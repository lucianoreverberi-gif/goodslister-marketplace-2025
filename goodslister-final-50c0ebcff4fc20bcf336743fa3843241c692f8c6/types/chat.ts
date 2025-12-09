
export interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  locale: string; // e.g., 'en-US', 'es-MX'
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  originalText: string;
  translatedText?: string;
  detectedLanguage?: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'system';
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: Message;
  unreadCount: number;
  isTyping?: boolean;
  fullMessages?: Message[];
  listing?: any;
}
