import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, updateProfile, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getFirebase } from '../lib/firebase'
import { upsertUser } from './db'

export async function signUpWithEmail(name: string, email: string, password: string) {
  const fb = getFirebase()
  if (!fb) throw new Error('Firebase is not configured. Set VITE_FIREBASE_* envs.')
  const { auth } = fb
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  if (name) await updateProfile(cred.user, { displayName: name })
  await upsertUser({ id: cred.user.uid, name: name || email.split('@')[0], email })
  return cred.user
}

export async function signInWithEmail(email: string, password: string) {
  const fb = getFirebase()
  if (!fb) throw new Error('Firebase is not configured. Set VITE_FIREBASE_* envs.')
  const { auth } = fb
  const cred = await signInWithEmailAndPassword(auth, email, password)
  await upsertUser({ id: cred.user.uid, name: cred.user.displayName || email.split('@')[0], email })
  return cred.user
}

export async function signOut() {
  const fb = getFirebase()
  if (!fb) return
  const { auth } = fb
  await fbSignOut(auth)
}

export function watchAuth(cb: (user: { uid: string; displayName: string | null; email: string | null } | null) => void) {
  const fb = getFirebase()
  if (!fb) return () => {}
  const { auth } = fb
  return onAuthStateChanged(auth, (u) => {
    cb(u ? { uid: u.uid, displayName: u.displayName, email: u.email } : null)
  })
}

export async function signInWithGoogle() {
  const fb = getFirebase()
  if (!fb) throw new Error('Firebase is not configured. Set VITE_FIREBASE_* envs.')
  const { auth } = fb
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const cred = await signInWithPopup(auth, provider)
  const u = cred.user
  await upsertUser({ id: u.uid, name: u.displayName || u.email || 'User', email: u.email || undefined })
  return u
}
