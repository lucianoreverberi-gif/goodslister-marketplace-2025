import React, { useMemo } from 'react';
import type { Booking } from '../types';
import {
    ClockIcon,
    AlertTriangleIcon,
    FileTextIcon,
    RocketIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    MailIcon,
    PackageIcon,
} from './icons';
import { format, differenceInHours } from 'date-fns';

/**
 * AttentionPanel
 *
 * Analyzes the user's bookings and surfaces the items that need action,
 * sorted by urgency. Rendered on the dashboard Home tab so hosts and
 * renters see what matters most on landing.
 *
 * Priority tiers (lower = more urgent):
 *   1 — OVERDUE                  (active + past end_date)
 *   2 — NEW BOOKING REQUEST      (pending, host must accept/decline)
 *   2 — HOST SIGNATURE NEEDED    (confirmed, renter signed, host hasn't)
 *   2 — CHECK-IN < 6h            (both signed, start within 6 hours)
 *   2 — RETURN < 3h              (active + end within 3 hours)
 *   3 — CHECK-IN 6–48h          (both signed, start within 48 hours)
 *   4 — RETURN 3–24h            (active + end within 24 hours)
 *
 * Empty state shows a friendly "All caught up" instead of hiding.
 */

interface UrgentItem {
    id: string;
    type: 'overdue' | 'new_request' | 'host_sign' | 'checkin_ready' | 'return_soon';
    booking: Booking;
    priority: number;
    label: string;
    subtitle: string;
    action: string;
    actionColor: string;
    onAction: () => void;
    Icon: React.FC<{ className?: string }>;
    tint: string;
}

interface AttentionPanelProps {
    userId: string;
    bookings: Booking[];
    justSignedIds: Set<string>;
    onOpenSignContract: (b: Booking) => void;
    onOpenCheckIn: (b: Booking) => void;
    onOpenReturn: (b: Booking) => void;
    onOpenBookings: () => void;
}

const AttentionPanel: React.FC<AttentionPanelProps> = ({
    userId,
    bookings,
    justSignedIds,
    onOpenSignContract,
    onOpenCheckIn,
    onOpenReturn,
    onOpenBookings,
}) => {
    const items = useMemo<UrgentItem[]>(() => {
        const now = new Date();
        const list: UrgentItem[] = [];

        for (const b of bookings) {
            const isHost = b.listing?.ownerId === userId;
            const isRenter = b.renterId === userId;
            if (!isHost && !isRenter) continue;

            const start = new Date(b.startDate);
            const end = new Date(b.endDate);
            const hoursToStart = differenceInHours(start, now);
            const hoursToEnd = differenceInHours(end, now);
            const listingTitle = b.listing?.title || 'Rental';

            // 1. OVERDUE
            if (b.status === 'active' && hoursToEnd < 0) {
                list.push({
                    id: b.id + '_overdue',
                    type: 'overdue',
                    booking: b,
                    priority: 1,
                    label: isHost ? 'RENTAL IS OVERDUE' : 'YOU ARE OVERDUE TO RETURN',
                    subtitle: listingTitle + ' · was due ' + format(end, 'MMM d, h:mm a'),
                    action: isHost ? 'CHECK STATUS' : 'RETURN NOW',
                    actionColor: 'bg-red-600 hover:bg-red-700',
                    onAction: () => onOpenReturn(b),
                    Icon: AlertTriangleIcon,
                    tint: 'bg-red-100 text-red-600',
                });
                continue;
            }

            // 2. NEW BOOKING REQUEST (host only)
            if (isHost && b.status === 'pending') {
                list.push({
                    id: b.id + '_pending',
                    type: 'new_request',
                    booking: b,
                    priority: 2,
                    label: 'NEW BOOKING REQUEST',
                    subtitle: listingTitle + ' · ' + format(start, 'MMM d') + '–' + format(end, 'MMM d'),
                    action: 'REVIEW',
                    actionColor: 'bg-amber-500 hover:bg-amber-600',
                    onAction: onOpenBookings,
                    Icon: MailIcon,
                    tint: 'bg-amber-100 text-amber-600',
                });
                continue;
            }

            // 3. HOST SIGNATURE NEEDED
            const hostSignedNow = !!b.hostSignedAt || justSignedIds.has(b.id + '_host');
            const renterSignedNow = !!b.renterSignedAt || justSignedIds.has(b.id);
            if (isHost && b.status === 'confirmed' && renterSignedNow && !hostSignedNow) {
                list.push({
                    id: b.id + '_hostsign',
                    type: 'host_sign',
                    booking: b,
                    priority: 2,
                    label: 'YOUR SIGNATURE NEEDED',
                    subtitle: listingTitle + ' · starts ' + format(start, 'MMM d, h:mm a'),
                    action: 'SIGN CONTRACT',
                    actionColor: 'bg-amber-500 hover:bg-amber-600',
                    onAction: () => onOpenSignContract(b),
                    Icon: FileTextIcon,
                    tint: 'bg-amber-100 text-amber-600',
                });
                continue;
            }

            // 4. CHECK-IN READY (host, both signed, starts within 48h)
            if (
                isHost &&
                b.status === 'confirmed' &&
                renterSignedNow &&
                hostSignedNow &&
                hoursToStart >= -2 &&
                hoursToStart < 48
            ) {
                const urgent = hoursToStart < 6;
                list.push({
                    id: b.id + '_checkin',
                    type: 'checkin_ready',
                    booking: b,
                    priority: urgent ? 2 : 3,
                    label: urgent
                        ? (hoursToStart < 1 ? 'CHECK-IN NOW' : 'CHECK-IN IN ' + Math.max(1, Math.ceil(hoursToStart)) + 'H')
                        : 'CHECK-IN IN ' + Math.ceil(hoursToStart) + 'H',
                    subtitle: listingTitle + ' · ' + format(start, 'MMM d, h:mm a'),
                    action: 'CHECK-IN',
                    actionColor: 'bg-cyan-600 hover:bg-cyan-700',
                    onAction: () => onOpenCheckIn(b),
                    Icon: RocketIcon,
                    tint: urgent ? 'bg-amber-100 text-amber-600' : 'bg-cyan-100 text-cyan-600',
                });
                continue;
            }

            // 5. RETURN SOON (active, ends within 24h)
            if (b.status === 'active' && hoursToEnd >= 0 && hoursToEnd < 24) {
                const urgent = hoursToEnd < 3;
                list.push({
                    id: b.id + '_return',
                    type: 'return_soon',
                    booking: b,
                    priority: urgent ? 2 : 4,
                    label: urgent
                        ? (hoursToEnd < 1 ? 'RETURN IMMINENT' : 'RETURN IN ' + Math.max(1, Math.ceil(hoursToEnd)) + 'H')
                        : 'RETURN IN ' + Math.ceil(hoursToEnd) + 'H',
                    subtitle: listingTitle + ' · due ' + format(end, 'MMM d, h:mm a'),
                    action: isHost ? 'READY FOR RETURN' : 'START RETURN',
                    actionColor: 'bg-slate-900 hover:bg-black',
                    onAction: () => onOpenReturn(b),
                    Icon: ClockIcon,
                    tint: urgent ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600',
                });
                continue;
            }
        }

        // Sort by priority ASC (most urgent first), tie-break by earliest date
        list.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return new Date(a.booking.startDate).getTime() - new Date(b.booking.startDate).getTime();
        });

        // Cap at 5 to avoid a wall of alerts
        return list.slice(0, 5);
    }, [bookings, userId, justSignedIds, onOpenSignContract, onOpenCheckIn, onOpenReturn, onOpenBookings]);

    // -------------------------------------------------------
    // Empty state — friendly, doesn't scream for attention
    // -------------------------------------------------------
    if (items.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircleIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-base">All caught up</h3>
                        <p className="text-sm text-slate-500">No pending actions right now. Enjoy the calm ✨</p>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------
    // With items — amber-tinted panel with prioritized action cards
    // -------------------------------------------------------
    return (
        <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl p-6 border-2 border-amber-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
                        {items.length} action{items.length > 1 ? 's' : ''} need your attention
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Sorted by urgency · click any card to act</p>
                </div>
            </div>

            <div className="space-y-2">
                {items.map(item => {
                    const Icon = item.Icon;
                    return (
                        <div
                            key={item.id}
                            className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.tint}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs font-black uppercase tracking-wider text-slate-900">
                                        {item.label}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5 truncate">{item.subtitle}</div>
                                </div>
                            </div>
                            <button
                                onClick={item.onAction}
                                className={`px-4 py-2 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 flex-shrink-0 ${item.actionColor}`}
                            >
                                {item.action}
                                <ArrowRightIcon className="h-3 w-3" />
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-amber-200 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <PackageIcon className="h-3 w-3" />
                    {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
                </p>
                <button
                    onClick={onOpenBookings}
                    className="text-[10px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 flex items-center gap-1"
                >
                    View all <ArrowRightIcon className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
};

export default AttentionPanel;
