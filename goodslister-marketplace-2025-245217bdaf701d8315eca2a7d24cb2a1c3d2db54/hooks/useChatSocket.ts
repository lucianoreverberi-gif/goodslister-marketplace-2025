
import { useState, useEffect, useCallback } from 'react';
import { Message, Conversation } from '../types/chat';

export const useChatSocket = (currentUserId: string | undefined, conversationId?: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Conversations from Real DB ONLY
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
            const allParticipantIds = Object.keys(c.participants);
            const otherId = allParticipantIds.find(id => id !== currentUserId);
            
            // Fallback: If for some reason we can't find 'other' (e.g. self-chat or data error), pick the first one
            const validOtherId = otherId || allParticipantIds[0];
            
            // Get user object or create placeholder if missing from map
            const otherUser = c.participants[validOtherId] || {
                id: validOtherId || 'unknown',
                name: 'Unknown User',
                avatarUrl: 'https://i.pravatar.cc/150?u=unknown'
            };
            
            const participantName = otherUser.name || 'Unknown User';
            const participantAvatar = otherUser.avatarUrl || 'https://i.pravatar.cc/150?u=unknown';

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

            // Map all messages for the active view
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

        // If a specific conversation is selected, update the messages state immediately
        if (conversationId) {
            const active = mappedConvos.find(c => c.id === conversationId);
            if (active && active.fullMessages) {
                setMessages(active.fullMessages);
            } else {
                setMessages([]);
            }
        }
      } else {
          console.error("Failed to sync chat from DB");
      }
    } catch (error) {
      console.error("Chat sync error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, conversationId]);

  // 2. Polling Interval (Real-time simulation)
  useEffect(() => {
    if (!currentUserId) {
        setLoading(false);
        return;
    }
    
    fetchConversations(); // Initial fetch
    
    // Poll every 3 seconds to get new messages from DB
    const intervalId = setInterval(() => {
        fetchConversations();
    }, 3000); 

    return () => clearInterval(intervalId);
  }, [currentUserId, conversationId, fetchConversations]);

  // 3. Send Message Function
  const sendMessage = async (text: string, convId?: string, listingId?: string, recipientId?: string) => {
    if (!currentUserId) return;

    const targetConvoId = convId || conversationId;

    // Optimistic Update (shows message immediately before DB confirms)
    const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        senderId: 'me',
        text: text,
        originalText: text,
        timestamp: new Date(),
        status: 'sent',
        type: 'text'
    };
    setMessages(prev => [...prev, tempMsg]);

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
            // The polling will pick up the real message ID shortly and replace the temp one
            fetchConversations();
        } else {
            console.error("Send API failed");
        }
    } catch (e) {
        console.error("Send failed", e);
    }
  };

  return {
    conversations,
    messages,
    sendMessage,
    isTyping: false,
    loading
  };
};
