import React, { forwardRef } from 'react'

function InputForChatGpt() {
  return (
    <>
       <input   type='text' 
       placeholder='Message Me'
       className='text-chatgpt-secondary-dark bg-transparent  outline-none ' />
    </>
  )
}

export default forwardRef(InputForChatGpt)