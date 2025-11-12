// services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { Listing, ListingCategory } from '../types';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

export interface FilterCriteria {
    category?: ListingCategory;
    location?: string;
    text?: string;
}

export type AdviceTopic = 'contract' | 'insurance' | 'payment';
export type ListingAdviceType = 'improvement' | 'pricing' | 'promotion';

/**
 * Processes a natural language search query into structured filter criteria.
 * @param query The natural language search query from the user.
 * @returns A promise that resolves to a FilterCriteria object.
 */
export const processSearchQuery = async (query: string): Promise<FilterCriteria> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the following search query from a user on an equipment rental site and extract it into a JSON format. The query is: "${query}". Valid categories are: ${Object.values(ListingCategory).join(', ')}. Extract the category, location (city or state), and any other general search text.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: {
                            type: Type.STRING,
                            description: 'The category of the item to search for.',
                            enum: Object.values(ListingCategory),
                        },
                        location: {
                            type: Type.STRING,
                            description: 'The location mentioned in the search, such as a city or state.'
                        },
                        text: {
                            type: Type.STRING,
                            description: 'Any other descriptive text for the search.'
                        }
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson as FilterCriteria;
    } catch (error) {
        console.error("Error processing search query with Gemini:", error);
        // Fallback to simple text filter on error
        return { text: query };
    }
};

/**
 * Generates a compelling listing description using AI.
 * @param title The title of the listing.
 * @param features A list of key features of the item.
 * @returns A promise that resolves to a generated description string.
 */
export const generateListingDescription = async (title: string, features: string[]): Promise<string> => {
    try {
        const prompt = `Write an engaging and professional product description for a listing on a rental marketplace. The product is a "${title}". Its key features are: ${features.join(', ')}. The description should be friendly, detailed, and highlight the benefits of renting this item for a great experience. Do not include the title in the description.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating listing description with Gemini:", error);
        return "Could not generate description. Please try again.";
    }
};

/**
 * Provides AI-powered advice on various topics related to listings.
 * @param topic The topic for advice (contract, insurance, payment).
 * @param itemType The type of item (e.g., 'Bikes').
 * @param itemDescription A brief description of the item.
 * @returns A promise that resolves to an advice string.
 */
export const getAIAdvice = async (topic: AdviceTopic, itemType: string, itemDescription: string): Promise<string> => {
    let prompt = '';
    switch (topic) {
        case 'contract':
            prompt = `Act as a virtual legal assistant. For a rental item of type "${itemType}" described as "${itemDescription}", suggest 3-4 important clauses to include in a rental agreement. Briefly explain why each clause is important. Format the response using bold for the clause titles.`;
            break;
        case 'insurance':
            prompt = `Act as an educational insurance advisor. For a rental item of type "${itemType}" described as "${itemDescription}", explain in simple terms the types of insurance coverage the owner might consider. Do not recommend a specific product. The goal is to educate on options. Format the response clearly.`;
            break;
        case 'payment':
            prompt = `Act as a finance and security expert. For a rental item of type "${itemType}" described as "${itemDescription}", provide 3 key tips on best practices for securely accepting payments. Explain the pros and cons of different payment methods (e.g., platform, bank transfer, cash).`;
            break;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting AI advice with Gemini:", error);
        return "Could not generate advice. Please try again.";
    }
};

/**
 * Provides AI-powered advice for a specific listing.
 * @param listing The listing object.
 * @param type The type of advice needed (improvement, pricing, promotion).
 * @returns A promise that resolves to an advice string.
 */
export const getListingAdvice = async (listing: Listing, type: ListingAdviceType): Promise<string> => {
    const listingInfo = `Title: ${listing.title}, Category: ${listing.category}, Description: ${listing.description}, Price per day: $${listing.pricePerDay}`;
    let prompt = '';
    switch (type) {
        case 'improvement':
            prompt = `Analyze the following rental listing information: ${listingInfo}. Provide 3 concrete and actionable suggestions to improve the listing's title and description to attract more customers. Format the response as a list.`;
            break;
        case 'pricing':
            prompt = `Analyze the following rental listing information: ${listingInfo}. Based on the item type and its description, provide a pricing strategy. Should they offer discounts for longer rentals? Weekend pricing? Offer 2 ideas.`;
            break;
        case 'promotion':
            prompt = `Based on the following rental listing information: ${listingInfo}. Create a short and engaging social media post (Instagram or Facebook) to promote this rental. Include relevant hashtags.`;
            break;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting listing advice with Gemini:", error);
        return "Could not generate recommendation. Please try again.";
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
    if (sourceLang === targetLang) return text;
    try {
        const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, without any additional comments or explanations.\n\nText: "${text}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error translating text with Gemini:", error);
        return `(Translation Error) ${text}`;
    }
};