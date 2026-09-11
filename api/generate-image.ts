import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/generate-image
 *
 * Server-side AI image generation for listings using Google Gemini.
 * The API_KEY environment variable stays on the server — never exposed to
 * browsers. Frontend calls this endpoint with the listing details and
 * receives a base64 data URI back.
 *
 * Body: { title, locationContext?, customPrompt? }
 * Returns: { imageDataUri: 'data:image/png;base64,...' }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
        console.error('[generate-image] API_KEY missing in environment');
        return res.status(500).json({
            error: 'AI image service is not configured. Please set the API_KEY environment variable in Vercel.',
        });
    }

    const { title, locationContext, customPrompt } = req.body || {};
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'title is required' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt =
            customPrompt ||
            `Professional, photorealistic product shot of a "${title}". The item should be clean, appealing, and centrally featured. The background should be scenic, appropriate for the item, evoking a sense of adventure, such as ${locationContext || 'a beautiful outdoor location'}. The lighting should be bright and natural, as if taken by a professional photographer for a high-end rental marketplace.`;

        console.log('[generate-image] prompt:', prompt.substring(0, 120));

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: '16:9',
                },
            },
        });

        // Iterate through parts to find the inline image data
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    const base64ImageBytes = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    return res.status(200).json({
                        imageDataUri: `data:${mimeType};base64,${base64ImageBytes}`,
                    });
                }
            }
        }

        console.error('[generate-image] API response missing image data');
        return res.status(502).json({
            error: 'Image generation succeeded but no image data was returned. Please try again.',
        });
    } catch (err: any) {
        console.error('[generate-image] error:', err?.message || err);
        // Surface Gemini-specific errors to the client
        const message = err?.message || 'Failed to generate image';
        // If the error is a quota / auth issue, share it cleanly
        if (message.toLowerCase().includes('api key') || message.toLowerCase().includes('permission')) {
            return res.status(500).json({ error: 'AI image service authentication failed. Please check API_KEY.' });
        }
        if (message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate')) {
            return res.status(429).json({ error: 'AI image quota exceeded. Please try again later.' });
        }
        return res.status(500).json({ error: 'Failed to generate image. Please try again or upload a real photo.' });
    }
}
