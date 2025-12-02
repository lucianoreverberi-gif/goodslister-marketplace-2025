
import React, { useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useChatSocket } from '../../hooks/useChatSocket';
import { Conversation, User } from '../../types/chat';
import { Sparkles, ArrowLeft, MoreVertical } from 'lucide-react';

// MOCK DATA
const MOCK_USER: User = { id: 'me', name: 'John Doe', avatar: '', isOnline: true, locale: 'en-US' };
const MOCK_CONVOS: Conversation[] = [
  {
    id: '1',
    participant: { id: 'p1', name: 'Maria Garcia', avatar: 'https://i.pravatar.cc/150?u=1', isOnline: true, locale: 'es-MX' },
    lastMessage: { id: 'm1', senderId: 'p1', text: 'Hola, ¿está disponible?', originalText: 'Hola', timestamp: new Date(), status: 'read', type: 'text' },
    unreadCount: 2,
  },
  {
    id: '2',
    participant: { id: 'p2', name: 'Pierre Dubois', avatar: 'https://i.pravatar.cc/150?u=2', isOnline: false, locale: 'fr-FR' },
    lastMessage: { id: 'm2', senderId: 'me', text: 'See you tomorrow!', originalText: 'See you tomorrow!', timestamp: new Date(), status: 'delivered', type: 'text' },
    unreadCount: 0,
  }
];

const ChatLayout: React.FC = () => {
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Hook for window resize listener
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Connect to our custom hook
  const { messages, sendMessage, isTyping } = useChatSocket(selectedConvoId);

  const activeConvo = MOCK_CONVOS.find(c => c.id === selectedConvoId);

  // UI LOGIC: Mobile vs Desktop
  // On Desktop: Always show list. Show chat if selected.
  // On Mobile: Show List IF no conversation selected. Show Chat IF conversation selected.
  const showList = !isMobileView || (isMobileView && !selectedConvoId);
  const showChat = !isMobileView || (isMobileView && selectedConvoId);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden rounded-lg shadow-xl border border-gray-200 m-4 max-w-7xl mx-auto">
      
      {/* LEFT SIDEBAR */}
      <div className={`${showList ? 'block' : 'hidden'} w-full md:w-[350px] lg:w-[400px] h-full`}>
        <ConversationList 
          conversations={MOCK_CONVOS} 
          activeId={selectedConvoId} 
          onSelect={setSelectedConvoId} 
        />
      </div>

      {/* RIGHT CHAT AREA */}
      <div className={`${showChat ? 'flex' : 'hidden'} flex-1 flex-col h-full bg-[#efeae2] relative`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/subtle-dark-vertical.png')]"></div>

        {activeConvo ? (
          <>
            {/* CHAT HEADER */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                {isMobileView && (
                  <button onClick={() => setSelectedConvoId(null)} className="p-1 -ml-1 text-gray-600">
                    <ArrowLeft size={24} />
                  </button>
                )}
                
                <img 
                  src={activeConvo.participant.avatar} 
                  className="w-10 h-10 rounded-full border border-gray-100" 
                  alt="" 
                />
                
                <div>
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">
                    {activeConvo.participant.name}
                  </h3>
                  <p className="text-xs text-green-600 font-medium">
                    {isTyping ? 'Typing...' : (activeConvo.participant.isOnline ? 'Online' : 'Offline')}
                  </p>
                </div>
              </div>

              {/* ACTIONS & TRANSLATION TOGGLE */}
              <div className="flex items-center gap-2 md:gap-4">
                {/* AI Toggle */}
                <button 
                  onClick={() => setTranslationEnabled(!translationEnabled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                    ${translationEnabled 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                    }`}
                >
                  <Sparkles size={14} className={translationEnabled ? 'animate-pulse' : ''} />
                  <span>{translationEnabled ? 'AI On' : 'AI Off'}</span>
                </button>
                
                <div className="hidden md:flex items-center border-l pl-3 ml-1">
                    <MoreVertical size={20} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                </div>
              </div>
            </header>

            {/* MESSAGES SCROLL AREA */}
            <div className="flex-1 overflow-y-auto p-4 z-0">
                {/* System Message */}
                <div className="flex justify-center mb-6">
                    <span className="bg-yellow-100 text-yellow-800 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-yellow-200">
                        Listing: {activeConvo.id === '1' ? 'Sea-Doo Spark 2023' : 'Trek Mountain Bike'}
                    </span>
                </div>

                {messages.map((msg) => (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    isOwnMessage={msg.senderId === 'me'}
                    globalTranslationEnabled={translationEnabled}
                  />
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-left-2">
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-200">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* INPUT AREA */}
            <ChatInput onSendMessage={sendMessage} />
          </>
        ) : (
          /* EMPTY STATE */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
              <span className="text-4xl">👋</span>
            </div>
            <h3 className="text-lg font-bold text-gray-600">Select a conversation</h3>
            <p className="max-w-xs mt-2 text-sm">Choose a chat from the left to start messaging your renters or hosts.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
