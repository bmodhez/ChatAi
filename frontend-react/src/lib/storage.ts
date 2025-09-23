import type { Conversation, UserProfile } from '../types/chat'

const USER_KEY = 'app.user.v1'
const convKey = (userId: string) => `app.conversations.v1.${userId || 'guest'}`

function safeParse<T>(str: string | null): T | null {
  if (!str) return null
  try {
    return JSON.parse(str) as T
  } catch {
    return null
  }
}

export function loadUser(): UserProfile | null {
  return safeParse<UserProfile>(localStorage.getItem(USER_KEY))
}

export function saveUser(user: UserProfile | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

export function loadConversations(userId: string): Conversation[] {
  return safeParse<Conversation[]>(localStorage.getItem(convKey(userId))) || []
}

export function saveConversations(userId: string, conversations: Conversation[]) {
  localStorage.setItem(convKey(userId), JSON.stringify(conversations))
}
