
import React, { useState, useRef, useEffect } from 'react';
import { ListingCategory } from '../types';
import { getAIAdvice } from '../services/geminiService';
import { BrainCircuitIcon, MapPinIcon, SparklesIcon, LightbulbIcon, ShieldCheckIcon } from './icons';

// API Key for Google Maps (Consistent with other components)
const MAPS_API_KEY = 'AIzaSyBXEVAhsLGBPWixJlR7dv5FLdybcr5SOP0';

const AIAssistantPage: React.FC = () => {
    // Form State
    const [category, setCategory] = useState<ListingCategory | ''>('');
    const [itemDetails, setItemDetails] = useState('');
    const [location, setLocation] = useState('');
    const [userQuestion, setUserQuestion] = useState('');
    
    // Response State
    const [isLoading, setIsLoading] = useState(false);
    const [advice, setAdvice] = useState('');

    // Google Maps Autocomplete
    const locationInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const initAutocomplete = () => {
            if (locationInputRef.current && (window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
                try {
                    const autocomplete = new (window as any).google.maps.places.Autocomplete(locationInputRef.current, { types: ['geocode'] });
                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        if (place.formatted_address) setLocation(place.formatted_address);
                        else if (place.name) setLocation(place.name);
                    });
                } catch (e) {
                    console.error("Maps Autocomplete init error", e);
                }
            }
        };

        if ((window as any).google && (window as any).google.maps) {
             initAutocomplete();
             return;
        }

        const scriptId = 'google-maps-script-manual';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => initAutocomplete();
            document.head.appendChild(script);
        } else {
             const existingScript = document.getElementById(scriptId) as HTMLScriptElement;
             if (existingScript) setTimeout(initAutocomplete, 1000);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !itemDetails || !userQuestion) return;

        setIsLoading(true);
        setAdvice('');
        try {
            const response = await getAIAdvice('consultation', category, itemDetails, location, userQuestion);
            setAdvice(response);
        } catch (error) {
            setAdvice("Sorry, I couldn't reach the server. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            {/* Header / Hero */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-cyan-100 rounded-full mb-4">
                        <BrainCircuitIcon className="h-8 w-8 text-cyan-600" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        Rental Success Coach
                    </h1>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        Don't let legal worries stop you from earning. Our AI Strategist finds <span className="text-cyan-600 font-bold">smart, compliant solutions</span> for your specific assets.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    
                    {/* Left Column: The "Consultation Form" */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <SparklesIcon className="h-5 w-5" />
                                Start Strategy Session
                            </h2>
                            <p className="text-cyan-100 text-sm mt-1">Tell us about your asset to get tailored advice.</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                            
                            {/* 1. Category */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    1. What are you listing?
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as ListingCategory)}
                                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-cyan-500 focus:border-cyan-500 py-3"
                                    required
                                >
                                    <option value="" disabled>Select a Category...</option>
                                    {Object.values(ListingCategory).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. Item Details */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    2. Describe the Item (Year, Make, Model)
                                </label>
                                <input
                                    type="text"
                                    value={itemDetails}
                                    onChange={(e) => setItemDetails(e.target.value)}
                                    placeholder="e.g. 2022 Yamaha Waverunner VX Deluxe"
                                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-cyan-500 focus:border-cyan-500 py-3 px-4"
                                    required
                                />
                            </div>

                            {/* 3. Location */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    3. Location (City/State)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        ref={locationInputRef}
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g. Miami, FL"
                                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-cyan-500 focus:border-cyan-500 py-3 pl-10"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Helps us check for local rules like Florida SB 606.</p>
                            </div>

                            {/* 4. The Question */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    4. What is your main concern?
                                </label>
                                <textarea
                                    value={userQuestion}
                                    onChange={(e) => setUserQuestion(e.target.value)}
                                    rows={4}
                                    placeholder="e.g. Do I need a special license? What if someone damages it? How do I accept payments safely?"
                                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-cyan-500 focus:border-cyan-500 p-4"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !category || !itemDetails}
                                className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg transform transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
                            >
                                {isLoading ? 'Analyzing Strategy...' : 'Get Expert Advice'}
                                {!isLoading && <LightbulbIcon className="h-5 w-5" />}
                            </button>
                        </form>
                    </div>

                    {/* Right Column: The "Advice Dashboard" */}
                    <div className="space-y-6">
                        {advice ? (
                            <div className="bg-white rounded-2xl shadow-xl border border-cyan-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                                <div className="bg-cyan-50 p-6 border-b border-cyan-100 flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-cyan-900">Your Custom Strategy</h3>
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <ShieldCheckIcon className="h-6 w-6 text-green-500" />
                                    </div>
                                </div>
                                <div className="p-8 prose prose-cyan max-w-none">
                                    {/* Render the AI response with simple formatting */}
                                    <div 
                                        className="text-gray-700 leading-relaxed space-y-4"
                                        dangerouslySetInnerHTML={{ 
                                            __html: advice
                                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                                                .replace(/### (.*?)\n/g, '<h4 class="text-lg font-bold text-cyan-700 mt-6 mb-2">$1</h4>')
                                                .replace(/\n/g, '<br />') 
                                        }} 
                                    />
                                </div>
                                <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                                    <p className="text-sm text-gray-500 mb-4">Ready to put this plan into action?</p>
                                    <a href="/createListing" className="inline-block px-6 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors">
                                        List Your Item Now
                                    </a>
                                </div>
                            </div>
                        ) : (
                            // Empty State / Placeholder
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-100/50 rounded-2xl border-2 border-dashed border-gray-300">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                                    <LightbulbIcon className="h-10 w-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-400">Waiting for your input...</h3>
                                <p className="text-gray-500 mt-2 max-w-sm">
                                    Fill out the form to receive a tailored rental strategy, legal workarounds, and safety tips for your specific asset.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AIAssistantPage;
