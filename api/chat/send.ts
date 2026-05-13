import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { senderId, text, conversationId, listingId, recipientId } = request.body;
  
  if (!senderId || !text) {
    return response.status(400).json({ error: 'Sender ID and text are required' });
  }

  try {
    let finalConversationId = conversationId;

    // 1. Ensure tables exist (Lazy setup)
    if (process.env.POSTGRES_URL) {
        await sql`
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                participant_ids TEXT[] NOT NULL,
                listing_id TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL REFERENCES conversations(id),
                sender_id TEXT NOT NULL,
                text TEXT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
    }

    // 2. Resolve or Create Conversation
    if (!finalConversationId) {
        if (!recipientId) {
            return response.status(400).json({ error: 'Recipient ID is required for new conversations' });
        }

        // Check if a conversation between these users for this listing already exists
        if (process.env.POSTGRES_URL) {
            const existing = await sql`
                SELECT id FROM conversations 
                WHERE ${senderId} = ANY(participant_ids) 
                AND ${recipientId} = ANY(participant_ids)
                AND (listing_id = ${listingId} OR (listing_id IS NULL AND ${listingId} IS NULL))
                LIMIT 1
            `;
            
            if (existing.rows.length > 0) {
                finalConversationId = existing.rows[0].id;
            } else {
                finalConversationId = `convo-${Date.now()}`;
                await sql`
                    INSERT INTO conversations (id, participant_ids, listing_id)
                    VALUES (${finalConversationId}, ARRAY[${senderId}, ${recipientId}], ${listingId})
                `;
            }
        } else {
            finalConversationId = `mock-convo-${Date.now()}`;
        }
    }

    // 3. Save Message
    const messageId = `msg-${Date.now()}`;
    if (process.env.POSTGRES_URL) {
        await sql`
            INSERT INTO messages (id, conversation_id, sender_id, text)
            VALUES (${messageId}, ${finalConversationId}, ${senderId}, ${text})
        `;
        // Update conversation timestamp
        await sql`
            UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ${finalConversationId}
        `;
    }

    return response.status(200).json({ 
        success: true, 
        messageId, 
        conversationId: finalConversationId 
    });
  } catch (error) {
    console.error("Error in chat/send:", error);
    return response.status(500).json({ error: 'Failed to send message' });
  }
}
