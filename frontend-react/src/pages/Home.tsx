import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFirebase } from '../lib/firebase'
import { signInWithEmail, signUpWithEmail, watchAuth, signInWithGoogle } from '../services/auth'

export default function HomeAuth() {
  const navigate = useNavigate()
  const fbEnabled = !!getFirebase()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = watchAuth((u) => {
      if (u) navigate('/chat', { replace: true })
    })
    return () => unsub()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!fbEnabled) throw new Error('Firebase not configured. Please set VITE_FIREBASE_* envs.')
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your name')
        await signUpWithEmail(name.trim(), email.trim(), password)
      } else {
        await signInWithEmail(email.trim(), password)
      }
      navigate('/chat', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-chatgpt-dark text-chatgpt-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-chatgpt-sidebar-dark rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F6c1dea172d6a4b98b66fa189fb2ab1aa%2F68777098987546868e1d6fc0bfc9e343?format=webp&width=96"
            alt="App logo"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="text-chatgpt-primary-dark font-bold text-xl">Algnite Chat</div>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-center">{mode === 'signup' ? 'Create account' : 'Welcome back'}</h1>
        {!fbEnabled && (
          <div className="mb-4 text-chatgpt-secondary-dark text-sm">
            Firebase is not configured. Set VITE_FIREBASE_* variables to enable email/password login. You can still use the app, but auth won’t persist.
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Your name"
              className="w-full bg-chatgpt-dark text-chatgpt-primary-dark outline-none rounded-lg px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-chatgpt-dark text-chatgpt-primary-dark outline-none rounded-lg px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-chatgpt-dark text-chatgpt-primary-dark outline-none rounded-lg px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-chatgpt-error text-sm">{error}</div>}
          <button disabled={loading} className="w-full bg-chatgpt-dark text-chatgpt-primary-dark px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-60">
            {loading ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Login'}
          </button>
        </form>
        <div className="my-3 flex items-center gap-2 text-chatgpt-secondary-dark">
          <div className="h-px bg-chatgpt-dark flex-1" />
          <div className="text-xs">OR</div>
          <div className="h-px bg-chatgpt-dark flex-1" />
        </div>
        <button
          onClick={async () => {
            setError(null)
            setLoading(true)
            try {
              if (!fbEnabled) throw new Error('Firebase not configured')
              await signInWithGoogle()
              navigate('/chat', { replace: true })
            } catch (e) {
              const m = e instanceof Error ? e.message : String(e)
              setError(m)
            } finally {
              setLoading(false)
            }
          }}
          className="w-full bg-white text-black px-3 py-2 rounded-lg hover:opacity-90"
        >
          Continue with Google
        </button>
        <div className="mt-4 text-center text-sm text-chatgpt-secondary-dark">
          {mode === 'signup' ? (
            <button className="underline" onClick={() => setMode('login')}>Have an account? Login</button>
          ) : (
            <button className="underline" onClick={() => setMode('signup')}>New here? Create account</button>
          )}
        </div>
      </div>
    </div>
  )
}
