import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory rate limiter: 15 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 15;
const WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
        return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
    return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

// Clean up old entries periodically to avoid memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
          if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
}, WINDOW_MS * 5);

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
  ) {
    if (request.method !== 'POST') {
          return response.status(405).json({ error: 'Method not allowed' });
    }

  if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
        return response.status(503).json({ error: 'AI service not configured' });
  }

  // Rate limiting by IP
  const ip =
        (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        request.socket?.remoteAddress ||
        'unknown';

  const { allowed, remaining } = checkRateLimit(ip);

  response.setHeader('X-RateLimit-Limit', RATE_LIMIT.toString());
    response.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (!allowed) {
        return response.status(429).json({
                error: 'Too many requests. Please wait a minute before trying again.',
        });
  }

  const { action, ...payload } = request.body || {};

  if (!action) {
        return response.status(400).json({ error: 'Missing action field' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const model = 'gemini-2.0-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
        let prompt = '';

      switch (action) {
        case 'search':
                  prompt = `You are a search assistant for an adventure gear rental marketplace called Goodslister.
                  Parse this natural language search query and return a JSON object with filter criteria.
                  Query: "${payload.query}"
                  Return JSON only with these optional fields: { category, location, text }
                  Valid categories: boats, kayaks, jetskis, atv, camping, fishing, watersports, snow, bikes`;
                  break;

        case 'generate':
                  prompt = `You are a listing description writer for Goodslister, an adventure gear rental marketplace.
                  Write a compelling, honest, 2-3 sentence rental listing description.
                  Title: "${payload.title}"
                  Location: "${payload.location}"
                  Features: ${(payload.features || []).join(', ')}
                  Return JSON only: { description: string, sources: [] }`;
                  break;

        case 'advice':
                  prompt = `You are a rental advice assistant for Goodslister marketplace.
                  Topic: ${payload.topic}
                  Listing: ${JSON.stringify(payload.listing || {})}
                  Provide brief, practical advice in 2-3 sentences.
                  Return JSON only: { advice: string }`;
                  break;

        case 'chat':
                  prompt = `You are a helpful assistant for Goodslister, an adventure gear rental marketplace in Florida.
                  Answer this user question briefly and helpfully: "${payload.message}"
                  Return JSON only: { reply: string }`;
                  break;

        default:
                  return response.status(400).json({ error: `Unknown action: ${action}` });
      }

      const geminiResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                                    temperature: 0.7,
                                    maxOutputTokens: 512,
                                    responseMimeType: 'application/json',
                        },
              }),
      });

      if (!geminiResponse.ok) {
              const err = await geminiResponse.text();
              console.error('Gemini API error:', err);
              return response.status(502).json({ error: 'AI service error' });
      }

      const data = await geminiResponse.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      let parsed: Record<string, unknown>;
        try {
                parsed = JSON.parse(text);
        } catch {
                parsed = { raw: text };
        }

      return response.status(200).json(parsed);
  } catch (error) {
        console.error('AI assistant error:', error);
        return response.status(500).json({ error: 'Internal server error' });
  }
}
