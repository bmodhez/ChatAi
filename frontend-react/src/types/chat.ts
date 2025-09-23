export type Role = 'user' | 'assistant' | 'system'

export type ChatAttachment = { type: 'image'; url: string; mimeType?: string }

export type ChatMessage = {
  role: Role
  content: string
  createdAt?: number
  attachments?: ChatAttachment[]
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
