
import React, { useState, useRef, useEffect } from 'react';
import { ListingCategory } from '../types';
import { getAIAdvice } from '../services/geminiService';
import { BrainCircuitIcon, MapPinIcon, SparklesIcon, LightbulbIcon, ShieldCheckIcon, MailIcon } from './icons';

// API Key for Google Maps (Consistent with other components)
const MAPS_API_KEY = 'AIzaSyCvFj8kvMmCc_AtqEAJ1b5feMTpj8EsZS4';

const AIAssistantPage: React.FC = () => {
    // Form State
    const [category, setCategory] = useState<ListingCategory | ''>('');
    const [itemDetails, setItemDetails] = useState('');
    const [location, setLocation] = useState('');
    const [userQuestion, setUserQuestion] = useState('');
    
    // Advice State
    const [isLoading, setIsLoading] = useState(false);
    const [advice, setAdvice] = useState('');
    const [showComingSoon, setShowComingSoon] = useState(false);

    const handleComingSoon = () => {
        setShowComingSoon(true);
        setTimeout(() => setShowComingSoon(false), 3000);
    };

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
                        Don't let legal worries stop you from earning. Our AI Strategist finds <span className="text-cyan-600 font-bold">smart, compliant structure</span> for your specific assets.
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
                                    <p className="mt-8 text-[10px] text-gray-400 italic leading-tight border-t border-gray-100 pt-4">
                                        AI suggestions are informational only and do not constitute legal advice. Always consult a licensed attorney before signing rental contracts or operating regulated assets.
                                    </p>
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
                                    Fill out the form to receive a tailored rental strategy, compliance pathways, and safety tips for your specific asset.
                                </p>
                                <p className="mt-6 text-[10px] text-gray-400 italic max-w-xs">
                                    AI suggestions are informational only and do not constitute legal advice. Always consult a licensed attorney before signing rental contracts or operating regulated assets.
                                </p>
                            </div>
                        )}
                    </div>

                </div>

                {/* Bottom Section: AI Assistant Modules */}
                <div className="mt-20 border-t border-gray-200 pt-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-gray-900">Goodslister AI Assistant</h2>
                        <p className="text-gray-500 mt-3 max-w-xl mx-auto">One intelligent assistant. Built to grow your rental business.</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest text-center mb-10">What it can do for you</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded-full">INCLUDED</span>
                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <BrainCircuitIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Success Coach</h3>
                                <p className="text-gray-500 mt-2 text-xs leading-relaxed">
                                    Optimized your <span className="font-bold text-gray-900">listing, photos & pricing</span> for maximum visibility.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                <span className="absolute top-4 right-4 bg-cyan-100 text-cyan-700 text-[8px] font-black px-2 py-0.5 rounded-full">PRO</span>
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <ShieldCheckIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Legal Shield</h3>
                                <p className="text-gray-500 mt-2 text-xs leading-relaxed">
                                    Expert in <span className="font-bold text-gray-900">Rental Law & Protection</span>. Helps you draft compliance pathways.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                <span className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full">BETA</span>
                                <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <MailIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Auto-Reply</h3>
                                <p className="text-gray-500 mt-2 text-xs leading-relaxed">
                                    Automates the heavy lifting. Vets guests and answers FAQs <span className="font-bold text-gray-900">automatically</span>.
                                </p>
                            </div>

                            <div className="bg-indigo-900 p-8 rounded-3xl border border-indigo-800 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <SparklesIcon className="h-20 w-20 text-white" />
                                </div>
                                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-300 rounded-2xl flex items-center justify-center mb-6">
                                    <BrainCircuitIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Custom Training</h3>
                                <p className="text-indigo-200 mt-2 text-xs leading-relaxed">
                                    Train your assistant on your specific rental rules, unique fleet features, and maintenance schedule.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Plans Section */}
                    <div className="mt-24">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-black text-gray-900">Simple, Transparent Pricing</h2>
                            <p className="text-gray-500 mt-3">Choose the plan that fits your hosting goals.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Plan 1: Starter */}
                            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col">
                                <h3 className="text-xl font-bold text-gray-900">Starter</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-gray-900">$0</span>
                                    <span className="text-gray-500 font-medium">/mo</span>
                                </div>
                                <p className="mt-2 text-sm text-gray-500 font-medium italic">"Get started, see the lift."</p>
                                <ul className="mt-8 space-y-4 flex-1">
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 text-cyan-600" /> Success Coach (5 AI strategies / month)
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 text-cyan-600" /> Basic listing analytics
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 text-cyan-600" /> Email support
                                    </li>
                                </ul>
                                <button onClick={handleComingSoon} className="mt-8 w-full py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all">
                                    Start Free
                                </button>
                            </div>

                            {/* Plan 2: Pro Host */}
                            <div className="bg-white rounded-[2rem] p-8 border-2 border-cyan-500 shadow-2xl relative flex flex-col scale-[1.05] z-10">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-cyan-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                                    MOST POPULAR
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Pro Host</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-gray-900">$29</span>
                                    <span className="text-gray-500 font-medium">/mo</span>
                                </div>
                                <p className="mt-2 text-sm text-gray-500 font-medium italic">"For active hosts who want to scale."</p>
                                <ul className="mt-8 space-y-4 flex-1">
                                    <li className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                                        <SparklesIcon className="h-4 w-4 text-orange-400" /> Unlimited AI strategies
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                                        <SparklesIcon className="h-4 w-4 text-orange-400" /> Auto-Reply (BETA)
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 text-cyan-600" /> Pre-approved templates by state
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 text-cyan-600" /> Priority search placement
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 text-cyan-600" /> "Verified Pro Host" badge
                                    </li>
                                </ul>
                                <button onClick={handleComingSoon} className="mt-8 w-full py-4 bg-cyan-600 text-white font-black rounded-2xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-200">
                                    Start 14-day trial
                                </button>
                                <p className="mt-3 text-[10px] text-center text-gray-400 font-medium">No charge for 14 days. Cancel anytime.</p>
                            </div>

                            {/* Plan 3: Concierge */}
                            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col">
                                <h3 className="text-xl font-bold text-gray-900">Concierge</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-gray-900">$149</span>
                                    <span className="text-gray-500 font-medium">/mo</span>
                                </div>
                                <p className="mt-2 text-sm text-gray-500 font-medium italic">"For fleet owners (5+ items)."</p>
                                <ul className="mt-8 space-y-4 flex-1">
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 text-cyan-600" /> Everything in Pro Host
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 text-cyan-600" /> AI trained on your fleet
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 text-cyan-600" /> WhatsApp & SMS automation
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 text-cyan-600" /> 1:1 onboarding (30 min call)
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 text-cyan-600" /> Monthly performance report
                                    </li>
                                </ul>
                                <button onClick={handleComingSoon} className="mt-8 w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all">
                                    Talk to Sales
                                </button>
                            </div>

                            {/* Plan 4: Enterprise */}
                            <div className="bg-gray-900 rounded-[2rem] p-8 shadow-xl flex flex-col text-white">
                                <h3 className="text-xl font-bold">Enterprise</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-white">Custom</span>
                                </div>
                                <p className="mt-2 text-sm text-gray-400 font-medium italic">"For brands & fleets of 20+."</p>
                                <ul className="mt-8 space-y-4 flex-1">
                                    <li className="flex items-center gap-3 text-sm text-gray-300">
                                        <ShieldCheckIcon className="h-4 w-4 text-indigo-400" /> Custom AI training
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-300">
                                        <ShieldCheckIcon className="h-4 w-4 text-indigo-400" /> Dedicated account manager
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-300">
                                        <ShieldCheckIcon className="h-4 w-4 text-indigo-400" /> SLA & uptime guarantee
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-300">
                                        <ShieldCheckIcon className="h-4 w-4 text-indigo-400" /> White-label option
                                    </li>
                                </ul>
                                <button onClick={handleComingSoon} className="mt-8 w-full py-4 bg-white text-gray-900 font-black rounded-2xl hover:bg-gray-100 transition-all">
                                    Contact Us
                                </button>
                            </div>

                        </div>

                        {/* Trusted By Bar */}
                        <div className="mt-20 py-10 border-t border-gray-100 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Featured & Trusted By</p>
                            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-30 grayscale font-black text-lg text-gray-600">
                                <span>TechCrunch</span>
                                <span>FORBES</span>
                                <span>Inc.</span>
                                <span>Wired</span>
                                <span>Business Insider</span>
                            </div>
                        </div>

                        {/* FAQ Section */}
                        <div className="mt-24 max-w-3xl mx-auto">
                            <h2 className="text-3xl font-black text-gray-900 text-center mb-12">Common Questions</h2>
                            <div className="space-y-6">
                                {[
                                    { q: "Can I cancel anytime?", a: "Yes. No long-term contracts. Cancel from your billing dashboard anytime." },
                                    { q: "What happens after my free trial?", a: "We'll only charge you if you decide to continue. We'll send a reminder 3 days before the trial ends." },
                                    { q: "Is my data private?", a: "Yes. Your listing data, messages, and AI interactions are encrypted and never sold or shared. See our Privacy Policy." },
                                    { q: "Do you offer refunds?", a: "Yes. 30-day money-back guarantee on all paid plans. No questions asked." }
                                ].map((item, i) => (
                                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h4 className="font-bold text-gray-900">{item.q}</h4>
                                        <p className="mt-2 text-sm text-gray-500 leading-relaxed font-medium">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showComingSoon && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-[150] animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3">
                    <BrainCircuitIcon className="h-5 w-5 text-cyan-400" />
                    <span className="text-sm font-bold">Coming soon — checkout integration in progress</span>
                </div>
            )}
        </div>
    );
};

export default AIAssistantPage;
