type Props = {
  src?: string | null
  name?: string | null
  role: 'user' | 'assistant'
}

function getInitial(name?: string | null) {
  const ch = (name || '').trim().charAt(0)
  return ch ? ch.toUpperCase() : '·'
}

export default function Avatar({ src, name, role }: Props) {
  const isUser = role === 'user'
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0"
         aria-label={isUser ? 'User avatar' : 'Assistant avatar'}>
      {src ? (
        // eslint-disable-next-line jsx-a11y/img-redundant-alt
        <img src={src} alt={isUser ? 'User avatar' : 'Assistant avatar'} className="w-full h-full object-cover" />
      ) : (
        <div className={isUser ? 'w-full h-full bg-chatgpt-user text-white flex items-center justify-center' : 'w-full h-full bg-chatgpt-dark text-chatgpt-primary-dark flex items-center justify-center'}>
          {isUser ? getInitial(name) : 'AI'}
        </div>
      )}
    </div>
  )
}
