import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const TEMPLATE_STYLE = `
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .header { background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
  .logo { height: 32px; width: auto; }
  .content { padding: 40px 32px; color: #374151; line-height: 1.6; }
  .btn { display: inline-block; background-color: #06B6D4; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 24px; }
  .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; }
  h1 { color: #111827; font-size: 24px; font-weight: bold; margin-top: 0; }
</style>
`;

const LOGO_URL = 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId, status } = req.body;

  if (!bookingId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Update DB Status
    await sql`UPDATE bookings SET status = ${status} WHERE id = ${bookingId}`;

    // 2. Fetch Info for Notifications
    const infoRes = await sql`
        SELECT b.id, b.status, b.listing_id, r.id as renter_id, r.email as renter_email, r.name as renter_name, 
               o.id as owner_id, o.email as owner_email, o.name as owner_name, l.title as listing_title
        FROM bookings b
        JOIN users r ON b.renter_id = r.id
        JOIN listings l ON b.listing_id = l.id
        JOIN users o ON l.owner_id = o.id
        WHERE b.id = ${bookingId}
    `;

    if (infoRes.rows.length > 0) {
        const info = infoRes.rows[0];

        // --- CHAT NOTIFICATION ---
        const systemMessage = status === 'confirmed' 
            ? `👋 Your request for "${info.listing_title}" has been APPROVED! You can now start the Check-in process in your bookings dashboard.`
            : `❌ Your request for "${info.listing_title}" was declined by the host. Any service fees paid have been refunded to your account.`;
        
        try {
            // Reutilizamos el endpoint de chat/send para notificar al inquilino
            await fetch(new URL('/api/chat/send', `https://${req.headers.host}`).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: info.owner_id,
                    recipientId: info.renter_id,
                    listingId: info.listing_id,
                    text: systemMessage
                })
            });
        } catch (chatErr) {
            console.error("Failed to send chat notification:", chatErr);
        }

        // --- EMAIL NOTIFICATION (RESEND) ---
        if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            
            let subject = '';
            let contentHtml = '';

            if (status === 'confirmed') {
                subject = `Trip Approved: ${info.listing_title} ✅`;
                contentHtml = `
                    <h1>Great news, ${info.renter_name}!</h1>
                    <p>The host <strong>${info.owner_name}</strong> has approved your booking request for <strong>${info.listing_title}</strong>.</p>
                    <p>Your trip is now confirmed. You can coordinate the pickup directly with the host using our internal chat.</p>
                    <center><a href="https://goodslister.com/dashboard" class="btn">View Booking</a></center>
                `;
            } else if (status === 'cancelled') {
                subject = `Update on your request: ${info.listing_title}`;
                contentHtml = `
                    <h1>Request Declined</h1>
                    <p>Hi ${info.renter_name},</p>
                    <p>Unfortunately, your request for <strong>${info.listing_title}</strong> could not be accommodated at this time.</p>
                    <p><strong>Refund Info:</strong> If any service fees were charged, they have been automatically released and should appear in your account within 3-5 business days.</p>
                    <center><a href="https://goodslister.com/explore" class="btn">Find another item</a></center>
                `;
            }

            if (subject) {
                await resend.emails.send({
                    from: `Goodslister <noreply@goodslister.com>`,
                    to: [info.renter_email],
                    subject: subject,
                    html: `<!DOCTYPE html><html><head>${TEMPLATE_STYLE}</head><body><div class="container"><div class="header"><img src="${LOGO_URL}" class="logo"/></div><div class="content">${contentHtml}</div><div class="footer">&copy; ${new Date().getFullYear()} Goodslister Inc.</div></div></body></html>`
                });
            }
        }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Status update failed' });
  }
}
