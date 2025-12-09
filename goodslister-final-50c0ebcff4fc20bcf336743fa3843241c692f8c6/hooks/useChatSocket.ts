
import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Conversation } from '../types/chat';

export const useChatSocket = (currentUserId: string | undefined, activeConversationId?: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const isPollingRef = useRef(false);

  // 1. Fetch Conversations from Real DB
  const fetchConversations = useCallback(async () => {
    if (!currentUserId || isPollingRef.current) return;
    
    isPollingRef.current = true;

    try {
      // CACHE BUSTING: Add ?t=timestamp to force fresh request to Vercel
      const response = await fetch(`/api/chat/sync?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Map API response to UI types
        const mappedConvos: Conversation[] = data.conversations.map((c: any) => {
            const allParticipantIds = Object.keys(c.participants);
            const otherId = allParticipantIds.find(id => id !== currentUserId) || allParticipantIds[0];
            
            const otherUser = c.participants[otherId] || {
                id: otherId || 'unknown',
                name: 'Unknown User',
                avatarUrl: 'https://i.pravatar.cc/150?u=unknown'
            };
            
            const lastMsgObj = c.messages && c.messages.length > 0 
                ? c.messages[c.messages.length - 1] 
                : null;

            const lastMessage: Message = lastMsgObj ? {
                id: lastMsgObj.id,
                senderId: lastMsgObj.senderId,
                text: lastMsgObj.text,
                originalText: lastMsgObj.text,
                timestamp: new Date(lastMsgObj.timestamp),
                status: 'read',
                type: 'text'
            } : {
                id: `sys-${c.id}`,
                senderId: 'system',
                text: 'New conversation started',
                originalText: '',
                timestamp: new Date(c.updated_at || Date.now()),
                status: 'read',
                type: 'system'
            };

            const fullMessages = c.messages ? c.messages.map((m: any) => ({
                id: m.id,
                senderId: m.senderId === currentUserId ? 'me' : m.senderId,
                text: m.text,
                originalText: m.text,
                timestamp: new Date(m.timestamp),
                status: 'read',
                type: 'text'
            })) : [];

            return {
                id: c.id,
                participant: {
                    id: otherUser.id,
                    name: otherUser.name || 'User',
                    avatar: otherUser.avatarUrl,
                    isOnline: false, 
                    locale: 'en-US'
                },
                lastMessage: lastMessage,
                unreadCount: 0,
                fullMessages: fullMessages,
                listing: c.listing 
            };
        });

        setConversations(mappedConvos);
      }
    } catch (error) {
      console.error("Chat sync error:", error);
    } finally {
      setLoading(false);
      isPollingRef.current = false;
    }
  }, [currentUserId]);

  // 2. Polling Interval
  useEffect(() => {
    if (!currentUserId) {
        setLoading(false);
        return;
    }
    
    fetchConversations();
    // Poll every 3 seconds
    const intervalId = setInterval(fetchConversations, 3000); 
    
    // Also poll when window regains focus (user comes back to tab)
    const handleFocus = () => fetchConversations();
    window.addEventListener('focus', handleFocus);

    return () => {
        clearInterval(intervalId);
        window.removeEventListener('focus', handleFocus);
    };
  }, [currentUserId, fetchConversations]);

  // 3. Send Message - Now returns Promise<string | null> (The New Conversation ID)
  const sendMessage = async (text: string, convId?: string, listingId?: string, recipientId?: string): Promise<string | null> => {
    if (!currentUserId) return null;

    const tempId = `temp-${Date.now()}`;
    const targetConvoId = convId || activeConversationId;

    const tempMsg: Message = {
        id: tempId,
        senderId: 'me',
        text: text,
        originalText: text,
        timestamp: new Date(),
        status: 'sent',
        type: 'text'
    };

    // If it's a draft, use 'NEW_DRAFT' so the UI shows it optimistically
    const localConvoId = targetConvoId || 'NEW_DRAFT';
    setLocalMessages(prev => [...prev, { ...tempMsg, conversationId: localConvoId } as any]);

    try {
        const payload = {
            senderId: currentUserId,
            text,
            // If it's a new draft, don't send 'NEW_DRAFT' to backend, send undefined so backend creates new
            conversationId: targetConvoId === 'NEW_DRAFT' ? undefined : targetConvoId,
            listingId,
            recipientId
        };

        const res = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await responseData(res);
            
            // Force immediate sync to get the server's version of the message
            fetchConversations();
            
            // Remove optimistic message once synced
            setLocalMessages(prev => prev.filter(m => m.id !== tempId));
            
            // Return the actual conversation ID created by the server
            return data.conversationId; 
        } else {
            console.error("Send failed");
            return null;
        }
    } catch (e) {
        console.error("Send network error", e);
        return null;
    }
  };

  const responseData = async(res: Response) => {
      try { return await res.json(); } catch(e) { return {}; }
  }

  const getActiveMessages = () => {
      if (!activeConversationId) return [];
      
      const convo = conversations.find(c => c.id === activeConversationId);
      const dbMessages = convo ? (convo.fullMessages || []) : [];
      
      // Filter local messages. 
      // If we are in 'NEW_DRAFT' mode, show 'NEW_DRAFT' local messages.
      // If we are in real ID mode, show messages for that ID.
      const pendingMessages = localMessages.filter(m => 
          (m as any).conversationId === activeConversationId || 
          (activeConversationId === 'NEW_DRAFT' && (m as any).conversationId === 'NEW_DRAFT')
      );
      
      return [...dbMessages, ...pendingMessages];
  };

  return {
    conversations,
    messages: getActiveMessages(),
    sendMessage,
    refresh: fetchConversations,
    isTyping: false,
    loading
  };
};
