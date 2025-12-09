
import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="p-3 md:p-4 bg-white border-t border-gray-100">
        <form 
        onSubmit={handleSubmit}
        className="flex items-end gap-2"
        >
        <button 
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
            <Paperclip size={20} />
        </button>

        <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={disabled}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-800 placeholder-slate-400 max-h-32 focus:outline-none"
            />
            <button type="button" className="text-gray-400 hover:text-gray-600 ml-2">
            <Smile size={20} />
            </button>
        </div>

        <button 
            type="submit" 
            disabled={!input.trim() || disabled}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all hover:scale-105 active:scale-95"
        >
            <Send size={20} />
        </button>
        </form>
    </div>
  );
};

export default ChatInput;
