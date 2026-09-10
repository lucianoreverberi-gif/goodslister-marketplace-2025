import posthog from 'posthog-js';

/**
 * PostHog analytics wrapper for Goodslister.
 * Handles initialization, user identification, and typed event tracking.
 * 
 * Fails silently if VITE_PUBLIC_POSTHOG_KEY env var is not set (development mode).
 * Never blocks the UI - all calls are fire-and-forget.
 */

// ====== INIT ======

let initialized = false;

export function initAnalytics(): void {
    if (initialized) return;
    if (typeof window === 'undefined') return;

    const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
    const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!key) {
        console.info('[Analytics] PostHog disabled - no VITE_PUBLIC_POSTHOG_KEY set');
        return;
    }

    try {
        posthog.init(key, {
            api_host: host,
            defaults: '2026-01-30',
            capture_pageview: true,
            capture_pageleave: true,
            session_recording: {
                maskAllInputs: true, // mask credit card numbers, passwords, SSNs
                maskInputOptions: {
                    password: true,
                    email: false, // email is fine to capture for support
                },
            },
            person_profiles: 'identified_only', // only create profiles for identified users
            loaded: (ph) => {
                if (import.meta.env.DEV) {
                    // In dev mode, print event names to console for debugging
                    ph.debug();
                }
            },
        });
        initialized = true;
        console.info('[Analytics] PostHog initialized');
    } catch (e) {
        console.warn('[Analytics] PostHog init failed:', e);
    }
}

// ====== IDENTIFY ======

interface UserTraits {
    email?: string;
    name?: string;
    createdAt?: string;
    isSuperhost?: boolean;
    listingCount?: number;
    isHost?: boolean;
}

export function identifyUser(userId: string, traits?: UserTraits): void {
    if (!initialized) return;
    try {
        posthog.identify(userId, traits);
    } catch (e) {
        console.warn('[Analytics] identify failed:', e);
    }
}

export function resetUser(): void {
    if (!initialized) return;
    try {
        posthog.reset();
    } catch (e) {
        console.warn('[Analytics] reset failed:', e);
    }
}

// ====== EVENT TYPES ======

export type AnalyticsEvent =
    // Auth & signup
    | 'user_signup_completed'
    | 'user_login_completed'
    | 'user_logout'
    // Marketplace top-of-funnel
    | 'explore_viewed'
    | 'listing_searched'
    | 'listing_viewed'
    // Booking funnel
    | 'booking_started'
    | 'booking_payment_started'
    | 'booking_payment_success'
    | 'booking_payment_failed'
    | 'booking_approved'
    | 'booking_rejected'
    | 'booking_cancelled'
    | 'booking_completed'
    // Trust & lifecycle
    | 'contract_signed'
    | 'checkin_started'
    | 'checkin_completed'
    | 'return_completed'
    | 'review_submitted'
    | 'face_verification_used'
    // Engagement
    | 'notification_clicked'
    | 'listing_created'
    | 'listing_boosted';

interface EventProperties {
    [key: string]: string | number | boolean | undefined | null;
}

export function track(event: AnalyticsEvent, properties?: EventProperties): void {
    if (!initialized) return;
    try {
        posthog.capture(event, properties);
    } catch (e) {
        console.warn('[Analytics] track failed:', e);
    }
}

// ====== FEATURE FLAGS ======

export function isFeatureEnabled(flag: string, defaultValue: boolean = false): boolean {
    if (!initialized) return defaultValue;
    try {
        const value = posthog.isFeatureEnabled(flag);
        return typeof value === 'boolean' ? value : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

// ====== CONVENIENCE HELPERS ======

/** Track a listing view with all the metadata Product Analytics cares about */
export function trackListingViewed(listing: {
    id: string;
    title: string;
    category?: string;
    price?: number;
    ownerId?: string;
    city?: string;
}): void {
    track('listing_viewed', {
        listing_id: listing.id,
        listing_title: listing.title,
        category: listing.category,
        price: listing.price,
        owner_id: listing.ownerId,
        city: listing.city,
    });
}

/** Track a booking payment success (revenue event) */
export function trackBookingPaymentSuccess(booking: {
    id: string;
    listingId: string;
    listingTitle: string;
    totalPrice: number;
    startDate: string;
    endDate: string;
    hostId: string;
}): void {
    track('booking_payment_success', {
        booking_id: booking.id,
        listing_id: booking.listingId,
        listing_title: booking.listingTitle,
        total_price: booking.totalPrice,
        start_date: booking.startDate,
        end_date: booking.endDate,
        host_id: booking.hostId,
        revenue: booking.totalPrice, // PostHog uses 'revenue' for LTV calculations
    });
}
