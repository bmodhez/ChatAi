import React, { useEffect, useRef, useState } from 'react'
import type { UserProfile } from '../types/chat'

type Props = {
  user: UserProfile | null
  onLogin: (user: UserProfile) => void
  onLogout: () => void
}

function ProfileMenu({ user, onLogin, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const handleLogin = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = `user_${Math.random().toString(36).slice(2)}`
    onLogin({ id, name: trimmed, email: email.trim() || undefined })
    setOpen(false)
    setName('')
    setEmail('')
  }

  return (
    <div className='relative' ref={menuRef}>
      <button
        className='flex items-center gap-2 text-chatgpt-primary-dark hover:bg-slate-500 px-3 py-1 rounded-lg'
        onClick={() => setOpen((v) => !v)}
      >
        <div className='w-7 h-7 rounded-full bg-chatgpt-dark flex items-center justify-center text-chatgpt-primary-dark'>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
        </div>
        <span className='hidden sm:inline'>{user?.name || 'Profile'}</span>
      </button>
      {open && (
        <div className='absolute right-0 mt-2 w-64 bg-chatgpt-dark text-chatgpt-primary-dark rounded-xl shadow-lg p-4 z-50'>
          {user ? (
            <div className='space-y-3'>
              <div>
                <div className='text-sm text-chatgpt-secondary-dark'>Signed in as</div>
                <div className='font-semibold'>{user.name}</div>
                {user.email && <div className='text-sm text-chatgpt-secondary-dark'>{user.email}</div>}
              </div>
              <button
                onClick={() => {
                  onLogout()
                  setOpen(false)
                }}
                className='w-full bg-chatgpt-sidebar-dark text-chatgpt-primary-dark px-3 py-2 rounded-lg hover:opacity-90'
              >
                Logout
              </button>
            </div>
          ) : (
            <div className='space-y-2'>
              <div className='font-semibold mb-1'>Login</div>
              <input
                type='text'
                placeholder='Your name'
                className='w-full bg-chatgpt-sidebar-dark text-chatgpt-primary-dark outline-none rounded-lg px-3 py-2'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type='email'
                placeholder='Email (optional)'
                className='w-full bg-chatgpt-sidebar-dark text-chatgpt-primary-dark outline-none rounded-lg px-3 py-2'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                onClick={handleLogin}
                className='w-full bg-chatgpt-sidebar-dark text-chatgpt-primary-dark px-3 py-2 rounded-lg hover:opacity-90'
              >
                Continue
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProfileMenu
