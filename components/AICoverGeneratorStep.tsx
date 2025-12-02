
import React, { useState } from 'react';
import { ListingCategory } from '../types';
import { WandSparklesIcon, CheckCircleIcon, AlertIcon, UploadCloudIcon, PencilIcon, LightbulbIcon } from './icons';
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

    // TRUST GATE: Check if user has uploaded real photos
    if (realPhotoCount < 3) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center my-6">
                <div className="flex justify-center mb-4 text-amber-500">
                    <AlertIcon className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold text-amber-900">Unlock AI Hero Generator</h3>
                <p className="text-amber-800 mt-2 text-sm max-w-lg mx-auto">
                    To maintain trust on Goodslister, you must upload at least <strong>3 real photos</strong> of your item's actual condition before you can generate an AI cover image.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-amber-700 font-mono text-xs bg-amber-100 px-3 py-1 rounded">
                    <UploadCloudIcon className="h-3 w-3" /> Current count: {realPhotoCount} / 3
                </div>
            </div>
        );
    }

    const constructAIPrompt = () => {
        // Use user input if available, otherwise fallback to generic based on category
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
        // Allow generation if either category is selected OR user typed something
        if (!category && !itemDetails) return;
        
        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);
        setHasAgreed(false);

        try {
            const prompt = constructAIPrompt();
            // We pass the full prompt to the service as the 3rd argument
            const url = await generateImageForListing("", "", prompt); 
            setGeneratedImage(url);
        } catch (err) {
            console.error(err);
            setError("Failed to generate image. Please try again or refine your description.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApply = () => {
        if (generatedImage && hasAgreed) {
            onImageGenerated(generatedImage);
            setGeneratedImage(null); // Reset after applying
            setHasAgreed(false);
            setItemDetails(''); // Optional: clear description
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100 shadow-sm my-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-600 p-2 rounded-lg text-white shadow-md">
                    <WandSparklesIcon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-purple-900">AI Hero Image Studio</h3>
                    <p className="text-xs text-purple-700">Create a stunning cover photo to boost clicks.</p>
                </div>
                <span className="ml-auto bg-purple-200 text-purple-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">Premium</span>
            </div>

            {/* Step 1: Description */}
            <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-bold text-purple-900 mb-2">
                    <PencilIcon className="h-4 w-4" />
                    Describe your Item
                </label>
                <div className="relative">
                    <textarea
                        value={itemDetails}
                        onChange={(e) => setItemDetails(e.target.value)}
                        placeholder={`E.g. A 2023 Yamaha Waverunner in bright blue and white, sporty design...`}
                        className="w-full p-4 text-sm border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500 min-h-[100px] shadow-sm"
                    />
                    {itemDetails.length === 0 && (
                        <div className="absolute top-3 right-3 p-2 bg-purple-100 rounded-md max-w-[200px] hidden sm:block pointer-events-none">
                            <p className="text-[10px] text-purple-800 font-medium flex gap-1 items-start">
                                <LightbulbIcon className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                Tip: Include Model, Color, and Year for best results.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Step 2: Vibe Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-xs font-bold text-purple-800 uppercase mb-1">Background</label>
                    <select 
                        value={setting} 
                        onChange={(e) => setSetting(e.target.value)}
                        className="w-full text-sm border-purple-200 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-white"
                    >
                        {SETTINGS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-purple-800 uppercase mb-1">Lighting</label>
                    <select 
                        value={lighting} 
                        onChange={(e) => setLighting(e.target.value)}
                        className="w-full text-sm border-purple-200 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-white"
                    >
                        {LIGHTING.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-purple-800 uppercase mb-1">Mood</label>
                    <select 
                        value={mood} 
                        onChange={(e) => setMood(e.target.value)}
                        className="w-full text-sm border-purple-200 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-white"
                    >
                        {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>

            {!generatedImage && (
                <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || (!category && !itemDetails)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    {isGenerating ? (
                        <>
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            Generating Scene...
                        </>
                    ) : (
                        <>
                            <WandSparklesIcon className="h-5 w-5" />
                            Generate Cover Image
                        </>
                    )}
                </button>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 text-center">
                    {error}
                </div>
            )}

            {generatedImage && (
                <div className="mt-6 bg-white p-4 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-bottom-4">
                    <h4 className="font-bold text-gray-800 mb-2 text-sm">Preview</h4>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-inner bg-gray-100 mb-4 group">
                        <img src={generatedImage} alt="AI Generated Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                            AI Generated
                        </div>
                    </div>

                    <label className="flex items-start gap-3 p-3 bg-purple-50 rounded border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={hasAgreed} 
                            onChange={(e) => setHasAgreed(e.target.checked)}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-xs text-purple-900 leading-tight">
                            I understand this image is for <strong>inspirational purposes only</strong>. I have already provided real photos that accurately represent the item's true condition.
                        </span>
                    </label>

                    <div className="flex gap-3 mt-4">
                        <button 
                            onClick={() => setGeneratedImage(null)} 
                            className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Discard
                        </button>
                        <button 
                            onClick={handleApply} 
                            disabled={!hasAgreed}
                            className="flex-1 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm flex justify-center items-center gap-2 transition-colors"
                        >
                            <CheckCircleIcon className="h-4 w-4" />
                            Use as Cover Photo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AICoverGeneratorStep;
