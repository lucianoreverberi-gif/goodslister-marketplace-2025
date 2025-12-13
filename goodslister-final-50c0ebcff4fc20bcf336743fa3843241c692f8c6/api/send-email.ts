
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
    .highlight { color: ${BRAND_COLOR}; font-weight: bold; }
    .link { color: ${BRAND_COLOR}; text-decoration: none; }
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
      <p>
        <a href="https://goodslister.com/help" class="link">Help Center</a> • 
        <a href="https://goodslister.com/terms" class="link">Terms</a> • 
        <a href="https://goodslister.com/privacy" class="link">Privacy</a>
      </p>
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
    case 'welcome':
      fromEmail = 'info@goodslister.com';
      senderName = 'Luciano from Goodslister';
      subject = 'Welcome to the Adventure! 🛶';
      bodyContent = `
        <h1>Welcome, ${data.name}!</h1>
        <p>We are thrilled to have you join the Goodslister community. You're now part of a global network of adventurers and gear owners.</p>
        <p>Whether you're looking to explore new horizons or turn your idle gear into income, you're in the right place.</p>
        <div class="info-box">
          <strong>Quick Tip:</strong> Completing your profile verification increases trust and helps you book faster.
        </div>
        <center>
          <a href="https://goodslister.com/explore" class="btn">Explore Gear</a>
        </center>
      `;
      break;

    case 'booking_confirmation': // Sent to Renter
      subject = 'Your Adventure is Confirmed! ✅';
      bodyContent = `
        <h1>You're going on an adventure!</h1>
        <p>Hi ${data.name}, great news! Your booking for <strong>${data.listingTitle}</strong> has been confirmed.</p>
        
        <h2>Trip Details</h2>
        <table class="details-table">
          <tr><td>Dates</td><td>${data.startDate} - ${data.endDate}</td></tr>
          <tr><td>Total Price</td><td>$${data.totalPrice}</td></tr>
          <tr><td>Payment Method</td><td>${data.paymentMethod === 'platform' ? 'Paid Online' : 'Direct on Pickup'}</td></tr>
        </table>

        <div class="info-box">
          Please coordinate the exact pickup time and location with the host via the chat.
        </div>

        <center>
          <a href="https://goodslister.com/dashboard" class="btn">View Booking</a>
        </center>
      `;
      break;

    case 'booking_request': // Sent to Host (or notification of instant book)
      subject = `New Booking: ${data.listingTitle} 💰`;
      bodyContent = `
        <h1>You have a new booking!</h1>
        <p>Cha-ching! <strong>${data.renterName}</strong> has booked your <strong>${data.listingTitle}</strong>.</p>
        
        <h2>Reservation Details</h2>
        <table class="details-table">
          <tr><td>Dates</td><td>${data.startDate} - ${data.endDate}</td></tr>
          <tr><td>Est. Earnings</td><td style="color:${ACCENT_COLOR}; font-weight:bold;">$${data.payoutAmount}</td></tr>
        </table>

        <p>Get the gear ready! Don't forget to use the <strong>Digital Inspection Tool</strong> upon handover to protect yourself.</p>

        <center>
          <a href="https://goodslister.com/dashboard" class="btn">Manage Booking</a>
        </center>
      `;
      break;

    case 'listing_published':
      subject = 'Your listing is live! 🚀';
      bodyContent = `
        <h1>Congratulations!</h1>
        <p>Your listing <strong>${data.listingTitle}</strong> is now live on the Goodslister marketplace.</p>
        <p>Renters in your area can now see and book your gear. We've also optimized your description with our AI to maximize visibility.</p>
        
        <center>
          <a href="https://goodslister.com/listing?id=${data.listingId}" class="btn">View Listing</a>
        </center>
      `;
      break;

    case 'message_notification':
      subject = `New message from ${data.senderName} 💬`;
      bodyContent = `
        <h1>New Message</h1>
        <p><strong>${data.senderName}</strong> sent you a message regarding <em>${data.listingTitle}</em>:</p>
        <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; font-style: italic; color: #555; margin: 20px 0;">
          "${data.messagePreview}"
        </div>
        <p>Responding quickly helps you secure bookings and maintain a high response rate.</p>
        <center>
          <a href="https://goodslister.com/inbox" class="btn">Reply Now</a>
        </center>
      `;
      break;

    case 'payout_sent':
      subject = 'You got paid! 💸';
      bodyContent = `
        <h1>Payout on the way</h1>
        <p>Good news! We've sent a payout of <strong style="color:${ACCENT_COLOR}; font-size: 18px;">$${data.amount}</strong> to your connected bank account.</p>
        <p>This is for the rental of <strong>${data.listingTitle}</strong>.</p>
        <p>Funds should arrive within 1-3 business days depending on your bank.</p>
        <center>
          <a href="https://goodslister.com/dashboard" class="btn">View Earnings</a>
        </center>
      `;
      break;

    case 'review_request':
      subject = `How was your trip with ${data.targetName}? ⭐`;
      bodyContent = `
        <h1>Rate your experience</h1>
        <p>Your rental of <strong>${data.listingTitle}</strong> has ended. We'd love to hear how it went!</p>
        <p>Reviews help build trust in the Goodslister community. It only takes a minute.</p>
        <center>
          <a href="https://goodslister.com/dashboard" class="btn">Leave a Review</a>
        </center>
      `;
      break;

    case 'verification_approved':
      subject = 'Identity Verified Successfully 🛡️';
      bodyContent = `
        <h1>You are verified!</h1>
        <p>Hi ${data.name},</p>
        <p>Your identity documents have been successfully processed and verified.</p>
        <p>You now have the <strong>Verified Badge</strong> on your profile, which increases trust and helps you stand out.</p>
        <div class="info-box">
          You are now eligible to rent higher-value items and list equipment with lower fees.
        </div>
      `;
      break;

    default:
      return res.status(400).json({ error: 'Invalid email type' });
  }

  // --- SEND ---
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: wrapHtml(subject, bodyContent),
    });

    if (error) {
      console.error("Resend Error:", error);
      if (error.message?.includes('domain')) {
         return res.status(400).json({ error: "Domain verification pending. Please verify 'goodslister.com' in Resend." });
      }
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: emailData?.id });

  } catch (error) {
    console.error("Email Handler Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
