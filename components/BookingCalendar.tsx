import React, { useState, useMemo } from 'react';
import type { Booking } from '../types';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    isValid,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './icons';

/**
 * BookingCalendar
 *
 * Month-view calendar of the user's rentals and trips. Days that fall
 * within any active booking (either as host or as renter) show colored
 * dots. Clicking a day expands the details below.
 *
 * Fully defensive: every property access is optional-chained, every date
 * is validated, and the per-booking processing is wrapped in try/catch
 * so one malformed row can't take down the whole widget.
 *
 * Legend:
 *   • Emerald dot — booking where the user is the HOST
 *   • Cyan dot    — booking where the user is the RENTER
 *   • Cyan ring   — today
 */
interface BookingCalendarProps {
    bookings: Booking[];
    userId: string;
    onOpenBookings?: () => void;
}

interface DayEntry {
    booking: Booking;
    role: 'host' | 'renter';
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const BookingCalendar: React.FC<BookingCalendarProps> = ({ bookings, userId, onOpenBookings }) => {
    // Defensive: always work off an array, even if parent passed nothing.
    const safeBookings: Booking[] = Array.isArray(bookings) ? bookings : [];

    const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // ---- Build a Map<dateISO, DayEntry[]> once per (bookings, userId) change
    const bookingsByDay = useMemo(() => {
        const map = new Map<string, DayEntry[]>();
        for (const b of safeBookings) {
            try {
                if (!b || !b.id || !b.startDate || !b.endDate) continue;
                const start = new Date(b.startDate);
                const end = new Date(b.endDate);
                if (!isValid(start) || !isValid(end)) continue;
                if (end < start) continue;

                const isHost = b.listing?.owner?.id === userId;
                const isRenter = b.renterId === userId;
                if (!isHost && !isRenter) continue;
                const role: 'host' | 'renter' = isHost ? 'host' : 'renter';

                const days = eachDayOfInterval({ start, end });
                for (const day of days) {
                    const key = format(day, 'yyyy-MM-dd');
                    if (!map.has(key)) map.set(key, []);
                    map.get(key)!.push({ booking: b, role });
                }
            } catch (err) {
                console.warn('[BookingCalendar] skipped booking', (b as any)?.id, err);
            }
        }
        return map;
    }, [safeBookings, userId]);

    // ---- Build the day grid for the current month view (6 rows x 7 cols)
    const days = useMemo(() => {
        try {
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);
            const gridStart = startOfWeek(monthStart);
            const gridEnd = endOfWeek(monthEnd);
            return eachDayOfInterval({ start: gridStart, end: gridEnd });
        } catch {
            return [] as Date[];
        }
    }, [currentMonth]);

    const selectedDayBookings = selectedDay
        ? bookingsByDay.get(format(selectedDay, 'yyyy-MM-dd')) || []
        : [];

    return (
        <div className="space-y-4 animate-in fade-in">
            {/* Calendar card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                {/* Header with month nav */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-cyan-600" />
                            Booking Calendar
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Your rentals and trips across time</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setCurrentMonth(prev => addMonths(prev, -1)); setSelectedDay(null); }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            aria-label="Previous month"
                        >
                            <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
                        </button>
                        <button
                            onClick={() => { setCurrentMonth(startOfMonth(new Date())); setSelectedDay(null); }}
                            className="text-lg font-black text-slate-900 min-w-[10ch] text-center hover:text-cyan-600 transition-colors"
                            title="Jump to current month"
                        >
                            {format(currentMonth, 'MMMM yyyy')}
                        </button>
                        <button
                            onClick={() => { setCurrentMonth(prev => addMonths(prev, 1)); setSelectedDay(null); }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            aria-label="Next month"
                        >
                            <ChevronRightIcon className="h-5 w-5 text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Weekday header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {WEEKDAYS.map((wd, i) => (
                        <div
                            key={i}
                            className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-2"
                        >
                            {wd}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, i) => {
                        const key = format(day, 'yyyy-MM-dd');
                        const dayBookings = bookingsByDay.get(key) || [];
                        const inCurrentMonth = isSameMonth(day, currentMonth);
                        const isToday = isSameDay(day, new Date());
                        const isSelected = !!selectedDay && isSameDay(day, selectedDay);
                        const hasHost = dayBookings.some(d => d.role === 'host');
                        const hasRenter = dayBookings.some(d => d.role === 'renter');

                        const cellClass = isSelected
                            ? 'bg-cyan-500 text-white ring-2 ring-cyan-400'
                            : isToday
                                ? 'bg-cyan-50 text-cyan-700 font-bold ring-1 ring-cyan-200'
                                : !inCurrentMonth
                                    ? 'text-slate-300 hover:bg-slate-50'
                                    : dayBookings.length > 0
                                        ? 'text-slate-900 hover:bg-slate-100 font-bold'
                                        : 'text-slate-700 hover:bg-slate-50';

                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDay(isSelected ? null : day)}
                                className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all relative ${cellClass}`}
                            >
                                <span className="text-sm">{format(day, 'd')}</span>
                                {dayBookings.length > 0 && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {hasHost && (
                                            <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                                        )}
                                        {hasRenter && (
                                            <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-cyan-500'}`} />
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        Hosting
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-cyan-500" />
                        Renting
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-cyan-50 ring-1 ring-cyan-200" />
                        Today
                    </div>
                </div>
            </div>

            {/* Selected-day details card */}
            {selectedDay && selectedDayBookings.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-4">
                        {format(selectedDay, 'MMMM d, yyyy')}
                        <span className="text-slate-400 font-normal text-sm ml-2">
                            ({selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? 's' : ''})
                        </span>
                    </h3>
                    <div className="space-y-3">
                        {selectedDayBookings.map((item, idx) => {
                            const b = item.booking;
                            const title = b.listing?.title || 'Booking';
                            let range = '';
                            try {
                                range = format(new Date(b.startDate), 'MMM d') + ' → ' + format(new Date(b.endDate), 'MMM d, yyyy');
                            } catch { /* leave empty */ }
                            const statusClass =
                                b.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                b.status === 'confirmed' ? 'bg-cyan-100 text-cyan-700' :
                                b.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                b.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                                'bg-slate-100 text-slate-600';
                            return (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                                >
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        item.role === 'host'
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-cyan-100 text-cyan-600'
                                    }`}>
                                        <CalendarIcon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-slate-900 text-sm truncate">{title}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {item.role === 'host' ? 'Hosting' : 'Renting'}{range && ' · ' + range}
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${statusClass}`}>
                                        {b.status || 'unknown'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    {onOpenBookings && (
                        <button
                            onClick={onOpenBookings}
                            className="mt-4 text-[10px] font-black uppercase tracking-wider text-cyan-600 hover:text-cyan-700"
                        >
                            View all bookings →
                        </button>
                    )}
                </div>
            )}

            {/* Hint card when nothing selected */}
            {(!selectedDay || selectedDayBookings.length === 0) && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                    <p className="text-xs text-slate-500">
                        {selectedDay
                            ? 'No bookings on ' + format(selectedDay, 'MMMM d')
                            : 'Click any day with a colored dot to see bookings'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default BookingCalendar;
