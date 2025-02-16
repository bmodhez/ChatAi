import React, { forwardRef } from 'react'

function InputForChatGpt(ref) {
  return (
    <>
       <input ref={ref}  type='text' 
       placeholder='Message Me'
       className='text-chatgpt-secondary-dark bg-transparent  outline-none ' />
    </>
  )
}

export default forwardRef(InputForChatGpt)