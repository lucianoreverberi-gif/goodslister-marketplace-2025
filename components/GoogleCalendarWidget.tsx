import React, { useState, useEffect, useCallback } from 'react';
import { CalendarIcon, CheckCircleIcon, RefreshCwIcon, AlertTriangleIcon, LinkIcon } from './icons';

/**
 * GoogleCalendarWidget
 *
 * Card shown in the dashboard's Profile Settings tab that lets a host
 * connect / disconnect Google Calendar.
 *
 * States:
 *   • loading      — initial status fetch or user action in flight
 *   • disconnected — shows "Connect Google Calendar" CTA
 *   • connected    — shows email, last-sync time, Sync Now + Disconnect
 *   • error        — shows a red toast + retry
 *
 * On mount the widget:
 *   1. Reads ?googleCalendar=connected|error&reason=... from the URL to
 *      show a toast if we just came back from the OAuth callback
 *   2. Fetches /api/auth/google-calendar/status?userId=...
 */

interface GoogleCalendarWidgetProps {
    userId: string;
}

interface Status {
    connected: boolean;
    email?: string | null;
    lastSync?: string | null;
}

function formatRelativeTime(iso: string | null | undefined): string {
    if (!iso) return 'Never';
    const then = new Date(iso).getTime();
    if (isNaN(then)) return 'Never';
    const diff = Date.now() - then;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
    const days = Math.floor(hr / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

const GoogleCalendarWidget: React.FC<GoogleCalendarWidgetProps> = ({ userId }) => {
    const [status, setStatus] = useState<Status | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);
    const [busy, setBusy] = useState<'connecting' | 'disconnecting' | 'syncing' | null>(null);

    // Load status
    const loadStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/auth/google-calendar/status?userId=${encodeURIComponent(userId)}`);
            const data = await res.json();
            setStatus({
                connected: !!data.connected,
                email: data.email || null,
                lastSync: data.lastSync || null,
            });
        } catch (err: any) {
            setStatus({ connected: false });
            setToast({ kind: 'error', msg: 'Could not check calendar status.' });
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // On mount: check URL params, then load status
    useEffect(() => {
        const url = new URL(window.location.href);
        const flag = url.searchParams.get('googleCalendar');
        if (flag === 'connected') {
            setToast({ kind: 'success', msg: 'Google Calendar connected successfully.' });
        } else if (flag === 'error') {
            const reason = url.searchParams.get('reason') || 'unknown';
            setToast({ kind: 'error', msg: 'Could not connect Google Calendar: ' + reason.replace(/_/g, ' ') + '.' });
        }
        // Clean the URL so a refresh doesn't re-show the toast
        if (flag) {
            url.searchParams.delete('googleCalendar');
            url.searchParams.delete('reason');
            window.history.replaceState({}, '', url.toString());
        }
        loadStatus();
    }, [loadStatus]);

    // Auto-dismiss toast after 5s
    useEffect(() => {
        if (!toast) return;
        const t = window.setTimeout(() => setToast(null), 5000);
        return () => window.clearTimeout(t);
    }, [toast]);

    const handleConnect = () => {
        setBusy('connecting');
        window.location.href = `/api/auth/google-calendar/init?userId=${encodeURIComponent(userId)}`;
    };

    const handleDisconnect = async () => {
        if (!window.confirm('Disconnect Google Calendar? Your existing Goodslister bookings will remain, but they will no longer sync.')) {
            return;
        }
        setBusy('disconnecting');
        try {
            const res = await fetch('/api/auth/google-calendar/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) throw new Error('Failed');
            await loadStatus();
            setToast({ kind: 'success', msg: 'Google Calendar disconnected.' });
        } catch (err: any) {
            setToast({ kind: 'error', msg: 'Could not disconnect: ' + (err?.message || 'try again') });
        } finally {
            setBusy(null);
        }
    };

    const handleSyncNow = async () => {
        setBusy('syncing');
        try {
            const res = await fetch('/api/google-calendar/sync-now', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || 'Failed');
            await loadStatus();
            setToast({ kind: 'success', msg: `Synced (${data.pushed || 0} pushed, ${data.pulled || 0} pulled).` });
        } catch (err: any) {
            setToast({ kind: 'error', msg: 'Sync failed: ' + (err?.message || 'try again') });
        } finally {
            setBusy(null);
        }
    };

    // ---------- Render ----------
    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 text-slate-400">
                    <CalendarIcon className="h-6 w-6 animate-pulse" />
                    <div>
                        <h3 className="font-black text-slate-900">Google Calendar Sync</h3>
                        <p className="text-xs">Checking connection...</p>
                    </div>
                </div>
            </div>
        );
    }

    const connected = !!status?.connected;

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${connected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <CalendarIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-900 text-base">Google Calendar Sync</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Push your Goodslister bookings to Google Calendar and detect external bookings (Airbnb, Turo, etc.) to prevent double-booking.
                    </p>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${
                    toast.kind === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    {toast.kind === 'success' ? <CheckCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <AlertTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Connected view */}
            {connected ? (
                <div className="space-y-3">
                    <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3">
                        <div className="flex items-center gap-2 text-emerald-800">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span className="text-xs font-black uppercase tracking-wider">Connected</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-1 truncate">{status?.email || 'Your Google account'}</p>
                        <p className="text-[11px] text-slate-500 mt-1">Last synced: {formatRelativeTime(status?.lastSync)}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSyncNow}
                            disabled={busy !== null}
                            className="flex-1 px-4 py-2 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCwIcon className={`h-3 w-3 ${busy === 'syncing' ? 'animate-spin' : ''}`} />
                            {busy === 'syncing' ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <button
                            onClick={handleDisconnect}
                            disabled={busy !== null}
                            className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all disabled:opacity-50"
                        >
                            {busy === 'disconnecting' ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                    </div>
                </div>
            ) : (
                /* Disconnected view */
                <button
                    onClick={handleConnect}
                    disabled={busy !== null}
                    className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                    <LinkIcon className="h-4 w-4" />
                    {busy === 'connecting' ? 'Redirecting to Google...' : 'Connect Google Calendar'}
                </button>
            )}

            {/* Fine print */}
            <p className="text-[10px] text-slate-400 leading-relaxed">
                We only read your calendar to prevent double-booking and only write events you create on Goodslister. You can disconnect at any time.
            </p>
        </div>
    );
};

export default GoogleCalendarWidget;
