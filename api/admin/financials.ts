import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Admin whitelist - only Luciano can access
const ADMIN_EMAILS = ['lucianoreverberi@gmail.com'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminEmail = (req.query.admin_email as string || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(adminEmail)) {
    return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
  }

  try {
    // Get transaction fee percent from platform_settings
    let transactionFeePercent = 10;
    try {
      const { rows: settingsRows } = await sql`SELECT transaction_fee_percent FROM platform_settings LIMIT 1`;
      if (settingsRows[0]?.transaction_fee_percent) {
        transactionFeePercent = parseFloat(settingsRows[0].transaction_fee_percent);
      }
    } catch (e) { /* table may not exist yet */ }

    // Fetch all boosts with listing + user info
    let boostsRows: any[] = [];
    try {
      const r = await sql`
        SELECT 
          b.id, b.tier, b.price_paid, b.status, b.created_at,
          b.stripe_checkout_session_id,
          listing_id, user_id, NULL as listing_title, NULL as user_name FROM boosts
        ORDER BY b.created_at DESC
      `;
      boostsRows = r.rows;
    } catch (e) { console.error('boosts fetch:', e); }

    // Fetch bookings for transaction fee revenue
    let bookingsRows: any[] = [];
    try {
      const r = await sql`
        SELECT 
          id, listing_id, renter_id, total_price, status, created_at,
          deposit_amount, deposit_hold_status
        FROM bookings
        WHERE status IN ('confirmed', 'completed', 'checked_in', 'active')
        ORDER BY created_at DESC
        LIMIT 200
      `;
      bookingsRows = r.rows;
    } catch (e) { /* table may not exist yet */ }

    // Calculate date boundaries
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Boost revenue aggregation
    let boostRevenueTotal = 0, boostRevenueThisMonth = 0, boostRevenueLastMonth = 0;
    let boostRefundsTotal = 0, boostRefundsThisMonth = 0;
    for (const b of boostsRows) {
      const created = new Date(b.created_at);
      const amount = parseFloat(b.price_paid) || 0;
      if (b.status === 'active' || b.status === 'expired') {
        boostRevenueTotal += amount;
        if (created >= firstDayThisMonth) boostRevenueThisMonth += amount;
        if (created >= firstDayLastMonth && created < firstDayThisMonth) boostRevenueLastMonth += amount;
      } else if (b.status === 'refunded') {
        boostRefundsTotal += amount;
        if (created >= firstDayThisMonth) boostRefundsThisMonth += amount;
      }
    }

    // Booking transaction fee revenue
    let bookingRevenueTotal = 0, bookingRevenueThisMonth = 0, bookingRevenueLastMonth = 0;
    let depositsHeld = 0;
    for (const bk of bookingsRows) {
      const created = new Date(bk.created_at);
      const total = parseFloat(bk.total_price) || 0;
      const fee = total * (transactionFeePercent / 100);
      bookingRevenueTotal += fee;
      if (created >= firstDayThisMonth) bookingRevenueThisMonth += fee;
      if (created >= firstDayLastMonth && created < firstDayThisMonth) bookingRevenueLastMonth += fee;
      if (bk.deposit_hold_status === 'held') {
        depositsHeld += parseFloat(bk.deposit_amount) || 0;
      }
    }

    const totalRevenue = boostRevenueTotal + bookingRevenueTotal;
    const totalThisMonth = boostRevenueThisMonth + bookingRevenueThisMonth;
    const totalLastMonth = boostRevenueLastMonth + bookingRevenueLastMonth;
    const netRevenue = totalRevenue - boostRefundsTotal;
    const changePct = totalLastMonth > 0 
      ? ((totalThisMonth - totalLastMonth) / totalLastMonth * 100) 
      : (totalThisMonth > 0 ? 100 : 0);

    // Chart data: last 6 months
    const chartMonths: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
      const monthStart = d;
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    let boostRev = 0, bookingRev = 0;
      for (const b of boostsRows) {
        const c = new Date(b.created_at);
        if (c >= monthStart && c < monthEnd && (b.status === 'active' || b.status === 'expired')) {
          boostRev += parseFloat(b.price_paid) || 0;
        }
      }
      for (const bk of bookingsRows) {
        const c = new Date(bk.created_at);
        if (c >= monthStart && c < monthEnd) {
          bookingRev += (parseFloat(bk.total_price) || 0) * (transactionFeePercent / 100);
        }
      }
      chartMonths.push({ month: monthKey, label: monthLabel, boost: Math.round(boostRev * 100) / 100, booking: Math.round(bookingRev * 100) / 100, total: Math.round((boostRev + bookingRev) * 100) / 100 });
    }

    // Build unified ledger
    const ledger: any[] = [];
    const tierNames: any = { local: 'Local Boost', spotlight: 'Spotlight', regional: 'Regional Hero' };
    for (const b of boostsRows) {
      const isRefund = b.status === 'refunded';
      ledger.push({
        id: `boost_${b.id}`,
        date: b.created_at,
        category: 'BOOST',
        description: `${tierNames[b.tier] || b.tier} - ${b.listing_title || 'Listing'}`,
        amount: isRefund ? -Math.abs(parseFloat(b.price_paid) || 0) : (parseFloat(b.price_paid) || 0),
        status: (b.status || 'unknown').toUpperCase(),
        user: b.user_name || 'Unknown',
      });
    }
    for (const bk of bookingsRows) {
      const total = parseFloat(bk.total_price) || 0;
      const fee = total * (transactionFeePercent / 100);
      ledger.push({
        id: `booking_${bk.id}`,
        date: bk.created_at,
        category: 'BOOKING FEE',
        description: `Transaction fee (${transactionFeePercent}%) - Booking #${bk.id}`,
        amount: fee,
        status: (bk.status || 'unknown').toUpperCase(),
        user: bk.renter_id || 'Unknown',
      });
      if (bk.deposit_amount && bk.deposit_hold_status === 'held') {
        ledger.push({
          id: `deposit_${bk.id}`,
          date: bk.created_at,
          category: 'DEPOSIT',
          description: `Security deposit hold - Booking #${bk.id}`,
          amount: parseFloat(bk.deposit_amount) || 0,
          status: 'HELD',
          user: bk.renter_id || 'Unknown',
        });
      }
    }
    ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.status(200).json({
      kpis: {
        revenue_total: Math.round(totalRevenue * 100) / 100,
        revenue_this_month: Math.round(totalThisMonth * 100) / 100,
        revenue_last_month: Math.round(totalLastMonth * 100) / 100,
        revenue_change_pct: Math.round(changePct * 10) / 10,
        boost_revenue: Math.round(boostRevenueTotal * 100) / 100,
        booking_revenue: Math.round(bookingRevenueTotal * 100) / 100,
        refunds_total: Math.round(boostRefundsTotal * 100) / 100,
        refunds_this_month: Math.round(boostRefundsThisMonth * 100) / 100,
        net_revenue: Math.round(netRevenue * 100) / 100,
        deposits_held: Math.round(depositsHeld * 100) / 100,
        transaction_fee_percent: transactionFeePercent,
      },
      chart: chartMonths,
      ledger: ledger.slice(0, 200),
      generated_at: now.toISOString(),
    });
  } catch (e: any) {
    console.error('Financials error:', e);
    return res.status(500).json({ error: e.message, stack: e.stack?.substring(0, 500) });
  }
}

