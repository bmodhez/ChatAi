import React, { useEffect, useMemo, useRef, useState } from 'react'
import MessagePrompt from '../components/MessagePrompt'
import ProfileMenu from '../components/ProfileMenu'
import ChatHistoryList from '../components/ChatHistoryList'
import type { ChatMessage, Conversation, UserProfile } from '../types/chat'
import { loadConversations, loadUser, saveConversations, saveUser } from '../lib/storage'
import { isFirestoreEnabled, ensureAuth, upsertUser, watchConversations, createConversationRemote, updateConversationRemote, deleteConversationRemote } from '../services/db'
import { uploadChatFile } from '../services/storage'
import { watchAuth } from '../services/auth'
import Avatar from '../components/Avatar'
import { getFirebase } from '../lib/firebase'
import CopyButton from '../components/CopyButton'

function Sidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  setIsMenuOpen,
  isMenuOpen,
}: {
  isMenuOpen: boolean
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  conversations: Conversation[]
  currentId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className={`min-w-60 px-2 py-2 h-screen bg-chatgpt-dark z-50`}>
      <div className={`flex justify-between font-inter text-chatgpt-primary-dark`}>
        <div className='cursor-pointer hover:bg-slate-500 p-1 rounded-lg' onClick={() => setIsMenuOpen(false)}>
          <img src='/nav_bar.svg' className='invert' />
        </div>
        <div></div>
      </div>

      <div className='font-inter mt-3'>
        <ChatHistoryList
          conversations={conversations}
          currentId={currentId}
          onSelect={onSelect}
          onNew={onNew}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

export { Sidebar as ChatHistory }

function makeTitle(text: string) {
  const words = text.trim().split(/\s+/).slice(0, 8)
  return words.join(' ')
}

function Chat() {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [input, setInput] = useState('')
  const [user, setUser] = useState<UserProfile | null>(null)
  const userId = user?.id || 'guest'
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const current = useMemo(() => conversations.find((c) => c.id === currentId) || null, [conversations, currentId])
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ dataUrl: string; mimeType: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const [scrollVersion, setScrollVersion] = useState(0)
  const controllerRef = useRef<AbortController | null>(null)
  const abortedRef = useRef(false)
  const userPhoto = (() => { try { return getFirebase()?.auth?.currentUser?.photoURL || null } catch { return null } })()
  const [showScrollDown, setShowScrollDown] = useState(false)

  const suggestions = [
    'Brainstorm marketing ideas for a new cafe',
    'Write a polite email to reschedule a meeting',
    'Explain React hooks like I am new to coding',
    'Summarize the key points from a long article',
  ]

  const msgCount = current?.messages.length || 0
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [scrollVersion, currentId, msgCount])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
      setShowScrollDown(!nearBottom)
    }
    el.addEventListener('scroll', onScroll)
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const u = loadUser()
    setUser(u)
    if (isFirestoreEnabled()) {
      ensureAuth(u?.name).catch(() => null)
      const unsub = watchAuth((fu) => {
        if (fu) {
          setUser({ id: fu.uid, name: fu.displayName || fu.email || 'User', email: fu.email || undefined })
        }
      })
      return () => unsub()
    }
  }, [])

  useEffect(() => {
    if (isFirestoreEnabled()) {
      let unsub: null | (() => void) = null
      ensureAuth(user?.name)
        .then(() => {
          unsub = watchConversations(
            (list) => {
              setConversations(list)
              if (list.length && !currentId) setCurrentId((prev) => prev || list[0].id)
            },
            () => {
              const data = loadConversations(userId)
              setConversations(data)
              if (data.length && !currentId) setCurrentId(data[0].id)
            }
          )
        })
        .catch(() => {
          const data = loadConversations(userId)
          setConversations(data)
          if (data.length && !currentId) setCurrentId(data[0].id)
        })
      return () => {
        if (unsub) unsub()
      }
    } else {
      const data = loadConversations(userId)
      setConversations(data)
      if (data.length && !currentId) setCurrentId(data[0].id)
    }
  }, [userId])

  useEffect(() => {
    if (!isFirestoreEnabled()) {
      saveConversations(userId, conversations)
    }
  }, [userId, conversations])

  const createNew = async (initialMessage?: ChatMessage) => {
    const now = Date.now()
    const title = initialMessage ? makeTitle(initialMessage.content) : 'New chat'
    if (isFirestoreEnabled()) {
      try {
        await ensureAuth(user?.name)
        const conv = await createConversationRemote({ title, messages: initialMessage ? [initialMessage] : [] })
        if (conv) {
          setConversations((prev) => [conv, ...prev])
          setCurrentId(conv.id)
          return conv
        }
      } catch {}
    }
    const id = `c_${Math.random().toString(36).slice(2)}`
    const conv: Conversation = { id, title, messages: initialMessage ? [initialMessage] : [], createdAt: now, updatedAt: now }
    setConversations((prev) => [conv, ...prev])
    setCurrentId(id)
    return conv
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    abortedRef.current = false

    let attachmentUrl: string | null = null
    if (selectedFile && isFirestoreEnabled()) {
      try {
        await ensureAuth(user?.name)
        attachmentUrl = await uploadChatFile(selectedFile)
      } catch {}
    }
    // Fallback to local preview data URL when Firestore is disabled or upload fails
    if (!attachmentUrl && selectedImage) {
      attachmentUrl = selectedImage.dataUrl
    }

    let conv = current
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      createdAt: Date.now(),
      attachments: attachmentUrl ? [{ type: 'image', url: attachmentUrl, mimeType: selectedFile?.type }] : undefined,
    }

    if (!conv) {
      conv = await createNew(userMsg)
      const idNow = conv.id
      setConversations((prev) =>
        prev.map((c) =>
          c.id === idNow
            ? { ...c, messages: [...c.messages, { role: 'assistant', content: '', createdAt: Date.now() }], updatedAt: Date.now() }
            : c
        )
      )
    } else {
      const updated: Conversation = {
        ...conv,
        title: conv.messages.length === 0 ? makeTitle(text) : conv.title,
        messages: [...conv.messages, userMsg, { role: 'assistant', content: '', createdAt: Date.now() }],
        updatedAt: Date.now(),
      }
      setConversations((prev) => prev.map((c) => (c.id === conv!.id ? updated : c)))
    }

    // Clear attached preview immediately after the message is queued
    setSelectedImage(null)
    setSelectedFile(null)

    setLoading(true)

    try {
      const baseMessages = (conv ? conversations.find((c) => c.id === conv!.id)?.messages || [] : [])
      const payloadMessages: ChatMessage[] = [
        ...baseMessages.filter((m) => m.role !== 'system' && !(m.role === 'assistant' && !m.content)),
        userMsg,
      ]

      let imageBase64: string | undefined
      let imageMimeType: string | undefined
      if (selectedImage) {
        imageMimeType = selectedImage.mimeType
        const base64 = selectedImage.dataUrl.split(',')[1]
        imageBase64 = base64
      }

      const controller = new AbortController()
      controllerRef.current = controller

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages, imageBase64, imageMimeType }),
        signal: controller.signal,
      })

      let errorText = ''
      if (!res.ok) {
        try { errorText = await res.text() } catch {}
        throw new Error(errorText || 'Failed to connect to AI service')
      }

      let assistantContent = ''

      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        let data: any = null
        try { data = await res.json() } catch { data = null }
        const text = data?.text || data?.choices?.[0]?.message?.content || ''
        assistantContent = text
        const idNow = conv!.id
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== idNow) return c
            const lastIdx = c.messages.length - 1
            const msgs = [...c.messages]
            if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
              msgs[lastIdx] = { ...msgs[lastIdx], content: assistantContent }
            }
            return { ...c, messages: msgs, updatedAt: Date.now() }
          })
        )
        setScrollVersion((v) => v + 1)
      } else if (res.body && (res.body as any).getReader) {
        const reader = (res.body as any).getReader()
        const decoder = new TextDecoder()
        let done = false
        while (!done) {
          const { value, done: doneReading } = await reader.read()
          done = doneReading
          const chunk = value ? decoder.decode(value, { stream: true }) : ''
          if (chunk) {
            assistantContent += chunk
            const idNow = conv!.id
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== idNow) return c
                const lastIdx = c.messages.length - 1
                const msgs = [...c.messages]
                if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                  msgs[lastIdx] = { ...msgs[lastIdx], content: assistantContent }
                }
                return { ...c, messages: msgs, updatedAt: Date.now() }
              })
            )
            setScrollVersion((v) => v + 1)
          }
        }
      } else {
        const text = await res.text()
        assistantContent = text || ''
        const idNow = conv!.id
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== idNow) return c
            const lastIdx = c.messages.length - 1
            const msgs = [...c.messages]
            if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
              msgs[lastIdx] = { ...msgs[lastIdx], content: assistantContent }
            }
            return { ...c, messages: msgs, updatedAt: Date.now() }
          })
        )
        setScrollVersion((v) => v + 1)
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      const isAbort = (err as any)?.name === 'AbortError' || /AbortError/i.test(raw)
      if (isAbort) {
        // swallow aborts silently
      } else if (!abortedRef.current) {
        const idNow = currentId
        const reason = /Missing API key/i.test(raw) ? 'Missing AI API key. Set GROK_API_KEY (and optionally GROK_BASE_URL) in the server environment.' : raw
        if (idNow) {
          setConversations((prev) =>
            prev.map((c) => (c.id === idNow ? { ...c, messages: [...c.messages, { role: 'assistant', content: `Error: ${reason}` }], updatedAt: Date.now() } : c))
          )
        }
        console.error(err)
      }
    } finally {
      setLoading(false)
      controllerRef.current = null
      abortedRef.current = false
      if (isFirestoreEnabled() && conv) {
        const final = conversations.find((c) => c.id === conv!.id)
        if (final) {
          try {
            await ensureAuth(user?.name)
            await updateConversationRemote(final.id, { title: final.title, messages: final.messages, updatedAt: Date.now() } as any)
          } catch {}
        }
      }
      setSelectedImage(null)
      setSelectedFile(null)
      inputRef.current?.focus()
    }
  }

  const handleStop = () => {
    try {
      if (controllerRef.current) {
        abortedRef.current = true
        // Provide a reason for better diagnostics (supported in modern browsers)
        try {
          ;(controllerRef.current.abort as any)?.('stopped-by-user')
        } catch {
          controllerRef.current.abort()
        }
        setLoading(false)
      }
    } catch {
      // ignore
    }
  }

  const handleSelect = (id: string) => {
    setCurrentId(id)
  }

  const handleDelete = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (currentId === id) setCurrentId(null)
    if (isFirestoreEnabled()) {
      try {
        await ensureAuth(user?.name)
        await deleteConversationRemote(id)
      } catch {}
    }
  }

  const handleNew = () => {
    createNew().catch(() => null)
    setMenuOpen(false)
  }

  const handleLogin = (u: UserProfile) => {
    saveUser(u)
    setUser(u)
    if (isFirestoreEnabled()) {
      ensureAuth(u.name).then(() => upsertUser(u)).catch(() => null)
    }
    setMenuOpen(false)
  }
  const handleLogout = () => {
    try { import('../services/auth').then(m => m.signOut()) } catch {}
    saveUser(null)
    setUser(null)
    setMenuOpen(false)
  }

  return (
    <>
      <div className='flex flex-col h-screen relative clip-path bg-chatgpt-sidebar-dark'>
        <div className={`absolute transition-transform duration-500 left-0 max-w-60 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} h-screen`}>
          <Sidebar
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setMenuOpen}
            conversations={conversations}
            currentId={currentId}
            onSelect={handleSelect}
            onNew={handleNew}
            onDelete={handleDelete}
          />
        </div>
        <div className='flex justify-between bg-chatgpt-sidebar-dark text-chatgpt-secondary-dark font-inter px-5 py-3'>
          <div
            className={`text-chatgpt-primary-dark cursor-pointer hover:bg-slate-500 p-1 rounded-lg ${isMenuOpen ? 'invisible' : ''}`}
            onClick={() => setMenuOpen(true)}
          >
            <img src='/nav_bar.svg' className='invert' />
          </div>
          <div className='font-bold text-xl'>Algnite AI</div>
          <ProfileMenu user={user} onLogin={handleLogin} onLogout={handleLogout} />
        </div>
        <div className='flex-1 bg-chatgpt-sidebar-dark overflow-y-auto' ref={scrollContainerRef}>
          <div className='max-w-3xl mx-auto px-4 py-6 space-y-6 md:space-y-7'>
            {!current || current.messages.length === 0 ? (
              <div className='text-center'>
                <div className='text-chatgpt-primary-dark text-2xl sm:text-3xl font-semibold mb-4'>What can I help with?</div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4'>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(s); inputRef.current?.focus() }}
                      className='text-left bg-chatgpt-dark text-chatgpt-primary-dark rounded-2xl p-4 hover:opacity-90'
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              current.messages.map((m, idx) => {
                const isUser = m.role === 'user'
                return (
                  <div key={idx} className={isUser ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={isUser ? 'flex items-end gap-3 max-w-[85%] justify-end' : 'flex items-end gap-3 max-w-[85%]'}>
                      {isUser ? (
                        <>
                          <Avatar role='user' name={user?.name || null} src={userPhoto} />
                          <div className='bg-chatgpt-user text-white px-4 py-2 rounded-2xl shadow leading-relaxed whitespace-pre-wrap break-words text-sm md:text-base'>
                            {m.attachments && m.attachments.length > 0 && m.attachments[0].type === 'image' && (
                              <img src={m.attachments[0].url} alt='attachment' className='max-h-48 rounded-lg mb-2' />
                            )}
                            {m.content}
                          </div>
                        </>
                      ) : (
                        <>
                          <Avatar role='assistant' src={'https://cdn.builder.io/api/v1/image/assets%2F6c1dea172d6a4b98b66fa189fb2ab1aa%2F68777098987546868e1d6fc0bfc9e343?format=webp&width=128'} />
                          <div className='flex-1 min-w-0'>
                            <div className='bg-chatgpt-dark text-chatgpt-primary-dark px-4 py-2 rounded-2xl shadow leading-relaxed whitespace-pre-wrap break-words text-sm md:text-base'>
                              {m.attachments && m.attachments.length > 0 && m.attachments[0].type === 'image' && (
                                <img src={m.attachments[0].url} alt='attachment' className='max-h-48 rounded-lg mb-2' />
                              )}
                              {m.content || (
                                <span className='inline-flex gap-1'>
                                  <span className='typing-dot'>.</span>
                                  <span className='typing-dot'>.</span>
                                  <span className='typing-dot'>.</span>
                                </span>
                              )}
                            </div>
                            {m.content && (
                              <div className='mt-1 flex items-center gap-2 text-xs'>
                                <CopyButton text={m.content} label='Copy' />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          <div ref={endRef} />
          </div>
        </div>
        {showScrollDown && (
          <button
            onClick={() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })}
            className='fixed bottom-28 right-6 bg-chatgpt-user text-white rounded-full px-3 py-2 shadow hover:opacity-90'
            aria-label='Scroll to bottom'
          >
            ↓
          </button>
        )}
        <div className='sm:items-center bg-chatgpt-sidebar-dark'>
          {selectedImage && (
            <div className='px-4 max-w-3xl mx-auto'>
              <div className='text-chatgpt-secondary-dark text-sm mb-1'>Image attached</div>
              <img src={selectedImage.dataUrl} alt='preview' className='max-h-40 rounded-lg' />
            </div>
          )}
          <MessagePrompt
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onSend={handleSend}
            disabled={loading}
            onStop={handleStop}
            showStop={loading}
            inputRef={inputRef}
            placeholder={'Ask anything'}
            emphasizePlaceholder={!current || current.messages.length === 0}
            onFileSelected={(file) => {
              setSelectedFile(file)
              const reader = new FileReader()
              reader.onload = () => {
                const result = String(reader.result)
                setSelectedImage({ dataUrl: result, mimeType: file.type || 'image/png' })
              }
              reader.readAsDataURL(file)
            }}
          />
        </div>
      </div>
    </>
  )
}

export default Chat
