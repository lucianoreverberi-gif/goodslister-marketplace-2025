import React, { useState } from 'react';
import { Listing } from '../types';
import { generateImageForListing } from '../services/imageService';
import { WandSparklesIcon } from './icons';

interface ImageGeneratorProps {
    listings: Listing[];
    onImageUpdate: (listingId: string, newImageUrl: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ listings, onImageUpdate }) => {
    const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
    const [errorStates, setErrorStates] = useState<{ [key: string]: string | null }>({});

    const handleGenerate = async (listing: Listing) => {
        setLoadingStates(prev => ({ ...prev, [listing.id]: true }));
        setErrorStates(prev => ({ ...prev, [listing.id]: null }));
        try {
            const locationContext = `in ${listing.location.city}, ${listing.location.country}`;
            const newImageUrl = await generateImageForListing(listing.title, locationContext);
            onImageUpdate(listing.id, newImageUrl);
        } catch (error) {
            console.error("Failed to generate image:", error);
            setErrorStates(prev => ({ ...prev, [listing.id]: 'Failed to generate image. Please try again.' }));
        } finally {
            setLoadingStates(prev => ({ ...prev, [listing.id]: false }));
        }
    };

    const featuredListings = listings.filter(l => l.isFeatured);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-1">AI Image Generator</h2>
            <p className="text-gray-600 mb-6">Generate new, unique images for your featured listings using AI.</p>
            <div className="space-y-6">
                {featuredListings.map(listing => (
                    <div key={listing.id} className="bg-white p-4 rounded-lg shadow flex items-center gap-6">
                        <div className="w-32 h-20 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
                            {loadingStates[listing.id] ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                                </div>
                            ) : (
                                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{listing.title}</h3>
                             {errorStates[listing.id] && <p className="text-sm text-red-500 mt-1">{errorStates[listing.id]}</p>}
                        </div>
                        <button
                            onClick={() => handleGenerate(listing)}
                            disabled={loadingStates[listing.id]}
                            className="flex items-center gap-2 py-2 px-4 text-white font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                        >
                            <WandSparklesIcon className="h-5 w-5" />
                            {loadingStates[listing.id] ? 'Generating...' : 'Generate New Image'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageGenerator;
