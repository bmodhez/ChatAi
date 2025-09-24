import React, { useEffect, useMemo, useRef, useState } from 'react'
import MessagePrompt from '../components/MessagePrompt'
import ProfileMenu from '../components/ProfileMenu'
import ChatHistoryList from '../components/ChatHistoryList'
import type { ChatMessage, Conversation, UserProfile } from '../types/chat'
import { loadConversations, loadUser, saveConversations, saveUser } from '../lib/storage'
import { isFirestoreEnabled, ensureAuth, upsertUser, watchConversations, createConversationRemote, updateConversationRemote, deleteConversationRemote } from '../services/db'
import { uploadChatFile } from '../services/storage'
import { watchAuth } from '../services/auth'
import Avatar from '../components/Avatar'
import { getFirebase } from '../lib/firebase'
import CopyButton from '../components/CopyButton'

function Sidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
}: {
  isMenuOpen: boolean
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  conversations: Conversation[]
  currentId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className={`min-w-60 px-2 py-2 h-screen bg-chatgpt-dark z-50`}>
      <div className={`flex justify-between font-inter text-chatgpt-primary-dark`}>
        <div className='cursor-pointer hover:bg-slate-500 p-1 rounded-lg' onClick={() => setIsMenuOpen(false)}>
          <img src='/nav_bar.svg' className='invert' />
        </div>
        <div></div>
      </div>

      <div className='font-inter mt-3'>
        <ChatHistoryList
          conversations={conversations}
          currentId={currentId}
          onSelect={onSelect}
          onNew={onNew}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

export { Sidebar as ChatHistory }

function makeTitle(text: string) {
  const words = text.trim().split(/\s+/).slice(0, 8)
  return words.join(' ')
}

function Chat() {
  // ✅ FIXED: setMenuOpen → setIsMenuOpen
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [input, setInput] = useState('')
  const [user, setUser] = useState<UserProfile | null>(null)
  const userId = user?.id || 'guest'
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const current = useMemo(() => conversations.find((c) => c.id === currentId) || null, [conversations, currentId])
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ dataUrl: string; mimeType: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const [scrollVersion, setScrollVersion] = useState(0)
  const controllerRef = useRef<AbortController | null>(null)
  const abortedRef = useRef(false)
  const userPhoto = (() => { try { return getFirebase()?.auth?.currentUser?.photoURL || null } catch { return null } })()
  const [showScrollDown, setShowScrollDown] = useState(false)

  // ... (rest of the code remains exactly the same) ...

  return (
    <>
      <div className='flex flex-col h-screen relative clip-path bg-chatgpt-sidebar-dark'>
        <div className={`absolute transition-transform duration-500 left-0 max-w-60 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} h-screen`}>
          <Sidebar
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            conversations={conversations}
            currentId={currentId}
            onSelect={handleSelect}
            onNew={handleNew}
            onDelete={handleDelete}
          />
        </div>
        <div className='flex justify-between bg-chatgpt-sidebar-dark text-chatgpt-secondary-dark font-inter px-5 py-3'>
          <div
            className={`text-chatgpt-primary-dark cursor-pointer hover:bg-slate-500 p-1 rounded-lg ${isMenuOpen ? 'invisible' : ''}`}
            onClick={() => setIsMenuOpen(true)}  {/* ✅ Fixed here too */}
          >
            <img src='/nav_bar.svg' className='invert' />
          </div>
          <div className='font-bold text-xl'>Algnite AI</div>
          <ProfileMenu user={user} onLogin={handleLogin} onLogout={handleLogout} />
        </div>

        {/* ... (rest of the code remains exactly the same) ... */}
      </div>
    </>
  )
}

export default Chat