import React, { forwardRef } from 'react'

type Props = {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
}

const InputForChatGpt = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onKeyDown, placeholder = 'Message Me' }, ref) => {
    return (
      <input
        ref={ref}
        type='text'
        placeholder={placeholder}
        className='text-chatgpt-secondary-dark bg-transparent outline-none w-full'
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    )
  }
)

export default InputForChatGpt
