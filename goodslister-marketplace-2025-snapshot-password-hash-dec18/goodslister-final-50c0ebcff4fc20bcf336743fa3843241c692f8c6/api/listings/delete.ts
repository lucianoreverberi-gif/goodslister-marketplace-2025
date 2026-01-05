
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
      return res.status(400).json({ error: 'Missing listing ID' });
  }

  try {
    // --- 1. Delete Dependent Bookings and their children ---
    const bookingsResult = await sql`SELECT id FROM bookings WHERE listing_id = ${id}`;
    const bookingIds = bookingsResult.rows.map(row => row.id);

    if (bookingIds.length > 0) {
        // Delete related reviews
        await sql`DELETE FROM reviews WHERE booking_id = ANY(${bookingIds as any})`;
        // Delete related inspections
        await sql`DELETE FROM inspections WHERE booking_id = ANY(${bookingIds as any})`;
        // Delete related payments
        await sql`DELETE FROM payments WHERE booking_id = ANY(${bookingIds as any})`;
        // Delete disputes
        await sql`DELETE FROM disputes WHERE booking_id = ANY(${bookingIds as any})`;
        
        // Finally delete the bookings
        await sql`DELETE FROM bookings WHERE listing_id = ${id}`;
    }

    // --- 2. Delete Dependent Conversations and their children ---
    const conversationsResult = await sql`SELECT id FROM conversations WHERE listing_id = ${id}`;
    const conversationIds = conversationsResult.rows.map(row => row.id);

    if (conversationIds.length > 0) {
        // Delete messages
        await sql`DELETE FROM messages WHERE conversation_id = ANY(${conversationIds as any})`;
        // Delete participants
        await sql`DELETE FROM conversation_participants WHERE conversation_id = ANY(${conversationIds as any})`;
        // Delete conversations
        await sql`DELETE FROM conversations WHERE listing_id = ${id}`;
    }

    // --- 3. Delete the Listing ---
    await sql`DELETE FROM listings WHERE id = ${id}`;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete listing error:', error);
    const message = error instanceof Error ? error.message : 'Unknown DB error';
    return res.status(500).json({ error: `Failed to delete listing: ${message}` });
  }
}
