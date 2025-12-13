
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
  .btn { display: inline-block; background-color: #06B6D4; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 24px; }
  .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; }
  h1 { color: #111827; font-size: 24px; font-weight: bold; margin-top: 0; }
  .highlight { color: #06B6D4; font-weight: bold; }
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
    await sql`UPDATE bookings SET status = ${status} WHERE id = ${bookingId}`;

    if (process.env.RESEND_API_KEY) {
        try {
            const bookingDetails = await sql`
                SELECT b.id, b.status, b.listing_id, r.email as renter_email, r.name as renter_name, o.email as owner_email, o.name as owner_name, l.title as listing_title
                FROM bookings b
                JOIN users r ON b.renter_id = r.id
                JOIN listings l ON b.listing_id = l.id
                JOIN users o ON l.owner_id = o.id
                WHERE b.id = ${bookingId}
            `;

            if (bookingDetails.rows.length > 0) {
                const info = bookingDetails.rows[0];
                const resend = new Resend(process.env.RESEND_API_KEY);
                
                let subject = '';
                let contentHtml = '';
                let targetEmail = '';

                if (status === 'active') {
                    targetEmail = info.renter_email;
                    subject = `Rental Started: ${info.listing_title} 🚀`;
                    contentHtml = `
                        <h1>Have a great trip, ${info.renter_name}!</h1>
                        <p>The handover for <strong class="highlight">${info.listing_title}</strong> is complete.</p>
                        <p>Your rental session is now <strong>ACTIVE</strong>. Have fun and stay safe!</p>
                        <p>Remember to return the item on time to avoid late fees.</p>
                        <center><a href="https://goodslister.com/dashboard" class="btn">View Session</a></center>
                    `;
                } else if (status === 'completed') {
                    targetEmail = info.owner_email;
                    subject = `Rental Completed: ${info.listing_title} ✅`;
                    contentHtml = `
                        <h1>Rental Finished</h1>
                        <p>Hi ${info.owner_name},</p>
                        <p>The rental session for <strong class="highlight">${info.listing_title}</strong> has been marked as <strong>COMPLETED</strong>.</p>
                        <p>Please ensure you have inspected the item. If you found any damages, please file a dispute within 48 hours via the dashboard.</p>
                        <center><a href="https://goodslister.com/dashboard" class="btn">View Dashboard</a></center>
                    `;
                }

                if (targetEmail && subject) {
                    await resend.emails.send({
                        from: `Goodslister <noreply@goodslister.com>`,
                        to: targetEmail,
                        subject: subject,
                        html: `<!DOCTYPE html><html><head>${TEMPLATE_STYLE}</head><body><div class="container"><div class="header"><img src="${LOGO_URL}" class="logo"/></div><div class="content">${contentHtml}</div><div class="footer">&copy; ${new Date().getFullYear()} Goodslister Inc.</div></div></body></html>`
                    });
                }
            }
        } catch (emailError) {
            console.error("Failed to send status email:", emailError);
        }
    }

    return res.status(200).json({ success: true, bookingId, status });
  } catch (error) {
    console.error('Update booking status error:', error);
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
}
