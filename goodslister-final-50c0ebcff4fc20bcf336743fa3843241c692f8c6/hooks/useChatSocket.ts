
import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Conversation } from '../types/chat';

export const useChatSocket = (currentUserId: string | undefined, activeConversationId?: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [localMessages, setLocalMessages] = useState<Message[]>([]); // Store optimistic messages here
  const [loading, setLoading] = useState(true);
  const isPollingRef = useRef(false);

  // 1. Fetch Conversations from Real DB
  const fetchConversations = useCallback(async () => {
    if (!currentUserId || isPollingRef.current) return;
    
    isPollingRef.current = true;

    try {
      const response = await fetch('/api/chat/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Map API response to UI types
        const mappedConvos: Conversation[] = data.conversations.map((c: any) => {
            const allParticipantIds = Object.keys(c.participants);
            // Find partner ID
            const otherId = allParticipantIds.find(id => id !== currentUserId) || allParticipantIds[0];
            
            const otherUser = c.participants[otherId] || {
                id: otherId || 'unknown',
                name: 'Unknown User',
                avatarUrl: 'https://i.pravatar.cc/150?u=unknown'
            };
            
            // Safe last message parsing
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
    const intervalId = setInterval(fetchConversations, 3000); 
    return () => clearInterval(intervalId);
  }, [currentUserId, fetchConversations]);

  // 3. Send Message (Optimistic UI)
  const sendMessage = async (text: string, convId?: string, listingId?: string, recipientId?: string) => {
    if (!currentUserId) return;

    // Create a temporary ID
    const tempId = `temp-${Date.now()}`;
    const targetConvoId = convId || activeConversationId;

    // Create optimistic message
    const tempMsg: Message = {
        id: tempId,
        senderId: 'me', // UI treats 'me' as current user
        text: text,
        originalText: text,
        timestamp: new Date(),
        status: 'sent',
        type: 'text'
    };

    // Add to local state immediately
    // If it's a new draft (no conversation ID yet), we mark it with 'NEW_DRAFT' so we can show it
    const localConvoId = targetConvoId || 'NEW_DRAFT';
    setLocalMessages(prev => [...prev, { ...tempMsg, conversationId: localConvoId } as any]);

    try {
        const payload = {
            senderId: currentUserId,
            text,
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
            // Force a sync to get the real ID back and clear the optimistic one effectively
            await fetchConversations();
            // Clear this specific local message since DB has it now
            setLocalMessages(prev => prev.filter(m => m.id !== tempId));
        } else {
            console.error("Send failed");
            // Optionally set status to 'error'
        }
    } catch (e) {
        console.error("Send network error", e);
    }
  };

  // 4. Compute Active Messages (DB + Local)
  // We grab the DB messages for the active conversation and append any local pending messages for it
  const getActiveMessages = () => {
      // If no active conversation, return empty
      if (!activeConversationId) return [];
      
      const convo = conversations.find(c => c.id === activeConversationId);
      const dbMessages = convo ? (convo.fullMessages || []) : [];
      
      // Filter local messages that belong to this conversation
      const pendingMessages = localMessages.filter(m => (m as any).conversationId === activeConversationId);
      
      return [...dbMessages, ...pendingMessages];
  };

  return {
    conversations,
    messages: getActiveMessages(), // Always return combined list
    sendMessage,
    isTyping: false,
    loading
  };
};
