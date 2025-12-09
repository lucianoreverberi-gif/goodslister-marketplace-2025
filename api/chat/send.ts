import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { conversationId, senderId, text, listingId, recipientId } = req.body;
  if (!senderId || !text) return res.status(400).json({ error: 'Missing senderId or text' });
  try {
    let finalConversationId = conversationId;
    if (!finalConversationId || finalConversationId === 'NEW_DRAFT') {
      if (!listingId || !recipientId) return res.status(400).json({ error: 'Need listingId and recipientId' });
      const existing = await sql`SELECT c.id FROM conversations c JOIN conversation_participants cp1 ON c.id = cp1.conversation_id JOIN conversation_participants cp2 ON c.id = cp2.conversation_id WHERE c.listing_id = ${listingId} AND cp1.user_id = ${senderId} AND cp2.user_id = ${recipientId} LIMIT 1`;
      if (existing.rows.length > 0) { finalConversationId = existing.rows[0].id; } else { finalConversationId = `convo-${Date.now()}-${Math.random().toString(36).substr(2,9)}`; await sql`INSERT INTO conversations (id, listing_id, updated_at) VALUES (${finalConversationId}, ${listingId}, CURRENT_TIMESTAMP)`; }
    }
    await sql`INSERT INTO conversation_participants (conversation_id, user_id) VALUES (${finalConversationId}, ${senderId}) ON CONFLICT (conversation_id, user_id) DO NOTHING`;
    if (recipientId) { await sql`INSERT INTO conversation_participants (conversation_id, user_id) VALUES (${finalConversationId}, ${recipientId}) ON CONFLICT (conversation_id, user_id) DO NOTHING`; }
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
    await sql`INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES (${messageId}, ${finalConversationId}, ${senderId}, ${text}, false, CURRENT_TIMESTAMP)`;
    await sql`UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ${finalConversationId}`;
    return res.status(200).json({ success: true, conversationId: finalConversationId, messageId });
  } catch (error) {
    console.error('Chat send error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
