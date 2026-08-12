import type { VercelRequest, VercelResponse } from '@vercel/node';

// Cache IP lookups in-memory per Vercel invocation to reduce ipapi.co usage
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return String(req.socket?.remoteAddress || '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Allow explicit IP for testing via query, else use client IP
    const ip = String(req.query.ip || getClientIp(req));

    // Skip lookup for local/private IPs; return default (Miami)
    if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return res.status(200).json({
        success: true,
        source: 'fallback',
        location: {
          city: 'Miami',
          state: 'FL',
          country: 'United States',
          countryCode: 'US',
          latitude: 25.7617,
          longitude: -80.1918
        }
      });
    }

    // Check cache
    const cached = cache.get(ip);
    if (cached && Date.now() - cached.timestamp < CACHE_MS) {
      return res.status(200).json({ success: true, source: 'cache', location: cached.data });
    }

    // Call ipapi.co (free tier: 30k req/day, no auth needed)
    const apiRes = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      headers: { 'User-Agent': 'goodslister.com' }
    });
    if (!apiRes.ok) {
      throw new Error(`ipapi returned ${apiRes.status}`);
    }
    const data = await apiRes.json();
    if (data.error) {
      throw new Error(data.reason || 'ipapi error');
    }

    const location = {
      city: data.city || 'Unknown',
      state: data.region || '',
      country: data.country_name || '',
      countryCode: data.country_code || '',
      latitude: typeof data.latitude === 'number' ? data.latitude : parseFloat(data.latitude),
      longitude: typeof data.longitude === 'number' ? data.longitude : parseFloat(data.longitude)
    };

    // Cache and return
    cache.set(ip, { data: location, timestamp: Date.now() });
    return res.status(200).json({ success: true, source: 'ipapi', location });
  } catch (error) {
    console.error('Geo IP error:', error);
    // Fallback to Miami on any error - never fail the request
    return res.status(200).json({
      success: true,
      source: 'fallback-error',
      error: error instanceof Error ? error.message : 'Unknown',
      location: {
        city: 'Miami',
        state: 'FL',
        country: 'United States',
        countryCode: 'US',
        latitude: 25.7617,
        longitude: -80.1918
      }
    });
  }
}
