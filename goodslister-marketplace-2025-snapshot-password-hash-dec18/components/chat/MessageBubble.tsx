
import React, { useState } from 'react';
import { Message } from '../../types/chat';
import { Check, CheckCheck, Languages } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  globalTranslationEnabled: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage, globalTranslationEnabled }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  // LOGIC: Determine what text to show
  // If global translation is ON, and we have a translation, and it's not my own message
  const isTranslated = globalTranslationEnabled && message.translatedText && !isOwnMessage;
  
  const displayContent = isTranslated && !showOriginal 
    ? message.translatedText 
    : message.originalText;

  return (
    <div className={`flex w-full mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`relative max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed
        ${isOwnMessage 
          ? 'bg-indigo-600 text-white rounded-br-none' 
          : 'bg-white border border-gray-200 text-slate-800 rounded-bl-none'
        }`}
      >
        {/* Translation Indicator */}
        {isTranslated && (
          <div className="flex items-center gap-1 mb-1 text-[10px] uppercase tracking-wider font-bold text-indigo-400 opacity-90">
            <Languages size={12} />
            <span>Translated from {message.detectedLanguage}</span>
          </div>
        )}

        <p className="whitespace-pre-wrap">{displayContent}</p>

        {/* Metadata Footer */}
        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isOwnMessage ? 'text-indigo-200' : 'text-slate-400'}`}>
          {/* Show Original Toggle */}
          {isTranslated && (
            <button 
              onClick={() => setShowOriginal(!showOriginal)}
              className="mr-2 underline hover:text-indigo-500 transition-colors"
            >
              {showOriginal ? 'Show Translation' : 'Show Original'}
            </button>
          )}
          
          <span>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          {isOwnMessage && (
            <span title={message.status}>
              {message.status === 'read' ? <CheckCheck size={14} className="text-blue-300" /> : <Check size={14} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
