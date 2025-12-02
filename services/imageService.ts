
import { GoogleGenAI } from "@google/genai";

// Lazy initialization to prevent app crash on load if env var is missing or undefined at build time
const getAiClient = () => {
    const apiKey = process.env.API_KEY || '';
    return new GoogleGenAI({ apiKey });
}

/**
 * Generates a high-quality, photorealistic image for a given listing.
 * Uses the robust gemini-2.5-flash-image model.
 * 
 * @param title The title of the listing.
 * @param locationContext A string describing the location.
 * @param customPrompt (Optional) A specific prompt to override the default product shot logic.
 * @returns A promise that resolves to a base64 encoded image string (Data URI).
 */
export const generateImageForListing = async (title: string, locationContext: string, customPrompt?: string): Promise<string> => {
    try {
        const ai = getAiClient();
        
        // Construct a prompt that encourages high quality if no custom prompt provided
        const prompt = customPrompt || `Professional, photorealistic product shot of a "${title}". The item should be clean, appealing, and centrally featured. The background should be scenic, appropriate for the item, evoking a sense of adventure, such as ${locationContext}. The lighting should be bright and natural, as if taken by a professional photographer for a high-end rental marketplace.`;
        
        // Use gemini-2.5-flash-image via generateContent for robust "Nano Banana" image generation
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: prompt }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9", // Landscape is best for Hero/Cover images
                }
            }
        });

        // Iterate through parts to find the image part (inlineData)
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    const base64ImageBytes = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    return `data:${mimeType};base64,${base64ImageBytes}`;
                }
            }
        }
        
        throw new Error("No image data found in the API response.");

    } catch (error) {
        console.error("Error generating image for listing with Gemini:", error);
        // Throw error to be handled by the UI
        throw error;
    }
};
