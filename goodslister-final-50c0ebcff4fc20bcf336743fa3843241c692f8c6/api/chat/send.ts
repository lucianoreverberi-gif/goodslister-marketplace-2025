
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Helper to create tables if they don't exist
async function ensureTablesExist() {
    console.log("Self-healing: Creating missing chat tables...");
    await sql`
        CREATE TABLE IF NOT EXISTS conversations (
            id VARCHAR(255) PRIMARY KEY,
            listing_id VARCHAR(255),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS conversation_participants (
            conversation_id VARCHAR(255) REFERENCES conversations(id),
            user_id VARCHAR(255),
            PRIMARY KEY (conversation_id, user_id)
        );
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(255) PRIMARY KEY,
            conversation_id VARCHAR(255) REFERENCES conversations(id),
            sender_id VARCHAR(255),
            content TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    console.log("Self-healing: Tables created.");
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
            
            if (!listingId || !recipientId) {
                 throw new Error('New chats require listingId and recipientId');
            }

            const existing = await sql`
                SELECT c.id 
                FROM conversations c
                JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
                JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
                WHERE c.listing_id = ${listingId}
                AND cp1.user_id = ${senderId}
                AND cp2.user_id = ${recipientId}
                LIMIT 1
            `;

            if (existing.rows.length > 0) {
                finalConversationId = existing.rows[0].id;
            } else {
                finalConversationId = `convo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                await sql`
                    INSERT INTO conversations (id, listing_id, updated_at)
                    VALUES (${finalConversationId}, ${listingId}, CURRENT_TIMESTAMP)
                `;
            }
        } else {
            // If existing conversation, we need to find the recipient ID to send the email
            // The recipient is the participant who is NOT the sender
            if (!finalRecipientId) {
                const participants = await sql`
                    SELECT user_id FROM conversation_participants 
                    WHERE conversation_id = ${finalConversationId} AND user_id != ${senderId}
                    LIMIT 1
                `;
                if (participants.rows.length > 0) {
                    finalRecipientId = participants.rows[0].user_id;
                }
            }
        }

        // 2. SELF-HEALING: Ensure participants are linked
        await sql`
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (${finalConversationId}, ${senderId})
            ON CONFLICT (conversation_id, user_id) DO NOTHING
        `;

        if (finalRecipientId) {
            await sql`
                INSERT INTO conversation_participants (conversation_id, user_id)
                VALUES (${finalConversationId}, ${finalRecipientId})
                ON CONFLICT (conversation_id, user_id) DO NOTHING
            `;
        }

        // 3. Insert Message
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await sql`
            INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
            VALUES (${messageId}, ${finalConversationId}, ${senderId}, ${text}, false, CURRENT_TIMESTAMP)
        `;

        // 4. Update Timestamp
        await sql`
            UPDATE conversations 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${finalConversationId}
        `;

        // 5. Send Email Notification (Async, best effort)
        if (process.env.RESEND_API_KEY && finalRecipientId) {
            try {
                // Get recipient email and sender name
                const recipientData = await sql`SELECT email, name FROM users WHERE id = ${finalRecipientId}`;
                const senderData = await sql`SELECT name FROM users WHERE id = ${senderId}`;
                
                if (recipientData.rows.length > 0 && senderData.rows.length > 0) {
                    const recipientEmail = recipientData.rows[0].email;
                    const recipientName = recipientData.rows[0].name;
                    const senderName = senderData.rows[0].name;
                    
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    const fromEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

                    await resend.emails.send({
                        from: `Goodslister <${fromEmail}>`,
                        to: recipientEmail,
                        subject: `New message from ${senderName}`,
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                <h2>Hello ${recipientName},</h2>
                                <p><strong>${senderName}</strong> sent you a message on Goodslister:</p>
                                <blockquote style="background: #f4f4f4; padding: 15px; border-left: 4px solid #06B6D4; border-radius: 4px;">
                                    "${text}"
                                </blockquote>
                                <br/>
                                <a href="https://goodslister.com/inbox" style="background-color: #06B6D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reply Now</a>
                            </div>
                        `
                    });
                    console.log(`Email notification sent to ${recipientEmail}`);
                }
            } catch (emailError) {
                console.error("Failed to send email notification:", emailError);
                // Don't fail the request if email fails
            }
        }

        return { 
            success: true, 
            conversationId: finalConversationId, 
            messageId 
        };

      } catch (error: any) {
        // AUTO-HEAL: If tables don't exist, create them and retry once
        if (retry && (error.code === '42P01' || error.message?.includes('does not exist'))) {
            await ensureTablesExist();
            return await executeSend(false); // Retry once
        }
        throw error;
      }
  };

  try {
    const result = await executeSend();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Chat send error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return res.status(500).json({ error: `Failed to send message: ${errorMessage}` });
  }
}
