import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, MicrophoneIcon } from './icons';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface HeaderSearchProps {
  onSearch: (query: string) => void;
  compact?: boolean;
}

// Dictionary of common terms - used for local typo correction
// Categories match app types.ts ListingCategory values
const DICTIONARY = [
  // Categories
  'boats', 'boat', 'yacht', 'yachts',
  'kayaks', 'kayak', 'canoe',
  'jetskis', 'jetski', 'jet ski', 'jetsky',
  'atv', 'quad', 'quads',
  'camping', 'tent', 'tents',
  'fishing', 'rod', 'rods',
  'watersports', 'paddleboard', 'sup', 'kitesurf', 'kitesurfing', 'surf', 'surfboard',
  'snow', 'ski', 'skis', 'snowboard',
  'bikes', 'bike', 'bicycle', 'mountain bike',
  'motorcycles', 'motorcycle', 'moto',
  'rvs', 'rv', 'motorhome',
  // Cities
  'Miami', 'Miami Beach', 'Fort Lauderdale', 'Pembroke Pines', 'Tampa', 'Orlando',
  'Key West', 'Naples', 'Sarasota', 'Jacksonville', 'Boca Raton', 'West Palm Beach'
];

// Simple Levenshtein distance - counts min edits (insertions/deletions/substitutions)
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[][] = Array(a.length + 1).fill(0).map(() => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// Given a word, find the best match in dictionary within tolerance
function correctTypo(word: string): string {
  const lowerWord = word.toLowerCase().trim();
  if (!lowerWord) return word;

  // Exact match (case insensitive) - return properly cased version
  const exactMatch = DICTIONARY.find(d => d.toLowerCase() === lowerWord);
  if (exactMatch) return exactMatch;

  // Tolerance: up to 2 edits for words with 5+ chars, 1 edit for shorter
  const maxDistance = lowerWord.length >= 5 ? 2 : 1;
  let bestMatch = word;
  let bestDistance = maxDistance + 1;

  for (const dictWord of DICTIONARY) {
    const dist = levenshtein(lowerWord, dictWord.toLowerCase());
    if (dist < bestDistance) {
      bestDistance = dist;
      bestMatch = dictWord;
    }
  }
  return bestMatch;
}

// Process full query: split into words, correct each, rebuild
function correctQuery(query: string): string {
  if (!query.trim()) return query;
  // Split on whitespace but preserve original spaces
  const words = query.split(/\s+/).filter(Boolean);
  const corrected = words.map(w => {
    // Skip very short words (a, in, at, of) or numbers
    if (w.length < 3 || /^\d+$/.test(w)) return w;
    return correctTypo(w);
  });
  return corrected.join(' ');
}

const HeaderSearch: React.FC<HeaderSearchProps> = ({ onSearch, compact = false }) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [preview, setPreview] = useState<string>(''); // Shows corrected version
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

  // Show preview of correction as user types (debounced feel)
  useEffect(() => {
    if (!query.trim()) {
      setPreview('');
      return;
    }
    const corrected = correctQuery(query);
    setPreview(corrected !== query ? corrected : '');
  }, [query]);

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
    if (!query.trim()) return;
    // Apply typo correction before firing search
    const corrected = correctQuery(query);
    onSearch(corrected);
    setQuery('');
    setPreview('');
  };

  const applyPreview = () => {
    if (preview) {
      setQuery(preview);
      setPreview('');
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-center bg-gray-100 hover:bg-gray-200/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-400 focus-within:shadow-lg rounded-full transition-all duration-200 ${compact ? 'h-9' : 'h-10'}`}>
          <div className="pl-3 pr-2 text-gray-500 flex-shrink-0">
            <SearchIcon className={compact ? 'w-4 h-4' : 'w-4 h-4'} />
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search: kayak, jetski, boat in Miamiâ¦"
            className={`flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500 ${compact ? 'py-1' : 'py-2'}`}
            aria-label="Search"
          />
          {recognitionRef.current && (
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`p-1.5 mr-1 rounded-full transition-all flex-shrink-0 ${
                isListening
                  ? 'bg-red-500/20 text-red-600 animate-pulse'
                  : 'text-gray-500 hover:text-cyan-600 hover:bg-white'
              }`}
              title={isListening ? 'Stop listening' : 'Search by voice'}
              aria-label={isListening ? 'Stop listening' : 'Search by voice'}
            >
              <MicrophoneIcon className="w-4 h-4" />
            </button>
          )}
          {query.trim() && (
            <button
              type="submit"
              className="mr-1 px-3 py-1 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition-colors flex-shrink-0"
              aria-label="Search"
            >
              Go
            </button>
          )}
        </div>
      </form>

      {/* Typo correction hint */}
      {preview && (
        <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          <button
            type="button"
            onClick={applyPreview}
            className="w-full text-left text-xs text-gray-600 hover:text-gray-900"
          >
            Did you mean: <span className="font-semibold text-cyan-600">{preview}</span>? <span className="text-gray-400">(click to use)</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default HeaderSearch;

