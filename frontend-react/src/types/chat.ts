export type Role = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  role: Role
  content: string
  createdAt?: number
}

export type Conversation = {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export type UserProfile = {
  id: string
  name: string
  email?: string
}
