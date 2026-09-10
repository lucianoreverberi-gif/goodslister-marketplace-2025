import { sql } from '@vercel/postgres';

/**
 * Internal helper for creating notifications from other endpoints.
 * Fails silently (best-effort) - never breaks the parent endpoint's flow.
 */
export type NotificationType =
  | 'booking_pending'          // Host: new booking request
  | 'booking_approved'         // Renter: host approved
  | 'booking_rejected'         // Renter: host rejected
  | 'booking_cancelled'        // Host: renter cancelled
  | 'contract_signed'          // Host: renter signed contract (check-in unlocked)
  | 'checkin_complete'         // Renter: host completed check-in
  | 'return_reminder'          // Both: return in <1hr
  | 'return_complete'          // Both: rental completed
  | 'review_received'          // Recipient: new review published
  | 'review_reminder';         // Both: leave review reminder

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string;
  listingId?: string;
  actionUrl?: string;
}

export async function createNotification(input: CreateNotificationInput): Promise<{ id?: string; error?: string }> {
  try {
    const result = await sql`
      INSERT INTO notifications (user_id, type, title, message, booking_id, listing_id, action_url)
      VALUES (${input.userId}, ${input.type}, ${input.title}, ${input.message}, ${input.bookingId || null}, ${input.listingId || null}, ${input.actionUrl || null})
      RETURNING id
    `;
    return { id: result.rows[0]?.id };
  } catch (error: any) {
    console.warn('Notification create failed (non-fatal):', error?.message);
    return { error: error?.message || 'unknown' };
  }
}
