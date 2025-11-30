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
    ATVS_UTVS = "ATVs & UTVs",
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
4.  **Call to Action:** A strong, bolded call to action (e.g., \`**Book your adventure today!**\`).`,
    
    // NEW PERSONA: The Rental Success Coach
    advisor: `You are the "Goodslister Rental Success Coach". Your mission is to help regular people (Hosts) monetize their recreational assets (boats, jet skis, RVs) confidently.
    
    **YOUR IDENTITY:**
    - You are NOT a lawyer, a warning system, or a "compliance cop". You are a business enabler.
    - Your goal is to solve the user's hesitation by offering "Smart Legal Structures" and "Best Practices" that make renting possible and safe.
    - **TONE:** Empowering, knowledgeable, "Insider" (use terms like "Pro-tip", "Smart move", "We've got you covered").
    - **STRICT RULE:** Never use alarmist words like "Illegal", "Lawsuit", "Severe Risk", or "Danger" in a standalone sentence. Always pair compliance topics with positive framing (e.g., instead of "It is illegal to rent without a license," say "To rent compliantly without a license, simply use our Bareboat Charter tool").

    **YOUR KNOWLEDGE BASE (THE TOOLKIT):**
    1. **Boats/Marine:** Pivot to "Bareboat/Demise Charter". Explain that Goodslister generates this contract so the renter becomes the temporary owner, meaning the host doesn't need a Captain's license.
    2. **Insurance:** If they lack commercial insurance, pivot to "Liability Waivers" + "High Security Deposits". Frame this as "Self-Insuring via Contract".
    3. **Powersports (Jet Skis/ATVs):** Focus on "Assumption of Risk" waivers and "Safety Checklists". Mention Florida SB 606 as a "Quality Standard" rather than a law to fear.
    4. **Vehicles/RVs:** Mention "Bailment Agreements" (private lending) as a strategy to navigate personal insurance exclusions.

    **OUTPUT FORMAT:**
    - Start with a direct, encouraging answer to their specific question.
    - Provide a "Smart Strategy" section with bullet points on how to structure the rental.
    - End with a motivating Call to Action.`
};

/**
 * Builds a contextual prompt for AI advice based on the topic.
 */
const buildAdvicePrompt = (topic: string, itemType: string, itemDescription: string, location: string = '', userQuestion: string = ''): string => {
    const locContext = location ? ` located in ${location}` : '';
    
    if (topic === 'consultation') {
        return `
        User Context:
        - Asset Category: ${itemType}
        - Asset Details: ${itemDescription}
        - Location: ${location || "General/Not Specified"}
        
        USER QUESTION/CONCERN: "${userQuestion}"

        Please provide a strategic, solution-oriented response. 
        If the user is asking about risks, pivot immediately to how Goodslister's tools (Contracts, Waivers, Verification) mitigate those risks.
        If the user is asking about payments, analyze **Zelle, CashApp, Venmo, and PayPal**. List the specific **Pros** and **Cons** of each for this rental scenario.
        `;
    }

    // Fallback for legacy calls (though we are moving to consultation)
    return `Act as the Goodslister Coach. Provide advice for a ${itemType} (${itemDescription})${locContext}.`;
};

/**
 * Builds a contextual prompt for specific listing advice.
 */
const buildListingAdvicePrompt = (listing: Listing, type: string): string => {
    const locationStr = `${listing.location.city}, ${listing.location.state}, ${listing.location.country}`;
    const listingInfo = `
    Item: ${listing.title}
    Category: ${listing.category}
    Description: ${listing.description}
    Price: $${listing.pricePerDay}/day
    Location: ${locationStr}
    `;

    switch (type) {
        case 'improvement':
            return `Role: E-commerce Listing Specialist.
            Task: Review the following rental listing and provide 3 distinct, actionable tips to increase bookings.
            Focus on:
            1. Title attractiveness (SEO and click-through).
            2. Description clarity and selling points.
            3. Missing details that renters in ${locationStr} would specifically care about.
            
            Listing Data: ${listingInfo}
            
            Output: A simple bulleted list of 3 tips.`;
        
        case 'pricing':
            return `Role: Pricing Strategy Consultant.
            Task: Analyze the pricing for this ${listing.category} item in ${locationStr}.
            Current Price: $${listing.pricePerDay}/day.
            
            Provide:
            1. A quick assessment (Competitive, High, or Low) considering local standards.
            2. Two specific pricing strategies to maximize revenue (e.g., seasonal adjustments, weekend vs weekday rates, weekly discounts).
            
            Listing Data: ${listingInfo}`;
            
        case 'promotion':
            return `Role: Social Media Influencer.
            Task: Write a captivating social media post (Instagram/Facebook style) to market this rental.
            
            Requirements:
            - Highlight the experience of using the item in ${listing.location.city}.
            - Use emojis.
            - Include relevant hashtags for the item and the location.
            
            Listing Data: ${listingInfo}`;
            
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
                // Modified to handle the 'consultation' flow
                const { topic, itemType, itemDescription, location, userQuestion } = payload;
                
                // We map 'consultation' topic to the Advisor Persona
                const isConsultation = topic === 'consultation';
                const systemPrompt = isConsultation ? systemInstructions.advisor : undefined;
                
                const prompt = buildAdvicePrompt(topic, itemType, itemDescription, location, userQuestion);
                
                if (!prompt) return res.status(400).json({ error: 'Invalid advice topic provided.' });
                
                const response = await ai.models.generateContent({ 
                    model: 'gemini-2.5-flash', 
                    contents: prompt,
                    config: systemPrompt ? { systemInstruction: systemPrompt } : undefined
                });
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