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
        // Neural Search v2 - bilingual, extracts dates, prices, capacity, subcategory
        const now = new Date();
        const todayISO = now.toISOString().split('T')[0];
        const dayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday
        const prompt = `You are a search parser for Goodslister, a peer-to-peer adventure gear rental marketplace based in Florida, USA.

Today is ${todayISO} (day of week: ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek]}).

Parse this user search query (may be in English or Spanish) and return ONLY a JSON object with the extracted filter criteria.

Query: "${payload.query}"

VALID CATEGORIES (use these EXACT English strings, never translate):
- "Water Sports" (for kayaks, kayak, canoe, jet ski, jetski, paddleboard, SUP, surf, kitesurf, windsurf, snorkel, dive, bote inflable)
- "Boats" (for boat, boats, yacht, yates, bote, barco, pontoon, sailboat, velero)
- "Fishing" (for fishing gear, fishing rod, caña de pescar, pesca, aparejos)
- "Camping" (for tent, tenda, carpa, sleeping bag, camping gear, acampar)
- "ATVs & UTVs" (for atv, quad, cuatriciclo, side-by-side, buggy)
- "Motorcycles" (for motorcycle, moto, bike (only motorized), harley, scooter)
- "Bikes" (for bicycle, bici, mountain bike, e-bike, road bike)
- "RVs" (for rv, motorhome, casa rodante, camper van, van)
- "Winter Sports" (for ski, snowboard, esquí, snow — rare in FL)

SUBCATEGORIES (return in English, must fit within the parent category):
- Under Water Sports: "Kayak", "Jet Ski", "Paddleboard", "Surf", "Snorkel"
- Under Boats: "Yacht", "Pontoon", "Sailboat", "Fishing Boat"
- Under Fishing: "Rod & Reel", "Fly Fishing", "Deep Sea"
- Under Camping: "Tent", "Sleeping Gear", "Cooking"
- Under Motorcycles: "Sport", "Cruiser", "Scooter"
- Under Bikes: "Mountain", "Road", "E-Bike"
- Return null if uncertain.

LOCATION extraction:
- Recognize Florida cities: Miami, Miami Beach, Fort Lauderdale, West Palm Beach, Boca Raton, Pembroke Pines, Key West, Tampa, Orlando, Naples, Sarasota, Jacksonville, Homestead, Coral Gables, Hollywood, Delray Beach.
- Return the exact English city name string, or null.

DATE parsing (return ISO YYYY-MM-DD strings):
- "today", "hoy" -> dateFrom = today, dateTo = today
- "tomorrow", "mañana" -> both = today + 1
- "this weekend", "fin de semana", "el finde", "sábado" (if today is Mon-Fri, next Saturday; if today is Sat, today) -> dateFrom = upcoming Saturday, dateTo = upcoming Sunday
- "next weekend", "próximo fin de semana" -> +7 from this-weekend
- "next week", "la próxima semana" -> dateFrom = next Monday, dateTo = next Sunday
- Specific day names: "sat", "sábado", "monday", "lunes" -> the next occurrence (>=today)
- "next 3 days", "los próximos 3 días" -> today to today+3
- If no date mentioned, omit dateFrom/dateTo entirely.

PRICE sensitivity (map to priceMax numeric USD):
- "cheap", "barato", "económico", "affordable", "budget" -> priceMax: 75
- "mid-range", "mid range", "moderate" -> priceMax: 200
- "premium", "luxury", "high-end", "lujo" -> omit priceMax (no max)
- Specific "under $X" or "menos de $X" -> priceMax: X
- If no price mention, omit priceMax.

CAPACITY (number of people, extract integer):
- "for 4 people", "para 4 personas", "4 pax", "4 pers" -> capacity: 4
- "for two", "para dos", "para pareja", "for a couple" -> capacity: 2
- "for a group", "for a big group", "para grupo grande" -> capacity: 6
- "solo", "individual", "single" -> capacity: 1
- If no capacity mention, omit.

MIN RATING:
- "top rated", "best rated", "los mejores", "mejor calificados" -> minRating: 4.5
- "4 stars or more", "4+ stars" -> minRating: 4
- Otherwise omit.

TEXT (fallback):
- Any remaining descriptive words that don't fit above (e.g., item names, brand hints, "with captain", "con captain", "instant book").
- Keep original language.
- Omit if empty.

Return ONLY valid JSON with omitted fields excluded. Example:
{ "category": "Water Sports", "subcategory": "Kayak", "location": "Miami Beach", "dateFrom": "2026-09-05", "dateTo": "2026-09-06", "priceMax": 75, "capacity": 2 }`;
        const r = await callGemini(apiKey, prompt, true);
        if (!r.ok) return response.status(r.status).json({ error: 'AI service error' });
        return response.status(200).json({ criteria: r.json || {} });
      }

      // 2) Generate listing description -> { description, sources }
      case 'generate': {
        const ctx = payload.context || {};
        const isExperience = ctx.listingType === 'experience';
        const prompt = `You are an expert copywriter for Goodslister, a peer-to-peer adventure gear rental marketplace in Florida.

Write a compelling, conversion-optimized rental listing description in ENGLISH.

CONTEXT:
- Title: "${payload.title || ''}"
- Location: "${payload.location || ''}"
- Category: ${ctx.category || 'general'}${ctx.subcategory ? ' / ' + ctx.subcategory : ''}
- Listing Type: ${isExperience ? 'EXPERIENCE (guided tour/activity)' : 'RENTAL (self-service equipment rental)'}
${ctx.brand ? '- Brand: ' + ctx.brand : ''}
${ctx.model ? '- Model: ' + ctx.model : ''}
- Key Features: ${(payload.features || []).filter(Boolean).join(' | ') || 'none provided'}

STRUCTURE (write as flowing prose, NOT bullet points):
1. HOOK: Open with an evocative 1-sentence hook that paints the experience (sunset paddle, adrenaline rush, family adventure). Match the tone to the category.
2. WHAT IT IS: 1-2 sentences describing the item/experience concretely — mention brand/model if provided, key specs, capacity, condition.
3. WHO IT'S FOR: 1 sentence naming the ideal user (beginners, families, thrill-seekers, groups of 4, etc.).
4. LOCATION HOOK: 1 sentence tying it to what makes ${payload.location || 'the area'} special (weather, scenery, launch spots, proximity).
5. CTA: 1 closing sentence inviting the booking with a friendly, confident tone.

RULES:
- Length: 100-180 words (4-6 sentences total).
- Tone: warm, confident, honest — like a knowledgeable local friend. NEVER salesy or hyperbolic.
- Use 1-2 relevant emojis MAX (only if they fit naturally — e.g., 🌊 for water, 🏔️ for mountains, 🚤 for boats). Skip entirely for professional categories (vehicles, RVs).
- SEO: naturally include the category/subcategory and location name.
- NO markdown, NO headers, NO bullet points — flowing prose only.
- NO invented specs, warranties, or claims. If a detail is not provided, don't fabricate.
- NO price mentions (that's shown separately).
- Write in English regardless of location.

Return ONLY valid JSON: { "description": string }`;
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
