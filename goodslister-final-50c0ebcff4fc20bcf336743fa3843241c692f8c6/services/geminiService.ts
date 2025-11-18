// services/geminiService.ts
import { Listing, ListingCategory } from '../types';

export interface FilterCriteria {
    category?: ListingCategory;
    location?: string;
    text?: string;
}

export type AdviceTopic = 'contract' | 'insurance' | 'payment';
export type ListingAdviceType = 'improvement' | 'pricing' | 'promotion';

export interface ListingDescriptionResult {
    description: string;
    sources: any[];
}

/**
 * A generic helper function to call our secure AI assistant backend.
 * @param body The request body to send to the API.
 * @returns A promise that resolves to the JSON response from the API.
 * @throws Throws an error with a detailed message if the API call fails.
 */
const callAIAssistantAPI = async (body: object) => {
    const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        // Vercel might return HTML for errors like timeouts (504)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
            // It's a JSON error from our API, as expected.
            const errorJson = await response.json();
            throw new Error(errorJson.error || 'An error occurred with the AI assistant.');
        } else {
            // It's likely an infrastructure error (e.g., timeout, gateway error) returning HTML or plain text.
            const errorText = await response.text();
            console.error('Non-JSON error from AI assistant API:', { status: response.status, body: errorText });
            
            if (response.status === 404) {
                 throw new Error(`The API endpoint was not found (Status: 404). This is likely a deployment configuration issue.`);
            }
            if (response.status === 504) {
                throw new Error('The request to the AI assistant timed out. This can happen on the first attempt on a new deployment. Please try again in a moment.');
            }
             if (response.status === 503) {
                 // The backend sends a 503 if the API key is missing.
                throw new Error('The AI service is currently unavailable. The server configuration might be incomplete.');
            }
            // For other non-JSON errors, show a more generic but helpful server error message.
            throw new Error(`A server error occurred (Status: ${response.status}). Please try again later.`);
        }
    }

    return response.json();
};


/**
 * Processes a natural language search query into structured filter criteria.
 * @param query The natural language search query from the user.
 * @returns A promise that resolves to a FilterCriteria object.
 */
export const processSearchQuery = async (query: string): Promise<FilterCriteria> => {
    try {
        const data = await callAIAssistantAPI({ action: 'search', query });
        return data.criteria as FilterCriteria;
    } catch (error) {
        console.error("Error processing search query via API:", error);
        // Fallback to simple text filter on error
        return { text: query };
    }
};

/**
 * Generates a compelling listing description by calling the secure backend endpoint.
 * @param title The title of the listing.
 * @param location The location of the item.
 * @param features A list of key features of the item.
 * @returns A promise that resolves to an object containing the description and sources.
 */
export const generateListingDescription = async (title: string, location: string, features: string[]): Promise<ListingDescriptionResult> => {
    return callAIAssistantAPI({ action: 'generate', title, location, features });
};

/**
 * Provides AI-powered advice on various topics related to listings.
 * @param topic The topic for advice (contract, insurance, payment).
 * @param itemType The type of item (e.g., 'Bikes').
 * @param itemDescription A brief description of the item.
 * @returns A promise that resolves to an advice string.
 */
export const getAIAdvice = async (topic: AdviceTopic, itemType: string, itemDescription: string): Promise<string> => {
    try {
        const data = await callAIAssistantAPI({ action: 'advice', topic, itemType, itemDescription });
        return data.advice;
    } catch (error) {
         console.error("Error getting AI advice via API:", error);
         const message = error instanceof Error ? error.message : "Could not generate advice.";
         return `Error: ${message}`;
    }
};

/**
 * Provides AI-powered advice for a specific listing.
 * @param listing The listing object.
 * @param type The type of advice needed (improvement, pricing, promotion).
 * @returns A promise that resolves to an advice string.
 */
export const getListingAdvice = async (listing: Listing, type: ListingAdviceType): Promise<string> => {
    try {
        const data = await callAIAssistantAPI({ action: 'listingAdvice', listing, adviceType: type });
        return data.advice;
    } catch (error) {
         console.error("Error getting listing advice via API:", error);
         const message = error instanceof Error ? error.message : "Could not generate recommendation.";
         return `Error: ${message}`;
    }
};

/**
 * Translates text from a source language to a target language.
 * @param text The text to translate.
 * @param targetLang The target language (e.g., "English", "Spanish").
 * @param sourceLang The source language (e.g., "English", "Spanish").
 * @returns A promise that resolves to the translated text.
 */
export const translateText = async (text: string, targetLang: string, sourceLang: string): Promise<string> => {
    if (sourceLang.toLowerCase() === targetLang.toLowerCase()) return text;
    try {
        const data = await callAIAssistantAPI({ action: 'translate', text, targetLang, sourceLang });
        return data.translatedText;
    } catch (error) {
        console.error("Error translating text via API:", error);
        return `(Translation Error) ${text}`;
    }
};

const callAITextManipulationAPI = async (action: 'improve' | 'shorten' | 'expand', currentText: string): Promise<string> => {
    if (!currentText.trim()) {
        return ""; // Don't call API for empty text
    }
    const data = await callAIAssistantAPI({ action, text: currentText });
    if (!data.text) {
        throw new Error("AI service returned an empty response.");
    }
    return data.text.trim();
};

export const improveDescription = (text: string): Promise<string> => callAITextManipulationAPI('improve', text);

export const shortenDescription = (text: string): Promise<string> => callAITextManipulationAPI('shorten', text);

export const expandDescription = (text: string): Promise<string> => callAITextManipulationAPI('expand', text);