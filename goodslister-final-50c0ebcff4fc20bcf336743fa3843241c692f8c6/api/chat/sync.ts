
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Force Fresh Data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // 2. Get Conversations (Using DISTINCT to avoid duplicate ghost chats)
    const convoIdsResult = await sql`
        SELECT DISTINCT conversation_id 
        FROM conversation_participants 
        WHERE user_id = ${userId}
    `;
    
    const convoIds = convoIdsResult.rows.map(r => r.conversation_id);

    if (convoIds.length === 0) {
        return res.status(200).json({ conversations: [] });
    }

    // 3. Fetch Conversation Metadata
    const conversationsResult = await sql`
        SELECT id, listing_id, updated_at
        FROM conversations 
        WHERE id = ANY(${convoIds as any})
        ORDER BY updated_at DESC
    `;

    // 4. Fetch All Messages for these chats
    const messagesResult = await sql`
        SELECT id, conversation_id, sender_id, content, created_at
        FROM messages
        WHERE conversation_id = ANY(${convoIds as any})
        ORDER BY created_at ASC
    `;

    // 5. Fetch Participants (Fault Tolerant)
    // We grab the user info directly. If the JOIN fails, we still get the ID from the participant table.
    const participantsResult = await sql`
        SELECT cp.conversation_id, cp.user_id as id, u.name, u.avatar_url
        FROM conversation_participants cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ANY(${convoIds as any})
    `;
    
    // 6. Fetch Listings
    const listingIds = [...new Set(conversationsResult.rows.map(c => c.listing_id))].filter(id => id);
    let listingsResult = { rows: [] };
    if (listingIds.length > 0) {
        listingsResult = await sql`
            SELECT id, title, images
            FROM listings
            WHERE id = ANY(${listingIds as any})
        `;
    }

    // 7. Assemble Logic
    const conversations = conversationsResult.rows.map(convo => {
        // Build Participant Map
        const participants = participantsResult.rows
            .filter(p => p.conversation_id === convo.id)
            .reduce((acc, p) => {
                const displayName = p.name || `User ${p.id.substring(0, 4)}`;
                const displayAvatar = p.avatar_url || `https://i.pravatar.cc/150?u=${p.id}`;
                
                acc[p.id] = { 
                    id: p.id, 
                    name: displayName, 
                    avatarUrl: displayAvatar
                };
                return acc;
            }, {} as any);

        // Attach Listing
        const listingRow = listingsResult.rows.find(l => l.id === convo.listing_id);
        const listing = listingRow ? {
            id: listingRow.id,
            title: listingRow.title,
            images: listingRow.images || []
        } : null;

        // Attach Messages
        const messages = messagesResult.rows
            .filter(m => m.conversation_id === convo.id)
            .map(m => ({
                id: m.id,
                senderId: m.sender_id,
                text: m.content,
                originalText: m.content,
                timestamp: m.created_at
            }));

        return {
            id: convo.id,
            listing: listing,
            participants,
            messages
        };
    });

    return res.status(200).json({ conversations });

  } catch (error) {
    console.error('Chat sync error:', error);
    return res.status(500).json({ error: 'Failed to sync chat' });
  }
}
