import React, { useState } from 'react';

interface AIChatCardProps {
  onSend?: (message: string) => void;
  isLoading?: boolean;
}

export const AIChatCard = ({ onSend, isLoading }: AIChatCardProps) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && onSend) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-[260px] flex flex-col">
      <div className="relative flex flex-col rounded-2xl p-[1.5px] overflow-hidden bg-gradient-to-br from-[#7e7e7e] via-[#363636] to-[#363636]">
        {/* Glow effect */}
        <div className="absolute -top-[10px] -left-[10px] w-[30px] h-[30px] bg-white/30 blur-[1px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col w-full bg-black/50 rounded-[15px] overflow-hidden backdrop-blur-sm">
          {/* Chat Input Area */}
          <div className="relative flex p-2">
            <textarea 
              id="chat_bot" 
              name="chat_bot" 
              placeholder={isLoading ? "Thinking..." : "Imagine Something...✦˚"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="w-full h-[50px] bg-transparent border-none text-white text-xs font-normal p-2 resize-none outline-none placeholder:text-[#f3f6fd] placeholder:transition-all focus:placeholder:text-[#363636] disabled:opacity-50"
            />
          </div>

          {/* Options Bar */}
          <div className="flex justify-between items-end p-2.5">
            <div className="flex gap-2">
              {/* Add Button */}
              <button className="flex text-white/10 bg-transparent border-none cursor-pointer transition-all hover:-translate-y-1 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24">
                  <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v8a5 5 0 1 0 10 0V6.5a3.5 3.5 0 1 0-7 0V15a2 2 0 0 0 4 0V8" />
                </svg>
              </button>
              {/* Format Button */}
              <button className="flex text-white/10 bg-transparent border-none cursor-pointer transition-all hover:-translate-y-1 hover:text-white">
                <svg viewBox="0 0 24 24" height={20} width={20} xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0-8h6m-3-3v6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" fill="none" />
                </svg>
              </button>
              {/* Mic Button */}
              <button className="flex text-white/10 bg-transparent border-none cursor-pointer transition-all hover:-translate-y-1 hover:text-white">
                <svg viewBox="0 0 24 24" height={20} width={20} xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.01 8.01 0 0 0 5.648 6.667M10.03 13c.151 2.439.848 4.73 1.97 6.752A15.9 15.9 0 0 0 13.97 13zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.01 8.01 0 0 0 19.938 13M4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333A8.01 8.01 0 0 0 4.062 11m5.969 0h3.938A15.9 15.9 0 0 0 12 4.248A15.9 15.9 0 0 0 10.03 11m4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.01 8.01 0 0 0-5.648-6.667" fill="currentColor" />
                </svg>
              </button>
            </div>

            {/* Submit Button */}
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="flex p-0.5 bg-gradient-to-t from-[#292929] via-[#555555] to-[#292929] rounded-[10px] shadow-inner cursor-pointer border-none outline-none transition-transform active:scale-90 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-[30px] h-[30px] p-1.5 bg-black/10 rounded-[10px] backdrop-blur-[3px] text-[#8b8b8b] group-hover:text-[#f3f6fd] transition-colors">
                <svg viewBox="0 0 512 512" className="w-full h-full transition-all group-hover:drop-shadow-[0_0_5px_#ffffff] group-focus:scale-125 group-focus:rotate-45 group-focus:-translate-x-0.5 group-focus:translate-y-px">
                  <path fill="currentColor" d="M473 39.05a24 24 0 0 0-25.5-5.46L47.47 185h-.08a24 24 0 0 0 1 45.16l.41.13l137.3 58.63a16 16 0 0 0 15.54-3.59L422 80a7.07 7.07 0 0 1 10 10L226.66 310.26a16 16 0 0 0-3.59 15.54l58.65 137.38c.06.2.12.38.19.57c3.2 9.27 11.3 15.81 21.09 16.25h1a24.63 24.63 0 0 0 23-15.46L478.39 64.62A24 24 0 0 0 473 39.05" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Tags */}
      <div className="flex gap-1 py-3.5 text-white text-[10px]">
        <span className="px-2 py-1 bg-[#1b1b1b] border-[1.5px] border-[#363636] rounded-[10px] cursor-pointer select-none hover:bg-[#2a2a2a]">Create An Image</span>
        <span className="px-2 py-1 bg-[#1b1b1b] border-[1.5px] border-[#363636] rounded-[10px] cursor-pointer select-none hover:bg-[#2a2a2a]">Analyse Data</span>
        <span className="px-2 py-1 bg-[#1b1b1b] border-[1.5px] border-[#363636] rounded-[10px] cursor-pointer select-none hover:bg-[#2a2a2a]">More</span>
      </div>
    </div>
  );
}
