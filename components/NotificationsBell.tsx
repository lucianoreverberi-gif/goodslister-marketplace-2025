import React, { useState, useEffect, useRef } from 'react';
import {
    subscribeToNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    formatRelativeTime,
    Notification
} from '../services/notificationsService';
import { BellIcon, MailIcon, CheckCircleIcon, MessageCircleIcon, AlertTriangleIcon, XIcon } from './icons';

interface NotificationsBellProps {
    userId: string;
    onNavigate?: (hash: string) => void;
}

// Choose an icon per notification type
const getIcon = (type: Notification['type']) => {
    switch (type) {
        case 'booking_new':
        case 'booking_confirmed':
            return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        case 'booking_cancelled':
        case 'booking_rejected':
            return <XIcon className="h-5 w-5 text-orange-500" />;
        case 'message_new':
            return <MessageCircleIcon className="h-5 w-5 text-blue-500" />;
        case 'damage_new':
        case 'damage_resolved':
            return <AlertTriangleIcon className="h-5 w-5 text-red-500" />;
        case 'welcome':
        default:
            return <MailIcon className="h-5 w-5 text-cyan-500" />;
    }
};

const NotificationsBell: React.FC<NotificationsBellProps> = ({ userId, onNavigate }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // Subscribe to Firestore notifications in real time
    useEffect(() => {
        if (!userId) return;
        const unsub = subscribeToNotifications(userId, (items, unread) => {
            setNotifications(items);
            setUnreadCount(unread);
        });
        return () => unsub();
    }, [userId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleNotificationClick = async (notif: Notification) => {
        // Mark as read first (fire and forget UI-wise)
        if (!notif.read) {
            markNotificationAsRead(userId, notif.id);
        }
        // Navigate via hash if link provided
        if (notif.link) {
            if (notif.link.startsWith('#')) {
                window.location.hash = notif.link.substring(1);
                if (onNavigate) onNavigate(notif.link.substring(1));
            } else {
                window.location.href = notif.link;
            }
        }
        setIsOpen(false);
    };

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await markAllNotificationsAsRead(userId);
    };

    if (!userId) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Items */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <BellIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">No notifications yet</p>
                                <p className="text-xs text-gray-400 mt-1">We'll notify you here about bookings, messages, and more.</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-3 ${
                                        n.read ? 'opacity-70' : 'bg-cyan-50/50'
                                    }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                                            <span className="text-[10px] text-gray-500 flex-shrink-0">{formatRelativeTime(n.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                                    </div>
                                    {!n.read && <span className="flex-shrink-0 w-2 h-2 bg-cyan-500 rounded-full mt-2" aria-label="unread"></span>}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsBell;
