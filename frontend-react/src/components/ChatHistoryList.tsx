import React from 'react'
import type { Conversation } from '../types/chat'

type Props = {
  conversations: Conversation[]
  currentId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString()
}

function ChatHistoryList({ conversations, currentId, onSelect, onNew, onDelete }: Props) {
  return (
    <div className='font-inter text-chatgpt-sidebar'>
      <div className='flex items-center justify-between my-2'>
        <p className='font-bold'>Chat History</p>
        <button className='bg-chatgpt-sidebar-dark text-chatgpt-primary-dark px-2 py-1 rounded-lg hover:opacity-90' onClick={onNew}>
          New
        </button>
      </div>
      <div className='space-y-2 max-h-[70vh] overflow-y-auto pr-1'>
        {conversations.length === 0 && (
          <div className='text-chatgpt-secondary-dark'>No conversations yet</div>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`rounded-xl px-3 py-2 cursor-pointer ${
              c.id === currentId ? 'bg-chatgpt-sidebar-dark' : 'hover:bg-slate-600'
            }`}
          >
            <div className='flex items-start justify-between gap-2'>
              <div onClick={() => onSelect(c.id)} className='flex-1'>
                <div className='text-chatgpt-primary-dark truncate'>{c.title}</div>
                <div className='text-xs text-chatgpt-secondary-dark'>{formatTime(c.updatedAt)}</div>
              </div>
              <button
                aria-label='Delete'
                onClick={() => onDelete(c.id)}
                className='text-chatgpt-secondary-dark hover:text-chatgpt-primary-dark'
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChatHistoryList
