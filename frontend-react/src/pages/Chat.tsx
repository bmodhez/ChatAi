import React, { useState } from 'react'
import MessagePrompt from '../components/MessagePrompt'


function ChatHistory({isMenuOpen,setIsMenuOpen}:{isMenuOpen:boolean,setIsMenuOpen:React.Dispatch<React.SetStateAction<boolean>>}) {

  return (
    <div className={`min-w-60  h-screen bg-chatgpt-dark `}>
        <div className={`flex justify-between  font-inter text-chatgpt-primary-dark `}>

        <div onClick={()=>setIsMenuOpen(false)}>E</div>
        <div>N</div>
        </div>
        </div>
        
    
  )
}
export {ChatHistory}
 
function Chat() {
    const [isMenuOpen,setMenuOpen] = useState(false);
  return (
   <>
    
    <div className='flex flex-col h-screen relative bg-chatgpt-sidebar-dark'>
       <div className={` absolute transition-transform duration-500 left-0 max-w-60  ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} h-screen`}>
            <ChatHistory isMenuOpen={isMenuOpen} setIsMenuOpen={setMenuOpen}/>
       </div>
        <div className='flex justify-between bg-chatgpt-sidebar-dark text-chatgpt-secondary-dark font-inter px-5 py-3'>
            {/* Nav Bar */}
            <div onClick={() => { 
   setMenuOpen(true); 
  console.log("Menu Open State:", isMenuOpen);
}}>E</div>
            <div>Al</div>
            <div>Profile</div>
        </div>
        <div className='flex-1 bg-chatgpt-sidebar-dark'>
            {/* Chat window */}

        </div>
        <div className='sm:items-center bg-chatgpt-sidebar-dark'>
            {/* Chat prompt */}
            <MessagePrompt/>
        </div>
    </div>
    </>
  )
}

export default Chat