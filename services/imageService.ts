/**
 * Client-side image service.
 *
 * Delegates image generation to the /api/generate-image server endpoint so
 * the Google Gemini API key never leaves the server.
 *
 * See api/generate-image.ts for the backend implementation.
 */

/**
 * Generates a high-quality, photorealistic image for a given listing.
 *
 * @param title The title of the listing.
 * @param locationContext A string describing the location.
 * @param customPrompt (Optional) A specific prompt to override the default product shot logic.
 * @returns A promise that resolves to a base64 encoded image string (Data URI).
 */
export const generateImageForListing = async (
    title: string,
    locationContext: string,
    customPrompt?: string
): Promise<string> => {
    try {
        const res = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, locationContext, customPrompt }),
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Image generation failed (${res.status})`);
        }

        const data = await res.json();
        if (!data.imageDataUri) {
            throw new Error('No image data returned from the server.');
        }
        return data.imageDataUri;
    } catch (err: any) {
        console.error('[imageService] generateImageForListing error:', err);
        throw err;
    }
};
