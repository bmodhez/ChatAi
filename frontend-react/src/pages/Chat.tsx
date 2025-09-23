import React, { useRef, useState } from 'react'
import MessagePrompt from '../components/MessagePrompt'

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

function ChatHistory({ setIsMenuOpen }: { isMenuOpen: boolean; setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <div className={`min-w-60 px-2 py-2 h-screen bg-chatgpt-dark z-50`}>
      <div className={`flex justify-between font-inter text-chatgpt-primary-dark`}>
        <div className='cursor-pointer hover:bg-slate-500 p-1 rounded-lg' onClick={() => setIsMenuOpen(false)}>
          <img src='nav_bar.svg' className='invert' />
        </div>
        <div>N</div>
      </div>

      <div className='font-inter text-chatgpt-sidebar font-bold mt-3'>
        <div>
          <p>Chat History</p>
        </div>
        <div></div>
      </div>
    </div>
  )
}
export { ChatHistory }

function Chat() {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const baseMessages = [...messages, userMsg]
    setMessages([...baseMessages, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: baseMessages }),
      })

      if (!res.ok || !res.body) {
        throw new Error('Failed to connect to AI service')
      }

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
          setMessages((prev) => {
            const copy = [...prev]
            const lastIdx = copy.length - 1
            if (lastIdx >= 0 && copy[lastIdx].role === 'assistant') {
              copy[lastIdx] = { ...copy[lastIdx], content: assistantContent }
            }
            return copy
          })
        }
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' }])
      console.error(err)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <>
      <div className='flex flex-col h-screen relative clip-path bg-chatgpt-sidebar-dark'>
        <div className={`absolute transition-transform duration-500 left-0 max-w-60 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} h-screen`}>
          <ChatHistory isMenuOpen={isMenuOpen} setIsMenuOpen={setMenuOpen} />
        </div>
        <div className='flex justify-between bg-chatgpt-sidebar-dark text-chatgpt-secondary-dark font-inter px-5 py-3'>
          <div
            className={`text-chatgpt-primary-dark cursor-pointer hover:bg-slate-500 p-1 rounded-lg ${isMenuOpen ? 'invisible' : ''}`}
            onClick={() => {
              setMenuOpen(true)
            }}
          >
            <img src='nav_bar.svg' className='invert' />
          </div>
          <div className='font-bold text-xl'>AI Chat Bot</div>
          <div>Profile</div>
        </div>
        <div className='flex-1 bg-chatgpt-sidebar-dark overflow-y-auto'>
          <div className='max-w-3xl mx-auto px-4 py-6 space-y-4'>
            {messages.length === 0 && (
              <div className='text-chatgpt-secondary-dark text-center'>
                Start a conversation. Ask questions, create content, learn skills.
              </div>
            )}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === 'user'
                    ? 'flex justify-end'
                    : 'flex justify-start'
                }
              >
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
            ))}
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
