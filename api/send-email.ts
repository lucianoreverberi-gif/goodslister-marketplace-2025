import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Brand colors & shared layout
const BRAND_COLOR = '#2563eb';
const BRAND_DARK = '#1e3a5f';
const FROM_ADDRESS = 'Goodslister <noreply@goodslister.com>';

function emailWrapper(content: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Goodslister</title>
          </head>
          <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
                <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);max-width:600px;width:100%;">
                              <!-- Header -->
                                      <tr><td style="background:${BRAND_DARK};padding:28px 40px;text-align:center;">
                                                <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:1px;">GOODSLISTER</h1>
                                                          <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">Adventure Rental Marketplace</p>
                                                                  </td></tr>
                                                                          <!-- Body -->
                                                                                  <tr><td style="padding:40px 40px 32px;">
                                                                                            ${content}
                                                                                                    </td></tr>
                                                                                                            <!-- Footer -->
                                                                                                                    <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                                                                                                                              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 Goodslister · <a href="https://www.goodslister.com" style="color:${BRAND_COLOR};text-decoration:none;">goodslister.com</a></p>
                                                                                                                                        <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">You received this email because you have an account on Goodslister.</p>
                                                                                                                                                </td></tr>
                                                                                                                                                      </table>
                                                                                                                                                          </td></tr>
                                                                                                                                                            </table>
                                                                                                                                                            </body>
                                                                                                                                                            </html>`;
}

function btnLink(url: string, label: string): string {
    return `<a href="${url}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">${label}</a>`;
}

function infoRow(label: string, value: string): string {
    return `<tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:160px;vertical-align:top;">${label}</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;vertical-align:top;">${value}</td>
              </tr>`;
}

function getEmailContent(type: string, data: Record<string, string>): { subject: string; html: string } {
    const appUrl = 'https://www.goodslister.com';

  switch (type) {

    case 'welcome':
            return {
                      subject: `Welcome to Goodslister, ${data.name}!`,
                      html: emailWrapper(`
                                <h2 style="margin:0 0 8px;color:${BRAND_DARK};font-size:22px;">Welcome aboard, ${data.name}! 🎉</h2>
                                          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">Your account is ready. You can now browse hundreds of adventure gear listings, rent equipment, or list your own gear for others to enjoy.</p>
                                                    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f0f7ff;border-radius:8px;padding:20px;margin-bottom:20px;">
                                                                <tr>
                                                                              <td>
                                                                                              <p style="margin:0 0 12px;color:${BRAND_DARK};font-weight:700;font-size:14px;">GET STARTED:</p>
                                                                                                              <p style="margin:0 0 8px;color:#475569;font-size:14px;">✅ Browse listings near you</p>
                                                                                                                              <p style="margin:0 0 8px;color:#475569;font-size:14px;">✅ Complete your profile</p>
                                                                                                                                              <p style="margin:0;color:#475569;font-size:14px;">✅ List your first item and earn</p>
                                                                                                                                                            </td>
                                                                                                                                                                        </tr>
                                                                                                                                                                                  </table>
                                                                                                                                                                                            ${btnLink(appUrl, 'Explore Goodslister')}
                                                                                                                                                                                                    `),
            };

    case 'booking_confirmation':
            return {
                      subject: `Booking Confirmed: ${data.listingTitle}`,
                      html: emailWrapper(`
                                <h2 style="margin:0 0 8px;color:${BRAND_DARK};font-size:22px;">Your booking is confirmed! ✅</h2>
                                          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hi ${data.name}, your rental has been confirmed. Here are the details:</p>
                                                    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f0f7ff;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                                                                ${infoRow('Item', data.listingTitle)}
                                                                            ${infoRow('Pick-up date', data.startDate)}
                                                                                        ${infoRow('Return date', data.endDate || '—')}
                                                                                                    ${infoRow('Total', data.totalPrice ? `$${data.totalPrice}` : '—')}
                                                                                                                ${infoRow('Booking ID', data.bookingId || '—')}
                                                                                                                          </table>
                                                                                                                                    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 4px;">📍 Please be ready at the agreed pick-up location on time.</p>
                                                                                                                                              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">If you need to make changes, contact the owner through the app.</p>
                                                                                                                                                        ${btnLink(appUrl, 'View My Bookings')}
                                                                                                                                                                `),
            };

    case 'booking_request':
            return {
                      subject: `New Rental Request: ${data.listingTitle}`,
                      html: emailWrapper(`
                                <h2 style="margin:0 0 8px;color:${BRAND_DARK};font-size:22px;">You have a new rental request! 📬</h2>
                                          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hi ${data.ownerName}, someone wants to rent your gear. Please review and respond promptly.</p>
                                                    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f0f7ff;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                                                                ${infoRow('Item', data.listingTitle)}
                                                                            ${infoRow('Requested by', data.renterName)}
                                                                                        ${infoRow('Pick-up date', data.startDate)}
                                                                                                    ${infoRow('Return date', data.endDate || '—')}
                                                                                                                ${infoRow('Total value', data.totalPrice ? `$${data.totalPrice}` : '—')}
                                                                                                                          </table>
                                                                                                                                    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">Log in to approve or decline this request as soon as possible.</p>
                                                                                                                                              ${btnLink(appUrl, 'Review Request')}
                                                                                                                                                      `),
            };

    case 'check_in':
            return {
                      subject: `Check-in Today: ${data.listingTitle}`,
                      html: emailWrapper(`
                                <h2 style="margin:0 0 8px;color:${BRAND_DARK};font-size:22px;">Your rental starts today! 🚀</h2>
                                          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hi ${data.name}, today is the pick-up day for your rental. Have an amazing adventure!</p>
                                                    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f0fff4;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                                                                ${infoRow('Item', data.listingTitle)}
                                                                            ${infoRow('Pick-up date', data.startDate)}
                                                                                        ${infoRow('Return date', data.endDate || '—')}
                                                                                                    ${infoRow('Booking ID', data.bookingId || '—')}
                                                                                                              </table>
                                                                                                                        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px;">📋 Remember to inspect the item carefully at pick-up and report any pre-existing damage.</p>
                                                                                                                                  <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">Enjoy your adventure and return the item in the same condition. 🏕️</p>
                                                                                                                                            ${btnLink(appUrl, 'View Booking Details')}
                                                                                                                                                    `),
            };

    case 'check_out':
            return {
                      subject: `Return Reminder: ${data.listingTitle} is due today`,
                      html: emailWrapper(`
                                <h2 style="margin:0 0 8px;color:${BRAND_DARK};font-size:22px;">Time to return your rental 📦</h2>
                                          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hi ${data.name}, your rental ends today. Please return the item to the owner as agreed.</p>
                                                    <table cellpadding="0" cellspacing="0" style="width:100%;background:#fff7ed;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                                                                ${infoRow('Item', data.listingTitle)}
                                                                            ${infoRow('Return date', data.endDate)}
                                                                                        ${infoRow('Booking ID', data.bookingId || '—')}
                                                                                                  </table>
                                                                                                            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px;">⏰ Late returns may incur additional charges as per the rental agreement.</p>
                                                                                                                      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">We hope you had a great experience! Please leave a review for the owner.</p>
                                                                                                                                ${btnLink(appUrl, 'Leave a Review')}
                                                                                                                                        `),
            };

    case 'booking_cancelled':
            return {
                      subject: `Booking Cancelled: ${data.listingTitle}`,
                      html: emailWrapper(`
                                <h2 style="margin:0 0 8px;color:#dc2626;font-size:22px;">Booking Cancelled</h2>
                                          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hi ${data.name}, your booking for <strong>${data.listingTitle}</strong> has been cancelled.</p>
                                                    <table cellpadding="0" cellspacing="0" style="width:100%;background:#fff5f5;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                                                                ${infoRow('Item', data.listingTitle)}
                                                                            ${infoRow('Cancelled date', data.cancelDate || new Date().toLocaleDateString())}
                                                                                        ${infoRow('Booking ID', data.bookingId || '—')}
                                                                                                    ${data.refundAmount ? infoRow('Refund', `$${data.refundAmount}`) : ''}
                                                                                                              </table>
                                                                                                                        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">If a refund applies, it will be processed within 5-7 business days. Browse other available gear below.</p>
                                                                                                                                  ${btnLink(appUrl, 'Find Similar Gear')}
                                                                                                                                          `),
            };

    case 'pickup_reminder':
            return {
                      subject: `Reminder: Pick up ${data.listingTitle} tomorrow`,
                      html: emailWrapper(`
                                <h2 style="margin:0 0 8px;color:${BRAND_DARK};font-size:22px;">Pick-up reminder ⏰</h2>
                                          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hi ${data.name}, just a friendly reminder that your rental pick-up is <strong>tomorrow</strong>!</p>
                                                    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f0f7ff;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                                                                ${infoRow('Item', data.listingTitle)}
                                                                            ${infoRow('Pick-up date', data.startDate)}
                                                                                        ${infoRow('Return date', data.endDate || '—')}
                                                                                                    ${infoRow('Booking ID', data.bookingId || '—')}
                                                                                                              </table>
                                                                                                                        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">Make sure you know the pick-up location and have your booking confirmation ready. Have a great adventure! 🎒</p>
                                                                                                                                  ${btnLink(appUrl, 'View Booking Details')}
                                                                                                                                          `),
            };

    case 'password_reset':
            return {
                      subject: 'Reset your Goodslister password',
                      html: emailWrapper(`
                                <h2 style="margin:0 0 8px;color:${BRAND_DARK};font-size:22px;">Password Reset Request 🔒</h2>
                                          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hi ${data.name}, we received a request to reset your Goodslister password. Click the button below to set a new password.</p>
                                                    <p style="background:#fff7ed;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;color:#92400e;font-size:14px;margin:0 0 24px;">⚠️ This link will expire in <strong>1 hour</strong>. If you did not request a password reset, ignore this email.</p>
                                                              ${btnLink(data.resetUrl || appUrl, 'Reset My Password')}
                                                                        <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;">Or copy this link: <span style="color:${BRAND_COLOR};">${data.resetUrl || appUrl}</span></p>
                                                                                `),
            };

    default:
            return {
                      subject: 'Notification from Goodslister',
                      html: emailWrapper(`
                                <h2 style="margin:0 0 16px;color:${BRAND_DARK};font-size:22px;">Hello from Goodslister</h2>
                                          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0;">${data.message || 'You have a new notification from Goodslister.'}</p>
                                                    ${btnLink(appUrl, 'Go to Goodslister')}
                                                            `),
            };
  }
}

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
  ) {
    if (request.method !== 'POST') {
          return response.status(405).json({ error: 'Method not allowed' });
    }

  if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Skipping email.');
        return response.status(200).json({ success: true, message: 'Email skipped (no API key)' });
  }

  const { type, to, data } = request.body;

  if (!type || !to) {
        return response.status(400).json({ error: 'Missing required fields: type, to' });
  }

  try {
        const { subject, html } = getEmailContent(type, data || {});

      await resend.emails.send({
              from: FROM_ADDRESS,
              to: [to],
              subject,
              html,
      });

      console.log(`Email sent: type=${type} to=${to}`);
        return response.status(200).json({ success: true, type });
  } catch (error) {
        console.error('Error sending email:', error);
        return response.status(500).json({ error: 'Failed to send email' });
  }
}
