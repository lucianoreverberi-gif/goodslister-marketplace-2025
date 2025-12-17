
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

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

const systemInstructions = {
    // ... (previous instructions)
    idScanner: `You are a professional document verification expert. 
    Analyze the provided ID image(s). 
    Your goal is to extract key data and detect potential fraud.
    - Extract: Full Name, Date of Birth, Expiration Date, Document Number.
    - Compare the extracted Name with the 'Expected Name' provided in the prompt.
    - Check if the ID is expired.
    - Provide a confidence score (0-100) for the authenticity of the document.
    - RETURN ONLY VALID JSON.`,
    improve: `You are a writing assistant for 'Goodslister'...`,
    shorten: `You are a writing assistant...`,
    expand: `You are a writing assistant...`,
    generate: `You are an expert copywriter...`,
    advisor: `You are the "Goodslister Rental Success Coach"...`
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!process.env.API_KEY) return res.status(503).json({ error: "API_KEY missing" });
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { action, ...payload } = req.body;

    try {
        switch (action) {
            case 'analyze-id': {
                const { frontImageBase64, expectedName } = payload;
                if (!frontImageBase64) return res.status(400).json({ error: "ID image required" });

                const prompt = `Expected Name: ${expectedName}. 
                Extract information from this ID card and verify if it matches the expected name. 
                Is the document expired? Does it look genuine?`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: {
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: 'image/jpeg', data: frontImageBase64.split(',')[1] || frontImageBase64 } }
                        ]
                    },
                    config: {
                        systemInstruction: systemInstructions.idScanner,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                extractedName: { type: Type.STRING },
                                dob: { type: Type.STRING },
                                expiryDate: { type: Type.STRING },
                                docNumber: { type: Type.STRING },
                                isExpired: { type: Type.BOOLEAN },
                                nameMatchScore: { type: Type.NUMBER },
                                verificationStatus: { type: Type.STRING, enum: ['verified', 'flagged', 'manual_check'] },
                                summary: { type: Type.STRING }
                            },
                            required: ['extractedName', 'verificationStatus']
                        }
                    }
                });

                return res.status(200).json(JSON.parse(response.text));
            }
            // ... (rest of cases)
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
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: text,
                    config: { systemInstruction: systemInstructions[action] },
                });
                return res.status(200).json({ text: response.text.trim() });
            }
            case 'advice': {
                const { topic, itemType, itemDescription, location, userQuestion } = payload;
                const isConsultation = topic === 'consultation';
                const prompt = isConsultation ? `USER QUESTION: ${userQuestion}` : `Topic: ${topic}`;
                const response = await ai.models.generateContent({ 
                    model: 'gemini-2.5-flash', 
                    contents: prompt,
                    config: { systemInstruction: isConsultation ? systemInstructions.advisor : undefined }
                });
                return res.status(200).json({ advice: response.text });
            }
            case 'search': {
                const { query } = payload;
                const prompt = `Analyze search query: "${query}"`;
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: { responseMimeType: "application/json" }
                });
                return res.status(200).json({ criteria: JSON.parse(response.text) });
            }
            case 'translate': {
                const { text, targetLang, sourceLang } = payload;
                const prompt = `Translate from ${sourceLang} to ${targetLang}: "${text}"`;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                return res.status(200).json({ translatedText: response.text.trim() });
            }
            default: return res.status(400).json({ error: `Invalid action: ${action}` });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "AI Processing Failed" });
    }
}
