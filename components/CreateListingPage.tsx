import React, { useState } from 'react';
import { generateListingDescription } from '../services/geminiService';
import { ListingCategory } from '../types';
import { subcategories } from '../constants';
import { ChevronLeftIcon, WandSparklesIcon, UploadCloudIcon, MapPinIcon, CameraIcon } from './icons';

const CreateListingPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [title, setTitle] = useState('');
    const [features, setFeatures] = useState<string[]>(['']);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<ListingCategory | ''>('');
    const [subcategory, setSubcategory] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [location, setLocation] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [ownerRules, setOwnerRules] = useState('');
    const [pricingType, setPricingType] = useState<'daily' | 'hourly'>('daily');
    const [price, setPrice] = useState('');
    
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
        if (!title.trim()) {
            alert("Please enter a title for your item.");
            return;
        }
        setIsGenerating(true);
        const nonEmptyFeatures = features.filter(f => f.trim() !== '');
        const generatedDesc = await generateListingDescription(title, nonEmptyFeatures);
        setDescription(generatedDesc);
        setIsGenerating(false);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value as ListingCategory;
        setCategory(newCategory);
        setSubcategory(''); // Reset subcategory when category changes
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
                    <form className="p-6 sm:p-8 space-y-8">
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

                        {/* Features */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800">Key Features</label>
                            <p className="mt-1 text-xs text-gray-500">List up to 5 key features. Used by AI to generate the description.</p>
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
                            <p className="mt-2 text-xs text-gray-500">Where is your item located?</p>
                        </div>

                        {/* Image Upload */}
                        <div>
                           <label htmlFor="file-upload" className="block text-sm font-bold text-gray-800">Item Images</label>
                            <div className="mt-2 flex items-center gap-4 rounded-md border border-gray-300 px-3 py-2 shadow-sm">
                                <CameraIcon className="h-5 w-5 text-gray-500" />
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500">
                                    <span>Choose files</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                                </label>
                                <span className="text-sm text-gray-500">No file chosen</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Upload one or more high-quality, real photos of your item.</p>
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
                        <div>
                            <div className="flex justify-between items-center">
                                <label htmlFor="description" className="block text-sm font-bold text-gray-800">Description</label>
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    disabled={isGenerating || !title}
                                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <WandSparklesIcon className="h-4 w-4" />
                                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                                </button>
                            </div>
                            <textarea
                                id="description"
                                rows={6}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder="Describe your item in detail, including features, condition, and any relevant information."
                            />
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
                            <div className="flex justify-end">
                                <button type="button" onClick={onBack} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
                                >
                                    Publish Listing
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