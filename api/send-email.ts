import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const COLORS = {
  blue: '#0ea5e9',
  dark: '#0f172a',
  white: '#ffffff',
  gray: '#f8fafc',
  text: '#334155',
};

const LOGO_URL = 'https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png';

const getBaseTemplate = (content: string, ctaText?: string, ctaUrl?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: ${COLORS.text}; margin: 0; padding: 0; background-color: ${COLORS.gray}; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${COLORS.white}; }
    .header { background-color: ${COLORS.dark}; padding: 32px; text-align: center; }
    .header img { height: 40px; }
    .content { padding: 40px 32px; }
    .footer { background-color: ${COLORS.gray}; padding: 32px; text-align: center; font-size: 12px; color: #64748b; }
    .card { background-color: ${COLORS.gray}; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0; }
    .button { background-color: ${COLORS.blue}; color: ${COLORS.white}; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 16px; }
    h1 { color: ${COLORS.dark}; font-size: 24px; margin-top: 0; }
    .info-row { margin-bottom: 8px; display: flex; justify-content: space-between; }
    .info-label { font-weight: 600; color: #64748b; }
    .info-value { color: ${COLORS.dark}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="Goodslister">
    </div>
    <div class="content">
      ${content}
      ${ctaText && ctaUrl ? `<div style="text-align: center; margin-top: 32px;"><a href="${ctaUrl}" class="button">${ctaText}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Goodslister. All rights reserved.</p>
      <p>123 Adventure Way, Florida, USA</p>
      <div style="margin-top: 16px;">
        <a href="https://goodslister.com/terms" style="color: #64748b; margin: 0 8px;">Terms</a>
        <a href="https://goodslister.com/privacy" style="color: #64748b; margin: 0 8px;">Privacy</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { type, to, data } = request.body;

  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Skipping email.');
    return response.status(200).json({ success: true, message: 'Email skipped (no API key)' });
  }

  try {
    let subject = 'Goodslister Notification';
    let html = '';

    switch (type) {
      case 'welcome':
        subject = 'Welcome to Goodslister!';
        html = getBaseTemplate(`
          <h1>Welcome to the Adventure, ${data.name}!</h1>
          <p>We're thrilled to have you on board. Goodslister is the #1 marketplace for renting premium outdoor gear and vehicles.</p>
          <div class="card">
            <p><strong>What's next?</strong></p>
            <ul style="padding-left: 20px;">
              <li>Complete your profile</li>
              <li>Explore listings in your area</li>
              <li>List your own gear to start earning</li>
            </ul>
          </div>
        `, 'Explore Marketplace', 'https://goodslister.com/explore');
        break;

      case 'booking_request_host':
        subject = `New Booking Request: ${data.listingTitle}`;
        html = getBaseTemplate(`
          <h1>New Booking Request</h1>
          <p>${data.renterName} wants to rent your <strong>${data.listingTitle}</strong>.</p>
          <div class="card">
            <div class="info-row"><span class="info-label">Dates:</span> <span class="info-value">${data.startDate} - ${data.endDate}</span></div>
            <div class="info-row"><span class="info-label">Total Earning:</span> <span class="info-value">$${data.totalPrice}</span></div>
            <div class="info-row"><span class="info-label">Payment:</span> <span class="info-value">${data.paymentMethod}</span></div>
          </div>
          <p>Please review and respond to this request within 24 hours.</p>
        `, 'Review Request', `https://goodslister.com/userDashboard`);
        break;

      case 'booking_request_renter':
        subject = `Request Sent: ${data.listingTitle}`;
        html = getBaseTemplate(`
          <h1>Request Sent!</h1>
          <p>Your request to rent <strong>${data.listingTitle}</strong> has been sent to ${data.hostName}.</p>
          <div class="card">
            <div class="info-row"><span class="info-label">Dates:</span> <span class="info-value">${data.startDate} - ${data.endDate}</span></div>
            <div class="info-row"><span class="info-label">Estimated Total:</span> <span class="info-value">$${data.totalPrice}</span></div>
          </div>
          <p>We'll notify you as soon as the host responds.</p>
        `, 'View My Bookings', 'https://goodslister.com/userDashboard');
        break;

      case 'booking_confirmed':
        subject = `Booking Confirmed: ${data.listingTitle}`;
        html = getBaseTemplate(`
          <h1>Great news! Booking Confirmed</h1>
          <p>Your rental for <strong>${data.listingTitle}</strong> has been approved by ${data.hostName}.</p>
          <div class="card">
            <div class="info-row"><span class="info-label">Location:</span> <span class="info-value">${data.listingLocation}</span></div>
            <div class="info-row"><span class="info-label">Dates:</span> <span class="info-value">${data.startDate} - ${data.endDate}</span></div>
            <div class="info-row"><span class="info-label">Host Contact:</span> <span class="info-value">${data.hostPhone || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Balance Due on Site:</span> <span class="info-value">$${data.balanceDueOnSite || '0.00'}</span></div>
          </div>
          <p>You can now message the host to coordinate the meeting point.</p>
        `, 'Chat with Host', `https://goodslister.com/inbox`);
        break;

      case 'booking_confirmed_host':
        subject = `Booking Confirmed: ${data.listingTitle}`;
        html = getBaseTemplate(`
          <h1>Booking Confirmed!</h1>
          <p>You've confirmed the booking for ${data.renterName} to rent your <strong>${data.listingTitle}</strong>.</p>
          <div class="card">
            <div class="info-row"><span class="info-label">Dates:</span> <span class="info-value">${data.startDate} - ${data.endDate}</span></div>
            <div class="info-row"><span class="info-label">Renter:</span> <span class="info-value">${data.renterName}</span></div>
            <div class="info-row"><span class="info-label">Total Earnings:</span> <span class="info-value">$${data.totalPrice}</span></div>
          </div>
          <p>Get ready! Coordinate with the renter through the inbox.</p>
        `, 'Go to Dashboard', 'https://goodslister.com/userDashboard');
        break;

      case 'booking_rejected':
        subject = `Update on your request for ${data.listingTitle}`;
        html = getBaseTemplate(`
          <h1>Booking Update</h1>
          <p>Unfortunately, ${data.hostName} was unable to confirm your request for <strong>${data.listingTitle}</strong>.</p>
          <div class="card">
            <p><strong>Reason:</strong> ${data.reason || 'Host unavailable for these dates.'}</p>
          </div>
          <p>Don't worry! There are many other listings available for your adventure.</p>
        `, 'Explore Other Listings', 'https://goodslister.com/explore');
        break;

      case 'booking_cancelled':
        subject = `Booking Cancelled: ${data.listingTitle}`;
        html = getBaseTemplate(`
          <h1>Booking Cancelled</h1>
          <p>The booking for <strong>${data.listingTitle}</strong> has been cancelled by ${data.cancelledBy}.</p>
          <div class="card">
            <div class="info-row"><span class="info-label">Dates:</span> <span class="info-value">${data.startDate} - ${data.endDate}</span></div>
            ${data.refundAmount ? `<div class="info-row"><span class="info-label">Refund Amount:</span> <span class="info-value">$${data.refundAmount}</span></div>` : ''}
          </div>
        `, 'Go to Home', 'https://goodslister.com');
        break;

      case 'payment_received':
        subject = `Payment Received: $${data.netPayout}`;
        html = getBaseTemplate(`
          <h1>Payment Received!</h1>
          <p>Your payout for the rental of <strong>${data.listingTitle}</strong> is on its way.</p>
          <div class="card">
            <div class="info-row"><span class="info-label">Gross Amount:</span> <span class="info-value">$${data.grossAmount}</span></div>
            <div class="info-row"><span class="info-label">Platform Fee:</span> <span class="info-value">-$${data.platformFee}</span></div>
            <div class="info-row" style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
              <span class="info-label" style="color: ${COLORS.dark}">Net Payout:</span> <span class="info-value" style="font-weight: 700;">$${data.netPayout}</span>
            </div>
            <div class="info-row"><span class="info-label">Expected Date:</span> <span class="info-value">${data.payoutDate || 'Incoming'}</span></div>
          </div>
        `, 'View Payouts', 'https://goodslister.com/userDashboard');
        break;

      case 'rental_reminder':
        subject = `Reminder: Your rental starts tomorrow!`;
        html = getBaseTemplate(`
          <h1>Ready for your adventure?</h1>
          <p>This is a reminder that your rental for <strong>${data.listingTitle}</strong> starts tomorrow!</p>
          <div class="card">
            <div class="info-row"><span class="info-label">Start Date:</span> <span class="info-value">${data.startDate}</span></div>
            <div class="info-row"><span class="info-label">Meeting Point:</span> <span class="info-value">${data.meetingPoint || 'Coordinate via chat'}</span></div>
            <div class="info-row"><span class="info-label">Host Phone:</span> <span class="info-value">${data.hostPhone || 'Check inbox'}</span></div>
          </div>
        `, 'View Booking Details', `https://goodslister.com/userDashboard`);
        break;

      case 'review_request':
        subject = `How was your adventure with ${data.hostName}?`;
        html = getBaseTemplate(`
          <h1>How was it?</h1>
          <p>We hope you had an amazing experience renting the <strong>${data.listingTitle}</strong> from ${data.hostName}.</p>
          <p>Your feedback helps our community stay safe and reliable. Please take a moment to leave a review.</p>
        `, 'Leave a Review', `https://goodslister.com/userDashboard`);
        break;

      default:
        subject = 'Goodslister Notification';
        html = getBaseTemplate(`<p>You have a new notification from Goodslister.</p>`);
    }

    await resend.emails.send({
      from: 'Goodslister <noreply@goodslister.com>',
      to: [to],
      subject: subject,
      html: html,
    });

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return response.status(500).json({ error: 'Failed to send email' });
  }
}

