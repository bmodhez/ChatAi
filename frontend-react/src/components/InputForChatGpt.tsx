import React, { forwardRef } from 'react'

type Props = {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
}

const InputForChatGpt = forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, onKeyDown, placeholder = 'Message Me' }, ref) => {
    return (
      <textarea
        ref={ref}
        placeholder={placeholder}
        className='text-chatgpt-secondary-dark bg-transparent outline-none w-full resize-none'
        value={value}
        rows={1}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onInput={(e) => {
          const el = e.currentTarget
          el.style.height = 'auto'
          el.style.height = `${el.scrollHeight}px`
        }}
      />
    )
  }
)

export default InputForChatGpt
