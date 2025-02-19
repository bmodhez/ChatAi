import React, { useState } from "react";
import MessagePrompt from "../components/MessagePrompt";

function ChatHistory({
  setIsMenuOpen,
}: {
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className={`min-w-60 px-2 py-2  h-screen bg-chatgpt-dark z-50  `}>
      <div
        className={`flex justify-between  font-inter text-chatgpt-primary-dark `}
      >
        <div className="cursor-pointer hover:bg-slate-500 p-1 rounded-lg" onClick={() => setIsMenuOpen(false)}><img src="nav_bar.svg" className="invert"/></div>
        <div>N</div>
      </div>
      
      <div className="font-inter text-chatgpt-sidebar font-bold mt-3">
        <div>
          <p>Chat History</p>
        </div>
        <div>

        </div>
      </div>
    </div>
  );
}
export { ChatHistory };

function Chat() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div className="flex flex-col h-screen relative clip-path bg-chatgpt-sidebar-dark">
        <div
          className={` absolute transition-transform duration-500 left-0 max-w-60  ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          } h-screen`}
        >
          <ChatHistory isMenuOpen={isMenuOpen} setIsMenuOpen={setMenuOpen} />
        </div>
        <div className="flex justify-between bg-chatgpt-sidebar-dark text-chatgpt-secondary-dark font-inter px-5 py-3">
          {/* Nav Bar */}
            <div
            className={`text-chatgpt-primary-dark cursor-pointer hover:bg-slate-500 p-1 rounded-lg ${isMenuOpen ? "invisible" : ""}`}
            onClick={() => {
              setMenuOpen(true);
              console.log("Menu Open State:", isMenuOpen);
            }}
            >
            <img src="nav_bar.svg" className="invert"/>
            </div>
          <div className="font-bold text-xl">Al Chat Bot</div>
          <div>Profile</div>
        </div>
        <div className="flex-1 bg-chatgpt-sidebar-dark">
          {/* Chat window */}
        </div>
        <div className="sm:items-center bg-chatgpt-sidebar-dark">
          {/* Chat prompt */}
          <MessagePrompt />
        </div>
      </div>
    </>
  );
}

export default Chat;
