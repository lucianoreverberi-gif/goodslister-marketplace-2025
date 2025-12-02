
import React, { useState } from 'react';
import { ListingCategory } from '../types';
import { WandSparklesIcon, CheckCircleIcon, AlertIcon, UploadCloudIcon, PencilIcon, LightbulbIcon, LockIcon } from './icons';
import { generateImageForListing } from '../services/imageService';

interface AICoverGeneratorStepProps {
    category: ListingCategory | '';
    realPhotoCount: number;
    onImageGenerated: (imageUrl: string) => void;
}

const SETTINGS = [
    'Tropical Beach', 'Mountain Lake', 'Urban Marina', 'Open Ocean', 
    'Desert Dunes', 'Forest Trail', 'Snowy Peak', 'City Street', 'Studio Background'
];

const LIGHTING = [
    'Golden Hour Sunset', 'Bright Midday Sun', 'Misty Morning', 'Dramatic Cloudy Sky', 'Neon Night', 'Soft Studio Lighting'
];

const MOODS = [
    'High Adrenaline Action', 'Peaceful & Relaxing', 'Luxurious & Romantic', 'Fun Family Gathering', 'Cinematic & Epic', 'Minimalist & Clean'
];

const AICoverGeneratorStep: React.FC<AICoverGeneratorStepProps> = ({ category, realPhotoCount, onImageGenerated }) => {
    const [itemDetails, setItemDetails] = useState('');
    const [setting, setSetting] = useState(SETTINGS[0]);
    const [lighting, setLighting] = useState(LIGHTING[0]);
    const [mood, setMood] = useState(MOODS[0]);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [hasAgreed, setHasAgreed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRUST GATE: Strict enforcement
    if (realPhotoCount < 3) {
        return (
            <div className="relative my-8 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                {/* Blurred Background to suggest value */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b')] bg-cover bg-center opacity-10 filter blur-sm"></div>
                
                <div className="relative p-8 flex flex-col items-center text-center z-10">
                    <div className="bg-amber-100 p-4 rounded-full text-amber-600 mb-4 shadow-sm ring-4 ring-amber-50">
                        <LockIcon className="h-8 w-8" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900">Unlock AI Hero Image Studio</h3>
                    
                    <div className="mt-4 p-4 bg-white/80 backdrop-blur-md rounded-lg border border-amber-200 max-w-lg shadow-sm">
                        <div className="flex items-start gap-3">
                            <AlertIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-amber-900 text-sm font-medium text-left">
                                To maintain trust on Goodslister, you must upload at least <strong>3 real photos</strong> of your item's actual condition before you can generate an AI cover image.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-500">Progress:</span>
                        <div className="flex gap-1">
                            {[1, 2, 3].map((step) => (
                                <div 
                                    key={step} 
                                    className={`h-2 w-8 rounded-full ${realPhotoCount >= step ? 'bg-green-500' : 'bg-gray-300'}`}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-gray-600 ml-2">
                            {realPhotoCount}/3 Photos
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    const constructAIPrompt = () => {
        const subject = itemDetails.trim() 
            ? itemDetails 
            : (category ? `a ${category.toLowerCase().slice(0, -1)}` : "an item");

        return `Professional, photorealistic lifestyle shot of ${subject}. 
        The scene is set in a ${setting}. 
        Lighting condition: ${lighting}. 
        The overall mood is ${mood}. 
        High resolution, 4k, highly detailed, cinematic composition.`;
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);
        setHasAgreed(false);

        try {
            const prompt = constructAIPrompt();
            // Call the robust Google Gemini service
            const url = await generateImageForListing("", "", prompt); 
            setGeneratedImage(url);
        } catch (err) {
            console.error(err);
            setError("We couldn't generate the image. Please try adjusting your description or try again in a moment.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApply = () => {
        if (generatedImage && hasAgreed) {
            onImageGenerated(generatedImage);
            setGeneratedImage(null);
            setHasAgreed(false);
            setItemDetails(''); 
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-1 border border-purple-100 shadow-md my-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2.5 rounded-lg text-white shadow-lg">
                        <WandSparklesIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-indigo-900">AI Hero Image Studio</h3>
                        <p className="text-xs text-indigo-600 font-medium">Create a click-worthy cover photo in seconds.</p>
                    </div>
                    <span className="ml-auto bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-indigo-200">
                        Unlocked
                    </span>
                </div>

                {/* Step 1: Description */}
                <div className="mb-5">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <PencilIcon className="h-3 w-3" />
                        1. Describe your Item
                    </label>
                    <div className="relative">
                        <textarea
                            value={itemDetails}
                            onChange={(e) => setItemDetails(e.target.value)}
                            placeholder={`E.g. A 2024 Yamaha Jet Ski, bright red and black, speeding through waves...`}
                            className="w-full p-4 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[80px] shadow-sm bg-white resize-none"
                        />
                        {itemDetails.length === 0 && (
                            <div className="absolute top-3 right-3 hidden sm:block pointer-events-none opacity-60">
                                <LightbulbIcon className="h-4 w-4 text-amber-500" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 2: Vibe Selectors */}
                <div className="mb-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <WandSparklesIcon className="h-3 w-3" />
                        2. Set the Scene
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <select 
                            value={setting} 
                            onChange={(e) => setSetting(e.target.value)}
                            className="w-full text-sm border-gray-200 rounded-lg focus:ring-purple-500 bg-white py-2.5 px-3"
                        >
                            {SETTINGS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select 
                            value={lighting} 
                            onChange={(e) => setLighting(e.target.value)}
                            className="w-full text-sm border-gray-200 rounded-lg focus:ring-purple-500 bg-white py-2.5 px-3"
                        >
                            {LIGHTING.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <select 
                            value={mood} 
                            onChange={(e) => setMood(e.target.value)}
                            className="w-full text-sm border-gray-200 rounded-lg focus:ring-purple-500 bg-white py-2.5 px-3"
                        >
                            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                {!generatedImage && (
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating}
                        className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                Designing your image...
                            </>
                        ) : (
                            <>
                                <WandSparklesIcon className="h-5 w-5 text-purple-300" />
                                Generate Cover Image
                            </>
                        )}
                    </button>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 text-center animate-in fade-in">
                        <div className="flex items-center justify-center gap-2">
                            <AlertIcon className="h-4 w-4" />
                            {error}
                        </div>
                    </div>
                )}

                {generatedImage && (
                    <div className="mt-6 bg-white p-1 rounded-xl border border-gray-200 shadow-lg animate-in fade-in zoom-in-95 duration-300">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 group">
                            <img src={generatedImage} alt="AI Generated Cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded backdrop-blur-sm">AI Generated Preview</span>
                            </div>
                        </div>

                        <div className="p-4">
                            <label className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100/50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={hasAgreed} 
                                    onChange={(e) => setHasAgreed(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-xs text-blue-900 leading-snug">
                                    I acknowledge this is an AI-generated representation. My listing also includes <strong>{realPhotoCount} real photos</strong> of the actual item.
                                </span>
                            </label>

                            <div className="flex gap-3 mt-4">
                                <button 
                                    onClick={() => setGeneratedImage(null)} 
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Discard
                                </button>
                                <button 
                                    onClick={handleApply} 
                                    disabled={!hasAgreed}
                                    className="flex-1 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm flex justify-center items-center gap-2 transition-all"
                                >
                                    <CheckCircleIcon className="h-4 w-4" />
                                    Use as Cover
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AICoverGeneratorStep;
