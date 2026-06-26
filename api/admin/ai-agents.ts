import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const ADMIN_EMAIL = 'lucianoreverberi@gmail.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { admin_email, action, data } = req.body;

  if (admin_email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Unauthorized admin access' });
  }

  try {
    if (action === 'get_listings') {
      const { rows } = await sql`SELECT id, title, description, price, category FROM listings ORDER BY created_at DESC`;
      return res.status(200).json({ listings: rows });
    }

    if (action === 'scam_check') {
      const { title, description, price, category } = data;
      const prompt = `Analyze this marketplace listing for potential scams or fraud:
Title: ${title}
Category: ${category}
Price: $${price}
Description: ${description}

Provide a JSON object with:
{
  "riskScore": number (0-100 indicating fraud risk),
  "isScam": boolean,
  "reasons": ["string describing red flags or concerns (e.g., price too low, sketchy language, etc.)"],
  "verdict": "string summarizing evaluation professionally, using positive framing for enabling rather than censoring",
  "recommendedAction": "string (e.g. Approve, Flag for Review, or Block)"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are the Goodslister Security Officer. Analyze listings for scam risks. Use an enabling, encouraging tone when suggesting host updates.'
        }
      });

      const result = JSON.parse(response.text?.trim() || '{}');
      return res.status(200).json({ result });
    }

    if (action === 'chat_audit') {
      const { conversation } = data;
      const prompt = `Audit the following chat messages between renter and host for off-platform payment attempts, contact sharing, or potential fraud rules bypass. 
Goodslister rules require all communication and security deposit holds to occur within the platform to maintain the "Smart Legal Shield" protection and insurance waivers.

Conversation text/log:
${conversation}

Provide a JSON object with:
{
  "violatesRules": boolean,
  "detectedPatterns": ["string describing specific bypass patterns found (e.g., phone number, Zelle suggestion)"],
  "confidence": "Low" | "Medium" | "High",
  "explain": "string brief explanation",
  "mediationSuggestion": "string warning or helpful coaching suggesting they stay on the platform. Remind them of our waivers, Digital Inspector, and deposit benefits to protect themselves."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are Goodslister Rule Safeguard Agent. Analyze chats for off-platform bypass. Remind hosts enthusiastically of their benefits (like Liability Waivers, Digital Inspector, and safety deposit safeguards).'
        }
      });

      const result = JSON.parse(response.text?.trim() || '{}');
      return res.status(200).json({ result });
    }

    if (action === 'dispute_mediate') {
      const { disputeTitle, disputeDetails, renterClaim, hostClaim, depositAmount } = data;
      const prompt = `Act as an Expert Dispute Mediator for Goodslister.
We need to mediate a security deposit or damage dispute using Goodslister's built-in solutions:
- Liability Waiver (Signed via Smart Legal Shield)
- Security Deposit (Funds held on card)
- Digital Inspector (Before/After photos with GPS timestamps)

Dispute Context:
Title/Issue: ${disputeTitle}
Details: ${disputeDetails}
Renter Statement: ${renterClaim}
Host Statement: ${hostClaim}
Security Deposit amount: $${depositAmount}

Formulate a fair resolution report that protects the Host while keeping both parties satisfied, leveraging Goodslister's evidence (Digital Inspector photos) and safety deposits.

Provide a JSON object with:
{
  "proposedDistribution": { "host_gets": number, "renter_refund": number },
  "justification": "string justifying the allocation using Digital Inspector evidence and signed liability waiver rules",
  "coachingEmailHost": "string email body to host, encouraging and empowering (e.g. thanking them for using the Digital Inspector 'Smart move! It saved the day', reassuring them)",
  "coachingEmailRenter": "string polite, objective email to renter explaining the decision based on GPS-timestamped photographic proof"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are the Dispute Resolution Coach on Goodslister. Help host resolve claims. Be empowering and enthusiastic about the host’s smart protection choices.'
        }
      });

      const result = JSON.parse(response.text?.trim() || '{}');
      return res.status(200).json({ result });
    }

    if (action === 'generate_marketing') {
      const { title, description, price, category, focusKeyword } = data;
      const prompt = `You are the marketing manager for Goodslister. Generate compelling promotional copies for this listing:
Title: ${title}
Description: ${description}
Price: $${price}
Category: ${category}
Selected focus keyword/theme: ${focusKeyword || 'adventure'}

Generate content exactly matching this JSON schema:
{
  "instagram": {
    "caption": "string (with eye-catching emojis, calls to action, and hashtags like #Goodslister #Bareboat #RentalSuccess)",
    "hook": "string (bold opening line)"
  },
  "newsletter": {
    "subjectLine": "string",
    "bodyCopy": "string (formatted with line breaks, introducing this premium asset, pitching the ease, safety, and compliance of Renting on Goodslister)"
  },
  "googleAds": {
    "headlines": ["string (max 30 chars)", "string (max 30 chars)", "string (max 30 chars)"],
    "descriptions": ["string (max 90 chars)", "string (max 90 chars)"]
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are a professional conversion-focused ad Copywriter. Write engaging, punchy, and highly persuasive high-converting copy.'
        }
      });

      const result = JSON.parse(response.text?.trim() || '{}');
      return res.status(200).json({ result });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error: any) {
    console.error('AI Admin Operations Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
