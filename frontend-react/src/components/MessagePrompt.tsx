import React from 'react'
import InputForChatGpt from './InputForChatGpt'

function MessagePrompt() {
  return (
    <>
    <div className='px-2 py-3 rounded-2xl mx-2 sm:mx-20 my-3 bg-chatgpt-dark md:mx-36 lg:mx-72'>
        <div className='flex justify-between mx-3 '>

        <InputForChatGpt/>
        <div className='rounded-full p-[0px] bg-white'>
            <img src='up_arrow.svg'></img>
        </div>
        </div>
    </div>
    </>
  )
}

export default MessagePrompt