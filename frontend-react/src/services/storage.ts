import { getFirebase } from '../lib/firebase'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { ensureAuth } from './db'

export async function uploadChatFile(file: File): Promise<string | null> {
  const fb = getFirebase()
  if (!fb) return null
  const { app, auth } = fb
  try {
    await ensureAuth()
  } catch {
    return null
  }
  const storage = getStorage(app)
  const uid = auth.currentUser?.uid || 'guest'
  const path = `uploads/${uid}/${Date.now()}-${file.name}`
  const r = ref(storage, path)
  const snap = await uploadBytes(r, file, { contentType: file.type })
  const url = await getDownloadURL(snap.ref)
  return url
}
