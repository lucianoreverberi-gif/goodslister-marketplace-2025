import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, MicrophoneIcon, ChevronRightIcon } from './icons';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface HeroSectionModernProps {
  userLocation?: { city: string; state: string; lat: number; lng: number };
  onSearch: (query: string) => void;
  onCategoryClick: (category: string) => void;
  onChangeLocation: () => void;
  isSearching?: boolean;
  totalListings?: number;
  totalCities?: number;
}

const QUICK_CATEGORIES = [
  { name: 'Camping', icon: 'ðï¸' },
  { name: 'Water Sports', icon: 'ð' },
  { name: 'Cycling', icon: 'ð´' },
  { name: 'Winter', icon: 'ð¿' },
  { name: 'Photography', icon: 'ð¸' },
  { name: 'Motorized', icon: 'ðï¸' }
];

const HeroSectionModern: React.FC<HeroSectionModernProps> = ({
  userLocation,
  onSearch,
  onCategoryClick,
  onChangeLocation,
  isSearching = false,
  totalListings,
  totalCities
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const locationLabel = userLocation
    ? `${userLocation.city}${userLocation.state ? `, ${userLocation.state}` : ''}`
    : 'Detecting location...';

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      ></div>

      {/* Content */}
      <div className="relative container mx-auto px-6 py-20 md:py-28 lg:py-32 min-h-[85vh] flex flex-col justify-center">
        
        {/* Location badge */}
        <div className="flex justify-center mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <button
            onClick={onChangeLocation}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-400/60 hover:bg-white/10 transition-all shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]"
          >
            <span className="text-cyan-400 text-sm">ð</span>
            <span className="text-sm font-semibold text-slate-100">{locationLabel}</span>
            <span className="text-xs text-slate-400 group-hover:text-cyan-400 transition-colors">Change</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </button>
        </div>

        {/* Headline */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-4">
            <span className="block">Rent the</span>
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              adventure gear
            </span>
            <span className="block text-slate-100">you need.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mt-6 font-light">
            Peer-to-peer marketplace for outdoor and adventure equipment. 
            <span className="text-cyan-400 font-semibold"> From your neighbors, near you.</span>
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto w-full mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          <div className="relative group">
            {/* Glow behind search */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
            
            <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="pl-5 pr-3 text-cyan-400">
                <SearchIcon className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Try 'camping tent for 4 people' or 'kayak this weekend'"
                className="flex-1 bg-transparent py-5 px-2 text-white text-base md:text-lg placeholder-slate-500 focus:outline-none"
              />
              {recognitionRef.current && (
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`p-3 mr-2 rounded-xl transition-all ${
                    isListening
                      ? 'bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                      : 'text-slate-400 hover:text-cyan-400 hover:bg-white/5'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice search'}
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="mr-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm uppercase tracking-wider hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Quick category pills */}
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto mb-10 animate-in fade-in duration-1000 delay-500">
          {QUICK_CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => onCategoryClick(cat.name)}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 text-sm text-slate-300 hover:text-white transition-all"
            >
              <span>{cat.icon}</span>
              <span className="font-medium">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Trust bar */}
        {(totalListings || totalCities) && (
          <div className="flex justify-center gap-8 md:gap-12 pt-8 border-t border-white/5 animate-in fade-in duration-1000 delay-700">
            {totalListings && (
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {totalListings.toLocaleString()}+
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Items available</div>
              </div>
            )}
            {totalCities && (
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {totalCities}+
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Cities</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                100%
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Verified hosts</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom fade to transition into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
    </section>
  );
};

export default HeroSectionModern;

