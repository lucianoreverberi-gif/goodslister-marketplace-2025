
import React, { useState, useEffect } from 'react';
import { ListingCategory } from '../types';
import { WandSparklesIcon, CheckCircleIcon, AlertIcon, UploadCloudIcon, PencilIcon, LightbulbIcon, LockIcon, PaletteIcon, TagIcon, CameraIcon } from './icons';
import { generateImageForListing } from '../services/imageService';

interface AICoverGeneratorStepProps {
    category: ListingCategory | '';
    realPhotoCount: number;
    onImageGenerated: (imageUrl: string) => void;
}

// Inspiration Chips Configuration
const INSPIRATION_CHIPS = {
    vibes: [
        { label: '🏝️ Tropical Paradise', text: 'situated in a tropical paradise with palm trees and turquoise water' },
        { label: '⛰️ Mountain Adventure', text: 'parked on a rugged mountain trail with snow-capped peaks in the background' },
        { label: '🏙️ Urban Luxury', text: 'in a high-end marina with city skyline lights reflecting on the water' },
        { label: '🌲 Deep Forest', text: 'surrounded by ancient pine trees and ferns in a misty forest' },
    ],
    lighting: [
        { label: '🌅 Golden Hour', text: 'bathed in warm, golden hour sunset lighting' },
        { label: '🌙 Dramatic Moonlight', text: 'under a dramatic moonlit sky with cinematic shadows' },
        { label: '☀️ Bright Midday', text: 'under bright, clear blue skies with sharp details' },
    ],
    action: [
        { label: '🌊 Splashing Waves', text: 'splashing through waves with dynamic water spray' },
        { label: '💨 High Speed', text: 'captured in motion with motion blur background' },
        { label: '📸 Studio Clean', text: 'isolated on a clean, professional studio infinity background' },
    ]
};

const AICoverGeneratorStep: React.FC<AICoverGeneratorStepProps> = ({ category, realPhotoCount, onImageGenerated }) => {
    // --- Section 1: Product Realism State ---
    const [productType, setProductType] = useState('');
    const [brandModel, setBrandModel] = useState('');
    const [colorFeatures, setColorFeatures] = useState('');

    // --- Section 2: Creative Vision State ---
    const [creativeScene, setCreativeScene] = useState('');
    
    // --- Generation State ---
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [hasAgreed, setHasAgreed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill Product Type if category exists
    useEffect(() => {
        if (category && !productType) {
            // Convert enum to readable string (e.g. "WATER_SPORTS" -> "Water Sports Equipment")
            const readable = category.toLowerCase().replace('_', ' ');
            setProductType(readable);
        }
    }, [category]);

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

    const constructAdvancedAIPrompt = () => {
        // Structure: Realism Core + Creative Scene
        return `A high-quality, professional lifestyle photograph of a ${colorFeatures} ${brandModel} ${productType}. The item is located in ${creativeScene}. The image should be photorealistic, cinematic, 4k resolution, and highly detailed.`;
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);
        setHasAgreed(false);

        try {
            const prompt = constructAdvancedAIPrompt();
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
            // Optional: clear fields or keep them for regeneration
        }
    };

    const addInspiration = (text: string) => {
        setCreativeScene(prev => {
            const separator = prev.length > 0 && !prev.endsWith(' ') ? ', ' : '';
            return prev + separator + text;
        });
    };

    const isFormValid = productType.trim() && brandModel.trim() && colorFeatures.trim();

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-1 border border-purple-100 shadow-md my-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6">
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-8 border-b border-indigo-100 pb-4">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2.5 rounded-lg text-white shadow-lg">
                        <WandSparklesIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-indigo-900">AI Hero Image Studio</h3>
                        <p className="text-xs text-indigo-600 font-medium">Create a stunning cover photo that matches your real item.</p>
                    </div>
                    <span className="ml-auto bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-indigo-200">
                        Unlocked
                    </span>
                </div>

                {/* Step 1: Product Realism */}
                <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-cyan-600" />
                        Step 1: Describe Your Actual Product
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Product Type <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={productType}
                                onChange={e => setProductType(e.target.value)}
                                placeholder="e.g. Jet Ski, Mountain Bike"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Brand & Model <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={brandModel}
                                onChange={e => setBrandModel(e.target.value)}
                                placeholder="e.g. Yamaha VX Cruiser"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Color & Key Features <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={colorFeatures}
                                onChange={e => setColorFeatures(e.target.value)}
                                placeholder="e.g. Bright blue hull with silver trim"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Step 2: Creative Vision */}
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <PaletteIcon className="h-4 w-4 text-purple-600" />
                        Step 2: Set the Scene & Vibe
                    </h4>
                    
                    <div className="relative">
                        <textarea
                            value={creativeScene}
                            onChange={(e) => setCreativeScene(e.target.value)}
                            placeholder="E.g., anchored in a crystal clear turquoise bay at sunset, cinematic style..."
                            className="w-full p-4 text-sm border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px] shadow-inner bg-gray-50 resize-none"
                        />
                        {creativeScene.length === 0 && (
                            <div className="absolute top-4 right-4 hidden sm:block pointer-events-none opacity-40">
                                <LightbulbIcon className="h-5 w-5 text-amber-500" />
                            </div>
                        )}
                    </div>

                    {/* Inspiration Chips */}
                    <div className="mt-4 space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Quick Add Inspiration:</p>
                        
                        <div className="flex flex-wrap gap-2">
                            {INSPIRATION_CHIPS.vibes.map((chip, idx) => (
                                <button key={idx} onClick={() => addInspiration(chip.text)} className="text-xs bg-white border border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 text-gray-600 px-3 py-1.5 rounded-full transition-all">
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {INSPIRATION_CHIPS.lighting.map((chip, idx) => (
                                <button key={idx} onClick={() => addInspiration(chip.text)} className="text-xs bg-white border border-gray-200 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 text-gray-600 px-3 py-1.5 rounded-full transition-all">
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {INSPIRATION_CHIPS.action.map((chip, idx) => (
                                <button key={idx} onClick={() => addInspiration(chip.text)} className="text-xs bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 text-gray-600 px-3 py-1.5 rounded-full transition-all">
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Generate Action */}
                {!generatedImage && (
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !isFormValid}
                        className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isGenerating ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                Designing your image...
                            </>
                        ) : (
                            <>
                                <WandSparklesIcon className="h-5 w-5 text-purple-300" />
                                {isFormValid ? "Generate Cover Image" : "Fill Product Details to Generate"}
                            </>
                        )}
                    </button>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 text-center animate-in fade-in">
                        <div className="flex items-center justify-center gap-2">
                            <AlertIcon className="h-4 w-4" />
                            {error}
                        </div>
                    </div>
                )}

                {/* Result Preview */}
                {generatedImage && (
                    <div className="mt-8 bg-white p-1 rounded-xl border border-gray-200 shadow-lg animate-in fade-in zoom-in-95 duration-300">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 group">
                            <img src={generatedImage} alt="AI Generated Cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded backdrop-blur-sm">AI Generated Preview</span>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={hasAgreed} 
                                        onChange={(e) => setHasAgreed(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-blue-900 leading-snug">
                                        I confirm this image reasonably represents the <strong>{colorFeatures} {brandModel}</strong> I am listing. I understand real photos are still required for damage inspection.
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setGeneratedImage(null)} 
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Discard & Edit
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
