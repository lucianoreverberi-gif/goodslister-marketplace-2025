
import React from 'react';
import { Conversation } from '../../types/chat';
import { Search } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, activeId, onSelect }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Inbox</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((convo) => (
          <div 
            key={convo.id}
            onClick={() => onSelect(convo.id)}
            className={`group p-4 flex items-start gap-3 cursor-pointer transition-colors border-b border-gray-50 hover:bg-gray-50
              ${activeId === convo.id ? 'bg-indigo-50 border-indigo-100' : ''}
            `}
          >
            {/* Avatar */}
            <div className="relative">
              <img 
                src={convo.participant.avatar} 
                alt={convo.participant.name} 
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              {convo.participant.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className={`font-semibold text-sm truncate ${activeId === convo.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                  {convo.participant.name}
                </h3>
                <span className="text-[10px] text-gray-400">10m</span>
              </div>
              
              <div className="flex justify-between items-center">
                <p className={`text-xs truncate max-w-[80%] ${convo.unreadCount > 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                  {convo.isTyping ? <span className="text-indigo-500 animate-pulse">Typing...</span> : convo.lastMessage.text}
                </p>
                
                {convo.unreadCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {convo.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
