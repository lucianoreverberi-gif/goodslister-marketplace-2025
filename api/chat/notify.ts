import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { senderId, recipientId, messagePreview, listingTitle } = req.body || {};

    if (!senderId || !recipientId || !messagePreview) {
      return res.status(400).json({ error: 'Missing required fields: senderId, recipientId, messagePreview' });
    }

    if (senderId === recipientId) {
      return res.status(200).json({ success: false, message: 'Skipped: sender is same as recipient' });
    }

    // Query both users in one shot
    const { rows } = await sql`
      SELECT id, name, email
      FROM users
      WHERE id = ${senderId} OR id = ${recipientId}
    `;

    const sender = rows.find(function(r) { return r.id === senderId; });
    const recipient = rows.find(function(r) { return r.id === recipientId; });

    if (!recipient?.email) {
      return res.status(404).json({ error: 'Recipient email not found', recipientId });
    }

    const senderName = sender?.name || 'Someone';
    // Trim preview to 200 chars to keep email concise
    const preview = String(messagePreview).substring(0, 200);

    const host = req.headers.host || 'www.goodslister.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const emailUrl = `${protocol}://${host}/api/send-email`;

    const emailRes = await fetch(emailUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'chat_message_new',
        to: recipient.email,
        data: {
          senderName,
          messagePreview: preview,
          listingTitle: listingTitle || 'a listing'
        }
      })
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text().catch(function() { return 'unknown'; });
      console.warn('chat_message_new email send failed:', emailRes.status, errText);
      return res.status(200).json({ success: false, message: `Email send failed: ${emailRes.status}` });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Chat notify error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

