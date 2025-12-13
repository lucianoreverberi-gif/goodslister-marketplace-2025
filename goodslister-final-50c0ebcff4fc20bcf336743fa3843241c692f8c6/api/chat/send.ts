
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// ... (Database helper functions remain the same) ...
async function ensureTablesExist() {
    await sql`CREATE TABLE IF NOT EXISTS conversations (id VARCHAR(255) PRIMARY KEY, listing_id VARCHAR(255), updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS conversation_participants (conversation_id VARCHAR(255) REFERENCES conversations(id), user_id VARCHAR(255), PRIMARY KEY (conversation_id, user_id))`;
    await sql`CREATE TABLE IF NOT EXISTS messages (id VARCHAR(255) PRIMARY KEY, conversation_id VARCHAR(255) REFERENCES conversations(id), sender_id VARCHAR(255), content TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversationId, senderId, text, listingId, recipientId } = req.body;

  if (!senderId || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  const executeSend = async (retry = true): Promise<any> => {
      try {
        let finalConversationId = conversationId;
        let finalRecipientId = recipientId;

        // 1. ID Resolution & Creation
        if (!finalConversationId || finalConversationId === 'NEW_DRAFT') {
            if (!listingId || !recipientId) throw new Error('New chats require listingId and recipientId');

            const existing = await sql`
                SELECT c.id FROM conversations c
                JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
                JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
                WHERE c.listing_id = ${listingId} AND cp1.user_id = ${senderId} AND cp2.user_id = ${recipientId} LIMIT 1
            `;

            if (existing.rows.length > 0) {
                finalConversationId = existing.rows[0].id;
            } else {
                finalConversationId = `convo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                await sql`INSERT INTO conversations (id, listing_id, updated_at) VALUES (${finalConversationId}, ${listingId}, CURRENT_TIMESTAMP)`;
            }
        } else {
            if (!finalRecipientId) {
                const participants = await sql`SELECT user_id FROM conversation_participants WHERE conversation_id = ${finalConversationId} AND user_id != ${senderId} LIMIT 1`;
                if (participants.rows.length > 0) finalRecipientId = participants.rows[0].user_id;
            }
        }

        // 2. Database Operations (Participants, Message, Timestamp)
        await sql`INSERT INTO conversation_participants (conversation_id, user_id) VALUES (${finalConversationId}, ${senderId}) ON CONFLICT (conversation_id, user_id) DO NOTHING`;
        if (finalRecipientId) await sql`INSERT INTO conversation_participants (conversation_id, user_id) VALUES (${finalConversationId}, ${finalRecipientId}) ON CONFLICT (conversation_id, user_id) DO NOTHING`;
        
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await sql`INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES (${messageId}, ${finalConversationId}, ${senderId}, ${text}, false, CURRENT_TIMESTAMP)`;
        await sql`UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ${finalConversationId}`;

        // 3. Send HTML Email Notification
        if (process.env.RESEND_API_KEY && finalRecipientId) {
            try {
                const recipientData = await sql`SELECT email, name FROM users WHERE id = ${finalRecipientId}`;
                const senderData = await sql`SELECT name FROM users WHERE id = ${senderId}`;
                
                if (recipientData.rows.length > 0 && senderData.rows.length > 0) {
                    const recipientEmail = recipientData.rows[0].email;
                    const recipientName = recipientData.rows[0].name;
                    const senderName = senderData.rows[0].name;
                    const resend = new Resend(process.env.RESEND_API_KEY);

                    // Reusing the style from send-email.ts for consistency
                    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color: #f3f4f6; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
      <img src="https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png" alt="Goodslister" style="height: 32px; width: auto;" />
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #111827; margin-top: 0;">New message from ${senderName}</h2>
      <p style="color: #374151;">Hi ${recipientName}, you have a new message on Goodslister:</p>
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; font-style: italic; color: #555; margin: 24px 0; border-left: 4px solid #06B6D4;">
        "${text}"
      </div>
      <center>
        <a href="https://goodslister.com/inbox" style="display: inline-block; background-color: #06B6D4; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reply Now</a>
      </center>
    </div>
    <div style="background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af;">
      <p>&copy; ${new Date().getFullYear()} Goodslister Inc.</p>
    </div>
  </div>
</body>
</html>`;

                    await resend.emails.send({
                        from: `Goodslister <noreply@goodslister.com>`,
                        to: recipientEmail,
                        subject: `New message from ${senderName}`,
                        html: html
                    });
                }
            } catch (emailError) {
                console.error("Failed to send email notification:", emailError);
            }
        }

        return { success: true, conversationId: finalConversationId, messageId };

      } catch (error: any) {
        if (retry && (error.code === '42P01' || error.message?.includes('does not exist'))) {
            await ensureTablesExist();
            return await executeSend(false);
        }
        throw error;
      }
  };

  try {
    const result = await executeSend();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Chat send error:', error);
    return res.status(500).json({ error: `Failed to send message` });
  }
}
