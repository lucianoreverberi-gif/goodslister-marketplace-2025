
import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Conversation } from '../types/chat';

export const useChatSocket = (currentUserId: string | undefined, conversationId?: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create a stable fetch function
  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;

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
            // Determine who the OTHER participant is
            const otherId = Object.keys(c.participants).find(id => id !== currentUserId);
            // Fallback: if user is talking to themselves (testing) or data error, pick first
            const validOtherId = otherId || Object.keys(c.participants)[0];
            const otherUser = c.participants[validOtherId];
            
            // Safe fallback if data is incomplete
            const participantName = otherUser?.name || 'Unknown User';
            const participantAvatar = otherUser?.avatarUrl || 'https://i.pravatar.cc/150?u=unknown';

            // Find last message
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
                    id: otherUser?.id || 'unknown',
                    name: participantName,
                    avatar: participantAvatar,
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

        // If a specific conversation is selected, update the messages state
        if (conversationId) {
            const active = mappedConvos.find(c => c.id === conversationId);
            if (active && active.fullMessages) {
                setMessages(active.fullMessages);
            } else {
                setMessages([]);
            }
        }
      }
    } catch (error) {
      console.error("Chat sync error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, conversationId]);

  // Polling Interval
  useEffect(() => {
    if (!currentUserId) return;
    
    fetchConversations(); // Initial fetch
    
    const intervalId = setInterval(() => {
        fetchConversations();
    }, 2500); // Poll frequently for real-time feel

    return () => clearInterval(intervalId);
  }, [currentUserId, conversationId, fetchConversations]);

  const sendMessage = async (text: string, convId?: string, listingId?: string, recipientId?: string) => {
    if (!currentUserId) return;

    const targetConvoId = convId || conversationId;

    try {
        const payload = {
            senderId: currentUserId,
            text,
            conversationId: targetConvoId,
            listingId,
            recipientId
        };

        const res = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            // Optimistic update handled by rapid polling for now, 
            // or we could push to state immediately here.
            fetchConversations();
        }
    } catch (e) {
        console.error("Send failed", e);
    }
  };

  return {
    conversations,
    messages,
    sendMessage,
    isTyping,
    loading
  };
};
