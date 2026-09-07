import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Dynamic robots.txt endpoint.
 * 
 * Production (goodslister.com): allows all crawlers.
 * Preview URLs (*.vercel.app, staging.*, etc): blocks all crawlers to prevent
 * duplicate content SEO issues.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const host = (req.headers.host || '').toLowerCase();
  
  // Production hostnames - allow full crawling
  const productionHosts = [
    'goodslister.com',
    'www.goodslister.com'
  ];
  
  const isProduction = productionHosts.includes(host);
  
  let body = '';
  
  if (isProduction) {
    // PRODUCTION - allow all crawlers
    body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /userDashboard
Disallow: /inbox
Disallow: /booking-details/
Disallow: /damage/
Disallow: /adminUserProfile

Sitemap: https://www.goodslister.com/sitemap.xml
`;
  } else {
    // PREVIEW / STAGING / VERCEL BRANCH URLS - block everything
    body = `User-agent: *
Disallow: /
`;
  }
  
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(body);
}
