
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversationId, senderId, text, listingId, recipientId } = req.body;

  if (!senderId || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let targetConversationId = conversationId;

    // 1. Create Conversation if it doesn't exist (First message)
    if (!targetConversationId && listingId && recipientId) {
        targetConversationId = `convo-${Date.now()}`;
        
        await sql`
            INSERT INTO conversations (id, listing_id)
            VALUES (${targetConversationId}, ${listingId})
        `;
    }

    if (!targetConversationId) {
        return res.status(400).json({ error: 'Missing conversationId or listing/recipient info' });
    }

    // 2. SELF-HEALING: Always attempt to ensure participants are linked.
    // If 'conversation_participants' row is missing, this fixes the "empty inbox" bug.
    // We use ON CONFLICT DO NOTHING to make it safe to run every time.
    if (recipientId) {
        await sql`
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES 
                (${targetConversationId}, ${senderId}),
                (${targetConversationId}, ${recipientId})
            ON CONFLICT DO NOTHING
        `;
    }

    // 3. Insert Message
    const messageId = `msg-${Date.now()}`;
    await sql`
        INSERT INTO messages (id, conversation_id, sender_id, content, is_read)
        VALUES (${messageId}, ${targetConversationId}, ${senderId}, ${text}, false)
    `;

    // 4. Update Conversation Timestamp
    await sql`
        UPDATE conversations 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${targetConversationId}
    `;

    return res.status(200).json({ success: true, conversationId: targetConversationId, messageId });

  } catch (error) {
    console.error('Chat send error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
