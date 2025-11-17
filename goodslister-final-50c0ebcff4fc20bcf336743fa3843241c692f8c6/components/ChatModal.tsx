import React, { useState, useEffect, useRef } from 'react';
import { Conversation, User, Message } from '../types';
import { XIcon, SendIcon, LanguagesIcon, ChevronLeftIcon } from './icons';
import { translateText } from '../services/geminiService';

// FIX: Added `userLanguage` and `onLanguageChange` to the props interface to allow language state to be managed by the parent component, resolving a type error in `App.tsx`.
interface ChatInboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
    currentUser: User;
    onSendMessage: (conversationId: string, text: string) => void;
    initialConversationId?: string | null;
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
                className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-3 py-1 pr-8 rounded-md shadow-sm text-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            >
                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    );
};

// FIX: Refactored component to use `userLanguage` and `onLanguageChange` props instead of its own local state for language selection.
const ChatInboxModal: React.FC<ChatInboxModalProps> = ({ isOpen, onClose, conversations, currentUser, onSendMessage, initialConversationId, userLanguage, onLanguageChange }) => {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId || null);
    const [messageInput, setMessageInput] = useState('');
    const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
    const [isTranslating, setIsTranslating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    useEffect(() => {
        if (initialConversationId) {
            setActiveConversationId(initialConversationId);
        }
    }, [initialConversationId]);
    
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeConversation?.messages, translatedMessages]);

    // Effect to translate messages when conversation or language changes
    useEffect(() => {
        if (!activeConversation) return;

        const translateAllMessages = async () => {
            // For this app, we assume the other participant (owner) always writes in English.
            // No need to translate if the target is English.
            if (userLanguage === 'English') {
                 setTranslatedMessages({}); // Clear previous translations
                 return;
            }

            setIsTranslating(true);
            const translations: Record<string, string> = {};
            const messagesToTranslate = activeConversation.messages.filter(
                msg => msg.senderId !== currentUser.id
            );

            await Promise.all(messagesToTranslate.map(async (msg) => {
                const translatedText = await translateText(msg.text, userLanguage, "English");
                translations[msg.id] = translatedText;
            }));

            setTranslatedMessages(translations);
            setIsTranslating(false);
        };

        translateAllMessages();
    }, [activeConversation, userLanguage, currentUser.id]);


    if (!isOpen) return null;

    const getOtherParticipant = (convo: Conversation) => {
        const otherId = Object.keys(convo.participants).find(id => id !== currentUser.id);
        return otherId ? convo.participants[otherId] : null;
    };

    const handleSend = () => {
        if (messageInput.trim() && activeConversationId) {
            onSendMessage(activeConversationId, messageInput);
            setMessageInput('');
        }
    };
    
    return (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg h-[80vh] flex flex-col relative overflow-hidden">
                {!activeConversation ? (
                    <>
                        <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <XIcon className="h-6 w-6" />
                            </button>
                        </header>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.length > 0 ? (
                                <ul>
                                    {conversations.map(convo => {
                                        const otherUser = getOtherParticipant(convo);
                                        const lastMessage = convo.messages[convo.messages.length - 1];
                                        return (
                                            <li key={convo.id} onClick={() => setActiveConversationId(convo.id)} className="p-4 flex items-center space-x-4 cursor-pointer hover:bg-gray-50 border-b">
                                                <img src={otherUser?.avatarUrl} alt={otherUser?.name} className="w-12 h-12 rounded-full" />
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="flex justify-between">
                                                        <p className="font-semibold text-gray-800 truncate">{otherUser?.name}</p>
                                                        {/* Could add message timestamp here */}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">{lastMessage?.text || `Conversation about "${convo.listing.title}"`}</p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="text-center p-10 text-gray-600">
                                    <p>You don't have any conversations yet.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <header className="flex items-center justify-between p-3 border-b sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setActiveConversationId(null)} className="text-gray-500 hover:text-gray-800 p-1">
                                    <ChevronLeftIcon className="h-6 w-6" />
                                </button>
                                <img src={getOtherParticipant(activeConversation)?.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm leading-tight">{getOtherParticipant(activeConversation)?.name}</h3>
                                    <p className="text-xs text-gray-500 truncate leading-tight">{activeConversation.listing.title}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <XIcon className="h-6 w-6" />
                            </button>
                        </header>
                        <div className="p-4 flex items-center justify-between border-b bg-gray-50 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <LanguagesIcon className="h-5 w-5" />
                                <span>Translate conversation to:</span>
                            </div>
                             <div className="flex items-center gap-2">
                                {isTranslating && <span className="text-xs text-gray-500 animate-pulse">Translating...</span>}
                                <LanguageSelector selectedLang={userLanguage} onChange={onLanguageChange} />
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-100">
                            {activeConversation.messages.map(msg => {
                                const messageText = msg.senderId === currentUser.id
                                    ? msg.text
                                    : translatedMessages[msg.id] || msg.text;
                                
                                const isTranslated = msg.senderId !== currentUser.id &&
                                                     translatedMessages[msg.id] &&
                                                     translatedMessages[msg.id] !== msg.text;

                                return (
                                    <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-xl ${msg.senderId === currentUser.id ? 'bg-cyan-600 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                                            <p className="text-sm">{messageText}</p>
                                        </div>
                                        {isTranslated && (
                                            <p className="text-xs text-gray-400 mt-1 italic">Original: "{msg.text}"</p>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t flex items-center bg-white">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your message..."
                                className="w-full border-gray-300 rounded-full shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-sm px-4 py-2"
                            />
                            <button onClick={handleSend} className="ml-2 flex-shrink-0 p-2 text-white bg-cyan-600 rounded-full hover:bg-cyan-700">
                                <SendIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatInboxModal;