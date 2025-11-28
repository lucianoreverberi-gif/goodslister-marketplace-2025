
import React, { useState, useEffect, useRef } from 'react';
import { generateListingDescription, improveDescription, shortenDescription, expandDescription } from '../services/geminiService';
import { ListingCategory, User, Listing, ListingType, PriceUnit } from '../types';
import { subcategories } from '../constants';
import { ChevronLeftIcon, WandSparklesIcon, UploadCloudIcon, MapPinIcon, XIcon, InfoIcon, SparklesIcon, ShrinkIcon, ExpandIcon } from './icons';
import SmartAdvisory from './SmartAdvisory';
import AICoverGeneratorStep from './AICoverGeneratorStep';

// TODO: In a real app, use process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY or similar
const MAPS_API_KEY = 'AIzaSyBXEVAhsLGBPWixJlR7dv5FLdybcr5SOP0';

interface CreateListingPageProps {
    onBack: () => void;
    currentUser: User | null;
    initialData?: Listing;
    onSubmit: (listing: Listing) => Promise<boolean>;
}

const CreateListingPage: React.FC<CreateListingPageProps> = ({ onBack, currentUser, initialData, onSubmit }) => {
    const isEditing = !!initialData;
    
    // Core Fields
    const [listingType, setListingType] = useState<ListingType>(initialData?.listingType || 'rental');
    const [title, setTitle] = useState(initialData?.title || '');
    const [features, setFeatures] = useState<string[]>(['']); 
    const [description, setDescription] = useState(initialData?.description || '');
    const [sources, setSources] = useState<any[]>([]);
    const [category, setCategory] = useState<ListingCategory | ''>(initialData?.category || '');
    const [subcategory, setSubcategory] = useState(initialData?.subcategory || '');
    const [aiAction, setAiAction] = useState<'generate' | 'improve' | 'shorten' | 'expand' | null>(null);
    
    // Smart Advisory State
    const [advisoryEnabled, setAdvisoryEnabled] = useState(false);

    // Location
    const initialLocationStr = initialData ? `${initialData.location.city}, ${initialData.location.state}, ${initialData.location.country}` : '';
    const [location, setLocation] = useState(initialLocationStr);
    
    // Media & Rules
    const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');
    const [ownerRules, setOwnerRules] = useState(initialData?.ownerRules || '');
    
    // Pricing
    const [pricingType, setPricingType] = useState<'daily' | 'hourly'>(initialData?.pricingType || 'daily');
    const [price, setPrice] = useState(initialData ? (initialData.pricingType === 'daily' ? initialData.pricePerDay?.toString() : initialData.pricePerHour?.toString()) || '' : '');
    const [securityDeposit, setSecurityDeposit] = useState(initialData?.securityDeposit?.toString() || '');
    const [priceUnit, setPriceUnit] = useState<PriceUnit>(initialData?.priceUnit || 'item');

    // Experience Specific Fields
    const [operatorLicenseId, setOperatorLicenseId] = useState(initialData?.operatorLicenseId || '');
    const [fuelPolicy, setFuelPolicy] = useState<'included' | 'extra'>(initialData?.fuelPolicy || 'extra');
    const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all_levels'>(initialData?.skillLevel || 'all_levels');
    const [whatsIncluded, setWhatsIncluded] = useState(initialData?.whatsIncluded || '');
    const [itinerary, setItinerary] = useState(initialData?.itinerary || '');

    // Status
    const [generationError, setGenerationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>(initialData?.images || []);
    const [isUploading, setIsUploading] = useState(false);
    
    // Maps
    const locationInputRef = useRef<HTMLInputElement>(null);
    const [mapsLoaded, setMapsLoaded] = useState(false);

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
                    setMapsLoaded(true);
                } catch (e) {
                    setMapsLoaded(false);
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
            script.onerror = () => setMapsLoaded(false);
            document.head.appendChild(script);
        } else {
             const existingScript = document.getElementById(scriptId) as HTMLScriptElement;
             if (existingScript) setTimeout(initAutocomplete, 1000);
        }
    }, []);

    // --- Helpers for Experience Logic ---
    const isCharterStyle = () => {
        return category === ListingCategory.BOATS || category === ListingCategory.UTVS || (category === ListingCategory.WATER_SPORTS && subcategory.toLowerCase().includes('jet ski'));
    };

    const isGuideStyle = () => {
        return category === ListingCategory.BIKES || category === ListingCategory.WINTER_SPORTS || category === ListingCategory.CAMPING || (category === ListingCategory.WATER_SPORTS && !subcategory.toLowerCase().includes('jet ski'));
    };

    const handleAddFeature = () => {
        if(features.length < 5) setFeatures([...features, '']);
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...features];
        newFeatures[index] = value;
        setFeatures(newFeatures);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCategory(e.target.value as ListingCategory);
        setSubcategory(''); 
        setAdvisoryEnabled(false);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        const uploadedUrls: string[] = [];
        for (const file of Array.from(files) as File[]) {
            try {
                const response = await fetch(`/api/upload-image?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
                if (!response.ok) throw new Error('Upload failed');
                const { url } = await response.json();
                uploadedUrls.push(url);
            } catch (error) {
                alert(`Error uploading ${file.name}`);
            }
        }
        setImageUrls(prev => [...prev, ...uploadedUrls]);
        setIsUploading(false);
    };

    const handleRemoveImage = (index: number) => setImageUrls(prev => prev.filter((_, i) => i !== index));

    // --- AI Handlers ---
    const handleGenerateDescription = async () => {
        if (!title.trim() || !location.trim()) {
            setGenerationError("Please provide a title and a location to generate a description with local tips.");
            return;
        }
        setGenerationError('');
        setAiAction('generate');
        setDescription('');
        setSources([]);
        try {
            const contextFeatures = features.filter(f => f.trim() !== '');
            if (listingType === 'experience') {
                if (whatsIncluded) contextFeatures.push(`Included: ${whatsIncluded}`);
                if (itinerary) contextFeatures.push(`Itinerary: ${itinerary}`);
                if (skillLevel) contextFeatures.push(`Skill Level: ${skillLevel}`);
            }
            const result = await generateListingDescription(title, location, contextFeatures);
            setDescription(result.description);
            setSources(result.sources);
        } catch (error) {
            setGenerationError('Error generating description.');
        } finally {
            setAiAction(null);
        }
    };
    
    const createTextHandler = (action: 'improve' | 'shorten' | 'expand', serviceFn: (text: string) => Promise<string>) => async () => {
        if (!description.trim()) return;
        setAiAction(action);
        setGenerationError('');
        try {
            const newText = await serviceFn(description);
            setDescription(newText);
        } catch (error) {
            setGenerationError('Error processing text.');
        } finally {
            setAiAction(null);
        }
    };

    const handleImproveDescription = createTextHandler('improve', improveDescription);
    const handleShortenDescription = createTextHandler('shorten', shortenDescription);
    const handleExpandDescription = createTextHandler('expand', expandDescription);

    // Callback to add the AI generated image
    const handleAiImageGenerated = (newUrl: string) => {
        // Add to the beginning so it becomes the cover
        setImageUrls(prev => [newUrl, ...prev]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            setSubmitMessage("You must be logged in.");
            return;
        }
        setIsSubmitting(true);
        setSubmitMessage('');

        if (!title || !category || !price || !location || !description || imageUrls.length === 0) {
            setSubmitMessage('Please fill in all required fields.');
            setIsSubmitting(false);
            return;
        }
        
        const locationParts = location.split(',');
        
        const listingData: Listing = {
            id: initialData ? initialData.id : `listing-${Date.now()}`,
            listingType,
            title,
            description,
            category: category as ListingCategory,
            subcategory,
            pricingType,
            priceUnit,
            pricePerDay: pricingType === 'daily' ? parseFloat(price) : 0,
            pricePerHour: pricingType === 'hourly' ? parseFloat(price) : 0,
            location: {
                city: locationParts[0]?.trim() || location,
                state: locationParts[1]?.trim() || '',
                country: locationParts[locationParts.length - 1]?.trim() || '',
                latitude: initialData?.location.latitude || 0, 
                longitude: initialData?.location.longitude || 0
            },
            owner: currentUser,
            images: imageUrls,
            videoUrl,
            isFeatured: initialData?.isFeatured || false,
            rating: initialData?.rating || 0,
            reviewsCount: initialData?.reviewsCount || 0,
            ownerRules,
            bookedDates: initialData?.bookedDates || [],
            hasCommercialInsurance: false,
            securityDeposit: parseFloat(securityDeposit) || 0,
            
            // New Experience Fields
            operatorLicenseId,
            fuelPolicy,
            skillLevel,
            whatsIncluded,
            itinerary
        };

        try {
            const success = await onSubmit(listingData);
            if (success) {
                setSubmitMessage('Success! Redirecting...');
                setTimeout(onBack, 2000);
            } else {
                setSubmitMessage('Failed to save listing.');
            }
        } catch (error) {
            setSubmitMessage('Error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
                    <ChevronLeftIcon className="h-5 w-5" />
                    {isEditing ? 'Cancel Editing' : 'Back to home'}
                </button>
                
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200/80">
                    <div className="p-6 sm:p-8 border-b">
                        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Listing' : 'Create New Listing'}</h1>
                        
                        {/* Listing Type Selector - NO ICONS */}
                        <div className="mt-6 flex rounded-md shadow-sm bg-gray-100 p-1">
                            <button
                                type="button"
                                onClick={() => setListingType('rental')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded transition-all ${listingType === 'rental' ? 'bg-white text-cyan-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Rent Your Gear
                            </button>
                            <button
                                type="button"
                                onClick={() => setListingType('experience')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded transition-all ${listingType === 'experience' ? 'bg-white text-purple-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Host an Experience
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        
                        {/* Basic Info */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-800">Title</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500" placeholder={listingType === 'rental' ? "E.g., Yamaha Jet Ski 2023" : "E.g., Sunset Jet Ski Tour of Miami"} />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800">Category</label>
                                    <select value={category} onChange={handleCategoryChange} className="mt-2 block w-full border-gray-300 rounded-md shadow-sm">
                                        <option value="" disabled>Select a category</option>
                                        {Object.values(ListingCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800">Subcategory</label>
                                    <select value={subcategory} onChange={e => setSubcategory(e.target.value)} disabled={!category} className="mt-2 block w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100">
                                        <option value="" disabled>Select a subcategory</option>
                                        {category && ((subcategories as any)[category] || []).map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800">Location</label>
                                <input ref={locationInputRef} type="text" value={location} onChange={e => setLocation(e.target.value)} className="mt-2 block w-full border-gray-300 rounded-md shadow-sm" placeholder="E.g., Miami, FL" />
                            </div>
                        </div>

                        {/* Key Features - IMPORTANT for AI */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800">Key Features (Optional)</label>
                            <p className="mt-1 text-xs text-gray-500">List up to 5 key features. The AI uses these to write your description.</p>
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-center mt-2">
                                    <input
                                        type="text"
                                        value={feature}
                                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                                        placeholder={`Feature ${index + 1}`}
                                    />
                                </div>
                            ))}
                            {features.length < 5 && (
                                <button type="button" onClick={handleAddFeature} className="mt-2 text-sm font-medium text-cyan-600 hover:text-cyan-800">
                                    + Add feature
                                </button>
                            )}
                        </div>

                        {/* Dynamic Experience Details Step */}
                        {listingType === 'experience' && category && (
                            <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                                    <SparklesIcon className="h-5 w-5" /> Experience Details
                                </h3>

                                {/* Charter Logic */}
                                {isCharterStyle() && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-purple-900">Operator/Captain License ID</label>
                                            <input type="text" value={operatorLicenseId} onChange={e => setOperatorLicenseId(e.target.value)} className="mt-1 block w-full border-purple-200 rounded-md" placeholder="USCG Reference Number" />
                                            <div className="mt-2 flex items-start gap-2 bg-white p-3 rounded border border-purple-100 text-xs text-purple-700">
                                                <InfoIcon className="h-4 w-4 flex-shrink-0 text-purple-500" />
                                                <p>USCG Regulations require a valid Captain's License for paid passenger trips. We verify this ID.</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-purple-900">Fuel Policy</label>
                                            <select value={fuelPolicy} onChange={e => setFuelPolicy(e.target.value as any)} className="mt-1 block w-full border-purple-200 rounded-md">
                                                <option value="extra">Renter Pays Fuel (Extra)</option>
                                                <option value="included">Fuel Included in Price</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Guide Logic */}
                                {isGuideStyle() && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-purple-900">Skill Level Required</label>
                                                <select value={skillLevel} onChange={e => setSkillLevel(e.target.value as any)} className="mt-1 block w-full border-purple-200 rounded-md">
                                                    <option value="all_levels">All Levels (Beginner Friendly)</option>
                                                    <option value="intermediate">Intermediate</option>
                                                    <option value="advanced">Advanced Only</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-purple-900">What's Included</label>
                                            <textarea value={whatsIncluded} onChange={e => setWhatsIncluded(e.target.value)} rows={3} className="mt-1 block w-full border-purple-200 rounded-md" placeholder="E.g., Surfboard, Wetsuit, Transport to beach, Snacks..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-purple-900">Itinerary</label>
                                            <textarea value={itinerary} onChange={e => setItinerary(e.target.value)} rows={3} className="mt-1 block w-full border-purple-200 rounded-md" placeholder="E.g., Meet at 7 AM, 2-hour session, optional lunch..." />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Smart Advisory (Rental Mode Only or General) */}
                        {listingType === 'rental' && (
                            <SmartAdvisory category={category} subcategory={subcategory} location={location} isEnabled={advisoryEnabled} onEnable={setAdvisoryEnabled} />
                        )}

                        {/* Media */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-800">Images</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex justify-center">
                                <label className="cursor-pointer text-center">
                                    <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <span className="mt-2 block text-sm font-medium text-cyan-600">Upload images</span>
                                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                </label>
                            </div>
                            {imageUrls.length > 0 && (
                                <div className="grid grid-cols-4 gap-4">
                                    {imageUrls.map((url, i) => (
                                        <div key={i} className="relative group">
                                            <img src={url} className="h-20 w-full object-cover rounded" />
                                            <button type="button" onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><XIcon className="h-3 w-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* NEW AI COVER GENERATOR STEP - INJECTED HERE */}
                        <AICoverGeneratorStep 
                            category={category as ListingCategory}
                            realPhotoCount={imageUrls.length}
                            onImageGenerated={handleAiImageGenerated}
                        />

                        {/* YouTube Video */}
                        <div>
                            <label htmlFor="videoUrl" className="block text-sm font-bold text-gray-800">YouTube Video (Optional)</label>
                             <input
                                type="url"
                                id="videoUrl"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <p className="mt-2 text-xs text-gray-500">Add a link to a video to showcase your item. <strong>Supports 360° videos!</strong></p>
                        </div>

                        {/* Description with AI */}
                        <div className="group">
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="description" className="block text-sm font-bold text-gray-800">
                                    Description
                                </label>
                                <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700 ring-1 ring-inset ring-cyan-600/20">
                                    <SparklesIcon className="mr-1 h-3 w-3" />
                                    AI-Powered
                                </span>
                            </div>
                            {generationError && <p className="text-sm text-red-600 mt-2">{generationError}</p>}
                            
                            <div className="relative rounded-md shadow-sm focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow">
                                <textarea
                                    id="description"
                                    rows={6}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="block w-full border-gray-300 rounded-t-lg border-b-0 focus:border-gray-300 focus:ring-0 resize-y text-gray-900 placeholder-gray-400 sm:text-sm leading-6"
                                    placeholder="Describe your item in detail, or use the AI tools below to help you write."
                                />
                                 {/* AI Writer Toolbar */}
                                <div className="flex items-center justify-between gap-x-3 border border-gray-300 border-t-0 rounded-b-lg bg-gray-50/50 px-3 py-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleGenerateDescription}
                                            disabled={!title.trim() || !location.trim() || !!aiAction}
                                            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Generate a description based on title and location"
                                        >
                                            <WandSparklesIcon className="-ml-0.5 h-4 w-4 text-cyan-600" aria-hidden="true" />
                                            Generate
                                        </button>
                                        
                                        <div className="h-4 w-px bg-gray-200 mx-1" />
                                        
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={handleImproveDescription}
                                                disabled={!description.trim() || !!aiAction}
                                                className="group inline-flex items-center rounded-md px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-white hover:text-cyan-700 hover:shadow-sm hover:ring-1 hover:ring-inset hover:ring-gray-300 disabled:text-gray-400 transition-all"
                                            >
                                                <SparklesIcon className="mr-1.5 h-3.5 w-3.5 group-hover:text-cyan-500" />
                                                Improve
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleShortenDescription}
                                                disabled={!description.trim() || !!aiAction}
                                                className="group inline-flex items-center rounded-md px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-white hover:text-cyan-700 hover:shadow-sm hover:ring-1 hover:ring-inset hover:ring-gray-300 disabled:text-gray-400 transition-all"
                                            >
                                                <ShrinkIcon className="mr-1.5 h-3.5 w-3.5 group-hover:text-cyan-500" />
                                                Shorten
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleExpandDescription}
                                                disabled={!description.trim() || !!aiAction}
                                                className="group inline-flex items-center rounded-md px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-white hover:text-cyan-700 hover:shadow-sm hover:ring-1 hover:ring-inset hover:ring-gray-300 disabled:text-gray-400 transition-all"
                                            >
                                                <ExpandIcon className="mr-1.5 h-3.5 w-3.5 group-hover:text-cyan-500" />
                                                Expand
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {aiAction && (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-600 animate-pulse">
                                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
                                            {aiAction === 'generate' ? 'Writing...' : 'Refining...'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {sources.length > 0 && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="text-sm font-bold text-gray-800">AI-Sourced Information:</h4>
                                    <p className="text-xs text-gray-500 mb-2">The description was enhanced with information from the following web pages:</p>
                                    <ul className="space-y-1">
                                        {sources.map((source: any, index: number) => (
                                            source.web?.uri && (
                                                <li key={index} className="flex items-start">
                                                    <span className="text-cyan-600 mr-2">›</span>
                                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline truncate" title={source.web.uri}>
                                                        {source.web.title || source.web.uri}
                                                    </a>
                                                </li>
                                            )
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Owner's Rules */}
                        <div>
                            <label htmlFor="owner-rules" className="block text-sm font-bold text-gray-800">Owner's Rules (Optional)</label>
                            <textarea
                                id="owner-rules"
                                rows={4}
                                value={ownerRules}
                                onChange={(e) => setOwnerRules(e.target.value)}
                                className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder="E.g., No smoking, must be returned clean, late fees may apply."
                            />
                            <p className="mt-2 text-xs text-gray-500">Set clear expectations for renters. This helps prevent misunderstandings.</p>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    {listingType === 'experience' ? 'Pricing Model' : 'Rental Duration'}
                                </label>
                                {listingType === 'experience' ? (
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setPriceUnit('person')} className={`flex-1 py-2 px-3 rounded text-sm font-medium border transition-colors ${priceUnit === 'person' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                                            Per Person
                                        </button>
                                        <button type="button" onClick={() => setPriceUnit('group')} className={`flex-1 py-2 px-3 rounded text-sm font-medium border transition-colors ${priceUnit === 'group' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                                            Per Group
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setPricingType('daily')} className={`flex-1 py-2 px-3 rounded text-sm font-medium border transition-colors ${pricingType === 'daily' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                                            Daily
                                        </button>
                                        <button type="button" onClick={() => setPricingType('hourly')} className={`flex-1 py-2 px-3 rounded text-sm font-medium border transition-colors ${pricingType === 'hourly' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                                            Hourly
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Price ($)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="block w-full border-gray-300 rounded-md pl-7" placeholder="0.00" />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {listingType === 'experience' ? `Price per ${priceUnit}` : `Price per ${pricingType === 'daily' ? 'day' : 'hour'}`}
                                </p>
                            </div>
                        </div>

                        {/* Security Deposit */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800">Security Deposit ($)</label>
                            <input type="number" value={securityDeposit} onChange={e => setSecurityDeposit(e.target.value)} className="mt-2 block w-full border-gray-300 rounded-md" placeholder="0" />
                        </div>

                        {/* Submit */}
                        <div className="pt-6 border-t flex justify-end gap-4">
                            <button type="button" onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-700 disabled:opacity-50">
                                {isSubmitting ? 'Saving...' : isEditing ? 'Update Listing' : 'Publish Listing'}
                            </button>
                        </div>
                        {submitMessage && <p className="text-center text-sm font-medium text-gray-700">{submitMessage}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateListingPage;
