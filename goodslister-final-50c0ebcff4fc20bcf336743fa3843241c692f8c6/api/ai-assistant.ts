import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import type { Listing } from '../types';

// FIX: Inline the ListingCategory enum to avoid runtime import errors in Vercel serverless functions
// when running in ES Module mode. Importing from '../types' fails because Node requires .js extensions.
enum ListingCategory {
    MOTORCYCLES = "Motorcycles",
    BIKES = "Bikes",
    BOATS = "Boats",
    CAMPING = "Camping",
    WINTER_SPORTS = "Winter Sports",
    WATER_SPORTS = "Water Sports",
    RVS = "RVs",
    UTVS = "UTVs",
}

// System instructions for various AI tasks
const systemInstructions = {
    improve: `You are a writing assistant for 'Goodslister', a rental marketplace. Your task is to proofread and improve the user's text for their listing description.
- Correct all spelling and grammar mistakes.
- Enhance clarity and flow.
- Adjust the tone to be more engaging, friendly, and persuasive for potential renters.
- Do NOT add new sections like headlines or bullet points if they don't exist. Refine the existing text.
- Return ONLY the improved text, with no extra comments or apologies.`,
    shorten: `You are a writing assistant for 'Goodslister', a rental marketplace. Your task is to make the user's listing description more concise and impactful.
- Shorten the text while preserving the key features and benefits of the item.
- Remove redundant words and rephrase sentences to be more direct.
- The goal is a punchier, easier-to-read description.
- Return ONLY the shortened text, with no extra comments.`,
    expand: `You are a writing assistant for 'Goodslister', a rental marketplace. Your task is to expand on the user's brief listing description.
- Elaborate on the provided points, adding more descriptive language and painting a picture of the experience.
- If the user mentions a feature, describe the benefit of that feature.
- Make the description more appealing and comprehensive.
- Return ONLY the expanded text, with no extra comments.`,
    generate: `You are an expert copywriter and local tour guide for 'Goodslister', an adventure rental marketplace. Your goal is to take a user's basic input and transform it into a stunning, persuasive listing description that sells the *experience*.

**YOUR PROCESS:**
1.  **Analyze Input:** Review the user's item title, location, and any provided features.
2.  **Enhance Content:** Correct any spelling/grammar mistakes. Use the location to research and incorporate specific, appealing local details (like famous landmarks, scenic spots, or popular activities related to the item).
3.  **Craft Description:** Write a compelling description using the structure below.

**CRITICAL INSTRUCTION - ADD LOCAL FLAIR:**
You MUST use your knowledge and search capabilities to find interesting tourist information about the provided **location**. Weave these details into the description. For example, if the item is a bike in Mendoza, mention the scenic vineyards. If it's a jet ski in Miami, talk about exploring Biscayne Bay. This makes the listing unique and valuable.

**OUTPUT FORMAT (Strict Markdown):**
1.  **Headline:** A captivating H3 headline (e.g., \`### Headline Here\`).
2.  **Opening Paragraph:** An engaging paragraph selling the experience, incorporating local details.
3.  **Highlights Section:** A section titled \`**What you'll love:**\` followed by a bulleted list of benefit-driven points.
4.  **Call to Action:** A strong, bolded call to action (e.g., \`**Book your adventure today!**\`).`
};

/**
 * Builds a contextual prompt for AI advice based on the topic.
 */
const buildAdvicePrompt = (topic: string, itemType: string, itemDescription: string, location: string = ''): string => {
    const locContext = location ? ` located in ${location}` : '';
    
    switch (topic) {
        case 'contract':
            return `Act as a virtual legal assistant. For a rental item of type "${itemType}" described as "${itemDescription}"${locContext}, suggest 3-4 important clauses to include in a rental agreement. ${location ? `Please consider specific legal nuances or common practices for rentals in ${location}. ` : ''}Briefly explain why each clause is important. Format the response using bold for the clause titles.`;
        case 'insurance':
            return `Act as an educational insurance advisor. For a rental item of type "${itemType}" described as "${itemDescription}"${locContext}, explain in simple terms the types of insurance coverage the owner might consider. ${location ? `Mention any specific insurance types relevant to ${location}. ` : ''}Do not recommend a specific product. The goal is to educate on options. Format the response clearly.`;
        case 'payment':
            return `Act as a finance and security expert. For a rental item of type "${itemType}" described as "${itemDescription}"${locContext}, provide 3 key tips on best practices for securely accepting payments. Explain the pros and cons of different payment methods (e.g., platform, bank transfer, cash).`;
        default:
            return '';
    }
};

/**
 * Builds a contextual prompt for specific listing advice.
 */
const buildListingAdvicePrompt = (listing: Listing, type: string): string => {
    const listingInfo = `Title: ${listing.title}, Category: ${listing.category}, Description: ${listing.description}, Price per day: $${listing.pricePerDay}`;
    switch (type) {
        case 'improvement':
            return `Analyze the following rental listing information: ${listingInfo}. Provide 3 concrete and actionable suggestions to improve the listing's title and description to attract more customers. Format the response as a list.`;
        case 'pricing':
            return `Analyze the following rental listing information: ${listingInfo}. Based on the item type and its description, provide a pricing strategy. Should they offer discounts for longer rentals? Weekend pricing? Offer 2 ideas.`;
        case 'promotion':
            return `Based on the following rental listing information: ${listingInfo}. Create a short and engaging social media post (Instagram or Facebook) to promote this rental. Include relevant hashtags.`;
        default:
            return '';
    }
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!process.env.API_KEY) {
        const errorMessage = "The AI service is not available because the API_KEY has not been configured on the server. Please add the API_KEY environment variable to your Vercel project settings.";
        console.error(errorMessage);
        return res.status(503).json({ error: errorMessage });
    }
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, ...payload } = req.body;

    if (!action) {
        return res.status(400).json({ error: 'An "action" must be provided in the request body.' });
    }

    try {
        switch (action) {
            case 'generate': {
                const { title, location, features } = payload;
                const userPrompt = `Generate a description for an item with Title: ${title}, Location: ${location}, Features: ${features?.join(', ') || 'N/A'}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: userPrompt,
                    config: { systemInstruction: systemInstructions.generate, tools: [{googleSearch: {}}] },
                });
                return res.status(200).json({
                    description: response.text,
                    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
                });
            }

            case 'improve':
            case 'shorten':
            case 'expand': {
                const { text } = payload;
                if (!text) return res.status(400).json({ error: 'Text is required for this action' });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: text,
                    config: { systemInstruction: systemInstructions[action] },
                });
                return res.status(200).json({ text: response.text.trim() });
            }

            case 'advice': {
                const { topic, itemType, itemDescription, location } = payload;
                const prompt = buildAdvicePrompt(topic, itemType, itemDescription, location);
                if (!prompt) return res.status(400).json({ error: 'Invalid advice topic provided.' });
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                return res.status(200).json({ advice: response.text });
            }

            case 'listingAdvice': {
                const { listing, adviceType } = payload;
                const prompt = buildListingAdvicePrompt(listing, adviceType);
                if (!prompt) return res.status(400).json({ error: 'Invalid listing advice type.' });
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                return res.status(200).json({ advice: response.text });
            }

            case 'search': {
                const { query } = payload;
                // Use the local enum values
                const categories = Object.values(ListingCategory).join(', ');
                const prompt = `Analyze the following search query from a user on an equipment rental site and extract it into a JSON format. The query is: "${query}". Valid categories are: ${categories}. Extract the category, location (city or state), and any other general search text.`;
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                category: { type: Type.STRING, enum: Object.values(ListingCategory) },
                                location: { type: Type.STRING },
                                text: { type: Type.STRING }
                            }
                        }
                    }
                });

                try {
                    // Gemini with JSON output mode should return valid JSON, but it's safer to parse in a try-catch.
                    const criteria = JSON.parse(response.text.trim());
                    return res.status(200).json({ criteria });
                } catch (parseError) {
                    console.error("Failed to parse AI JSON response for 'search' action. Response text:", response.text);
                    // If parsing fails, we gracefully fall back to a simple text search.
                    const fallbackCriteria = { text: query };
                    return res.status(200).json({ criteria: fallbackCriteria });
                }
            }

            case 'translate': {
                const { text, targetLang, sourceLang } = payload;
                const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, without any additional comments or explanations.\n\nText: "${text}"`;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                return res.status(200).json({ translatedText: response.text.trim() });
            }
                
            default:
                return res.status(400).json({ error: `Invalid action: ${action}` });
        }
    } catch (error) {
        console.error(`Error with AI action '${action}':`, error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return res.status(500).json({ error: `An error occurred while communicating with the AI service: ${message}` });
    }
}