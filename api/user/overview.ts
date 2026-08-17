import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// User overview endpoint - stats for user's own dashboard Home tab
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = (req.query.user_id as string || '').trim();
  if (!userId) {
    return res.status(400).json({ error: 'user_id required' });
  }

  try {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Transaction fee percent
    let feePercent = 6;
    try {
      const { rows } = await sql`SELECT transaction_fee_percent FROM platform_settings LIMIT 1`;
      if (rows[0]?.transaction_fee_percent) feePercent = parseFloat(rows[0].transaction_fee_percent);
    } catch (e) { /* skip */ }

    // ======== BOOKINGS AS HOST (someone rented user's listing) ========
    // Need to join bookings.listing_id -> listings.owner_id = userId
    let bookingsAsHost = { pending: 0, confirmed: 0, completed: 0, total: 0 };
    let hostEarningsThisMonth = 0, hostEarningsLastMonth = 0, hostEarningsTotal = 0;
    try {
      const { rows } = await sql`
        SELECT b.id, b.status, b.total_price, b.created_at
        FROM bookings b
        INNER JOIN listings l ON b.listing_id = l.id
        WHERE l.owner_id = ${userId}
      `;
      for (const bk of rows) {
        if (bk.status === 'pending') bookingsAsHost.pending++;
        else if (bk.status === 'confirmed' || bk.status === 'checked_in' || bk.status === 'active') bookingsAsHost.confirmed++;
        else if (bk.status === 'completed') bookingsAsHost.completed++;
        bookingsAsHost.total++;

        if (['confirmed', 'completed', 'checked_in', 'active'].includes(bk.status)) {
          const total = parseFloat(bk.total_price) || 0;
          const hostEarning = total * (1 - feePercent / 100); // host gets total minus platform fee
          const created = new Date(bk.created_at);
          hostEarningsTotal += hostEarning;
          if (created >= firstDayThisMonth) hostEarningsThisMonth += hostEarning;
          if (created >= firstDayLastMonth && created < firstDayThisMonth) hostEarningsLastMonth += hostEarning;
        }
      }
    } catch (e) { /* listings/bookings tables may not exist */ }

    // ======== BOOKINGS AS RENTER (user rented from others) ========
    let bookingsAsRenter = { pending: 0, confirmed: 0, completed: 0, total: 0 };
    try {
      const { rows } = await sql`
        SELECT id, status FROM bookings WHERE renter_id = ${userId}
      `;
      for (const bk of rows) {
        if (bk.status === 'pending') bookingsAsRenter.pending++;
        else if (bk.status === 'confirmed' || bk.status === 'checked_in' || bk.status === 'active') bookingsAsRenter.confirmed++;
        else if (bk.status === 'completed') bookingsAsRenter.completed++;
        bookingsAsRenter.total++;
      }
    } catch (e) { /* skip */ }

    // ======== ACTIVE LISTINGS ========
    let activeListings = 0;
    try {
      const { rows } = await sql`SELECT COUNT(*)::int AS c FROM listings WHERE owner_id = ${userId}`;
      activeListings = rows[0]?.c || 0;
    } catch (e) { /* skip */ }

    // ======== BOOSTS spent ========
    let boostsSpent = 0, activeBoostsCount = 0;
    try {
      const { rows } = await sql`
        SELECT status, price_paid FROM boosts WHERE user_id = ${userId}
      `;
      for (const b of rows) {
        if (['active', 'expired'].includes(b.status)) {
          boostsSpent += parseFloat(b.price_paid) || 0;
        }
        if (b.status === 'active') activeBoostsCount++;
      }
    } catch (e) { /* skip */ }

    // ======== SUPERHOST STATUS ========
    let isSuperhost = false;
    try {
      const { rows } = await sql`SELECT is_superhost FROM admin_user_flags WHERE user_id = ${userId}`;
      isSuperhost = rows[0]?.is_superhost || false;
    } catch (e) { /* table may not exist yet */ }

    // Superhost progress: goal is 10 completed bookings as host
    const superhostGoal = 10;
    const bookingsForSuperhost = bookingsAsHost.completed;
    const superhostProgress = Math.min(100, Math.round((bookingsForSuperhost / superhostGoal) * 100));
    const bookingsNeeded = Math.max(0, superhostGoal - bookingsForSuperhost);

    // ======== EARNINGS % CHANGE ========
    const earningsChangePct = hostEarningsLastMonth > 0
      ? Math.round(((hostEarningsThisMonth - hostEarningsLastMonth) / hostEarningsLastMonth * 100) * 10) / 10
      : (hostEarningsThisMonth > 0 ? 100 : 0);

    // ======== OPEN DISPUTES against user ========
    let openDisputes = 0;
    try {
      const { rows } = await sql`
        SELECT COUNT(*)::int AS c FROM damage_reports 
        WHERE reporter_id = ${userId} AND status IN ('open', 'pending', 'disputed')
      `;
      openDisputes = rows[0]?.c || 0;
    } catch (e) { /* skip */ }

    return res.status(200).json({
      user_id: userId,
      earnings: {
        this_month: Math.round(hostEarningsThisMonth * 100) / 100,
        last_month: Math.round(hostEarningsLastMonth * 100) / 100,
        total: Math.round(hostEarningsTotal * 100) / 100,
        change_pct: earningsChangePct,
      },
      bookings_as_host: bookingsAsHost,
      bookings_as_renter: bookingsAsRenter,
      listings: {
        active: activeListings,
        active_boosts: activeBoostsCount,
      },
      superhost: {
        is_superhost: isSuperhost,
        completed_bookings: bookingsForSuperhost,
        goal: superhostGoal,
        bookings_needed: bookingsNeeded,
        progress_pct: superhostProgress,
      },
      spent_on_boosts: Math.round(boostsSpent * 100) / 100,
      open_disputes: openDisputes,
      transaction_fee_percent: feePercent,
      generated_at: now.toISOString(),
    });
  } catch (e: any) {
    console.error('user-overview error:', e);
    return res.status(500).json({ error: e.message });
  }
}

