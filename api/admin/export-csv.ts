import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Admin CSV export endpoint
// GET ?type=bookings|financials|users|listings|boosts&admin_email=X
// Returns text/csv with Content-Disposition attachment

const ADMIN_EMAILS = ['lucianoreverberi@gmail.com'];

function toCSV(rows: any[], columns: string[]): string {
  const header = columns.join(',');
  const lines = rows.map(r => columns.map(c => {
    const v = r[c];
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    // Escape CSV: wrap in quotes if contains comma/quote/newline
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(','));
  return [header, ...lines].join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const adminEmail = (req.query.admin_email as string || '').toLowerCase();
    if (!ADMIN_EMAILS.includes(adminEmail)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const type = (req.query.type as string || 'bookings').toLowerCase();
    const now = new Date().toISOString().slice(0, 10);
    let csv = '';
    let filename = '';

    if (type === 'bookings') {
      const { rows } = await sql`
        SELECT b.id, b.listing_id, b.renter_id, b.status, b.total_price, b.deposit_amount, 
               b.stripe_payment_intent_id, b.created_at, b.start_date, b.end_date,
               l.title AS listing_title, l.owner_id AS host_id
        FROM bookings b
        LEFT JOIN listings l ON b.listing_id = l.id
        ORDER BY b.id DESC LIMIT 5000
      `;
      csv = toCSV(rows, ['id', 'created_at', 'start_date', 'end_date', 'status', 'listing_id', 'listing_title', 'host_id', 'renter_id', 'total_price', 'deposit_amount', 'stripe_payment_intent_id']);
      filename = `goodslister-bookings-${now}.csv`;
    }
    else if (type === 'financials') {
      // Fetch transaction fee percent
      let feePercent = 6;
      try {
        const { rows: r } = await sql`SELECT transaction_fee_percent FROM platform_settings LIMIT 1`;
        if (r[0]?.transaction_fee_percent) feePercent = parseFloat(r[0].transaction_fee_percent);
      } catch (e) {}
      
      const { rows: bookings } = await sql`
        SELECT id, total_price, status, created_at, listing_id, renter_id
        FROM bookings WHERE status IN ('confirmed', 'completed', 'active', 'checked_in')
        ORDER BY id DESC LIMIT 5000
      `;
      const { rows: boosts } = await sql`
        SELECT id, user_id, tier, price_paid, status, created_at
        FROM boosts WHERE status IN ('active', 'expired')
        ORDER BY id DESC LIMIT 5000
      `;
      
      const entries: any[] = [];
      for (const b of bookings) {
        const total = parseFloat(b.total_price) || 0;
        const fee = total * (feePercent / 100);
        entries.push({
          date: b.created_at,
          type: 'booking_fee',
          gross_amount: total.toFixed(2),
          platform_fee: fee.toFixed(2),
          host_earning: (total - fee).toFixed(2),
          reference_id: b.id,
          description: `Booking #${b.id} (listing ${b.listing_id})`
        });
      }
      for (const b of boosts) {
        entries.push({
          date: b.created_at,
          type: 'boost_revenue',
          gross_amount: parseFloat(b.price_paid || 0).toFixed(2),
          platform_fee: parseFloat(b.price_paid || 0).toFixed(2),
          host_earning: '0.00',
          reference_id: b.id,
          description: `Boost ${b.tier} by user ${b.user_id}`
        });
      }
      // Sort by date desc
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      csv = toCSV(entries, ['date', 'type', 'gross_amount', 'platform_fee', 'host_earning', 'reference_id', 'description']);
      filename = `goodslister-financials-${now}.csv`;
    }
    else if (type === 'users') {
      const { rows: users } = await sql`
        SELECT DISTINCT owner_id AS user_id FROM listings
        UNION SELECT DISTINCT renter_id FROM bookings
        UNION SELECT DISTINCT user_id FROM boosts
      `;
      
      const { rows: listingCounts } = await sql`SELECT owner_id, COUNT(*)::int AS c FROM listings GROUP BY owner_id`;
      const listingsMap: any = {};
      for (const r of listingCounts) listingsMap[r.owner_id] = r.c;
      
      const { rows: bookingCounts } = await sql`
        SELECT b.renter_id, COUNT(*)::int AS bookings_count, SUM(b.total_price)::float AS ltv
        FROM bookings b WHERE b.status IN ('confirmed', 'completed', 'active', 'checked_in')
        GROUP BY b.renter_id
      `;
      const bookingsMap: any = {};
      for (const r of bookingCounts) bookingsMap[r.renter_id] = { bookings: r.bookings_count, ltv: r.ltv };
      
      const { rows: hostBookings } = await sql`
        SELECT l.owner_id, COUNT(b.id)::int AS c
        FROM bookings b JOIN listings l ON b.listing_id = l.id
        WHERE b.status IN ('confirmed', 'completed', 'active', 'checked_in')
        GROUP BY l.owner_id
      `;
      const hostBookingsMap: any = {};
      for (const r of hostBookings) hostBookingsMap[r.owner_id] = r.c;
      
      const { rows: flags } = await sql`SELECT user_id, is_superhost FROM admin_user_flags`.catch(() => ({ rows: [] as any[] })) as any;
      const flagsMap: any = {};
      for (const r of (flags || [])) flagsMap[r.user_id] = { is_superhost: r.is_superhost };
      
      const enriched = users.filter(u => u.user_id).map(u => ({
        user_id: u.user_id,
        listings_count: listingsMap[u.user_id] || 0,
        bookings_as_host: hostBookingsMap[u.user_id] || 0,
        bookings_as_renter: bookingsMap[u.user_id]?.bookings || 0,
        ltv: (bookingsMap[u.user_id]?.ltv || 0).toFixed(2),
        is_superhost: flagsMap[u.user_id]?.is_superhost || false
      }));
      csv = toCSV(enriched, ['user_id', 'listings_count', 'bookings_as_host', 'bookings_as_renter', 'ltv', 'is_superhost']);
      filename = `goodslister-users-${now}.csv`;
    }
    else if (type === 'listings') {
      const { rows } = await sql`
        SELECT id, title, category, subcategory, price_per_day, price_per_hour, pricing_type, 
               location_city, location_state, owner_id, moderation_status, moderation_rejection_reason
        FROM listings ORDER BY id DESC LIMIT 5000
      `;
      csv = toCSV(rows, ['id', 'title', 'category', 'subcategory', 'price_per_day', 'price_per_hour', 'pricing_type', 'location_city', 'location_state', 'owner_id', 'moderation_status', 'moderation_rejection_reason']);
      filename = `goodslister-listings-${now}.csv`;
    }
    else if (type === 'boosts') {
      const { rows } = await sql`
        SELECT id, user_id, listing_id, tier, price_paid, status, stripe_checkout_session_id, 
               stripe_payment_intent_id, created_at, activated_at, expires_at, views_count, inquiries_count
        FROM boosts ORDER BY id DESC LIMIT 5000
      `;
      csv = toCSV(rows, ['id', 'created_at', 'user_id', 'listing_id', 'tier', 'price_paid', 'status', 'activated_at', 'expires_at', 'views_count', 'inquiries_count', 'stripe_payment_intent_id']);
      filename = `goodslister-boosts-${now}.csv`;
    }
    else {
      return res.status(400).json({ error: 'type must be bookings|financials|users|listings|boosts' });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (e: any) {
    console.error('export-csv error:', e);
    return res.status(500).json({ error: e.message });
  }
}

