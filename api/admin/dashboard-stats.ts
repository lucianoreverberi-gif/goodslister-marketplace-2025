import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Admin whitelist - only Luciano can access
const ADMIN_EMAILS = ['lucianoreverberi@gmail.com'];

interface ActivityEvent {
  id: string;
  type: 'signup' | 'listing' | 'booking' | 'boost' | 'dispute' | 'refund';
  title: string;
  subtitle: string;
  timestamp: string;
  amount?: number;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'cyan';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminEmail = (req.query.admin_email as string || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(adminEmail)) {
    return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
  }

  try {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ======== FINANCIAL AGGREGATIONS ========
    
    // Boost revenue this month vs last month
    let boostsRows: any[] = [];
    try {
      const r = await sql`
        SELECT id, tier, price_paid, status, created_at, listing_id, user_id
        FROM boosts
        ORDER BY created_at DESC
        LIMIT 500
      `;
      boostsRows = r.rows;
    } catch (e) { console.error('boosts fetch:', e); }

    let boostRevThisMonth = 0, boostRevLastMonth = 0, boostRevTotal = 0;
    for (const b of boostsRows) {
      if (b.status !== 'active' && b.status !== 'expired') continue;
      const amt = parseFloat(b.price_paid) || 0;
      const created = new Date(b.created_at);
      boostRevTotal += amt;
      if (created >= firstDayThisMonth) boostRevThisMonth += amt;
      if (created >= firstDayLastMonth && created < firstDayThisMonth) boostRevLastMonth += amt;
    }

    // Booking data
    let bookingsRows: any[] = [];
    try {
      const r = await sql`
        SELECT id, listing_id, renter_id, total_price, status, created_at, deposit_amount, deposit_hold_status
        FROM bookings
        ORDER BY created_at DESC
        LIMIT 500
      `;
      bookingsRows = r.rows;
    } catch (e) { /* table may not exist */ }

    // Transaction fee (from platform_settings)
    let transactionFeePercent = 6;
    try {
      const { rows } = await sql`SELECT transaction_fee_percent FROM platform_settings LIMIT 1`;
      if (rows[0]?.transaction_fee_percent) transactionFeePercent = parseFloat(rows[0].transaction_fee_percent);
    } catch (e) { /* skip */ }

    // GMV = sum of all completed bookings (gross merchandise value)
    let gmvTotal = 0, gmvThisMonth = 0, gmvLastMonth = 0;
    let bookingFeeThisMonth = 0, bookingFeeLastMonth = 0, bookingFeeTotal = 0;
    for (const bk of bookingsRows) {
      if (!['confirmed', 'completed', 'checked_in', 'active'].includes(bk.status)) continue;
      const total = parseFloat(bk.total_price) || 0;
      const fee = total * (transactionFeePercent / 100);
      const created = new Date(bk.created_at);
      gmvTotal += total;
      bookingFeeTotal += fee;
      if (created >= firstDayThisMonth) { gmvThisMonth += total; bookingFeeThisMonth += fee; }
      if (created >= firstDayLastMonth && created < firstDayThisMonth) { gmvLastMonth += total; bookingFeeLastMonth += fee; }
    }

    const revenueThisMonth = boostRevThisMonth + bookingFeeThisMonth;
    const revenueLastMonth = boostRevLastMonth + bookingFeeLastMonth;
    const revenueTotal = boostRevTotal + bookingFeeTotal;
    const revenueChangePct = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100) * 10) / 10
      : (revenueThisMonth > 0 ? 100 : 0);
    const gmvChangePct = gmvLastMonth > 0
      ? Math.round(((gmvThisMonth - gmvLastMonth) / gmvLastMonth * 100) * 10) / 10
      : (gmvThisMonth > 0 ? 100 : 0);

    // ======== COUNTS ========
    
    // Active listings (Postgres if exists, else 0)
    let activeListingsCount = 0;
    try {
      const r = await sql`SELECT COUNT(*)::int AS c FROM listings`;
      activeListingsCount = r.rows[0]?.c || 0;
    } catch (e) { /* table may not exist */ }

    // Open damage disputes
    let openDisputesCount = 0;
    try {
      const r = await sql`SELECT COUNT(*)::int AS c FROM damage_reports WHERE status IN ('open', 'pending', 'disputed')`;
      openDisputesCount = r.rows[0]?.c || 0;
    } catch (e) { /* table may not exist */ }

    // Active boosts count
    const activeBoostsCount = boostsRows.filter(b => b.status === 'active').length;

    // Bookings this month
    const bookingsThisMonth = bookingsRows.filter(bk => new Date(bk.created_at) >= firstDayThisMonth).length;

    // ======== ACTIVITY FEED (last 20 events from Postgres) ========
    
    const activity: ActivityEvent[] = [];

    // Recent boosts
    for (const b of boostsRows.slice(0, 10)) {
      const amt = parseFloat(b.price_paid) || 0;
      const tierName = b.tier === 'local' ? 'Local Boost' : b.tier === 'spotlight' ? 'Spotlight' : b.tier === 'regional' ? 'Regional Hero' : b.tier;
      const statusColor = b.status === 'active' ? 'cyan' : b.status === 'refunded' ? 'red' : 'yellow';
      activity.push({
        id: `boost_${b.id}`,
        type: 'boost',
        title: `${tierName} ${b.status === 'refunded' ? 'refunded' : b.status === 'active' ? 'activated' : 'pending'}`,
        subtitle: `Listing ${b.listing_id}`,
        timestamp: b.created_at,
        amount: b.status === 'refunded' ? -amt : amt,
        color: statusColor as any,
      });
    }

    // Recent bookings
    for (const bk of bookingsRows.slice(0, 10)) {
      const total = parseFloat(bk.total_price) || 0;
      const statusColor = bk.status === 'completed' ? 'green' : bk.status === 'confirmed' ? 'blue' : bk.status === 'pending' ? 'yellow' : bk.status === 'cancelled' ? 'red' : 'blue';
      activity.push({
        id: `booking_${bk.id}`,
        type: 'booking',
        title: `Booking ${bk.status}`,
        subtitle: `Listing ${bk.listing_id} - Renter ${bk.renter_id?.substring(0, 8) || 'unknown'}`,
        timestamp: bk.created_at,
        amount: total,
        color: statusColor as any,
      });
    }

    // Recent disputes
    try {
      const { rows: disputes } = await sql`
        SELECT id, booking_id, status, description, created_at, reporter_id
        FROM damage_reports
        ORDER BY created_at DESC
        LIMIT 5
      `;
      for (const d of disputes) {
        activity.push({
          id: `dispute_${d.id}`,
          type: 'dispute',
          title: `Damage report ${d.status}`,
          subtitle: `Booking #${d.booking_id}: ${(d.description || '').substring(0, 60)}${d.description?.length > 60 ? '...' : ''}`,
          timestamp: d.created_at,
          color: d.status === 'open' ? 'red' : d.status === 'resolved' ? 'green' : 'yellow',
        });
      }
    } catch (e) { /* damage_reports may not exist */ }

    // Sort activity by timestamp DESC, take top 20
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = activity.slice(0, 20);

    // ======== FUNNEL METRICS (basic - can extend later) ========
    // Signups this month (from Firestore/app-data - skip in Postgres endpoint)

    return res.status(200).json({
      kpis: {
        gmv: {
          total: Math.round(gmvTotal * 100) / 100,
          this_month: Math.round(gmvThisMonth * 100) / 100,
          last_month: Math.round(gmvLastMonth * 100) / 100,
          change_pct: gmvChangePct,
        },
        net_revenue: {
          total: Math.round(revenueTotal * 100) / 100,
          this_month: Math.round(revenueThisMonth * 100) / 100,
          last_month: Math.round(revenueLastMonth * 100) / 100,
          change_pct: revenueChangePct,
        },
        active_listings: activeListingsCount,
        active_boosts: activeBoostsCount,
        open_disputes: openDisputesCount,
        bookings_this_month: bookingsThisMonth,
        transaction_fee_percent: transactionFeePercent,
      },
      activity: recentActivity,
      generated_at: now.toISOString(),
    });
  } catch (e: any) {
    console.error('Dashboard stats error:', e);
    return res.status(500).json({ error: e.message });
  }
}

