import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildIcsFile, type CalendarEvent } from '../../utils/calendarLinks';

/**
 * GET /api/bookings/ics?bookingId=xxx
 *
 * Downloads a .ics calendar file for the given booking. Works with Apple
 * Calendar, iOS Calendar, Outlook desktop, and Google Calendar imports.
 *
 * Public endpoint by design: the booking id is a UUID and knowing it does
 * not grant access to sensitive PII (event only shows title, dates,
 * pickup location). No auth token required so email clients and calendar
 * subscriptions can fetch it.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method not allowed');
    }

    const bookingId = String(req.query.bookingId || '').trim();
    if (!bookingId) {
        return res.status(400).send('Missing bookingId');
    }

    try {
        // Fetch minimal booking + listing data needed for the calendar event
        const result = await sql`
            SELECT
                b.id,
                b.start_date,
                b.end_date,
                b.status,
                l.title AS listing_title,
                l.category AS listing_category,
                l.location AS listing_location
            FROM bookings b
            LEFT JOIN listings l ON l.id = b.listing_id
            WHERE b.id = ${bookingId}
            LIMIT 1
        `;

        if (result.rows.length === 0) {
            return res.status(404).send('Booking not found');
        }

        const row: any = result.rows[0];

        const origin = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'goodslister.com';
        const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
        const bookingUrl = `${proto}://${origin}/#userDashboard?tab=bookings`;

        const category = (row.listing_category || 'Rental').replace(/_/g, ' ').toLowerCase();

        const evt: CalendarEvent = {
            title: `Rental: ${row.listing_title || 'Goodslister booking'}`,
            description:
                'Your Goodslister rental period.\n\n' +
                'Item: ' + (row.listing_title || 'Rental item') + '\n' +
                'Category: ' + category + '\n' +
                'Manage this booking on Goodslister.',
            location: row.listing_location || undefined,
            startDate: row.start_date,
            endDate: row.end_date,
            bookingUrl,
        };

        const icsBody = buildIcsFile(evt, bookingId);
        const filename = 'goodslister-booking-' + bookingId + '.ics';

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'private, max-age=300');
        return res.status(200).send(icsBody);
    } catch (err: any) {
        console.error('[bookings/ics] error:', err);
        return res.status(500).send('Failed to generate calendar file');
    }
}
