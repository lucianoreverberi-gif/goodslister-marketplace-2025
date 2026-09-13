/**
 * calendarLinks.ts
 *
 * Helpers for generating "Add to Calendar" links across three surfaces:
 *   1. Google Calendar     — URL-based (opens in browser)
 *   2. Outlook Web         — URL-based (opens in browser)
 *   3. iCal / .ics file    — downloadable, works on Apple Calendar, iOS,
 *                            Outlook desktop, Google Calendar imports
 *
 * All builders take a normalized CalendarEvent shape.
 */

export interface CalendarEvent {
    title: string;
    description: string;
    location?: string;
    startDate: Date | string;
    endDate: Date | string;
    /** Absolute URL to the booking on Goodslister (added to description) */
    bookingUrl?: string;
}

// --- Formatters -------------------------------------------------------------

/** Format a date as YYYYMMDDTHHmmssZ (UTC, no punctuation) — iCal + Google fmt */
function formatUtc(d: Date | string): string {
    const date = new Date(d);
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        date.getUTCFullYear().toString() +
        pad(date.getUTCMonth() + 1) +
        pad(date.getUTCDate()) +
        'T' +
        pad(date.getUTCHours()) +
        pad(date.getUTCMinutes()) +
        pad(date.getUTCSeconds()) +
        'Z'
    );
}

/** Escape text for use inside an .ics file per RFC 5545 */
function escapeIcs(text: string): string {
    return (text || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

/** Build the description that ends up on the calendar event body */
function buildDescription(evt: CalendarEvent): string {
    const parts = [evt.description];
    if (evt.bookingUrl) {
        parts.push('', 'View booking: ' + evt.bookingUrl);
    }
    return parts.join('\n');
}

// --- Google Calendar --------------------------------------------------------

/**
 * Build a Google Calendar "Add to Calendar" URL.
 * Opens Google Calendar in a new tab with the event pre-filled; the user
 * clicks "Save" to confirm.
 */
export function googleCalendarUrl(evt: CalendarEvent): string {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: evt.title,
        dates: formatUtc(evt.startDate) + '/' + formatUtc(evt.endDate),
        details: buildDescription(evt),
    });
    if (evt.location) params.set('location', evt.location);
    return 'https://calendar.google.com/calendar/render?' + params.toString();
}

// --- Outlook Web ------------------------------------------------------------

/**
 * Build an Outlook.com Web "Add to Calendar" URL.
 */
export function outlookWebUrl(evt: CalendarEvent): string {
    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: evt.title,
        startdt: new Date(evt.startDate).toISOString(),
        enddt: new Date(evt.endDate).toISOString(),
        body: buildDescription(evt),
    });
    if (evt.location) params.set('location', evt.location);
    return 'https://outlook.live.com/calendar/0/deeplink/compose?' + params.toString();
}

// --- iCal / .ics ------------------------------------------------------------

/**
 * Build a complete .ics file body (RFC 5545). Works with Apple Calendar,
 * iOS Calendar, Outlook desktop, and can be imported into Google Calendar.
 */
export function buildIcsFile(evt: CalendarEvent, uid: string): string {
    const dtstamp = formatUtc(new Date());
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Goodslister//Rental Booking//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:' + uid + '@goodslister.com',
        'DTSTAMP:' + dtstamp,
        'DTSTART:' + formatUtc(evt.startDate),
        'DTEND:' + formatUtc(evt.endDate),
        'SUMMARY:' + escapeIcs(evt.title),
        'DESCRIPTION:' + escapeIcs(buildDescription(evt)),
    ];
    if (evt.location) lines.push('LOCATION:' + escapeIcs(evt.location));
    lines.push(
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'BEGIN:VALARM',
        'TRIGGER:-PT2H',
        'ACTION:DISPLAY',
        'DESCRIPTION:' + escapeIcs('Reminder: ' + evt.title),
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    );
    // .ics requires CRLF line endings
    return lines.join('\r\n');
}
