import './App.css'
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Chat from './pages/Chat'
import HomeAuth from './pages/Home'
import { useEffect, useState } from 'react'
import { getFirebase } from './lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const fb = getFirebase()
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    if (!fb) {
      setAuthed(true)
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(fb.auth, (u) => {
      setAuthed(!!u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return <div className='min-h-screen bg-chatgpt-sidebar-dark text-chatgpt-primary-dark flex items-center justify-center'>Loading…</div>
  if (!authed) return <Navigate to='/' replace />
  return <>{children}</> // FIX: Wrap with Fragment
}

export default function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomeAuth />} />
        <Route
          path='/chat'
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  )
}
