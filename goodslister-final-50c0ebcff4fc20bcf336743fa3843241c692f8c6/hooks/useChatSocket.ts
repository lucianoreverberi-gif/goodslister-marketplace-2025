
import { useState, useEffect, useRef } from 'react';
import { Message, Conversation } from '../types/chat';

// Map generic app Conversation type to specific Chat UI type if needed
// For now, we assume strict typing from the API response
export const useChatSocket = (currentUserId: string, conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false); // Typing status is harder with polling, keeping false for now
  
  // Ref to track if we need to scroll down on new message
  const lastMessageIdRef = useRef<string | null>(null);

  // --- POLLING LOGIC ---
  const fetchMessages = async () => {
    if (!currentUserId) return;
    
    try {
        const response = await fetch('/api/chat/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId }),
        });
        
        if (response.ok) {
            const data = await response.json();
            const conversations = data.conversations;
            
            // Filter messages for the ACTIVE conversation
            if (conversationId) {
                const activeConvo = conversations.find((c: any) => c.id === conversationId);
                if (activeConvo && activeConvo.messages) {
                    // Map DB format to UI format if needed
                    const uiMessages: Message[] = activeConvo.messages.map((m: any) => ({
                        id: m.id,
                        senderId: m.senderId === currentUserId ? 'me' : m.senderId, // UI uses 'me' logic
                        text: m.text,
                        originalText: m.text,
                        timestamp: new Date(m.timestamp),
                        status: 'read',
                        type: 'text'
                    }));
                    
                    // Simple dedup check or check length
                    setMessages(uiMessages);
                }
            }
        }
    } catch (e) {
        console.error("Chat sync error", e);
    }
  };

  // Poll every 3 seconds
  useEffect(() => {
    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUserId, conversationId]);


  const sendMessage = async (text: string) => {
    // Optimistic Update
    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      senderId: 'me',
      text,
      originalText: text,
      timestamp: new Date(),
      status: 'sent',
      type: 'text',
    };
    setMessages((prev) => [...prev, newMessage]);

    // Send to Backend
    try {
        await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId,
                senderId: currentUserId,
                text
            })
        });
        // Polling will pick up the confirmed message shortly
    } catch (e) {
        console.error("Failed to send", e);
        // Could mark message as failed here
    }
  };

  return {
    messages,
    sendMessage,
    isTyping: false, // Not supported in simple polling
    isConnected: true
  };
};
