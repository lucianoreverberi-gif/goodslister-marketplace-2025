import React, { useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useChatSocket } from '../../hooks/useChatSocket';
import { Sparkles, ArrowLeft, Phone, Video, MoreVertical, RefreshCw } from 'lucide-react';
import { Session } from '../../types';

interface ChatLayoutProps {
    initialSelectedId?: string | null;
    currentUser: Session | null;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ initialSelectedId, currentUser }) => {
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(initialSelectedId || null);
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Use the hook with the active conversation ID
  const { conversations, messages, sendMessage, refresh, loading } = useChatSocket(currentUser?.id, selectedConvoId);

  const activeConvo = conversations.find(c => c.id === selectedConvoId);

  useEffect(() => {
      if (initialSelectedId) {
          setSelectedConvoId(initialSelectedId);
      }
  }, [initialSelectedId]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showList = !isMobileView || (isMobileView && !selectedConvoId);
  const showChat = !isMobileView || (isMobileView && selectedConvoId);

  if (!currentUser) return (
      <div className="flex items-center justify-center h-[60vh] flex-col text-gray-500">
          <h2 className="text-xl font-bold mb-2">Please Log In</h2>
          <p>You need to be logged in to view your inbox.</p>
      </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden rounded-lg shadow-xl border border-gray-200 m-4 max-w-7xl mx-auto">
      
      {/* LEFT SIDEBAR */}
      <div className={`${showList ? 'block' : 'hidden'} w-full md:w-[350px] lg:w-[400px] h-full flex flex-col border-r border-gray-200 bg-white`}>
        {/* Header with Refresh */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-gray-700">Messages</h2>
            <button 
                onClick={() => refresh()} 
                className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-white rounded-full transition-all"
                title="Refresh Messages"
            >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
        </div>

        <ConversationList 
          conversations={conversations} 
          activeId={selectedConvoId} 
          onSelect={setSelectedConvoId} 
        />
        {!loading && conversations.length === 0 && (
             <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                 <p className="font-semibold">No messages found</p>
                 <p className="text-sm text-gray-400 mt-1">
                    Your inbox is empty. Start a chat from a listing!
                 </p>
             </div>
        )}
      </div>

      {/* RIGHT CHAT AREA */}
      <div className={`${showChat ? 'flex' : 'hidden'} flex-1 flex-col h-full bg-[#efeae2] relative`}>
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/subtle-dark-vertical.png')]"></div>

        {activeConvo ? (
          <>
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                {isMobileView && (
                  <button onClick={() => setSelectedConvoId(null)} className="p-1 -ml-1 text-gray-600">
                    <ArrowLeft size={24} />
                  </button>
                )}
                
                <img 
                  src={activeConvo.participant.avatar} 
                  className="w-10 h-10 rounded-full border border-gray-100 object-cover" 
                  alt={activeConvo.participant.name} 
                />
                
                <div>
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">
                    {activeConvo.participant.name}
                  </h3>
                  <div className="flex items-center gap-2">
                      <p className="text-xs text-green-600 font-medium">Online</p>
                      {activeConvo.listing && (
                          <span className="text-xs text-gray-400">• {activeConvo.listing.title}</span>
                      )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
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
                
                <div className="hidden md:flex items-center border-l pl-3 ml-1 gap-3">
                    <Phone size={20} className="text-gray-400 hover:text-indigo-600 cursor-pointer" />
                    <Video size={20} className="text-gray-400 hover:text-indigo-600 cursor-pointer" />
                    <MoreVertical size={20} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 z-0 space-y-4">
                {/* Listing Context Bubble if available */}
                {activeConvo.listing && (
                    <div className="flex justify-center mb-4">
                        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-2 text-xs text-gray-600">
                            <span>Inquiry regarding: <strong>{activeConvo.listing.title}</strong></span>
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    isOwnMessage={msg.senderId === 'me' || msg.senderId === currentUser?.id}
                    globalTranslationEnabled={translationEnabled}
                  />
                ))}
            </div>

            <ChatInput onSendMessage={(text) => sendMessage(text, selectedConvoId!)} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
              <span className="text-4xl">👋</span>
            </div>
            <h3 className="text-lg font-bold text-gray-600">Welcome to your Inbox</h3>
            <p className="max-w-xs mt-2 text-sm">Select a conversation from the left to coordinate rentals safely.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;