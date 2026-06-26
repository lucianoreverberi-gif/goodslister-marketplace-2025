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

// Calls Gemini and returns parsed JSON (when responseMimeType is json) or raw text.
async function callGemini(
  apiKey: string,
  prompt: string,
  expectJson: boolean,
): Promise<{ ok: true; json?: any; text?: string; status?: undefined } | { ok: false; status: number }> {
  const model = 'gemini-2.5-flash';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const generationConfig: Record<string, unknown> = {
    temperature: 0.7,
    maxOutputTokens: 1024,
  };
  if (expectJson) generationConfig.responseMimeType = 'application/json';

  const geminiResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  if (!geminiResponse.ok) {
    const err = await geminiResponse.text();
    console.error('Gemini API error:', err);
    return { ok: false, status: 502 };
  }

  const data = await geminiResponse.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (expectJson) {
    let parsed: any;
    try {
      parsed = JSON.parse(text || '{}');
    } catch {
      parsed = { raw: text };
    }
    return { ok: true, json: parsed };
  }

  return { ok: true, text };
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  if (!apiKey) {
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

  try {
    switch (action) {
      // 1) Natural-language search -> { criteria }
      case 'search': {
        const prompt = `You are a search assistant for an adventure gear rental marketplace called Goodslister.
Parse this natural language search query and return ONLY a JSON object with optional filter criteria.
Query: "${payload.query}"
Return JSON only with these optional fields: { "category": string, "location": string, "text": string }
Valid categories: boats, kayaks, jetskis, atv, camping, fishing, watersports, snow, bikes, motorcycles, rvs`;
        const r = await callGemini(apiKey, prompt, true);
        if (!r.ok) return response.status(r.status).json({ error: 'AI service error' });
        return response.status(200).json({ criteria: r.json || {} });
      }

      // 2) Generate listing description -> { description, sources }
      case 'generate': {
        const prompt = `You are a listing description writer for Goodslister, an adventure gear rental marketplace.
Write a compelling, honest, 2-3 sentence rental listing description.
Title: "${payload.title || ''}"
Location: "${payload.location || ''}"
Features: ${(payload.features || []).join(', ')}
Return ONLY JSON: { "description": string }`;
        const r = await callGemini(apiKey, prompt, true);
        if (!r.ok) return response.status(r.status).json({ error: 'AI service error' });
        const description = (r.json && (r.json.description ?? r.json.raw)) || '';
        return response.status(200).json({ description, sources: [] });
      }

      // 3) General advice (contract / insurance / payment / consultation) -> { advice }
      case 'advice': {
        const prompt = `You are a rental advice assistant for Goodslister, an adventure gear rental marketplace in Florida.
Topic: ${payload.topic || 'general'}
Item type: ${payload.itemType || ''}
Item description: ${payload.itemDescription || ''}
Location: ${payload.location || ''}
${payload.userQuestion ? `User question: ${payload.userQuestion}` : ''}
Provide brief, practical, friendly advice in 2-4 sentences. Plain text only, no markdown.`;
        const r = await callGemini(apiKey, prompt, false);
        if (!r.ok) return response.status(r.status).json({ error: 'AI service error' });
        return response.status(200).json({ advice: (r.text || '').trim() });
      }

      // 4) Listing-specific advice (improvement / pricing / promotion) -> { advice }
      case 'listingAdvice': {
        const prompt = `You are a listing optimization assistant for Goodslister marketplace.
Advice type requested: ${payload.adviceType || 'improvement'}
Listing data: ${JSON.stringify(payload.listing || {})}
Give specific, actionable ${payload.adviceType || 'improvement'} advice in 2-4 sentences. Plain text only, no markdown.`;
        const r = await callGemini(apiKey, prompt, false);
        if (!r.ok) return response.status(r.status).json({ error: 'AI service error' });
        return response.status(200).json({ advice: (r.text || '').trim() });
      }

      // 5/6/7) Text transforms -> { text }
      case 'improve':
      case 'shorten':
      case 'expand': {
        const instruction =
          action === 'improve'
            ? 'Improve the writing quality, grammar and appeal while keeping the same meaning and approximate length.'
            : action === 'shorten'
            ? 'Make it more concise while keeping the key information.'
            : 'Expand it with a bit more useful, relevant detail without inventing facts.';
        const prompt = `You are an editor for rental listing descriptions on Goodslister.
${instruction}
Return ONLY the resulting text, with no preamble, quotes or markdown.
Text: "${payload.text || ''}"`;
        const r = await callGemini(apiKey, prompt, false);
        if (!r.ok) return response.status(r.status).json({ error: 'AI service error' });
        return response.status(200).json({ text: (r.text || '').trim() });
      }

      // 8) Translate -> { translatedText }
      case 'translate': {
        const prompt = `Translate the following text from ${payload.sourceLang || 'auto'} to ${payload.targetLang || 'English'}.
Return ONLY the translated text, with no preamble, quotes or markdown.
Text: "${payload.text || ''}"`;
        const r = await callGemini(apiKey, prompt, false);
        if (!r.ok) return response.status(r.status).json({ error: 'AI service error' });
        return response.status(200).json({ translatedText: (r.text || '').trim() });
      }

      default:
        return response.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('AI assistant error:', error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
