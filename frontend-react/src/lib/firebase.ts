import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export function getFirebaseConfig() {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
  const required = ['apiKey', 'authDomain', 'projectId'] as const
  const missing = required.filter((k) => !cfg[k])
  return { cfg, enabled: missing.length === 0 }
}

export function getFirebase() {
  const { cfg, enabled } = getFirebaseConfig()
  if (!enabled) return null
  const app = getApps().length ? getApps()[0] : initializeApp(cfg as any)
  const auth = getAuth(app)
  const db = getFirestore(app)
  return { app, auth, db }
}
