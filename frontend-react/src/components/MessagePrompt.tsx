import React from 'react'
import InputForChatGpt from './InputForChatGpt'

type Props = {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onFileSelected?: (file: File) => void
  disabled?: boolean
  onStop?: () => void
  showStop?: boolean
}

function MessagePrompt({ value, onChange, onSend, onFileSelected, disabled, onStop, showStop }: Props) {
  return (
    <>
      <div className='px-2 py-3 rounded-2xl mx-2 sm:mx-20 my-3 bg-chatgpt-dark md:mx-36 lg:mx-72'>
        <div className='flex justify-between mx-3 items-center gap-2'>
          <div className='flex-1'>
            <InputForChatGpt
              value={value}
              onChange={onChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !disabled) {
                  e.preventDefault()
                  onSend()
                }
              }}
            />
          </div>
          <label className='rounded-full p-[6px] bg-white cursor-pointer hover:opacity-90'>
            <input
              type='file'
              accept='image/*'
              className='hidden'
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f && onFileSelected) onFileSelected(f)
              }}
            />
            📎
          </label>
          {showStop && (
            <button
              type='button'
              aria-label='Stop generation'
              onClick={onStop}
              className='rounded-full p-[6px] bg-white'
            >
              ⏹
            </button>
          )}
          <button
            type='button'
            aria-label='Send message'
            disabled={disabled}
            onClick={onSend}
            className='rounded-full p-[6px] bg-white disabled:opacity-60 disabled:cursor-not-allowed'
          >
            <img src='up_arrow.svg' alt='Send' />
          </button>
        </div>
      </div>
    </>
  )
}

export default MessagePrompt
