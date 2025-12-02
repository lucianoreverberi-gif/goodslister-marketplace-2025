
import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types/chat';

export const useChatSocket = (conversationId: string | null) => {
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Simulation: Receive a message from the "server"
  const simulateReceiveMessage = useCallback((text: string, originalLang: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: 'partner',
        text: text,
        originalText: text,
        translatedText: "This is a simulated translation of the incoming message.", // Mock AI response
        detectedLanguage: originalLang,
        timestamp: new Date(),
        status: 'read',
        type: 'text',
      };
      setMessages((prev) => [...prev, newMessage]);
      
      // Visual notification
      if (document.hidden) {
        document.title = `(1) New Message | Goodslister`;
      }
    }, 3000); // 3 second delay to simulate typing
  }, []);

  const sendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text,
      originalText: text,
      timestamp: new Date(),
      status: 'sent',
      type: 'text',
    };
    setMessages((prev) => [...prev, newMessage]);
    
    // Simulate a reply
    if (Math.random() > 0.5) {
        simulateReceiveMessage("Hola, ¿está disponible todavía?", "es");
    }
  };

  // Reset messages when changing conversation (Mock logic only)
  useEffect(() => {
    if (conversationId) {
        // Load mock history
        setMessages([
            {
                id: '1',
                senderId: 'partner',
                text: 'Is this item still available?',
                originalText: 'Is this item still available?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60),
                status: 'read',
                type: 'text'
            }
        ]);
    }
  }, [conversationId]);

  return {
    messages,
    sendMessage,
    isTyping,
    isConnected: true
  };
};
