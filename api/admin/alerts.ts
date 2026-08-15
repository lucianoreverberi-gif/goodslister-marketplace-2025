import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Admin whitelist
const ADMIN_EMAILS = ['lucianoreverberi@gmail.com'];

interface Alert {
  id: string;
  type: 'dispute' | 'booking' | 'refund' | 'boost' | 'deposit' | 'fraud';
  severity: 'info' | 'warning' | 'critical';
  count: number;
  title: string;
  description: string;
  action_label: string;
  action_tab: string; // AdminTab id to navigate to
  icon: string; // emoji or lucide name
  items?: any[]; // preview of top 3 items
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminEmail = (req.query.admin_email as string || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(adminEmail)) {
    return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
  }

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const alerts: Alert[] = [];

    // ======== 1. OPEN DAMAGE DISPUTES ========
    try {
      const { rows: openDisputes } = await sql`
        SELECT id, booking_id, description, created_at, status
        FROM damage_reports
        WHERE status IN ('open', 'pending', 'disputed')
        ORDER BY created_at DESC
        LIMIT 10
      `;
      if (openDisputes.length > 0) {
        alerts.push({
          id: 'disputes-open',
          type: 'dispute',
          severity: openDisputes.length >= 3 ? 'critical' : 'warning',
          count: openDisputes.length,
          title: `${openDisputes.length} open dispute${openDisputes.length > 1 ? 's' : ''}`,
          description: 'Damage reports waiting for admin review',
          action_label: 'Review disputes',
          action_tab: 'disputes',
          icon: 'âï¸',
          items: openDisputes.slice(0, 3).map(d => ({
            id: d.id,
            booking_id: d.booking_id,
            preview: (d.description || '').substring(0, 80),
            days_old: Math.floor((now.getTime() - new Date(d.created_at).getTime()) / (24 * 60 * 60 * 1000)),
          })),
        });
      }
    } catch (e) { /* damage_reports may not exist */ }

    // ======== 2. BOOKINGS PENDING > 24h ========
    try {
      const { rows: pendingBookings } = await sql`
        SELECT id, listing_id, renter_id, total_price, created_at
        FROM bookings
        WHERE status = 'pending' AND created_at < ${twentyFourHoursAgo.toISOString()}
        ORDER BY created_at ASC
        LIMIT 10
      `;
      if (pendingBookings.length > 0) {
        alerts.push({
          id: 'bookings-stale-pending',
          type: 'booking',
          severity: pendingBookings.length >= 5 ? 'critical' : 'warning',
          count: pendingBookings.length,
          title: `${pendingBookings.length} booking${pendingBookings.length > 1 ? 's' : ''} pending >24h`,
          description: 'Bookings awaiting host confirmation â hosts may need reminder',
          action_label: 'View bookings',
          action_tab: 'bookings',
          icon: 'â³',
          items: pendingBookings.slice(0, 3).map(bk => ({
            id: bk.id,
            listing_id: bk.listing_id,
            renter_id: bk.renter_id,
            amount: parseFloat(bk.total_price) || 0,
            hours_old: Math.floor((now.getTime() - new Date(bk.created_at).getTime()) / (60 * 60 * 1000)),
          })),
        });
      }
    } catch (e) { /* bookings may not exist */ }

    // ======== 3. BOOSTS EXPIRING IN NEXT 24h ========
    try {
      const { rows: expiringSoon } = await sql`
        SELECT id, tier, listing_id, user_id, price_paid, expires_at
        FROM boosts
        WHERE status = 'active' AND expires_at IS NOT NULL 
              AND expires_at BETWEEN ${now.toISOString()} AND ${oneDayFromNow.toISOString()}
        ORDER BY expires_at ASC
        LIMIT 10
      `;
      if (expiringSoon.length > 0) {
        alerts.push({
          id: 'boosts-expiring',
          type: 'boost',
          severity: 'info',
          count: expiringSoon.length,
          title: `${expiringSoon.length} boost${expiringSoon.length > 1 ? 's' : ''} expiring in 24h`,
          description: 'Opportunity to email hosts and pitch renewal',
          action_label: 'View boosts',
          action_tab: 'boosts',
          icon: 'ð',
          items: expiringSoon.slice(0, 3).map(b => ({
            id: b.id,
            tier: b.tier,
            listing_id: b.listing_id,
            user_id: b.user_id,
            price: parseFloat(b.price_paid) || 0,
            expires_at: b.expires_at,
            hours_until: Math.floor((new Date(b.expires_at).getTime() - now.getTime()) / (60 * 60 * 1000)),
          })),
        });
      }
    } catch (e) { /* boosts may not exist */ }

    // ======== 4. DEPOSITS HELD > 7 DAYS ========
    try {
      const { rows: staleDeposits } = await sql`
        SELECT id, listing_id, renter_id, deposit_amount, created_at
        FROM bookings
        WHERE deposit_hold_status = 'held' AND created_at < ${sevenDaysAgo.toISOString()}
        ORDER BY created_at ASC
        LIMIT 10
      `;
      if (staleDeposits.length > 0) {
        alerts.push({
          id: 'deposits-stale',
          type: 'deposit',
          severity: staleDeposits.length >= 5 ? 'warning' : 'info',
          count: staleDeposits.length,
          title: `${staleDeposits.length} deposit${staleDeposits.length > 1 ? 's' : ''} held >7 days`,
          description: 'Consider releasing if no disputes filed â improves host trust',
          action_label: 'View bookings',
          action_tab: 'bookings',
          icon: 'ð°',
          items: staleDeposits.slice(0, 3).map(bk => ({
            id: bk.id,
            listing_id: bk.listing_id,
            renter_id: bk.renter_id,
            deposit: parseFloat(bk.deposit_amount) || 0,
            days_held: Math.floor((now.getTime() - new Date(bk.created_at).getTime()) / (24 * 60 * 60 * 1000)),
          })),
        });
      }
    } catch (e) { /* bookings may not exist */ }

    // ======== 5. RECENT REFUNDS (last 24h) ========
    try {
      const { rows: recentRefunds } = await sql`
        SELECT id, tier, price_paid, listing_id, user_id, created_at
        FROM boosts
        WHERE status = 'refunded' AND created_at > ${twentyFourHoursAgo.toISOString()}
        ORDER BY created_at DESC
        LIMIT 10
      `;
      if (recentRefunds.length > 0) {
        alerts.push({
          id: 'refunds-recent',
          type: 'refund',
          severity: recentRefunds.length >= 3 ? 'warning' : 'info',
          count: recentRefunds.length,
          title: `${recentRefunds.length} refund${recentRefunds.length > 1 ? 's' : ''} in last 24h`,
          description: 'Review pattern â may indicate product issues',
          action_label: 'View financials',
          action_tab: 'financials',
          icon: 'â©ï¸',
          items: recentRefunds.slice(0, 3).map(b => ({
            id: b.id,
            tier: b.tier,
            amount: parseFloat(b.price_paid) || 0,
            user_id: b.user_id,
            listing_id: b.listing_id,
            hours_ago: Math.floor((now.getTime() - new Date(b.created_at).getTime()) / (60 * 60 * 1000)),
          })),
        });
      }
    } catch (e) { /* boosts may not exist */ }

    // ======== 6. FRAUD-LIKE PATTERN: MULTIPLE FAILED PAYMENTS ========
    // Detect users with 3+ failed payment attempts in last 24h (from Stripe events would be ideal,
    // but we can track via boost pending entries that never activated)
    try {
      const { rows: manyPendingSameUser } = await sql`
        SELECT user_id, COUNT(*)::int as attempts
        FROM boosts
        WHERE status = 'pending' AND created_at > ${twentyFourHoursAgo.toISOString()}
        GROUP BY user_id
        HAVING COUNT(*) >= 3
        LIMIT 10
      `;
      if (manyPendingSameUser.length > 0) {
        alerts.push({
          id: 'fraud-multiple-pending',
          type: 'fraud',
          severity: 'critical',
          count: manyPendingSameUser.length,
          title: `${manyPendingSameUser.length} user${manyPendingSameUser.length > 1 ? 's' : ''} with 3+ failed payments`,
          description: 'Potential card testing / fraud pattern â review manually',
          action_label: 'View users',
          action_tab: 'users',
          icon: 'ð¨',
          items: manyPendingSameUser.slice(0, 3).map(u => ({
            user_id: u.user_id,
            attempts: u.attempts,
          })),
        });
      }
    } catch (e) { /* skip */ }

    // Sort by severity: critical > warning > info
    const severityOrder: any = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return res.status(200).json({
      alerts,
      total_count: alerts.length,
      critical_count: alerts.filter(a => a.severity === 'critical').length,
      warning_count: alerts.filter(a => a.severity === 'warning').length,
      info_count: alerts.filter(a => a.severity === 'info').length,
      generated_at: now.toISOString(),
    });
  } catch (e: any) {
    console.error('Alerts error:', e);
    return res.status(500).json({ error: e.message });
  }
}

