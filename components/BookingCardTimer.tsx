import React, { useState, useEffect } from 'react';
import { ClockIcon, AlertTriangleIcon } from './icons';

/**
 * BookingCardTimer
 *
 * Live countdown to a booking's endDate (Scheduled Return). Ticks every
 * second. Renders three visual states based on how close/past the deadline:
 *
 *   1. Normal   — slate text, clock icon
 *   2. Imminent — amber, when < 30 min remaining
 *   3. Overdue  — red, when deadline has passed
 *
 * Two size variants:
 *   compact = true  — for use inline in booking cards on the dashboard
 *   compact = false — for use as a large hero timer (RENTAL_DASHBOARD)
 *
 * Also exports the calcTimeLeft helper for reuse elsewhere.
 */

export interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
    isImminent: boolean; // true when < 30 min remaining and not yet overdue
    totalMinutesRemaining: number; // positive if in the future, negative if overdue
}

export function calcTimeLeft(endDate: string | Date): TimeLeft {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    const isOverdue = diff < 0;
    const abs = Math.abs(diff);
    const totalMinutesRemaining = Math.floor(diff / (1000 * 60));
    return {
        days: Math.floor(abs / (1000 * 60 * 60 * 24)),
        hours: Math.floor((abs / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((abs / (1000 * 60)) % 60),
        seconds: Math.floor((abs / 1000) % 60),
        isOverdue,
        isImminent: !isOverdue && diff < 30 * 60 * 1000,
        totalMinutesRemaining,
    };
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function formatDuration(t: TimeLeft): string {
    const hhmmss = `${pad(t.hours)}:${pad(t.minutes)}:${pad(t.seconds)}`;
    return t.days > 0 ? `${t.days}d ${hhmmss}` : hhmmss;
}

interface BookingCardTimerProps {
    endDate: string | Date;
    compact?: boolean;
    /** When true, hides itself once overdue (useful in cases where the card
     * already shows an overdue badge). Default false — timer stays visible. */
    hideWhenOverdue?: boolean;
}

const BookingCardTimer: React.FC<BookingCardTimerProps> = ({
    endDate,
    compact = true,
    hideWhenOverdue = false,
}) => {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(endDate));

    useEffect(() => {
        // Tick immediately (so state is fresh on mount after props change)
        setTimeLeft(calcTimeLeft(endDate));
        const interval = window.setInterval(() => {
            setTimeLeft(calcTimeLeft(endDate));
        }, 1000);
        return () => window.clearInterval(interval);
    }, [endDate]);

    if (hideWhenOverdue && timeLeft.isOverdue) return null;

    const colorClass = timeLeft.isOverdue
        ? 'text-red-600'
        : timeLeft.isImminent
            ? 'text-amber-600'
            : 'text-slate-700';

    const Icon = timeLeft.isOverdue ? AlertTriangleIcon : ClockIcon;

    if (compact) {
        return (
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold ${colorClass}`}>
                <Icon className="h-3 w-3 flex-shrink-0" />
                <span className="tabular-nums">
                    {timeLeft.isOverdue && '−'}
                    {formatDuration(timeLeft)}
                </span>
                <span className="font-normal opacity-70">
                    {timeLeft.isOverdue ? 'overdue' : 'to return'}
                </span>
            </div>
        );
    }

    // Full-size variant (for RENTAL_DASHBOARD hero)
    return (
        <div className="text-center">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${timeLeft.isOverdue ? 'text-red-600' : 'text-slate-400'}`}>
                {timeLeft.isOverdue ? 'Overdue by' : 'Time to Return'}
            </p>
            <div className={`text-6xl font-black tracking-tighter tabular-nums ${colorClass}`}>
                {formatDuration(timeLeft)}
            </div>
        </div>
    );
};

export default BookingCardTimer;
