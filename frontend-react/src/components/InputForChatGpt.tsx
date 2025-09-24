import React, { forwardRef } from 'react'

type Props = {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  emphasizePlaceholder?: boolean
}

const InputForChatGpt = forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, onKeyDown, placeholder = 'Ask anything', emphasizePlaceholder = false }, ref) => {
    return (
      <textarea
        ref={ref}
        placeholder={placeholder}
        className={`text-chatgpt-secondary-dark bg-transparent outline-none w-full resize-none ${
          emphasizePlaceholder ? 'placeholder:italic placeholder:font-semibold' : ''
        }`}
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
