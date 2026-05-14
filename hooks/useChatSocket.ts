
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

    const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUserId)
    );

    // Simple cache to avoid re-fetching the same user multiple times
    const userCache: Record<string, any> = {};

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const convoPromises = snapshot.docs.map(async (convoDoc) => {
            const data = convoDoc.data();
            const otherId = data.participants.find((id: string) => id !== currentUserId) || data.participants[0];
            
            let otherUserName = 'User';
            let otherUserAvatar = `https://i.pravatar.cc/150?u=${otherId}`;
            
            try {
                // Use cache if available to speed up loading
                if (userCache[otherId]) {
                    otherUserName = userCache[otherId].name;
                    otherUserAvatar = userCache[otherId].avatarUrl;
                } else {
                    const userDoc = await getDoc(doc(db, 'users', otherId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        otherUserName = userData.name || otherUserName;
                        otherUserAvatar = userData.avatarUrl || otherUserAvatar;
                        userCache[otherId] = { name: otherUserName, avatarUrl: otherUserAvatar };
                    }
                }
            } catch (e) {
                console.warn("Could not fetch participant info", e);
            }

            const lastMsgDoc = data.lastMessage;
            
            const extractDate = (ts: any) => {
                if (!ts) return new Date();
                if (typeof ts.toDate === 'function') return ts.toDate();
                if (ts instanceof Date) return ts;
                if (typeof ts === 'number') return new Date(ts);
                if (typeof ts === 'string') {
                    const d = new Date(ts);
                    return isNaN(d.getTime()) ? new Date() : d;
                }
                return new Date();
            };

            const lastMessage: Message = lastMsgDoc ? {
                id: lastMsgDoc.id || 'last',
                senderId: lastMsgDoc.senderId,
                text: lastMsgDoc.text,
                originalText: lastMsgDoc.text,
                timestamp: extractDate(lastMsgDoc.timestamp),
                status: 'read',
                type: 'text'
            } : {
                id: `sys-${convoDoc.id}`,
                senderId: 'system',
                text: 'New conversation',
                originalText: '',
                timestamp: extractDate(data.updatedAt),
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
                updatedAt: extractDate(data.updatedAt),
                listing: data.listing ? { id: data.listing.id, title: data.listing.title } : null
            };
        });

        const results = await Promise.all(convoPromises);
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

    const q = query(
        collection(db, 'conversations', activeConversationId, 'messages')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const extractDate = (ts: any) => {
            if (!ts) return new Date();
            if (typeof ts.toDate === 'function') return ts.toDate();
            if (ts instanceof Date) return ts;
            return new Date();
        };

        const msgs = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                senderId: data.senderId,
                text: data.text,
                originalText: data.text,
                timestamp: extractDate(data.timestamp),
                status: 'read',
                type: 'text'
            } as Message;
        });

        msgs.sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
        setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeConversationId]);

  // 3. Send Message
  const sendMessage = async (text: string, convId?: string, listingId?: string, recipientId?: string, listingTitle?: string): Promise<string | null> => {
    if (!currentUserId) return null;

    let targetConvoId = convId || activeConversationId;
    
    // NEW_DRAFT Logic - Check for duplicates before creating
    if (targetConvoId === 'NEW_DRAFT' || !targetConvoId) {
        if (!recipientId) return null;

        try {
            // DETERMINISTIC ID: Use a consistent ID to prevent duplicates at the DB level
            // Formula: convo_[user1]_[user2]_[listingId] (sorted IDs to ensure same ID regardless of who starts)
            const sortedParticipants = [currentUserId, recipientId].sort();
            targetConvoId = listingId 
                ? `convo_${sortedParticipants[0]}_${sortedParticipants[1]}_${listingId}`
                : `convo_${sortedParticipants[0]}_${sortedParticipants[1]}`;

            // Check if convo exists first
            const convoDoc = await getDoc(doc(db, 'conversations', targetConvoId));
            
            if (!convoDoc.exists()) {
                // Create conversation with deterministic ID
                await setDoc(doc(db, 'conversations', targetConvoId), {
                    participants: [currentUserId, recipientId],
                    listing: listingId ? { id: listingId, title: listingTitle || 'Gear' } : null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastMessage: {
                        text: text,
                        senderId: currentUserId,
                        timestamp: new Date()
                    }
                });
            }
        } catch (e) {
            console.error("Convo creation/check failed:", e);
            // Fallback to auto-generated ID if deterministic fails (e.g. ID too long)
            try {
                const convoRef = await addDoc(collection(db, 'conversations'), {
                    participants: [currentUserId, recipientId],
                    listing: listingId ? { id: listingId, title: listingTitle || 'Gear' } : null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastMessage: { text, senderId: currentUserId, timestamp: new Date() }
                });
                targetConvoId = convoRef.id;
            } catch (innerE) {
                return null;
            }
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
