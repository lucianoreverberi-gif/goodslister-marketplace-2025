
import React, { useState, useEffect } from 'react';
import { useCookieConsent, CookieConsent } from '../hooks/useCookieConsent';
import { ShieldIcon, XIcon, CheckCircleIcon, ExternalLinkIcon } from './icons';

export const CookieConsentBanner: React.FC = () => {
    const { consent, isLoaded, saveConsent } = useCookieConsent();
    const [showBanner, setShowBanner] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);
    
    // Internal state for customization modal
    const [tempConsent, setTempConsent] = useState({
        essential: true,
        functional: true,
        analytics: true,
        marketing: true
    });

    useEffect(() => {
        if (isLoaded && !consent) {
            // Delay banner slightly for better UX
            const timer = setTimeout(() => setShowBanner(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, consent]);

    // Handle custom open event from Link/Button
    useEffect(() => {
        const handleOpen = () => {
            if (consent) {
                setTempConsent({
                    essential: true,
                    functional: consent.functional,
                    analytics: consent.analytics,
                    marketing: consent.marketing
                });
            }
            setShowCustomize(true);
        };
        window.addEventListener('openCookiePreferences', handleOpen);
        return () => window.removeEventListener('openCookiePreferences', handleOpen);
    }, [consent]);

    const handleAcceptAll = () => {
        saveConsent({
            essential: true,
            functional: true,
            analytics: true,
            marketing: true
        });
        setShowBanner(false);
    };

    const handleRejectAll = () => {
        saveConsent({
            essential: true,
            functional: false,
            analytics: false,
            marketing: false
        });
        setShowBanner(false);
    };

    const handleSaveCustom = () => {
        saveConsent(tempConsent);
        setShowCustomize(false);
        setShowBanner(false);
    };

    if (!isLoaded || (!showBanner && !showCustomize)) return null;

    return (
        <>
            {/* Main Banner */}
            {showBanner && !showCustomize && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 animate-in slide-in-from-bottom-full duration-500">
                    <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                        {/* Decorative accent */}
                        <div className="absolute top-0 left-0 w-2 h-full bg-cyan-600"></div>
                        
                        <div className="flex items-start gap-4">
                            <div className="bg-cyan-50 p-3 rounded-2xl text-cyan-600 hidden sm:block mt-1">
                                <ShieldIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">We value your privacy</p>
                                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                                    We use cookies to enhance your experience, analyze site usage, and assist in our marketing. You can manage preferences anytime. 
                                    <a href="#cookiePolicy" className="text-cyan-600 hover:underline font-bold ml-1 inline-flex items-center gap-0.5">
                                        Cookie Policy <ExternalLinkIcon className="h-3 w-3" />
                                    </a>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <button 
                                onClick={handleAcceptAll}
                                className="flex-1 md:flex-none px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-100 transition-all active:scale-95 uppercase tracking-widest leading-none"
                            >
                                Accept All
                            </button>
                            <button 
                                onClick={handleRejectAll}
                                className="flex-1 md:flex-none px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all active:scale-95 uppercase tracking-widest leading-none"
                            >
                                Essential Only
                            </button>
                            <button 
                                onClick={() => setShowCustomize(true)}
                                className="w-full md:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 font-bold text-xs rounded-xl transition-all active:scale-95 uppercase tracking-widest leading-none"
                            >
                                Customize
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customization Modal */}
            {showCustomize && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Privacy Preferences</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage your cookie settings</p>
                            </div>
                            <button onClick={() => setShowCustomize(false)} className="p-2 border border-slate-100 hover:bg-slate-50 rounded-xl transition-all active:scale-90 text-slate-400">
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Essential */}
                            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div>
                                    <p className="font-black text-slate-900 text-sm">Strictly Necessary</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1">Required for the website to function (Auth, CSRF, Security). Cannot be disabled.</p>
                                </div>
                                <div className="h-6 w-11 bg-cyan-600 rounded-full flex items-center px-1 opacity-50 cursor-not-allowed">
                                    <div className="bg-white h-4 w-4 rounded-full translate-x-5 transition-transform"></div>
                                </div>
                            </div>

                            {/* Functional */}
                            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-100">
                                <div>
                                    <p className="font-black text-slate-900 text-sm">Functional Cookies</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1">Enables personalization like UI preferences, theme, and language selection.</p>
                                </div>
                                <button 
                                    onClick={() => setTempConsent(prev => ({ ...prev, functional: !prev.functional }))}
                                    className={`h-6 w-11 rounded-full flex items-center px-1 transition-all ${tempConsent.functional ? 'bg-cyan-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`bg-white h-4 w-4 rounded-full transition-transform ${tempConsent.functional ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {/* Analytics */}
                            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-100">
                                <div>
                                    <p className="font-black text-slate-900 text-sm">Analytics Cookies</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1">Helps us understand how visitors interact with the site to improve performance.</p>
                                </div>
                                <button 
                                    onClick={() => setTempConsent(prev => ({ ...prev, analytics: !prev.analytics }))}
                                    className={`h-6 w-11 rounded-full flex items-center px-1 transition-all ${tempConsent.analytics ? 'bg-cyan-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`bg-white h-4 w-4 rounded-full transition-transform ${tempConsent.analytics ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {/* Marketing */}
                            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-100">
                                <div>
                                    <p className="font-black text-slate-900 text-sm">Marketing Cookies</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1">Used to deliver more relevant advertisements and track ad conversion analytics.</p>
                                </div>
                                <button 
                                    onClick={() => setTempConsent(prev => ({ ...prev, marketing: !prev.marketing }))}
                                    className={`h-6 w-11 rounded-full flex items-center px-1 transition-all ${tempConsent.marketing ? 'bg-cyan-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`bg-white h-4 w-4 rounded-full transition-transform ${tempConsent.marketing ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                            <button 
                                onClick={() => {
                                    setTempConsent({ essential: true, functional: true, analytics: true, marketing: true });
                                }}
                                className="text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest"
                            >
                                Enable All
                            </button>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowCustomize(false)}
                                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveCustom}
                                    className="px-8 py-3 bg-slate-900 text-white font-black text-xs rounded-xl shadow-lg hover:bg-black transition-all active:scale-95 uppercase tracking-widest"
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
