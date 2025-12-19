import React, { useState, useEffect, useRef } from 'react';
import { Listing, HeroSlide, Banner, ListingCategory, CategoryImagesMap, Page } from '../types';
import ListingCard from './ListingCard';
import CategoryCard from './CategoryCard';
import { processSearchQuery, FilterCriteria } from '../services/geminiService';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, ShieldCheckIcon, SmileIcon, UserCheckIcon, WalletIcon, MessageCircleIcon, FileSignatureIcon, MicrophoneIcon, ScanIcon, BrainIcon, ZapIcon, GlobeIcon, UploadCloudIcon, MessageSquareIcon } from './icons';
import FAQSection from './FAQSection';

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
    onNavigate: (page: Page) => void;
    listings: Listing[];
    heroSlides: HeroSlide[];
    banners: Banner[];
    categoryImages: CategoryImagesMap;
    favorites: string[];
    onToggleFavorite: (id: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
    onListingClick, onCreateListing, onSearch, onNavigate, listings, heroSlides, banners, categoryImages, favorites, onToggleFavorite 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [howItWorksTab, setHowItWorksTab] = useState<'renter' | 'owner'>('renter');
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
            alert("Tu navegador no soporta búsqueda por voz.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            alert("Acceso al micrófono denegado.");
            return;
        }
        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'es-ES';
            recognition.onstart = () => setIsListening(true);
            recognition.onresult = async (event: any) => {
                const transcript = event.results[0][0].transcript;
                setSearchQuery(transcript);
                await performSearch(transcript);
            };
            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        }
        recognitionRef.current.start();
    };

    const handleCategoryClick = (category: string) => onSearch({ category: category as ListingCategory });
    const nextSlide = () => setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    const prevSlide = () => setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);

    const featuredListings = listings.filter(l => l.isFeatured);

    const handleBannerClick = (banner: Banner) => {
        if (banner.linkUrl) {
            const path = banner.linkUrl.startsWith('/') ? banner.linkUrl.substring(1) : banner.linkUrl;
            if (path === 'explore') onNavigate('explore');
            else if (path === 'createListing') onNavigate('createListing');
            else if (path === 'aiAssistant') onNavigate('aiAssistant');
            else if (path === 'userDashboard') onNavigate('userDashboard');
            else onNavigate(path as Page);
        } else {
            onCreateListing();
        }
    };

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
                            <button onClick={() => handleBannerClick(banner)} className="inline-block py-3 px-8 text-gray-900 font-semibold rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-lg">
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
                            <button onClick={() => handleBannerClick(banner)} className="flex-shrink-0 py-3 px-8 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors whitespace-nowrap">
                                {banner.buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div key={banner.id} className="relative bg-gray-800 h-[500px] text-white flex items-center justify-center overflow-hidden rounded-2xl shadow-xl">
                <div className="absolute inset-0">
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>
                <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{banner.title}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-200">{banner.description}</p>
                    <button onClick={() => handleBannerClick(banner)} className="mt-8 inline-block py-3 px-8 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors">
                        {banner.buttonText}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <main>
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
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{heroSlides[currentSlide]?.title}</h1>
                    <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-200">{heroSlides[currentSlide]?.subtitle}</p>
                    <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto flex items-center rounded-lg shadow-lg bg-white">
                        <div className="relative w-full">
                           <input
                                id="hero-search-input"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 rounded-l-lg border-none focus:ring-0 text-gray-900"
                                placeholder={isListening ? "Escuchando..." : "Busca un kayak para 2 en Bariloche..."}
                            />
                            <button type="button" onClick={handleVoiceSearch} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-cyan-600'}`}>
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

            <div id="how-it-works" className="bg-white py-16 sm:py-24 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">¿Cómo funciona Goodslister?</h2>
                <div className="flex justify-center mt-8 mb-12">
                    <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                        <button onClick={() => setHowItWorksTab('renter')} className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${howItWorksTab === 'renter' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Para Renters</button>
                        <button onClick={() => setHowItWorksTab('owner')} className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${howItWorksTab === 'owner' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Para Dueños</button>
                    </div>
                </div>
                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                    {howItWorksTab === 'renter' ? (
                        <>
                            <div className="text-center"><div className="bg-cyan-100 text-cyan-600 rounded-full p-4 mb-4 inline-block"><SearchIcon className="h-8 w-8" /></div><h3 className="text-lg font-semibold">1. Busca y Encuentra</h3><p className="mt-2 text-gray-600">Explora miles de bienes verificados cerca de ti.</p></div>
                            <div className="text-center"><div className="bg-cyan-100 text-cyan-600 rounded-full p-4 mb-4 inline-block"><ShieldCheckIcon className="h-8 w-8" /></div><h3 className="text-lg font-semibold">2. Reserva con Confianza</h3><p className="mt-2 text-gray-600">Pagos protegidos y contratos inteligentes.</p></div>
                            <div className="text-center"><div className="bg-cyan-100 text-cyan-600 rounded-full p-4 mb-4 inline-block"><SmileIcon className="h-8 w-8" /></div><h3 className="text-lg font-semibold">3. Vive la Aventura</h3><p className="mt-2 text-gray-600">Retira el equipo y disfruta al máximo.</p></div>
                        </>
                    ) : (
                        <>
                            <div className="text-center"><div className="bg-green-100 text-green-600 rounded-full p-4 mb-4 inline-block"><UploadCloudIcon className="h-8 w-8" /></div><h3 className="text-lg font-semibold">1. Publica tu Bien</h3><p className="mt-2 text-gray-600">Nuestra IA te ayuda con fotos y descripciones.</p></div>
                            <div className="text-center"><div className="bg-green-100 text-green-600 rounded-full p-4 mb-4 inline-block"><MessageSquareIcon className="h-8 w-8" /></div><h3 className="text-lg font-semibold">2. Gestiona Reservas</h3><p className="mt-2 text-gray-600">Chatea con renters verificados y aprueba solicitudes.</p></div>
                            <div className="text-center"><div className="bg-green-100 text-green-600 rounded-full p-4 mb-4 inline-block"><WalletIcon className="h-8 w-8" /></div><h3 className="text-lg font-semibold">3. Gana Dinero</h3><p className="mt-2 text-gray-600">Recibe pagos seguros directamente en tu cuenta.</p></div>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-gray-50 py-16 sm:py-24">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">Intelligence, Integrated.</h2>
                    <p className="mt-4 text-lg text-gray-600">Diseñado para que la IA trabaje para ti.</p>
                    <div className="mt-16 flex flex-wrap justify-center gap-8">
                        <div onClick={() => document.getElementById('hero-search-input')?.focus()} className="flex flex-col items-center text-center cursor-pointer group hover:bg-white p-6 rounded-xl transition-all w-full sm:w-72">
                            <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-6"><BrainIcon className="h-10 w-10" /></div>
                            <h3 className="text-xl font-semibold">Neural Search</h3>
                            <p className="mt-2 text-sm text-gray-600">Describe lo que buscas con tus propias palabras.</p>
                        </div>
                        <div onClick={() => onNavigate('aiAssistant')} className="flex flex-col items-center text-center cursor-pointer group hover:bg-white p-6 rounded-xl transition-all w-full sm:w-72">
                            <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-6"><UserCheckIcon className="h-10 w-10" /></div>
                            <h3 className="text-xl font-semibold">AI Identity Guard</h3>
                            <p className="mt-2 text-sm text-gray-600">Seguridad de nivel bancario. Nuestra IA escanea y verifica identificaciones oficiales en segundos.</p>
                        </div>
                        <div onClick={() => onNavigate('createListing')} className="flex flex-col items-center text-center cursor-pointer group hover:bg-white p-6 rounded-xl transition-all w-full sm:w-72">
                            <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-6"><ZapIcon className="h-10 w-10" /></div>
                            <h3 className="text-xl font-semibold">Optimized Listings</h3>
                            <p className="mt-2 text-sm text-gray-600">Crea publicaciones de alto impacto con un solo clic.</p>
                        </div>
                        <div onClick={() => onNavigate('userDashboard')} className="flex flex-col items-center text-center cursor-pointer group hover:bg-white p-6 rounded-xl transition-all w-full sm:w-72">
                            <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-6"><ScanIcon className="h-10 w-10" /></div>
                            <h3 className="text-xl font-semibold">AI Smart Inspector</h3>
                            <p className="mt-2 text-sm text-gray-600">Compara fotos antes/después para detectar daños automáticamente.</p>
                        </div>
                    </div>
                </div>
            </div>

            {featuredListings.length > 0 && (
                 <div className="bg-white py-16 sm:py-24">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-12">Bienes Destacados</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredListings.map(listing => (
                                <ListingCard key={listing.id} listing={listing} onClick={onListingClick} isFavorite={favorites.includes(listing.id)} onToggleFavorite={onToggleFavorite} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <FAQSection />

            <div className="py-16 sm:py-24">
                <div className="container mx-auto px-4 flex flex-col gap-12">
                    {banners.map(banner => renderBanner(banner))}
                </div>
            </div>
        </main>
    );
};

export default HomePage;