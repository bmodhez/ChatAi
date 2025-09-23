import { onAuthStateChanged, signInAnonymously, updateProfile } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, getDoc } from 'firebase/firestore'
import { getFirebase } from '../lib/firebase'
import type { Conversation, ChatMessage, UserProfile } from '../types/chat'

export function isFirestoreEnabled() {
  return !!getFirebase()
}

export async function ensureAuth(displayName?: string) {
  const fb = getFirebase()
  if (!fb) return null
  const { auth } = fb
  if (auth.currentUser) return auth.currentUser
  const cred = await signInAnonymously(auth)
  if (displayName) await updateProfile(cred.user, { displayName })
  return cred.user
}

export async function upsertUser(profile: UserProfile) {
  const fb = getFirebase()
  if (!fb) return
  const { db, auth } = fb
  const uid = auth.currentUser?.uid
  if (!uid) return
  await setDoc(doc(db, 'users', uid), {
    name: profile.name,
    email: profile.email || null,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true })
}

function toConv(id: string, data: any): Conversation {
  return {
    id,
    title: data.title || 'New chat',
    messages: Array.isArray(data.messages) ? data.messages : [],
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
  }
}

export function watchConversations(cb: (list: Conversation[]) => void) {
  const fb = getFirebase()
  if (!fb) return () => {}
  const { db, auth } = fb
  const uid = auth.currentUser?.uid
  if (!uid) return () => {}
  const q = query(collection(db, 'users', uid, 'conversations'), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const items: Conversation[] = []
    snap.forEach((d) => items.push(toConv(d.id, d.data())))
    cb(items)
  })
}

export async function createConversationRemote(initial?: { title?: string; messages?: ChatMessage[] }) {
  const fb = getFirebase()
  if (!fb) return null
  const { db, auth } = fb
  const uid = auth.currentUser?.uid
  if (!uid) return null
  const ref = await addDoc(collection(db, 'users', uid, 'conversations'), {
    title: initial?.title || 'New chat',
    messages: initial?.messages || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  const snap = await getDoc(ref)
  return toConv(ref.id, snap.data())
}

export async function updateConversationRemote(id: string, patch: Partial<Conversation>) {
  const fb = getFirebase()
  if (!fb) return
  const { db, auth } = fb
  const uid = auth.currentUser?.uid
  if (!uid) return
  await updateDoc(doc(db, 'users', uid, 'conversations', id), {
    ...patch,
    updatedAt: Date.now(),
  } as any)
}

export async function deleteConversationRemote(id: string) {
  const fb = getFirebase()
  if (!fb) return
  const { db, auth } = fb
  const uid = auth.currentUser?.uid
  if (!uid) return
  await deleteDoc(doc(db, 'users', uid, 'conversations', id))
}
