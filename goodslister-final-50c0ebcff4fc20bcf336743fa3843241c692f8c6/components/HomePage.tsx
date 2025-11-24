
import React, { useState, useEffect, useRef } from 'react';
import { Listing, HeroSlide, Banner, ListingCategory, CategoryImagesMap } from '../types';
import ListingCard from './ListingCard';
import CategoryCard from './CategoryCard';
import { processSearchQuery, FilterCriteria } from '../services/geminiService';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, ShieldCheckIcon, SmileIcon, UserCheckIcon, WalletIcon, MessageCircleIcon, BrainCircuitIcon, FileSignatureIcon, WandSparklesIcon, LanguagesIcon, MicrophoneIcon } from './icons';

// Extend the global Window interface for SpeechRecognition APIs
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface HomePageProps {
    onListingClick: (id: string) => void;
    onCreateListing: () => void;
    onSearch: (criteria: FilterCriteria) => void;
    listings: Listing[];
    heroSlides: HeroSlide[];
    banners: Banner[];
    categoryImages: CategoryImagesMap;
}

const HomePage: React.FC<HomePageProps> = ({ onListingClick, onCreateListing, onSearch, listings, heroSlides, banners, categoryImages }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    
    const performSearch = async (query: string) => {
        setIsSearching(true);
        if (!query.trim()) {
            onSearch({});
            setIsSearching(false);
            return;
        }
        const criteria = await processSearchQuery(query);
        onSearch(criteria);
        setIsSearching(false);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        await performSearch(searchQuery);
    };

    const handleVoiceSearch = async () => {
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support voice recognition. Please try Google Chrome.");
            return;
        }

        // Explicitly request microphone permission to improve reliability and provide clearer error messages.
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // The stream is only used to trigger the permission prompt. We should stop the tracks immediately
            // to turn off the microphone indicator in the browser.
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Microphone permission error:", err);
            alert("Microphone access is required for voice search. Please grant permission in your browser settings and try again.");
            return;
        }

        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            
            recognition.onstart = () => {
                setIsListening(true);
                setSearchQuery('');
            };

            recognition.onresult = async (event: any) => {
                const transcript = event.results[0][0].transcript;
                setSearchQuery(transcript);
                await performSearch(transcript);
            };

            recognition.onerror = (event: any) => {
                console.error("Voice recognition error:", event.error);
                // The main permission error is now caught by getUserMedia, but this is a fallback.
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    alert('Permission to use the microphone was denied. Please enable it in your browser settings.');
                } else {
                    alert(`An error occurred during voice recognition: ${event.error}. Please try again.`);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };
            
            recognitionRef.current = recognition;
        }

        recognitionRef.current.start();
    };

    const handleCategoryClick = (category: string) => {
        onSearch({ category: category as ListingCategory });
    };

    const nextSlide = () => setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    const prevSlide = () => setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);

    const featuredListings = listings.filter(l => l.isFeatured);

    const renderBanner = (banner: Banner) => {
        const layout = banner.layout || 'overlay';

        if (layout === 'split') {
            return (
                <div key={banner.id} className="bg-white h-[500px] flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-xl">
                    <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover"/>
                    </div>
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gray-900 text-white">
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{banner.title}</h2>
                        <p className="mt-4 text-lg text-gray-300">{banner.description}</p>
                        <div className="mt-8">
                            <button onClick={onCreateListing} className="inline-block py-3 px-8 text-gray-900 font-semibold rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-lg">
                                {banner.buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (layout === 'wide') {
            return (
                <div key={banner.id} className="bg-white overflow-hidden rounded-2xl shadow-xl">
                    <div className="h-[300px] md:h-[400px] relative">
                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                             <span className="inline-block py-1 px-3 rounded-full bg-cyan-600 text-white text-xs font-bold tracking-wider uppercase mb-2">Featured</span>
                        </div>
                    </div>
                    <div className="p-8 md:p-10 bg-white">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{banner.title}</h2>
                                <p className="mt-2 text-gray-600 max-w-2xl">{banner.description}</p>
                            </div>
                            <button onClick={onCreateListing} className="flex-shrink-0 py-3 px-8 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors whitespace-nowrap">
                                {banner.buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Default 'overlay' layout
        return (
            <div key={banner.id} className="relative bg-gray-800 h-[500px] text-white flex items-center justify-center overflow-hidden rounded-2xl shadow-xl">
                <div className="absolute inset-0">
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>
                <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        {banner.title}
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-200">
                        {banner.description}
                    </p>
                    <button onClick={onCreateListing} className="mt-8 inline-block py-3 px-8 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors">
                        {banner.buttonText}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <main>
            {/* Hero section */}
            <div className="relative bg-gray-800 h-[95vh] text-white flex items-center justify-center overflow-hidden">
                 <div className="absolute inset-0">
                    {heroSlides.map((slide, index) => (
                         <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                            <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-black/50"></div>
                        </div>
                    ))}
                 </div>
                 <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        {heroSlides[currentSlide]?.title}
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-200">
                        {heroSlides[currentSlide]?.subtitle}
                    </p>
                    <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto flex items-center rounded-lg shadow-lg bg-white">
                        <div className="relative w-full">
                           <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 rounded-l-lg border-none focus:ring-0 text-gray-900"
                                placeholder={isListening ? "Listening..." : "Search for kayak for 2 in Miami beach"}
                            />
                            <button 
                                type="button" 
                                onClick={handleVoiceSearch}
                                aria-label="Search by voice"
                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-cyan-600'}`}
                            >
                                <MicrophoneIcon className="h-6 w-6"/>
                            </button>
                        </div>
                        <button type="submit" disabled={isSearching} className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-r-lg hover:bg-cyan-700 disabled:bg-gray-400 flex items-center self-stretch">
                            {isSearching ? '...' : <SearchIcon className="h-5 w-5"/>}
                        </button>
                    </form>
                </div>
                {heroSlides.length > 1 && <>
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/30 rounded-full hover:bg-white/50 text-white transition z-20"><ChevronLeftIcon/></button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/30 rounded-full hover:bg-white/50 text-white transition z-20"><ChevronRightIcon/></button>
                </>}
            </div>

            <>
                {/* How it Works Section */}
                <div id="how-it-works" className="bg-white py-16 sm:py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">How does Goodslister work?</h2>
                        <p className="mt-4 text-lg leading-8 text-gray-600">Renting has never been so easy, fast, and secure.</p>
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-cyan-100 text-cyan-600 rounded-full p-4 mb-4">
                                    <SearchIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">1. Search and Find</h3>
                                <p className="mt-2 text-base text-gray-600">Explore thousands of items listed by verified owners in your area. Use our smart search to find exactly what you need.</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-cyan-100 text-cyan-600 rounded-full p-4 mb-4">
                                    <ShieldCheckIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">2. Book with Confidence</h3>
                                <p className="mt-2 text-base text-gray-600">Communicate directly with the owner, agree on the dates, and pay securely through our platform with built-in protection.</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-cyan-100 text-cyan-600 rounded-full p-4 mb-4">
                                    <SmileIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">3. Enjoy the Adventure</h3>
                                <p className="mt-2 text-base text-gray-600">Pick up the item and live your experience. When you're done, return the item and rate the owner to help our trusted community grow.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Featured Listings */}
                {featuredListings.length > 0 && (
                     <div className="bg-gray-50 py-16 sm:py-24">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-center mb-12">Featured Goods</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {featuredListings.map(listing => (
                                    <ListingCard key={listing.id} listing={listing} onClick={onListingClick} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories Section */}
                <div className="bg-white py-16 sm:py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                         <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Explore Universes of Adventure</h2>
                            <p className="mt-4 text-lg leading-8 text-gray-600">Each category is a portal to a new experience.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                            {Object.entries(categoryImages).map(([category, imageUrl]) => (
                                <CategoryCard
                                    key={category}
                                    name={category}
                                    imageUrl={imageUrl}
                                    onClick={handleCategoryClick}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI Features Section */}
                <div className="bg-gray-50 py-16 sm:py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Intelligence, Integrated.</h2>
                        <p className="mt-4 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">We've designed a platform where AI works for you, making everything simpler, faster, and safer.</p>
                        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-6">
                                    <BrainCircuitIcon className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">Neural Search</h3>
                                <p className="mt-2 text-base text-gray-600">Describe what you're looking for in your own words. Our AI interprets your intent to find the perfect gear.</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-6">
                                    <FileSignatureIcon className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">Smart Contracts</h3>
                                <p className="mt-2 text-base text-gray-600">Generate detailed rental agreements in seconds. AI protects your interests with clear and concise clauses.</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-6">
                                    <WandSparklesIcon className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">Optimized Listings</h3>
                                <p className="mt-2 text-base text-gray-600">Create high-impact listings with a single click. Our AI writes descriptions that capture attention and convert.</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-6">
                                    <LanguagesIcon className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">Multilingual Chat</h3>
                                <p className="mt-2 text-base text-gray-600">Communicate globally with instant AI-powered translations directly in your chat conversations.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Trust & Safety Section */}
                <div className="bg-white py-16 sm:py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Your Trust is Our Priority</h2>
                        <p className="mt-4 text-lg leading-8 text-gray-600">We build a safe community so you can rent with peace of mind.</p>
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-green-100 text-green-600 rounded-full p-4 mb-4">
                                    <UserCheckIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Profile Verification</h3>
                                <p className="mt-2 text-base text-gray-600">We verify the identity of all our members to ensure safe and reliable interactions.</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-green-100 text-green-600 rounded-full p-4 mb-4">
                                    <WalletIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Secure and Protected Payments</h3>
                                <p className="mt-2 text-base text-gray-600">We process all payments through an encrypted gateway to protect your financial information.</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-green-100 text-green-600 rounded-full p-4 mb-4">
                                    <MessageCircleIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">24/7 Support</h3>
                                <p className="mt-2 text-base text-gray-600">Our support team is available day and night to help you with any questions or issues.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banners */}
                <div className="py-16 sm:py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
                        {banners.map(banner => renderBanner(banner))}
                    </div>
                </div>
            </>
        </main>
    );
};

export default HomePage;
