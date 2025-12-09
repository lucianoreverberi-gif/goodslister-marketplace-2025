
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Disable Cache - Force fresh data every time
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
    // --- STEP 1: AGGRESSIVE DISCOVERY (The Fix) ---
    // Find conversation IDs where:
    // A. I am explicitly listed as a participant (Standard)
    // B. OR I am the OWNER of the listing being discussed (Recovery)
    // C. OR I have sent messages in that conversation history (Recovery)
    
    const discoveryResult = await sql`
        SELECT DISTINCT c.id as conversation_id
        FROM conversations c
        LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
        LEFT JOIN listings l ON c.listing_id = l.id
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE 
            cp.user_id = ${userId} 
            OR l.owner_id = ${userId}
            OR m.sender_id = ${userId}
    `;
    
    const convoIds = discoveryResult.rows.map(r => r.conversation_id);

    if (convoIds.length === 0) {
        return res.status(200).json({ conversations: [] });
    }

    // --- STEP 2: SELF-HEALING (Auto-Repair) ---
    // If we found a chat via ownership/history but the 'participant' link is missing,
    // insert it now so it shows up in the inbox correctly next time.
    for (const convoId of convoIds) {
        await sql`
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (${convoId}, ${userId})
            ON CONFLICT (conversation_id, user_id) DO NOTHING
        `;
    }

    // --- STEP 3: FETCH DATA ---
    
    // Fetch Conversation Metadata
    const conversationsResult = await sql`
        SELECT id, listing_id, updated_at
        FROM conversations 
        WHERE id = ANY(${convoIds as any})
        ORDER BY updated_at DESC
    `;

    // Fetch All Messages
    const messagesResult = await sql`
        SELECT id, conversation_id, sender_id, content, created_at
        FROM messages
        WHERE conversation_id = ANY(${convoIds as any})
        ORDER BY created_at ASC
    `;

    // Fetch Participants
    // We get ALL participants for these conversations to show the other person's face
    const participantsResult = await sql`
        SELECT cp.conversation_id, cp.user_id as id, u.name, u.avatar_url
        FROM conversation_participants cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ANY(${convoIds as any})
    `;
    
    // Fetch Listings
    const listingIds = [...new Set(conversationsResult.rows.map(c => c.listing_id))].filter(id => id);
    let listingsResult = { rows: [] };
    if (listingIds.length > 0) {
        listingsResult = await sql`
            SELECT id, title, images
            FROM listings
            WHERE id = ANY(${listingIds as any})
        `;
    }

    // --- STEP 4: ASSEMBLE ---
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
