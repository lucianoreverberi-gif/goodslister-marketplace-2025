
import { useState, useEffect, useCallback } from 'react';
import { Message, Conversation } from '../types/chat';
import { 
    db, 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    addDoc, 
    serverTimestamp, 
    doc, 
    setDoc, 
    updateDoc,
    getDocs,
    getDoc,
    Timestamp 
} from '../services/firebase';

export const useChatSocket = (currentUserId: string | undefined, activeConversationId?: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Listen to Conversations
  useEffect(() => {
    if (!currentUserId) {
        setConversations([]);
        setLoading(false);
        return;
    }

    // REMOVED orderBy to avoid mandatory composite index requirement
    const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUserId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const convoPromises = snapshot.docs.map(async (convoDoc) => {
            const data = convoDoc.data();
            const otherId = data.participants.find((id: string) => id !== currentUserId) || data.participants[0];
            
            // Try to fetch other user details for high-quality UI
            let otherUserName = 'User';
            let otherUserAvatar = `https://i.pravatar.cc/150?u=${otherId}`;
            
            try {
                // For demo purposes, we fetch one-off. In production, consider Denormalization.
                const userDoc = await getDoc(doc(db, 'users', otherId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    otherUserName = userData.name || otherUserName;
                    otherUserAvatar = userData.avatarUrl || otherUserAvatar;
                }
            } catch (e) {
                console.warn("Could not fetch participant info", e);
            }

            const lastMsgDoc = data.lastMessage;
            const lastMessage: Message = lastMsgDoc ? {
                id: lastMsgDoc.id || 'last',
                senderId: lastMsgDoc.senderId,
                text: lastMsgDoc.text,
                originalText: lastMsgDoc.text,
                timestamp: lastMsgDoc.timestamp?.toDate() || new Date(),
                status: 'read',
                type: 'text'
            } : {
                id: `sys-${convoDoc.id}`,
                senderId: 'system',
                text: 'New conversation',
                originalText: '',
                timestamp: data.updatedAt?.toDate() || new Date(),
                status: 'read',
                type: 'system'
            };

            return {
                id: convoDoc.id,
                participant: {
                    id: otherId,
                    name: otherUserName,
                    avatar: otherUserAvatar,
                    isOnline: false,
                    locale: 'en-US'
                },
                lastMessage: lastMessage,
                unreadCount: 0,
                updatedAt: data.updatedAt?.toDate() || new Date(), // Keep for client sorting
                listing: data.listing ? { id: data.listing.id, title: data.listing.title } : null
            };
        });

        const results = await Promise.all(convoPromises);
        // Sort client-side to avoid index requirement
        results.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));

        setConversations(results);
        setLoading(false);
    }, (error) => {
        console.error("Conversations listener error:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // 2. Listen to Messages for Active Conversation
  useEffect(() => {
    if (!activeConversationId || activeConversationId === 'NEW_DRAFT') {
        setMessages([]);
        return;
    }

    // REMOVED orderBy to avoid mandatory composite index requirement
    const q = query(
        collection(db, 'conversations', activeConversationId, 'messages')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                senderId: data.senderId,
                text: data.text,
                originalText: data.text,
                timestamp: data.timestamp?.toDate() || new Date(),
                status: 'read',
                type: 'text'
            } as Message;
        });

        // Sort client-side
        msgs.sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));

        setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeConversationId]);

  // 3. Send Message
  const sendMessage = async (text: string, convId?: string, listingId?: string, recipientId?: string): Promise<string | null> => {
    if (!currentUserId) return null;

    let targetConvoId = convId || activeConversationId;
    
    // NEW_DRAFT Logic
    if (targetConvoId === 'NEW_DRAFT' || !targetConvoId) {
        if (!recipientId) return null;

        try {
            // Create conversation first
            const convoRef = await addDoc(collection(db, 'conversations'), {
                participants: [currentUserId, recipientId],
                listing: listingId ? { id: listingId, title: 'Listing' } : null, // Title usually passed or fetched
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastMessage: {
                    text: text,
                    senderId: currentUserId,
                    timestamp: new Date() // Temporary for sorting before server sync
                }
            });
            targetConvoId = convoRef.id;
        } catch (e) {
            console.error("Convo creation failed:", e);
            return null;
        }
    }

    try {
        // Add message to subcollection
        const msgData = {
            senderId: currentUserId,
            text,
            timestamp: serverTimestamp()
        };

        await addDoc(collection(db, 'conversations', targetConvoId, 'messages'), msgData);

        // Update conversation metadata for inbox sorting
        await updateDoc(doc(db, 'conversations', targetConvoId), {
            updatedAt: serverTimestamp(),
            lastMessage: {
                ...msgData,
                timestamp: new Date() // Use local date for immediate update in client if possible
            }
        });

        return targetConvoId;
    } catch (e) {
        console.error("Send message failed:", e);
        return null;
    }
  };

  return {
    conversations,
    messages,
    sendMessage,
    refresh: () => {}, // Not needed for real-time
    isTyping: false,
    loading
  };
};
