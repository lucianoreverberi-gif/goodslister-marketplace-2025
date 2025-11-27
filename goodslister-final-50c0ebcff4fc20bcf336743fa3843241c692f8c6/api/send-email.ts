
// @ts-ignore: Suppress type resolution error for server-side module in client-side build context
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validate HTTP Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API Key
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is missing");
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { type, to, data } = req.body;

  if (!to || !type) {
    return res.status(400).json({ error: 'Missing required fields (to, type)' });
  }

  // Configuration for Sender Email
  // 1. If SENDER_EMAIL is set in Vercel (e.g. 'noreply@goodslister.com'), use it.
  // 2. Otherwise, fallback to Resend's testing domain 'onboarding@resend.dev'.
  // NOTE: To use a custom domain, you MUST verify it in the Resend Dashboard first.
  const fromEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
  const senderName = 'Goodslister';

  try {
    let subject = '';
    let htmlContent = '';

    // Simple HTML Templates based on email type
    switch (type) {
      case 'welcome':
        subject = 'Welcome to Goodslister! 🛶';
        htmlContent = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>Welcome, ${data.name}!</h1>
            <p>We are thrilled to have you join the Goodslister community.</p>
            <p>You can now list your gear to earn extra income or rent unique items for your next adventure.</p>
            <br/>
            <a href="https://goodslister.com" style="background-color: #06B6D4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Explore Now</a>
          </div>
        `;
        break;

      case 'booking_confirmation':
        subject = 'Booking Confirmed! ✅';
        htmlContent = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>Your Adventure is Booked!</h1>
            <p>Hi ${data.name}, your booking for <strong>${data.listingTitle}</strong> is confirmed.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Dates:</strong> ${data.startDate} to ${data.endDate}</p>
                <p><strong>Total Price:</strong> $${data.totalPrice}</p>
                <p><strong>Payment:</strong> ${data.paymentMethod === 'platform' ? 'Paid Online' : 'Direct to Owner'}</p>
            </div>
            <p>You can chat with the owner in your dashboard to coordinate pickup.</p>
          </div>
        `;
        break;

      case 'message_notification':
        subject = `New message from ${data.senderName} 💬`;
        htmlContent = `
          <div style="font-family: sans-serif; color: #333;">
            <h2>You have a new message</h2>
            <p><strong>${data.senderName}</strong> sent you a message regarding <em>${data.listingTitle}</em>:</p>
            <blockquote style="border-left: 4px solid #06B6D4; padding-left: 10px; color: #555; font-style: italic;">
              "${data.messagePreview}"
            </blockquote>
            <br/>
            <a href="https://goodslister.com" style="background-color: #06B6D4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reply Now</a>
          </div>
        `;
        break;

      default:
        return res.status(400).json({ error: 'Invalid email type' });
    }

    // Send the email
    // Important: If using the 'onboarding@resend.dev' domain, you can ONLY send to the email address 
    // associated with your Resend account. Once you verify 'goodslister.com', this restriction is lifted.
    const { data: emailData, error } = await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to: [to], 
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Error:", error);
      // Provide a helpful error message if it's likely a domain verification issue
      if (error.message?.includes('domain')) {
         return res.status(400).json({ error: "Domain not verified. Please check Resend settings or use the registered testing email." });
      }
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: emailData?.id });

  } catch (error) {
    console.error("Email Handler Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
