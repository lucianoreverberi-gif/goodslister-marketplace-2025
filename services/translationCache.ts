import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { translateChatMessage, TranslationResult } from './geminiService';

/**
 * Multilingual Chat v2 - Firestore-backed translation cache.
 * 
 * Structure: translations/{messageId}/langs/{targetLangCode}
 * Fields: translatedText, detectedSourceLang, targetLang, createdAt
 * 
 * Reduces Gemini token usage: on cache hit, no API call is made.
 * Sync across devices: any user viewing the same message in the same target
 * language gets the cached translation instantly.
 */

// Normalize language name -> lowercase code (English -> "en", Spanish -> "es", ...)
const langToCode = (lang: string): string => {
    const l = (lang || '').toLowerCase().trim();
    if (l.startsWith('en')) return 'en';
    if (l.startsWith('es') || l === 'español' || l === 'spanish') return 'es';
    if (l.startsWith('por') || l === 'português' || l === 'portugues') return 'pt';
    if (l.startsWith('fr') || l === 'français' || l === 'francais') return 'fr';
    if (l.startsWith('de') || l === 'deutsch' || l === 'german') return 'de';
    if (l.startsWith('it') || l === 'italiano' || l === 'italian') return 'it';
    return l.substring(0, 2) || 'xx';
};

interface CachedTranslation {
    translatedText: string;
    detectedSourceLang: string | null;
    sameLanguage: boolean;
    cached: boolean; // true if hit, false if fresh from Gemini
}

/**
 * Get translation with cache-first strategy.
 * 1. Check Firestore cache for {messageId, targetLang}
 * 2. Cache hit: return immediately
 * 3. Cache miss: call Gemini, store result in Firestore, return
 * 
 * Errors gracefully degrade: on Firestore or Gemini failure, returns { sameLanguage: true } so UI shows original text.
 */
export const getOrCreateTranslation = async (
    messageId: string,
    text: string,
    targetLang: string
): Promise<CachedTranslation> => {
    if (!messageId || !text || !text.trim()) {
        return { translatedText: '', detectedSourceLang: null, sameLanguage: true, cached: false };
    }

    const langCode = langToCode(targetLang);
    const cacheDocRef = doc(db, 'translations', messageId, 'langs', langCode);

    // ---- STEP 1: Check cache ----
    try {
        const cached = await getDoc(cacheDocRef);
        if (cached.exists()) {
            const data = cached.data();
            return {
                translatedText: data.translatedText || '',
                detectedSourceLang: data.detectedSourceLang || null,
                sameLanguage: data.sameLanguage === true,
                cached: true
            };
        }
    } catch (e) {
        console.warn('Translation cache read failed for', messageId, e);
        // Continue to fresh translation
    }

    // ---- STEP 2: Cache miss - call Gemini ----
    let result: TranslationResult;
    try {
        result = await translateChatMessage(text, targetLang);
    } catch (e) {
        console.error('translateChatMessage failed for', messageId, e);
        return { translatedText: '', detectedSourceLang: null, sameLanguage: true, cached: false };
    }

    // ---- STEP 3: Persist to Firestore cache (fire and forget) ----
    setDoc(cacheDocRef, {
        translatedText: result.translatedText,
        detectedSourceLang: result.detectedSourceLang,
        sameLanguage: result.sameLanguage,
        targetLang: targetLang,
        targetLangCode: langCode,
        createdAt: serverTimestamp()
    }).catch((e) => {
        console.warn('Translation cache write failed for', messageId, e);
    });

    return {
        translatedText: result.translatedText,
        detectedSourceLang: result.detectedSourceLang,
        sameLanguage: result.sameLanguage,
        cached: false
    };
};

/**
 * Detect user's preferred language from browser navigator.
 * Returns full name matching the LanguageSelector options.
 */
export const detectUserLanguage = (): string => {
    if (typeof navigator === 'undefined') return 'English';
    const raw = (navigator.language || 'en').toLowerCase();
    if (raw.startsWith('es')) return 'Spanish';
    if (raw.startsWith('pt')) return 'Português';
    if (raw.startsWith('fr')) return 'Français';
    if (raw.startsWith('de')) return 'Deutsch';
    if (raw.startsWith('it')) return 'Italiano';
    return 'English';
};
