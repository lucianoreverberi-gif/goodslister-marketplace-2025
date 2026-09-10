import { db } from './firebase';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    doc,
    updateDoc,
    Timestamp,
    QueryDocumentSnapshot,
    DocumentData,
    getDocs,
    writeBatch,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Firestore-backed notification center for real-time alerts.
 * 
 * Structure: notifications/{userId}/items/{notifId}
 * Fields:
 *   - type: 'booking_new' | 'booking_confirmed' | 'booking_cancelled' | 'message_new' | 'damage_new' | 'deposit_released'
 *   - title: string (short, bold)
 *   - message: string (longer, body)
 *   - link: string (hash route, e.g., '#dashboard' or '#damage/123')
 *   - read: boolean
 *   - createdAt: Timestamp
 * 
 * Notifications are WRITTEN from backend endpoints (via Firebase Admin) or client-side.
 * They are READ by NotificationsBell via real-time onSnapshot subscription.
 */

export type NotificationType =
    | 'booking_new'
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'booking_rejected'
    | 'message_new'
    | 'damage_new'
    | 'damage_resolved'
    | 'deposit_released'
    | 'contract_signed'
    | 'review_received'
    | 'welcome';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    link: string;
    read: boolean;
    createdAt: Date;
}

/**
 * Subscribe to unread notifications for a user in real time.
 * Returns an unsubscribe function to call in useEffect cleanup.
 */
export const subscribeToNotifications = (
    userId: string,
    onUpdate: (notifications: Notification[], unreadCount: number) => void
): (() => void) => {
    if (!userId) return () => {};

    try {
        const notifRef = collection(db, 'notifications', userId, 'items');
        const q = query(notifRef, orderBy('createdAt', 'desc'), limit(20));

        const unsub = onSnapshot(q, (snapshot) => {
            const items: Notification[] = [];
            let unread = 0;
            snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
                const d = docSnap.data();
                const notif: Notification = {
                    id: docSnap.id,
                    type: (d.type || 'welcome') as NotificationType,
                    title: d.title || '',
                    message: d.message || '',
                    link: d.link || '',
                    read: d.read === true,
                    createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date()
                };
                items.push(notif);
                if (!notif.read) unread += 1;
            });
            onUpdate(items, unread);
        }, (error) => {
            console.warn('Notifications subscription error:', error);
            onUpdate([], 0);
        });

        return unsub;
    } catch (e) {
        console.warn('Failed to subscribe to notifications:', e);
        return () => {};
    }
};

/**
 * Mark a single notification as read.
 */
export const markNotificationAsRead = async (userId: string, notifId: string): Promise<void> => {
    if (!userId || !notifId) return;
    try {
        const ref = doc(db, 'notifications', userId, 'items', notifId);
        await updateDoc(ref, { read: true });
    } catch (e) {
        console.warn('Failed to mark notification as read:', e);
    }
};

/**
 * Mark all unread notifications as read.
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    if (!userId) return;
    try {
        const notifRef = collection(db, 'notifications', userId, 'items');
        const q = query(notifRef, where('read', '==', false), limit(50));
        const snap = await getDocs(q);
        if (snap.empty) return;

        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
            batch.update(d.ref, { read: true });
        });
        await batch.commit();
    } catch (e) {
        console.warn('Failed to mark all notifications as read:', e);
    }
};

/**
 * Format a relative timestamp for display (e.g., "2m ago", "1h ago", "3d ago").
 */
export const formatRelativeTime = (date: Date): string => {
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Create a notification for a target user (client-side write).
 * MVP approach - post-launch we'll migrate to firebase-admin backend triggers.
 * Fire-and-forget: errors logged, never blocking.
 */
export interface CreateNotificationInput {
    userId: string; // recipient
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
}

export const createNotification = async (input: CreateNotificationInput): Promise<void> => {
    const { userId, type, title, message, link } = input;
    if (!userId || !type || !title) {
        console.warn('createNotification: missing required fields', input);
        return;
    }
    try {
        const notifRef = collection(db, 'notifications', userId, 'items');
        await addDoc(notifRef, {
            type,
            title,
            message: message || '',
            link: link || '',
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (e) {
        console.warn('Failed to create notification for', userId, e);
    }
};
