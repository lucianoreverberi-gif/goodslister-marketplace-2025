
import React, { useState, useEffect, useRef } from 'react';
import { User, Listing } from '../types';
import { XIcon, SendIcon, LanguagesIcon, ChevronLeftIcon, MessageSquareIcon } from './icons';
import { translateText } from '../services/geminiService';
import { useChatSocket } from '../hooks/useChatSocket';

interface ChatInboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    initialContext?: {
        listing?: Listing;
        recipient?: User;
        conversationId?: string;
    } | null;
    userLanguage: string;
    onLanguageChange: (lang: string) => void;
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

const ChatInboxModal: React.FC<ChatInboxModalProps> = ({ isOpen, onClose, currentUser, initialContext, userLanguage, onLanguageChange }) => {
    // Local State for Selection
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    
    // Hook: Pass active ID so it returns the correct merged message stream
    const { conversations, messages, sendMessage, loading } = useChatSocket(currentUser.id, activeConversationId);
    
    const [messageInput, setMessageInput] = useState('');
    const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
    const [isTranslating, setIsTranslating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Handle Initial Context / Deep Linking
    useEffect(() => {
        if (isOpen && initialContext) {
            if (initialContext.conversationId) {
                setActiveConversationId(initialContext.conversationId);
            } else if (initialContext.listing && initialContext.recipient) {
                // Check if we already have a conversation for this listing to avoid duplicates
                const existing = conversations.find((c: any) => 
                    c.listing?.id === initialContext.listing?.id
                );
                if (existing) {
                    setActiveConversationId(existing.id);
                } else {
                    setActiveConversationId('NEW_DRAFT');
                }
            }
        }
    }, [isOpen, initialContext, conversations.length]); // Check conversations length to see if sync finished

    // Identify Active Conversation Object (for header info)
    const activeConversation = activeConversationId !== 'NEW_DRAFT' 
        ? conversations.find(c => c.id === activeConversationId)
        : null;

    const draftRecipient = activeConversationId === 'NEW_DRAFT' ? initialContext?.recipient : null;
    const draftListing = activeConversationId === 'NEW_DRAFT' ? initialContext?.listing : null;

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, activeConversationId]);

    const handleSend = async () => {
        if (!messageInput.trim()) return;
        const text = messageInput;
        setMessageInput(''); // Clear immediately for UX

        if (activeConversationId === 'NEW_DRAFT' && draftListing && draftRecipient) {
            await sendMessage(text, undefined, draftListing.id, draftRecipient.id);
            // We stay in NEW_DRAFT state visually, but the hook handles the optimistic update
            // Once the poll happens, it will sync the real conversation
        } else if (activeConversationId) {
            await sendMessage(text, activeConversationId);
        }
    };

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] flex overflow-hidden border border-gray-200">
                
                {/* SIDEBAR (List) */}
                <div className={`w-full md:w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Inbox</h2>
                        <button onClick={onClose} className="md:hidden text-gray-500">
                            <XIcon className="h-6 w-6" />
                        </button>
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
                    
                    {/* Chat Header */}
                    {activeConversationId ? (
                        <>
                            <header className="p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10 bg-white">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setActiveConversationId(null)} className="md:hidden text-gray-500">
                                        <ChevronLeftIcon className="h-6 w-6" />
                                    </button>
                                    
                                    <img 
                                        src={activeConversation ? activeConversation.participant.avatar : (draftRecipient?.avatarUrl || 'https://i.pravatar.cc/150')} 
                                        alt="" 
                                        className="w-10 h-10 rounded-full border border-gray-200" 
                                    />
                                    <div>
                                        <h3 className="font-bold text-gray-900">
                                            {activeConversation ? activeConversation.participant.name : (draftRecipient?.name || 'New Chat')}
                                        </h3>
                                        <p className="text-xs text-cyan-600 font-medium truncate max-w-[200px]">
                                            {activeConversation?.listing?.title || draftListing?.title}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border">
                                        <LanguagesIcon className="h-4 w-4 text-gray-500" />
                                        <LanguageSelector selectedLang={userLanguage} onChange={onLanguageChange} />
                                    </div>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                        <XIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </header>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                {activeConversationId === 'NEW_DRAFT' && messages.length === 0 && (
                                    <div className="text-center py-10 text-gray-400 text-sm">
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <SendIcon className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <p>This is the start of your conversation with <strong>{draftRecipient?.name}</strong>.</p>
                                        <p className="mt-2 text-xs">Ask about availability or details for {draftListing?.title}.</p>
                                    </div>
                                )}

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

export default ChatInboxModal;
