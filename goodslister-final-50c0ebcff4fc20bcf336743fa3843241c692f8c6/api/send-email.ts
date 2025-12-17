
// @ts-ignore: Suppress type resolution error for server-side module in client-side build context
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const LOGO_URL = 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png';
const BRAND_COLOR = '#06B6D4'; // Cyan-600
const ACCENT_COLOR = '#10B981'; // Green-500

// --- HTML WRAPPER ---
const wrapHtml = (title: string, bodyContent: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; color: #374151; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-top: 40px; margin-bottom: 40px; }
    .header { background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { height: 32px; width: auto; }
    .content { padding: 40px 32px; line-height: 1.6; }
    .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .btn { display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin-top: 24px; text-align: center; }
    .btn:hover { opacity: 0.9; }
    h1 { color: #111827; font-size: 24px; margin-bottom: 16px; font-weight: 700; }
    h2 { color: #1f2937; font-size: 18px; margin-top: 24px; margin-bottom: 12px; }
    p { margin-bottom: 16px; }
    .info-box { background-color: #f0fdfa; border-left: 4px solid ${BRAND_COLOR}; padding: 16px; border-radius: 4px; margin: 24px 0; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table td { padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .details-table td:first-child { font-weight: 600; color: #6b7280; width: 40%; }
    .details-table td:last-child { color: #111827; text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://goodslister.com" target="_blank">
        <img src="${LOGO_URL}" alt="Goodslister" class="logo" />
      </a>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Goodslister Inc. All rights reserved.</p>
      <p>100 Lincoln Rd, Miami Beach, FL 33139</p>
    </div>
  </div>
</body>
</html>
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is missing");
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { type, to, data } = req.body;

  if (!to || !type) {
    return res.status(400).json({ error: 'Missing required fields (to, type)' });
  }

  let fromEmail = 'noreply@goodslister.com';
  let senderName = 'Goodslister';
  let subject = '';
  let bodyContent = '';

  // --- TEMPLATE LOGIC ---
  switch (type) {
    case 'password_reset':
      subject = 'Reset your password 🔒';
      bodyContent = `
        <h1>Password Reset Request</h1>
        <p>Hi ${data.name},</p>
        <p>We received a request to reset the password for your Goodslister account.</p>
        <p>If you didn't make this request, you can safely ignore this email.</p>
        <center>
          <a href="${data.resetLink}" class="btn">Reset Password</a>
        </center>
        <p style="margin-top:20px; font-size:12px; color:#666;">Link expires in 1 hour.</p>
      `;
      break;

    case 'welcome':
      fromEmail = 'info@goodslister.com';
      senderName = 'Luciano from Goodslister';
      subject = 'Welcome to the Adventure! 🛶';
      bodyContent = `
        <h1>Welcome, ${data.name}!</h1>
        <p>We are thrilled to have you join the Goodslister community.</p>
        <center><a href="https://goodslister.com/explore" class="btn">Explore Gear</a></center>
      `;
      break;

    case 'booking_confirmation': 
      subject = 'Your Adventure is Confirmed! ✅';
      bodyContent = `
        <h1>Booking Confirmed!</h1>
        <p>Hi ${data.name}, your booking for <strong>${data.listingTitle}</strong> is ready.</p>
        <table class="details-table">
          <tr><td>Dates</td><td>${data.startDate} - ${data.endDate}</td></tr>
          <tr><td>Total Price</td><td>$${data.totalPrice}</td></tr>
        </table>
        <center><a href="https://goodslister.com/dashboard" class="btn">View Booking</a></center>
      `;
      break;
      
    case 'booking_request': 
      subject = `New Request: ${data.listingTitle} 📅`;
      bodyContent = `
        <h1>You have a new request!</h1>
        <p><strong>${data.renterName}</strong> wants to book your <strong>${data.listingTitle}</strong>.</p>
        <center><a href="https://goodslister.com/dashboard" class="btn">Manage Request</a></center>
      `;
      break;

    default:
      // Fallback for generic messages
      if (type.includes('message')) {
          subject = 'New Message';
          bodyContent = `<p>You have a new notification on Goodslister.</p>`;
      } else {
          return res.status(400).json({ error: 'Invalid email type' });
      }
  }

  // --- SEND ---
  try {
    // NOTE: In Resend Free Tier, you can only send to your own email address unless you verify a domain.
    // If 'to' is not verified, this might throw a 403.
    const { data: emailData, error } = await resend.emails.send({
      from: `${senderName} <onboarding@resend.dev>`, // Default Resend Sender
      to: [to],
      subject: subject,
      html: wrapHtml(subject, bodyContent),
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: emailData?.id });

  } catch (error) {
    console.error("Email Handler Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
