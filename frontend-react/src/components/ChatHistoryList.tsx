
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
        <p className='font-bold text-chatgpt-primary-dark'>Chat History</p>
        <button
          className='bg-chatgpt-sidebar-dark text-chatgpt-primary-dark px-3 py-1 rounded-lg hover:opacity-90 inline-flex items-center gap-1'
          onClick={onNew}
          aria-label='Start new chat'
        >
          <span className='text-lg leading-none'>＋</span>
          <span className='hidden sm:inline'>New</span>
        </button>
      </div>
      <div className='space-y-1 max-h-[70vh] overflow-y-auto pr-1'>
        {conversations.length === 0 && (
          <div className='text-chatgpt-secondary-dark text-sm'>No conversations yet</div>
        )}
        {conversations.map((c) => {
          const last = c.messages?.[c.messages.length - 1]
          const preview = last?.content ? (last.content.length > 40 ? last.content.slice(0, 40) + '…' : last.content) : ' '
          return (
            <div
              key={c.id}
              className={`group rounded-xl px-3 py-2 cursor-pointer transition-colors ${
                c.id === currentId ? 'bg-chatgpt-sidebar-dark' : 'hover:bg-slate-600'
              }`}
            >
              <div className='flex items-start justify-between gap-2'>
                <div onClick={() => onSelect(c.id)} className='flex-1 min-w-0'>
                  <div className='text-chatgpt-primary-dark truncate'>{c.title}</div>
                  <div className='flex items-center gap-2 text-xs text-chatgpt-secondary-dark'>
                    <span className='truncate max-w-[10rem]'>{preview}</span>
                    <span className='opacity-60'>·</span>
                    <span className='shrink-0'>{formatTime(c.updatedAt)}</span>
                  </div>
                </div>
                <button
                  aria-label='Delete conversation'
                  onClick={() => onDelete(c.id)}
                  className='text-chatgpt-secondary-dark hover:text-chatgpt-primary-dark opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ChatHistoryList
