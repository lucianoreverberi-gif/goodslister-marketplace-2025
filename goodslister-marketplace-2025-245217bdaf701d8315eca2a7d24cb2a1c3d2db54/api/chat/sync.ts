
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // 1. Get all conversations ID the user is part of
    const convoIdsResult = await sql`
        SELECT conversation_id 
        FROM conversation_participants 
        WHERE user_id = ${userId}
    `;
    
    const convoIds = convoIdsResult.rows.map(r => r.conversation_id);

    if (convoIds.length === 0) {
        return res.status(200).json({ conversations: [] });
    }

    // 2. Fetch Conversation Details
    const conversationsResult = await sql`
        SELECT c.id, c.listing_id, c.updated_at
        FROM conversations c
        WHERE c.id = ANY(${convoIds as any})
        ORDER BY c.updated_at DESC
    `;

    // Fetch Messages
    const messagesResult = await sql`
        SELECT id, conversation_id, sender_id, content, is_read, created_at
        FROM messages
        WHERE conversation_id = ANY(${convoIds as any})
        ORDER BY created_at ASC
    `;

    // Fetch Participants Info (ROBUST FIX: LEFT JOIN)
    // We select cp.user_id as the primary ID to ensure we get a participant even if the user record is missing
    const participantsResult = await sql`
        SELECT cp.conversation_id, cp.user_id as id, u.name, u.avatar_url
        FROM conversation_participants cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ANY(${convoIds as any})
    `;
    
    // Fetch Listing Info
    const listingIds = [...new Set(conversationsResult.rows.map(c => c.listing_id))].filter(id => id);
    let listingsResult = { rows: [] };
    
    if (listingIds.length > 0) {
        listingsResult = await sql`
            SELECT id, title, images
            FROM listings
            WHERE id = ANY(${listingIds as any})
        `;
    }

    // 3. Reconstruct Data
    const conversations = conversationsResult.rows.map(convo => {
        const participants = participantsResult.rows
            .filter(p => p.conversation_id === convo.id)
            .reduce((acc, p) => {
                // Fallback if name is missing from DB join
                const displayName = p.name || `User ${p.id.substring(0, 5)}`;
                const displayAvatar = p.avatar_url || `https://i.pravatar.cc/150?u=${p.id}`;
                
                acc[p.id] = { 
                    id: p.id, 
                    name: displayName, 
                    avatarUrl: displayAvatar,
                    email: '', 
                    registeredDate: '',
                    favorites: []
                };
                return acc;
            }, {} as any);

        const listingRow = listingsResult.rows.find(l => l.id === convo.listing_id);
        const listing = listingRow ? {
            id: listingRow.id,
            title: listingRow.title,
            images: listingRow.images || [],
            description: '', category: 'Boats', pricingType: 'daily', location: { city: '', state: '', country: '', latitude: 0, longitude: 0},
            owner: { id: '', name: '', email: '', registeredDate: '', avatarUrl: '', favorites: [] } 
        } : null;

        const messages = messagesResult.rows
            .filter(m => m.conversation_id === convo.id)
            .map(m => ({
                id: m.id,
                senderId: m.sender_id,
                text: m.content,
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
