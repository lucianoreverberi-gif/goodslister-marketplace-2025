
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId, status } = req.body;

  if (!bookingId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Update the status in DB
    await sql`
        UPDATE bookings 
        SET status = ${status}
        WHERE id = ${bookingId}
    `;

    // 2. Send Notification Email via Resend
    if (process.env.RESEND_API_KEY) {
        try {
            // Fetch booking details including Renter and Owner info
            // We join users twice: once for renter, once for owner (via listing)
            const bookingDetails = await sql`
                SELECT 
                    b.id, b.status, b.listing_id,
                    r.email as renter_email, r.name as renter_name,
                    o.email as owner_email, o.name as owner_name,
                    l.title as listing_title
                FROM bookings b
                JOIN users r ON b.renter_id = r.id
                JOIN listings l ON b.listing_id = l.id
                JOIN users o ON l.owner_id = o.id
                WHERE b.id = ${bookingId}
            `;

            if (bookingDetails.rows.length > 0) {
                const info = bookingDetails.rows[0];
                const resend = new Resend(process.env.RESEND_API_KEY);
                // Use 'noreply' for automated system status updates
                const fromEmail = 'noreply@goodslister.com';
                
                let subject = '';
                let htmlBody = '';
                let targetEmail = '';

                if (status === 'active') {
                    // Notify Renter that rental has started
                    targetEmail = info.renter_email;
                    subject = `Rental Started: ${info.listing_title} 🚀`;
                    htmlBody = `
                        <h1>Have a great trip, ${info.renter_name}!</h1>
                        <p>The handover for <strong>${info.listing_title}</strong> is complete.</p>
                        <p>Your rental session is now ACTIVE. Remember to:</p>
                        <ul>
                            <li>Follow the owner's safety rules.</li>
                            <li>Contact <strong>${info.owner_name}</strong> via the app if you have issues.</li>
                            <li>Return the item on time to avoid late fees.</li>
                        </ul>
                    `;
                } else if (status === 'completed') {
                    // Notify Owner that item is returned (or Renter that it's done)
                    // Let's notify BOTH in a real app, but here we notify the Owner as primary confirmation
                    targetEmail = info.owner_email;
                    subject = `Rental Completed: ${info.listing_title} ✅`;
                    htmlBody = `
                        <h1>Rental Finished</h1>
                        <p>Hi ${info.owner_name},</p>
                        <p>The rental session for <strong>${info.listing_title}</strong> has been marked as COMPLETED.</p>
                        <p>Please ensure you have inspected the item. If you found any damages, please file a dispute within 48 hours via the dashboard.</p>
                        <br/>
                        <a href="https://goodslister.com/dashboard">Go to Dashboard</a>
                    `;
                }

                if (targetEmail && subject) {
                    await resend.emails.send({
                        from: `Goodslister <${fromEmail}>`,
                        to: targetEmail,
                        subject: subject,
                        html: htmlBody
                    });
                    console.log(`Status email sent to ${targetEmail}`);
                }
            }
        } catch (emailError) {
            console.error("Failed to send status email:", emailError);
            // Non-blocking error
        }
    }

    return res.status(200).json({ success: true, bookingId, status });
  } catch (error) {
    console.error('Update booking status error:', error);
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
}
