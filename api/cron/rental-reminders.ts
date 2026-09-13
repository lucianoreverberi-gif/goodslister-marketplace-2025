import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Daily rental-reminders cron (runs at 14:00 UTC).
 *
 * Sends 6 kinds of reminder emails, deduped via per-booking sent-at columns:
 *
 *   1. Rental starts tomorrow  → RENTER  (rental_reminder)         reminder_sent_at
 *   2. Rental starts tomorrow  → HOST    (rental_reminder_host)    host_reminder_sent_at
 *   3. Return is tomorrow      → RENTER  (rental_return_reminder)  return_reminder_sent_at
 *   4. Return is tomorrow      → HOST    (rental_return_reminder_host)  return_reminder_sent_at (shared with #3)
 *   5. Booking is overdue      → RENTER  (rental_overdue_renter)   overdue_reminder_sent_at
 *   6. Booking is overdue      → HOST    (rental_overdue_host)     overdue_reminder_sent_at (shared with #5)
 *
 * Columns needed on bookings table: reminder_sent_at (existing),
 * host_reminder_sent_at, return_reminder_sent_at, overdue_reminder_sent_at.
 * All added via idempotent ALTER TABLE at the top of the handler.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Optional auth via CRON_SECRET
    const authHeader = req.headers['authorization'];
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Ensure tracking columns exist (idempotent)
        await sql`
            ALTER TABLE bookings
            ADD COLUMN IF NOT EXISTS host_reminder_sent_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS return_reminder_sent_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS overdue_reminder_sent_at TIMESTAMPTZ
        `;

        const host = req.headers.host || 'www.goodslister.com';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const emailUrl = `${protocol}://${host}/api/send-email`;

        const sendEmail = async (type: string, to: string, data: Record<string, any>) => {
            const r = await fetch(emailUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, to, data }),
            });
            if (!r.ok) throw new Error(`send-email ${type} failed: ${r.status}`);
        };

        const fmtDate = (d: Date | string) =>
            new Date(d).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            });

        let totalSent = 0;
        const failures: string[] = [];

        // ============================================================
        // 1 + 2. Bookings STARTING tomorrow → remind RENTER + HOST
        // ============================================================
        const startingTomorrow = await sql`
            SELECT b.id, b.start_date, b.renter_id, b.reminder_sent_at, b.host_reminder_sent_at,
                   ru.email AS renter_email, ru.name AS renter_name,
                   l.title AS listing_title, l.location AS listing_location,
                   l.user_id AS host_id,
                   hu.email AS host_email, hu.name AS host_name
            FROM bookings b
            JOIN users ru ON ru.id = b.renter_id
            JOIN listings l ON l.id = b.listing_id
            JOIN users hu ON hu.id = l.user_id
            WHERE b.status = 'confirmed'
              AND b.start_date::date = (CURRENT_DATE + INTERVAL '1 day')::date
        `;

        for (const b of startingTomorrow.rows) {
            const startFmt = fmtDate(b.start_date);
            // RENTER reminder (only if not sent)
            if (!b.reminder_sent_at) {
                try {
                    await sendEmail('rental_reminder', b.renter_email, {
                        listingTitle: b.listing_title,
                        startDate: startFmt,
                        meetingPoint: b.listing_location || 'Coordinate via chat',
                        hostPhone: 'Check inbox',
                    });
                    await sql`UPDATE bookings SET reminder_sent_at = NOW() WHERE id = ${b.id}`;
                    totalSent++;
                } catch (e: any) {
                    failures.push(`${b.id} renter-start: ${e.message}`);
                }
            }
            // HOST reminder (only if not sent)
            if (!b.host_reminder_sent_at) {
                try {
                    await sendEmail('rental_reminder_host', b.host_email, {
                        listingTitle: b.listing_title,
                        hostName: b.host_name,
                        renterName: b.renter_name,
                        startDate: startFmt,
                        meetingPoint: b.listing_location || 'Coordinate via chat',
                    });
                    await sql`UPDATE bookings SET host_reminder_sent_at = NOW() WHERE id = ${b.id}`;
                    totalSent++;
                } catch (e: any) {
                    failures.push(`${b.id} host-start: ${e.message}`);
                }
            }
        }

        // ============================================================
        // 3 + 4. Bookings ENDING tomorrow → remind RENTER + HOST
        // ============================================================
        const endingTomorrow = await sql`
            SELECT b.id, b.end_date, b.renter_id, b.return_reminder_sent_at,
                   ru.email AS renter_email, ru.name AS renter_name,
                   l.title AS listing_title, l.location AS listing_location,
                   l.user_id AS host_id,
                   hu.email AS host_email, hu.name AS host_name
            FROM bookings b
            JOIN users ru ON ru.id = b.renter_id
            JOIN listings l ON l.id = b.listing_id
            JOIN users hu ON hu.id = l.user_id
            WHERE b.status = 'active'
              AND b.end_date::date = (CURRENT_DATE + INTERVAL '1 day')::date
              AND b.return_reminder_sent_at IS NULL
        `;

        for (const b of endingTomorrow.rows) {
            const endFmt = fmtDate(b.end_date);
            let anySent = false;
            try {
                await sendEmail('rental_return_reminder', b.renter_email, {
                    listingTitle: b.listing_title,
                    renterName: b.renter_name,
                    endDate: endFmt,
                    meetingPoint: b.listing_location || 'As agreed with host',
                });
                totalSent++;
                anySent = true;
            } catch (e: any) {
                failures.push(`${b.id} renter-return: ${e.message}`);
            }
            try {
                await sendEmail('rental_return_reminder_host', b.host_email, {
                    listingTitle: b.listing_title,
                    hostName: b.host_name,
                    renterName: b.renter_name,
                    endDate: endFmt,
                    meetingPoint: b.listing_location || 'As agreed with renter',
                });
                totalSent++;
                anySent = true;
            } catch (e: any) {
                failures.push(`${b.id} host-return: ${e.message}`);
            }
            if (anySent) {
                await sql`UPDATE bookings SET return_reminder_sent_at = NOW() WHERE id = ${b.id}`;
            }
        }

        // ============================================================
        // 5 + 6. OVERDUE bookings → remind RENTER + HOST
        // ============================================================
        const overdue = await sql`
            SELECT b.id, b.end_date, b.renter_id,
                   ru.email AS renter_email, ru.name AS renter_name,
                   l.title AS listing_title,
                   l.user_id AS host_id,
                   hu.email AS host_email, hu.name AS host_name
            FROM bookings b
            JOIN users ru ON ru.id = b.renter_id
            JOIN listings l ON l.id = b.listing_id
            JOIN users hu ON hu.id = l.user_id
            WHERE b.status = 'active'
              AND b.end_date < NOW()
              AND (b.overdue_reminder_sent_at IS NULL OR b.overdue_reminder_sent_at < (NOW() - INTERVAL '1 day'))
        `;

        for (const b of overdue.rows) {
            const endFmt = fmtDate(b.end_date);
            let anySent = false;
            try {
                await sendEmail('rental_overdue_renter', b.renter_email, {
                    listingTitle: b.listing_title,
                    renterName: b.renter_name,
                    endDate: endFmt,
                });
                totalSent++;
                anySent = true;
            } catch (e: any) {
                failures.push(`${b.id} renter-overdue: ${e.message}`);
            }
            try {
                await sendEmail('rental_overdue_host', b.host_email, {
                    listingTitle: b.listing_title,
                    hostName: b.host_name,
                    renterName: b.renter_name,
                    endDate: endFmt,
                });
                totalSent++;
                anySent = true;
            } catch (e: any) {
                failures.push(`${b.id} host-overdue: ${e.message}`);
            }
            if (anySent) {
                await sql`UPDATE bookings SET overdue_reminder_sent_at = NOW() WHERE id = ${b.id}`;
            }
        }

        return res.status(200).json({
            success: true,
            sent: totalSent,
            startingTomorrow: startingTomorrow.rows.length,
            endingTomorrow: endingTomorrow.rows.length,
            overdue: overdue.rows.length,
            failures,
        });
    } catch (error: any) {
        console.error('Rental reminders cron error:', error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
