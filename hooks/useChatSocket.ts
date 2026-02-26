
import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Conversation } from '../types/chat';

export const useChatSocket = (currentUserId: string | undefined, activeConversationId?: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const isPollingRef = useRef(false);

  // 1. SYNC
  const fetchConversations = useCallback(async () => {
    if (!currentUserId || isPollingRef.current) return;
    
    isPollingRef.current = true;

    try {
      const response = await fetch(`/api/chat/sync?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        const data = await response.json();
        
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
                text: 'New conversation',
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

  // 2. Polling
  useEffect(() => {
    if (!currentUserId) {
        setLoading(false);
        return;
    }
    
    fetchConversations();
    // Aggressive polling to ensure liveness
    const intervalId = setInterval(fetchConversations, 2000); 
    
    const handleFocus = () => fetchConversations();
    window.addEventListener('focus', handleFocus);

    return () => {
        clearInterval(intervalId);
        window.removeEventListener('focus', handleFocus);
    };
  }, [currentUserId, fetchConversations]);

  // 3. SEND
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

    const localConvoId = targetConvoId || 'NEW_DRAFT';
    setLocalMessages(prev => [...prev, { ...tempMsg, conversationId: localConvoId } as any]);

    // Data Prep: Try to find missing IDs if not provided
    let finalRecipientId = recipientId;
    let finalListingId = listingId;

    if (targetConvoId && targetConvoId !== 'NEW_DRAFT') {
        const existingConvo = conversations.find(c => c.id === targetConvoId);
        if (existingConvo) {
            // CRITICAL: Always send recipient ID to enable backend self-healing
            if (!finalRecipientId) finalRecipientId = existingConvo.participant.id;
            if (!finalListingId && existingConvo.listing) finalListingId = existingConvo.listing.id;
        }
    }

    try {
        const payload = {
            senderId: currentUserId,
            text,
            conversationId: targetConvoId === 'NEW_DRAFT' ? undefined : targetConvoId,
            listingId: finalListingId,
            recipientId: finalRecipientId
        };

        const res = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            setTimeout(() => fetchConversations(), 300); // Quick sync
            setLocalMessages(prev => prev.filter(m => m.id !== tempId));
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

  const getActiveMessages = () => {
      if (!activeConversationId) return [];
      
      const convo = conversations.find(c => c.id === activeConversationId);
      const dbMessages = convo ? (convo.fullMessages || []) : [];
      
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
