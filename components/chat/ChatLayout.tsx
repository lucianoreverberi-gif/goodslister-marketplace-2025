import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { SendIcon, LanguagesIcon, ChevronLeftIcon, MessageSquareIcon } from '../icons';
import { translateText } from '../../services/geminiService';
import { useChatSocket } from '../../hooks/useChatSocket';

interface ChatLayoutProps {
    initialSelectedId: string | null;
    currentUser: User | null;
}

const LanguageSelector: React.FC<{ selectedLang: string, onChange: (lang: string) => void }> = ({ selectedLang, onChange}) => {
    const languages = ["English", "Spanish", "Português", "Français", "Deutsch"];
    return (
        <div className="relative">
             <select 
                value={selectedLang} 
                onChange={e => onChange(e.target.value)}
                className="block appearance-none w-full bg-white border border-gray-200 text-gray-700 py-1 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-cyan-500 text-xs"
            >
                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
        </div>
    );
};

const ChatLayout: React.FC<ChatLayoutProps> = ({ initialSelectedId, currentUser }) => {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(initialSelectedId);
    const [userLanguage, setUserLanguage] = useState('English');
    
    // Hook: Pass active ID so it returns the correct merged message stream
    const { conversations, messages, sendMessage, loading } = useChatSocket(currentUser?.id, activeConversationId);
    
    const [messageInput, setMessageInput] = useState('');
    const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
    const [isTranslating, setIsTranslating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialSelectedId) {
            setActiveConversationId(initialSelectedId);
        }
    }, [initialSelectedId]);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    // Scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, activeConversationId]);

    // Translation Logic
    useEffect(() => {
        if (!activeConversation || !activeConversation.fullMessages || !currentUser) return;
        const translateAllMessages = async () => {
            if (userLanguage === 'English') {
                 setTranslatedMessages({}); 
                 return;
            }
            setIsTranslating(true);
            const translations: Record<string, string> = {};
            const messagesToTranslate = activeConversation.fullMessages!.filter(
                (msg: any) => msg.senderId !== currentUser.id && msg.text
            );
            await Promise.all(messagesToTranslate.map(async (msg: any) => {
                const translatedText = await translateText(msg.text, userLanguage, "English");
                translations[msg.id] = translatedText;
            }));
            setTranslatedMessages(translations);
            setIsTranslating(false);
        };
        translateAllMessages();
    }, [activeConversation, userLanguage, currentUser]);

    const handleSend = async () => {
        if (!messageInput.trim() || !activeConversationId) return;
        
        const text = messageInput;
        setMessageInput(''); 

        await sendMessage(text, activeConversationId);
    };

    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-gray-500">
                <p>Please log in to view your messages.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl shadow-xl h-[70vh] flex overflow-hidden border border-gray-200">
                
                {/* SIDEBAR (List) */}
                <div className={`w-full md:w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {loading && conversations.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">Syncing chats...</div>
                        )}
                        
                        {!loading && conversations.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                <MessageSquareIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                <p>No messages yet.</p>
                            </div>
                        )}

                        {conversations.map(convo => (
                            <div 
                                key={convo.id} 
                                onClick={() => setActiveConversationId(convo.id)} 
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${activeConversationId === convo.id ? 'bg-white border-l-4 border-l-cyan-600 shadow-sm' : ''}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <img src={convo.participant.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">{convo.participant.name}</h3>
                                            <span className="text-xs text-gray-400">
                                                {convo.lastMessage.timestamp instanceof Date ? convo.lastMessage.timestamp.toLocaleDateString([], {month: 'short', day: 'numeric'}) : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {convo.listing?.title && <span className="text-cyan-600 font-medium">[{convo.listing.title}] </span>}
                                            {convo.lastMessage.text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CHAT AREA */}
                <div className={`flex-1 flex flex-col bg-white ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    
                    {activeConversationId ? (
                        <>
                            <header className="p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10 bg-white">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setActiveConversationId(null)} className="md:hidden text-gray-500">
                                        <ChevronLeftIcon className="h-6 w-6" />
                                    </button>
                                    
                                    <img 
                                        src={activeConversation?.participant.avatar || 'https://i.pravatar.cc/150'} 
                                        alt="" 
                                        className="w-10 h-10 rounded-full border border-gray-200" 
                                    />
                                    <div>
                                        <h3 className="font-bold text-gray-900">
                                            {activeConversation?.participant.name || 'Chat'}
                                        </h3>
                                        <p className="text-xs text-cyan-600 font-medium truncate max-w-[200px]">
                                            {activeConversation?.listing?.title}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border">
                                        <LanguagesIcon className="h-4 w-4 text-gray-500" />
                                        <LanguageSelector selectedLang={userLanguage} onChange={setUserLanguage} />
                                    </div>
                                </div>
                            </header>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                {messages.map((msg: any) => {
                                    const isMe = msg.senderId === 'me' || msg.senderId === currentUser.id;
                                    const translated = translatedMessages[msg.id];
                                    
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm relative ${isMe ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                                                <p className="text-sm leading-relaxed">{translated || msg.text}</p>
                                                {translated && (
                                                    <p className="text-[10px] mt-1 opacity-70 italic border-t border-white/20 pt-1">
                                                        Original: "{msg.text}"
                                                    </p>
                                                )}
                                                <div className={`flex items-center justify-end gap-1 mt-1`}>
                                                    <span className={`text-[10px] ${isMe ? 'text-cyan-100' : 'text-gray-400'}`}>
                                                        {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                                    </span>
                                                    {isMe && msg.status === 'sent' && (
                                                        <span className="text-[10px] opacity-70">✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Type a message..."
                                        className="w-full pl-4 pr-12 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-cyan-500 focus:ring-0 rounded-full transition-all text-sm"
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleSend}
                                        disabled={!messageInput.trim()} 
                                        className="absolute right-2 p-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    >
                                        <SendIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <MessageSquareIcon className="h-10 w-10 text-gray-300" />
                            </div>
                            <p className="font-medium">Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatLayout;
