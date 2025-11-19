import React, { useState } from 'react';
import { generateListingDescription, improveDescription, shortenDescription, expandDescription } from '../services/geminiService';
import { ListingCategory } from '../types';
import { subcategories } from '../constants';
import { ChevronLeftIcon, WandSparklesIcon, UploadCloudIcon, MapPinIcon, CameraIcon, SparklesIcon, ShrinkIcon, ExpandIcon, XIcon } from './icons';

const CreateListingPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [title, setTitle] = useState('');
    const [features, setFeatures] = useState<string[]>(['']);
    const [description, setDescription] = useState('');
    const [sources, setSources] = useState<any[]>([]);
    const [category, setCategory] = useState<ListingCategory | ''>('');
    const [subcategory, setSubcategory] = useState('');
    const [aiAction, setAiAction] = useState<'generate' | 'improve' | 'shorten' | 'expand' | null>(null);
    const [location, setLocation] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [ownerRules, setOwnerRules] = useState('');
    const [pricingType, setPricingType] = useState<'daily' | 'hourly'>('daily');
    const [price, setPrice] = useState('');
    const [generationError, setGenerationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    
    const handleAddFeature = () => {
        if(features.length < 5) {
            setFeatures([...features, '']);
        }
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...features];
        newFeatures[index] = value;
        setFeatures(newFeatures);
    };

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
            const nonEmptyFeatures = features.filter(f => f.trim() !== '');
            const result = await generateListingDescription(title, location, nonEmptyFeatures);
            setDescription(result.description);
            setSources(result.sources);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred during generation.';
            setGenerationError(message);
        } finally {
            setAiAction(null);
        }
    };

    // Factory function to handle text manipulation actions (improve, shorten, expand)
    const createTextHandler = (action: 'improve' | 'shorten' | 'expand', serviceFn: (text: string) => Promise<string>) => async () => {
        if (!description.trim()) return;

        setAiAction(action);
        setGenerationError('');
        setSources([]);

        try {
            const newText = await serviceFn(description);
            setDescription(newText);
        } catch (error) {
            const message = error instanceof Error ? error.message : `The AI could not ${action} the text. Please try again.`;
            setGenerationError(message);
            // Do not update the description, preserving the user's original text
        } finally {
            setAiAction(null);
        }
    };

    const handleImproveDescription = createTextHandler('improve', improveDescription);
    const handleShortenDescription = createTextHandler('shorten', shortenDescription);
    const handleExpandDescription = createTextHandler('expand', expandDescription);


    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value as ListingCategory;
        setCategory(newCategory);
        setSubcategory(''); // Reset subcategory when category changes
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const uploadedUrls: string[] = [];

        for (const file of Array.from(files) as File[]) {
            // Basic validation
            if (!file.type.startsWith('image/')) {
                alert(`File ${file.name} is not a valid image.`);
                continue;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert(`Image ${file.name} is too large (max 5MB).`);
                continue;
            }

            try {
                const response = await fetch(`/api/upload-image?filename=${encodeURIComponent(file.name)}`, {
                    method: 'POST',
                    body: file,
                });

                if (!response.ok) {
                    throw new Error(`Upload failed for ${file.name}`);
                }
                
                const { url } = await response.json();
                uploadedUrls.push(url);

            } catch (error) {
                console.error(error);
                alert(`There was an error uploading ${file.name}. Please try again.`);
            }
        }
        
        setImageUrls(prev => [...prev, ...uploadedUrls]);
        setIsUploading(false);
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage('');

        // Basic validation
        if (!title || !category || !price || !location || !description || imageUrls.length === 0) {
            setSubmitMessage('Please fill in all required fields and upload at least one image.');
            setIsSubmitting(false);
            return;
        }

        // Simulate API call
        setTimeout(() => {
            console.log('Form submitted with data:', {
                title, features, description, category, subcategory, location, videoUrl, ownerRules, pricingType, price, sources, imageUrls
            });
            setSubmitMessage('Listing published successfully! Redirecting...');
            setIsSubmitting(false);
            setTimeout(onBack, 2000);
        }, 1500);
    };


    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
                    <ChevronLeftIcon className="h-5 w-5" />
                    Back to home
                </button>
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200/80">
                    <div className="p-6 sm:p-8 border-b">
                        <h1 className="text-2xl font-bold text-gray-900">List Your Item</h1>
                        <p className="mt-1 text-sm text-gray-600">Fill out the form below to list your recreational gear on our marketplace.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-bold text-gray-800">Title</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder="E.g., Yamaha Jet Ski 2023"
                            />
                            <p className="mt-2 text-xs text-gray-500">A catchy title for your listing.</p>
                        </div>
                        
                         {/* Location */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-bold text-gray-800">Location</label>
                            <div className="relative mt-2">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    type="text"
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 pl-10"
                                    placeholder="E.g., Miami, FL"
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Where is your item located? Be specific for better AI suggestions.</p>
                        </div>

                        {/* Features */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800">Key Features (Optional)</label>
                            <p className="mt-1 text-xs text-gray-500">List up to 5 key features to give the AI more context.</p>
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

                        {/* Category and Subcategory */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="category" className="block text-sm font-bold text-gray-800">Category</label>
                                <select 
                                    id="category"
                                    value={category}
                                    onChange={handleCategoryChange}
                                    className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    <option value="" disabled>Select a category</option>
                                    {Object.values(ListingCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="subcategory" className="block text-sm font-bold text-gray-800">Subcategory</label>
                                <select 
                                    id="subcategory"
                                    value={subcategory}
                                    onChange={(e) => setSubcategory(e.target.value)}
                                    disabled={!category}
                                    className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-100"
                                >
                                    <option value="" disabled>Select a subcategory</option>
                                    {category && subcategories[category].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        {/* Image Upload */}
                        <div>
                           <label htmlFor="file-upload" className="block text-sm font-bold text-gray-800">Item Images</label>
                           <div className="mt-2 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                                <div className="space-y-1 text-center">
                                    <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-medium text-cyan-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2 hover:text-cyan-500">
                                            <span>Upload files</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/png, image/jpeg" onChange={handleImageUpload} disabled={isUploading}/>
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB each</p>
                                </div>
                            </div>
                            {isUploading && (
                                <div className="mt-2 text-sm text-gray-600 text-center">Uploading...</div>
                            )}
                            {imageUrls.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {imageUrls.map((url, index) => (
                                        <div key={url} className="relative group">
                                            <img src={url} alt={`Uploaded preview ${index + 1}`} className="h-24 w-full object-cover rounded-md shadow-md" />
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveImage(index)} 
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remove image"
                                            >
                                                <XIcon className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
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
                            <p className="mt-2 text-xs text-gray-500">Add a link to a YouTube video to better showcase your item.</p>
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
                                        {sources.map((source, index) => (
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-800">Pricing Model</label>
                                <div className="mt-2 flex gap-4 rounded-md shadow-sm p-2 border border-gray-300">
                                    <label className="flex-1 text-center py-1.5 px-3 rounded-md cursor-pointer text-sm font-medium transition-colors" style={pricingType === 'daily' ? {backgroundColor: '#06B6D4', color: 'white'} : {backgroundColor: '#F3F4F6'}}>
                                        <input type="radio" name="pricingType" value="daily" checked={pricingType === 'daily'} onChange={() => setPricingType('daily')} className="sr-only"/>
                                        Daily
                                    </label>
                                    <label className="flex-1 text-center py-1.5 px-3 rounded-md cursor-pointer text-sm font-medium transition-colors" style={pricingType === 'hourly' ? {backgroundColor: '#06B6D4', color: 'white'} : {backgroundColor: '#F3F4F6'}}>
                                        <input type="radio" name="pricingType" value="hourly" checked={pricingType === 'hourly'} onChange={() => setPricingType('hourly')} className="sr-only"/>
                                        Hourly
                                    </label>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="price" className="block text-sm font-bold text-gray-800">
                                    {pricingType === 'daily' ? 'Price per day ($)' : 'Price per hour ($)'}
                                </label>
                                <input 
                                    type="number" 
                                    id="price" 
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500" 
                                    placeholder={pricingType === 'daily' ? "50" : "15"} 
                                />
                            </div>
                        </div>
                        
                        {/* Submit Button */}
                        <div className="pt-5 border-t">
                             {submitMessage && (
                                <p className={`text-sm mb-4 text-center ${submitMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                                    {submitMessage}
                                </p>
                            )}
                            <div className="flex justify-end">
                                <button type="button" onClick={onBack} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400"
                                >
                                    {isSubmitting ? 'Publishing...' : 'Publish Listing'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateListingPage;