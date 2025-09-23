import React, { useEffect, useMemo, useRef, useState } from 'react'
import MessagePrompt from '../components/MessagePrompt'
import ProfileMenu from '../components/ProfileMenu'
import ChatHistoryList from '../components/ChatHistoryList'
import type { ChatMessage, Conversation, UserProfile } from '../types/chat'
import { loadConversations, loadUser, saveConversations, saveUser } from '../lib/storage'
import { isFirestoreEnabled, ensureAuth, upsertUser, watchConversations, createConversationRemote, updateConversationRemote, deleteConversationRemote } from '../services/db'

function Sidebar({
  isMenuOpen,
  setIsMenuOpen,
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
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
          <img src='nav_bar.svg' className='invert' />
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = loadUser()
    setUser(u)
    if (isFirestoreEnabled()) {
      ensureAuth(u?.name).catch(() => null)
    }
  }, [])

  useEffect(() => {
    if (isFirestoreEnabled()) {
      let unsub: null | (() => void) = null
      ensureAuth(user?.name)
        .then(() => {
          unsub = watchConversations((list) => {
            setConversations(list)
            if (list.length && !currentId) setCurrentId((prev) => prev || list[0].id)
          })
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

  const upsertConversation = (updater: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === currentId ? updater(c) : c)))
  }

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

    let conv = current
    const userMsg: ChatMessage = { role: 'user', content: text, createdAt: Date.now() }

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

    setLoading(true)

    try {
      const baseMessages = (conv ? conversations.find((c) => c.id === conv!.id)?.messages || [] : [])
      const payloadMessages: ChatMessage[] = [
        ...baseMessages.filter((m) => m.role !== 'system' && !(m.role === 'assistant' && !m.content)),
        userMsg,
      ]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
      })

      if (!res.ok || !res.body) throw new Error('Failed to connect to AI service')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let assistantContent = ''

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
        }
      }
    } catch (err) {
      const idNow = currentId
      if (idNow) {
        setConversations((prev) =>
          prev.map((c) => (c.id === idNow ? { ...c, messages: [...c.messages, { role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' }], updatedAt: Date.now() } : c))
        )
      }
      console.error(err)
    } finally {
      setLoading(false)
      if (isFirestoreEnabled() && conv) {
        const final = conversations.find((c) => c.id === conv!.id)
        if (final) {
          await ensureAuth(user?.name)
          await updateConversationRemote(final.id, { title: final.title, messages: final.messages, updatedAt: Date.now() } as any)
        }
      }
      inputRef.current?.focus()
    }
  }

  const handleSelect = (id: string) => {
    setCurrentId(id)
  }

  const handleDelete = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (currentId === id) setCurrentId(null)
    if (isFirestoreEnabled()) {
      await ensureAuth(user?.name)
      await deleteConversationRemote(id)
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
            <img src='nav_bar.svg' className='invert' />
          </div>
          <div className='font-bold text-xl'>AI Chat Bot</div>
          <ProfileMenu user={user} onLogin={handleLogin} onLogout={handleLogout} />
        </div>
        <div className='flex-1 bg-chatgpt-sidebar-dark overflow-y-auto'>
          <div className='max-w-3xl mx-auto px-4 py-6 space-y-4'>
            {!current || current.messages.length === 0 ? (
              <div className='text-chatgpt-secondary-dark text-center'>
                Start a conversation. Ask questions, create content, learn skills.
              </div>
            ) : (
              current.messages.map((m, idx) => (
                <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] bg-chatgpt-user text-white px-4 py-2 rounded-2xl'
                        : 'max-w-[85%] bg-chatgpt-dark text-chatgpt-primary-dark px-4 py-2 rounded-2xl'
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className='sm:items-center bg-chatgpt-sidebar-dark'>
          <MessagePrompt value={input} onChange={(e) => setInput(e.target.value)} onSend={handleSend} disabled={loading} />
        </div>
      </div>
    </>
  )
}

export default Chat
