import sgMail from '@sendgrid/mail';
// Force rebuild - using verified domain noreply@goodslister.com
// Cache invalidation: Vercel rebuild forced on Dec 12, 2025 19:10 EST
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validate HTTP Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API Key
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is missing');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const { type, to, data } = req.body;

  // Validate input
  if (!type || !to || !data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let subject = '';
  let htmlContent = '';

  // Email templates based on type
  switch (type) {
    case 'welcome':
      subject = 'Welcome to GoodsLister! 🎉';
      htmlContent = `
        <div style="font-family: sans-serif; color: #333;">
          <h1>Welcome, \${data.name}!</h1>
          <p>We are thrilled to have you join the GoodsLister community.</p>
          <p>You can now list your gear to earn extra income or rent unique items for your next adventure.</p>
          <br/>
          <a href="https://goodslister-marketplace-2025.vercel.app" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a>
        </div>
      `;
      break;

    case 'booking_confirmation':
      subject = 'Booking Confirmed! ✅';
      htmlContent = `
        <div style="font-family: sans-serif; color: #333;">
          <h1>Your Adventure is Booked!</h1>
          <p>Hi \${data.name}, your booking for <strong>\${data.listingTitle}</strong> is confirmed.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Dates:</strong> \${data.startDate} to \${data.endDate}</p>
            <p><strong>Total Price:</strong> \$\${data.totalPrice}</p>
            <p><strong>Payment:</strong> \${data.paymentMethod === 'platform' ? 'Paid Online' : 'Pay Upon Pickup'}</p>
          </div>
          <p>You can chat with the owner in your dashboard to coordinate pickup.</p>
        </div>
      `;
      break;

    case 'check_in_reminder':
      subject = 'Check-In Reminder for Your Rental 📅';
      htmlContent = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Your rental is starting soon!</h2>
          <p>Hi \${data.name},</p>
          <p>This is a reminder that your rental for <strong>\${data.listingTitle}</strong> starts soon.</p>
          <p><strong>Pickup Location:</strong> \${data.pickupLocation}</p>
          <p><strong>Owner Contact:</strong> \${data.ownerContact}</p>
          <br/>
          <a href="https://goodslister-marketplace-2025.vercel.app" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a>
        </div>
      `;
      break;

    case 'booking_change':
      subject = 'Booking Change Notice ⚠️';
      htmlContent = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Your Booking Has Been Updated</h2>
          <p>Hi \${data.name},</p>
          <p>Your booking for <strong>\${data.listingTitle}</strong> has been modified.</p>
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Changes:</strong></p>
            <p>\${data.changeDetails}</p>
          </div>
          <p>Please review the changes and contact the owner if you have any questions.</p>
        </div>
      `;
      break;

    case 'return_reminder':
      subject = 'Time to Return Your Rental 🔄';
      htmlContent = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Time to Return Your Rental</h2>
          <p>Hi \${data.name},</p>
          <p>This is a friendly reminder that your rental period for <strong>\${data.listingTitle}</strong> is ending soon.</p>
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Return Location:</strong> \${data.returnLocation}</p>
            <p><strong>Return Time:</strong> \${data.returnTime}</p>
          </div>
          <p>Please ensure the item is returned in good condition. Thank you for using GoodsLister!</p>
        </div>
      `;
      break;

    case 'message_notification':
      subject = 'New Message from \${data.senderName} 💬';
      htmlContent = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>You have a new message</h2>
          <p><strong>\${data.senderName}</strong> sent you a message regarding <em>\${data.listingTitle}</em></p>
          <blockquote style="border-left: 4px solid #0b6bd4; padding-left: 10px; color: #555; margin: 20px 0;">
            "\${data.messagePreview}"
          </blockquote>
          <br/>
          <a href="https://goodslister-marketplace-2025.vercel.app" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Message</a>
        </div>
      `;
      break;

    default:
      return res.status(400).json({ error: 'Invalid email type' });
  }

  // Send the email
  // NOTE: 'from' address must be 'noreply@goodslister.com' until you verify a domain in SendGrid
  try {
    await sgMail.send({
      to: to,
      from: 'GoodsLister <noreply@goodslister.com>',
      subject: subject,
      html: htmlContent,
    });

    return res.status(200).json({ success: true, id: 'sent' });
  } catch (error: any) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('SendGrid Response Error:', error.response.body);
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
// Force rebuild for deployment
