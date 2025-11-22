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
 * Helper function to call the serverless AI API.
 */
async function callAiApi(action: string, payload: any) {
    try {
        const response = await fetch('/api/ai-assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload }),
        });
        
        if (!response.ok) {
             const err = await response.json().catch(() => ({}));
             throw new Error(err.error || `AI Service Error: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Error calling AI API [${action}]:`, error);
        throw error;
    }
}

/**
 * Processes a natural language search query into structured filter criteria via API.
 */
export const processSearchQuery = async (query: string): Promise<FilterCriteria> => {
    try {
        const data = await callAiApi('search', { query });
        return data.criteria;
    } catch (error) {
        // Fallback to simple text search if AI fails
        return { text: query };
    }
};

/**
 * Generates a listing description via API.
 */
export const generateListingDescription = async (title: string, location: string, features: string[]): Promise<ListingDescriptionResult> => {
    const data = await callAiApi('generate', { title, location, features });
    return { description: data.description, sources: data.sources };
};

/**
 * Provides AI-powered advice via API.
 */
export const getAIAdvice = async (topic: AdviceTopic, itemType: string, itemDescription: string, location: string = ''): Promise<string> => {
     try {
         const data = await callAiApi('advice', { topic, itemType, itemDescription, location });
         return data.advice;
     } catch (e) {
         return "Could not generate advice at this time. Please check your connection.";
     }
};

/**
 * Provides specific listing advice (Improvement, Pricing, Promotion) via API.
 */
export const getListingAdvice = async (listing: Listing, type: ListingAdviceType): Promise<string> => {
    try {
        const data = await callAiApi('listingAdvice', { listing, adviceType: type });
        return data.advice;
    } catch (error) {
        return "Could not generate listing advice. Please try again later.";
    }
};

/**
 * Translates text via API.
 */
export const translateText = async (text: string, targetLang: string, sourceLang: string): Promise<string> => {
    if (sourceLang.toLowerCase() === targetLang.toLowerCase()) return text;
    try {
         const data = await callAiApi('translate', { text, targetLang, sourceLang });
         return data.translatedText;
    } catch (e) {
        return text;
    }
};

// Text manipulation helpers
export const improveDescription = async (text: string) => (await callAiApi('improve', { text })).text;
export const shortenDescription = async (text: string) => (await callAiApi('shorten', { text })).text;
export const expandDescription = async (text: string) => (await callAiApi('expand', { text })).text;
