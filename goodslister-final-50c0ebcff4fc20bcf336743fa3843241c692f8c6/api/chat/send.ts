
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Disable Cache
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversationId, senderId, text, listingId, recipientId } = req.body;

  if (!senderId || !text) {
      return res.status(400).json({ error: 'Missing required fields (senderId, text)' });
  }

  try {
    let finalConversationId = conversationId;

    // 2. "Smart" ID Resolution: If we don't have a valid ID, or it's a draft, FIND or CREATE it.
    if (!finalConversationId || finalConversationId === 'NEW_DRAFT') {
        
        if (!listingId || !recipientId) {
             // If we can't find/create, we can't proceed without these details
             return res.status(400).json({ error: 'New chats require listingId and recipientId' });
        }

        // A. Check if conversation already exists for these 2 users on this listing
        // We look for a conversation that has both participants for the specific listing
        // Note: In complex SQL this involves joining participants twice or aggregation. 
        // For simplicity/speed in Vercel Postgres, we check conversations on the listing, 
        // then verify participants in JS or subquery if volume is low. 
        // Here is a robust SQL approach:
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
            // B. Create NEW Conversation
            finalConversationId = `convo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            await sql`
                INSERT INTO conversations (id, listing_id)
                VALUES (${finalConversationId}, ${listingId})
            `;
            
            // Link Participants
            await sql`
                INSERT INTO conversation_participants (conversation_id, user_id)
                VALUES 
                    (${finalConversationId}, ${senderId}),
                    (${finalConversationId}, ${recipientId})
            `;
        }
    } else {
        // SELF-HEALING: Even if we have an ID, ensure the recipient is actually linked.
        // This fixes the bug where messages are sent but don't appear in the other user's inbox.
        if (recipientId) {
             await sql`
                INSERT INTO conversation_participants (conversation_id, user_id)
                VALUES (${finalConversationId}, ${recipientId})
                ON CONFLICT DO NOTHING
            `;
        }
    }

    // 3. Insert the Message
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await sql`
        INSERT INTO messages (id, conversation_id, sender_id, content, is_read)
        VALUES (${messageId}, ${finalConversationId}, ${senderId}, ${text}, false)
    `;

    // 4. Update Conversation Timestamp (so it floats to top of inbox)
    await sql`
        UPDATE conversations 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${finalConversationId}
    `;

    return res.status(200).json({ 
        success: true, 
        conversationId: finalConversationId, 
        messageId 
    });

  } catch (error) {
    console.error('Chat send error:', error);
    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return res.status(500).json({ error: `Failed to send message: ${errorMessage}` });
  }
}
