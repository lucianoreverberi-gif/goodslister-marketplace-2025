
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Disable Cache completely
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

    // 2. ID Resolution & Creation
    // If we don't have a valid ID, or it's a draft, try to FIND it or CREATE it.
    if (!finalConversationId || finalConversationId === 'NEW_DRAFT') {
        
        if (!listingId || !recipientId) {
             return res.status(400).json({ error: 'New chats require listingId and recipientId' });
        }

        // Check for existing conversation loosely (just by participants and listing)
        // This prevents creating duplicate chats if the frontend state was lost
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
            // Create NEW Conversation
            finalConversationId = `convo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            await sql`
                INSERT INTO conversations (id, listing_id, updated_at)
                VALUES (${finalConversationId}, ${listingId}, CURRENT_TIMESTAMP)
            `;
        }
    }

    // 3. SELF-HEALING MECHANISM (The Critical Fix)
    // We forcefully ensure BOTH participants are linked to this conversation ID.
    // This fixes the issue where a chat exists but one user cannot see it in their inbox.
    
    // Link Sender
    await sql`
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (${finalConversationId}, ${senderId})
        ON CONFLICT (conversation_id, user_id) DO NOTHING
    `;

    // Link Recipient (if we know who they are)
    if (recipientId) {
        await sql`
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (${finalConversationId}, ${recipientId})
            ON CONFLICT (conversation_id, user_id) DO NOTHING
        `;
    }

    // 4. Insert the Message
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    await sql`
        INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
        VALUES (${messageId}, ${finalConversationId}, ${senderId}, ${text}, false, CURRENT_TIMESTAMP)
    `;

    // 5. Update Conversation Timestamp
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return res.status(500).json({ error: `Failed to send message: ${errorMessage}` });
  }
}
