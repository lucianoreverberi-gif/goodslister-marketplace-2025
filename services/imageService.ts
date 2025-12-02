
import { GoogleGenAI } from "@google/genai";

// Lazy initialization to prevent app crash on load if env var is missing or undefined at build time
const getAiClient = () => {
    // Falls back to empty string if not defined, allowing component to render but fail gracefully on action
    const apiKey = process.env.API_KEY || '';
    return new GoogleGenAI({ apiKey });
}

/**
 * Generates a high-quality, photorealistic image for a given listing.
 * @param title The title of the listing.
 * @param locationContext A string describing the location.
 * @param customPrompt (Optional) A specific prompt to override the default product shot logic.
 * @returns A promise that resolves to a base64 encoded image string.
 */
export const generateImageForListing = async (title: string, locationContext: string, customPrompt?: string): Promise<string> => {
    try {
        const ai = getAiClient();
        
        // Construct the prompt
        const prompt = customPrompt || `Professional, photorealistic product shot of a "${title}". The item should be clean, appealing, and centrally featured. The background should be scenic, appropriate for the item, evoking a sense of adventure, such as ${locationContext}. The lighting should be bright and natural, as if taken by a professional photographer for a high-end rental marketplace.`;
        
        // Use gemini-2.5-flash-image for reliable, high-speed generation
        // or gemini-3-pro-image-preview for highest quality if quota allows.
        // We use gemini-2.5-flash-image as the safe default for broad compatibility.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: prompt }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9", // Landscape for Hero Cover
                }
            }
        });

        // Parse response for image data
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:image/png;base64,${base64ImageBytes}`;
                }
            }
        }
        
        throw new Error("No image data found in the API response.");

    } catch (error) {
        console.error("Error generating image for listing with Gemini:", error);
        // Throw error to be handled by the caller (e.g. show error message in UI)
        throw error;
    }
};
