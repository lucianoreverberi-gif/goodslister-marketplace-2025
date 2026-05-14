
import { useState, useEffect } from 'react';

export interface CookieConsent {
    essential: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp: string;
    version: string;
}

const STORAGE_KEY = 'goodslister_cookie_consent';
const CURRENT_VERSION = '1.0';

export function useCookieConsent() {
    const [consent, setConsent] = useState<CookieConsent | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as CookieConsent;
                if (parsed.version === CURRENT_VERSION) {
                    setConsent(parsed);
                }
            } catch (e) {
                console.error('Failed to parse cookie consent', e);
            }
        }
        setIsLoaded(true);
    }, []);

    const saveConsent = (newConsent: Omit<CookieConsent, 'timestamp' | 'version'>) => {
        const fullConsent: CookieConsent = {
            ...newConsent,
            timestamp: new Date().toISOString(),
            version: CURRENT_VERSION
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fullConsent));
        setConsent(fullConsent);
        
        // Dispatch event so other instances of the hook (if any) can update
        window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: fullConsent }));
    };

    const resetConsent = () => {
        localStorage.removeItem(STORAGE_KEY);
        setConsent(null);
    };

    return {
        consent,
        isLoaded,
        saveConsent,
        resetConsent,
        STORAGE_KEY
    };
}
