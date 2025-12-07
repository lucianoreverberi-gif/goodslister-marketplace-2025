
import React, { useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useChatSocket } from '../../hooks/useChatSocket';
import { Conversation, User } from '../../types/chat'; 
import { Sparkles, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import * as mockApi from '../../services/mockApiService';

const ChatLayout: React.FC = () => {
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Real Data State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // 1. Initialize User & Fetch Conversations
  useEffect(() => {
    const init = async () => {
        const appData = await mockApi.fetchAllData(); 
        // HACK for Demo: Use user-1 (Carlos) if no prop provided
        const loggedInUser = appData.users[0]; 
        setCurrentUser(loggedInUser);

        // Fetch Conversations for this user
        try {
            const res = await fetch('/api/chat/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loggedInUser.id })
            });
            if (res.ok) {
                const data = await res.json();
                
                // Map Backend Conversation to UI Conversation
                const mappedConvos: Conversation[] = data.conversations.map((c: any) => {
                     const otherId = Object.keys(c.participants).find(id => id !== loggedInUser.id);
                     const otherUser = c.participants[otherId || ''];
                     const lastMsg = c.messages[c.messages.length - 1];

                     return {
                         id: c.id,
                         participant: {
                             id: otherUser?.id || 'unknown',
                             name: otherUser?.name || 'Unknown User',
                             avatar: otherUser?.avatarUrl || '',
                             isOnline: false,
                             locale: 'en-US'
                         },
                         lastMessage: lastMsg ? {
                             id: lastMsg.id,
                             senderId: lastMsg.senderId,
                             text: lastMsg.text,
                             originalText: lastMsg.text,
                             timestamp: new Date(lastMsg.timestamp),
                             status: 'read',
                             type: 'text'
                         } : { 
                             id: 'sys', senderId: 'sys', text: 'New conversation', originalText: '', timestamp: new Date(), status: 'read', type: 'system' 
                         },
                         unreadCount: 0
                     };
                });
                setConversations(mappedConvos);
            }
        } catch (e) {
            console.error("Error loading chat list", e);
        }
    };
    init();
    
    // Set up polling for the conversation LIST
    const interval = setInterval(init, 5000); 

    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        clearInterval(interval);
    };
  }, []);

  // Connect to our custom hook for the ACTIVE conversation messages
  const { messages, sendMessage } = useChatSocket(currentUser?.id, selectedConvoId);

  const activeConvo = conversations.find(c => c.id === selectedConvoId);

  const showList = !isMobileView || (isMobileView && !selectedConvoId);
  const showChat = !isMobileView || (isMobileView && selectedConvoId);

  if (!currentUser) return <div className="p-10 text-center">Loading chat...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden rounded-lg shadow-xl border border-gray-200 m-4 max-w-7xl mx-auto">
      
      {/* LEFT SIDEBAR */}
      <div className={`${showList ? 'block' : 'hidden'} w-full md:w-[350px] lg:w-[400px] h-full`}>
        <ConversationList 
          conversations={conversations} 
          activeId={selectedConvoId} 
          onSelect={setSelectedConvoId} 
        />
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
                  className="w-10 h-10 rounded-full border border-gray-100" 
                  alt="" 
                />
                
                <div>
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">
                    {activeConvo.participant.name}
                  </h3>
                  <p className="text-xs text-green-600 font-medium">Online</p>
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
                
                <div className="hidden md:flex items-center border-l pl-3 ml-1">
                    <MoreVertical size={20} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 z-0">
                {messages.map((msg) => (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    isOwnMessage={msg.senderId === 'me'}
                    globalTranslationEnabled={translationEnabled}
                  />
                ))}
            </div>

            <ChatInput onSendMessage={sendMessage} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
              <span className="text-4xl">👋</span>
            </div>
            <h3 className="text-lg font-bold text-gray-600">Select a conversation</h3>
            <p className="max-w-xs mt-2 text-sm">Choose a chat from the left to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
