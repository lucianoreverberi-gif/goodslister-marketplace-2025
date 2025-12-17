
import React, { useState, useEffect, useRef } from 'react';
import { generateListingDescription, improveDescription, shortenDescription, expandDescription } from '../services/geminiService';
import { ListingCategory, User, Listing, ListingType, PriceUnit } from '../types';
import { subcategories } from '../constants';
import { ChevronLeftIcon, WandSparklesIcon, UploadCloudIcon, MapPinIcon, XIcon, InfoIcon, SparklesIcon, ShrinkIcon, ExpandIcon, ZapIcon, ShieldCheckIcon, LockIcon, FileSignatureIcon, PenToolIcon, CheckCircleIcon, AnchorIcon } from './icons';
import SmartAdvisory from './SmartAdvisory';
import AICoverGeneratorStep from './AICoverGeneratorStep';

const MAPS_API_KEY = 'AIzaSyBXEVAhsLGBPWixJlR7dv5FLdybcr5SOP0';

interface CreateListingPageProps {
    onBack: () => void;
    currentUser: User | null;
    initialData?: Listing;
    onSubmit: (listing: Listing) => Promise<boolean>;
}

const CreateListingPage: React.FC<CreateListingPageProps> = ({ onBack, currentUser, initialData, onSubmit }) => {
    const isEditing = !!initialData;
    
    const [listingType, setListingType] = useState<ListingType>(initialData?.listingType || 'rental');
    const [title, setTitle] = useState(initialData?.title || '');
    const [features, setFeatures] = useState<string[]>(initialData ? [] : ['']); 
    const [description, setDescription] = useState(initialData?.description || '');
    const [category, setCategory] = useState<ListingCategory | ''>(initialData?.category || '');
    const [subcategory, setSubcategory] = useState(initialData?.subcategory || '');
    const [aiAction, setAiAction] = useState<'generate' | 'improve' | 'shorten' | 'expand' | null>(null);
    
    const [legalSelection, setLegalSelection] = useState<'standard' | 'custom'>(initialData?.legalTemplateSelection || 'standard');
    const [legalItemName, setLegalItemName] = useState(initialData?.legalItemName || '');

    const initialLocationStr = initialData ? `${initialData.location.city}, ${initialData.location.state}, ${initialData.location.country}` : '';
    const [location, setLocation] = useState(initialLocationStr);
    
    const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');
    const [ownerRules, setOwnerRules] = useState(initialData?.ownerRules || '');
    
    const [pricingType, setPricingType] = useState<'daily' | 'hourly'>(initialData?.pricingType || 'daily');
    const [price, setPrice] = useState(initialData ? (initialData.pricingType === 'daily' ? initialData.pricePerDay?.toString() : initialData.pricePerHour?.toString()) || '' : '');
    const [securityDeposit, setSecurityDeposit] = useState(initialData?.securityDeposit?.toString() || '');
    const [priceUnit, setPriceUnit] = useState<PriceUnit>(initialData?.priceUnit || 'item');
    const [instantBookingEnabled, setInstantBookingEnabled] = useState(initialData?.instantBookingEnabled || false);

    const [operatorLicenseId, setOperatorLicenseId] = useState(initialData?.operatorLicenseId || '');
    const [fuelPolicy, setFuelPolicy] = useState<'included' | 'extra'>(initialData?.fuelPolicy || 'extra');
    const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all_levels'>(initialData?.skillLevel || 'all_levels');
    const [whatsIncluded, setWhatsIncluded] = useState(initialData?.whatsIncluded || '');
    const [itinerary, setItinerary] = useState(initialData?.itinerary || '');

    const [generationError, setGenerationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>(initialData?.images || []);
    const [isUploading, setIsUploading] = useState(false);
    
    const locationInputRef = useRef<HTMLInputElement>(null);

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
                } catch (e) {}
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
            document.head.appendChild(script);
        }
    }, []);

    const isCharterStyle = () => category === ListingCategory.BOATS || category === ListingCategory.ATVS_UTVS || (category === ListingCategory.WATER_SPORTS && subcategory.toLowerCase().includes('jet ski'));

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setCategory(e.target.value as ListingCategory); setSubcategory(''); };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        for (const file of Array.from(files) as File[]) {
            try {
                const response = await fetch(`/api/upload-image?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
                const { url } = await response.json();
                setImageUrls(prev => [...prev, url]);
            } catch (error) { alert(`Error uploading ${file.name}`); }
        }
        setIsUploading(false);
    };

    const handleRemoveImage = (index: number) => setImageUrls(prev => prev.filter((_, i) => i !== index));

    const handleGenerateDescription = async () => {
        if (!title.trim() || !location.trim()) { setGenerationError("Title and location required."); return; }
        setAiAction('generate');
        try {
            const result = await generateListingDescription(title, location, features.filter(f => f.trim() !== ''));
            setDescription(result.description);
        } catch (error) { setGenerationError('Error generating.'); } finally { setAiAction(null); }
    };
    
    const handleImproveDescription = async () => {
        if (!description.trim()) return;
        setAiAction('improve');
        try { setDescription(await improveDescription(description)); } finally { setAiAction(null); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSubmitting(true);

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
            ownerRules: legalSelection === 'custom' ? ownerRules : '',
            securityDeposit: parseFloat(securityDeposit) || 0,
            operatorLicenseId,
            fuelPolicy,
            skillLevel,
            whatsIncluded,
            itinerary,
            instantBookingEnabled,
            legalTemplateSelection: legalSelection,
            legalItemName: legalSelection === 'standard' ? legalItemName : undefined,
            rating: initialData?.rating || 0,
            reviewsCount: initialData?.reviewsCount || 0,
        };

        try {
            const success = await onSubmit(listingData);
            if (success) { setSubmitMessage('Success!'); setTimeout(onBack, 1500); }
        } catch (error) { setSubmitMessage('Error occurred.'); } finally { setIsSubmitting(false); }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
                    <ChevronLeftIcon className="h-5 w-5" /> Cancel
                </button>
                
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-8 border-b">
                        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Listing' : 'Create Listing'}</h1>
                        <div className="mt-6 flex bg-gray-100 p-1 rounded-md">
                            <button type="button" onClick={() => setListingType('rental')} className={`flex-1 py-2 text-sm font-bold rounded ${listingType === 'rental' ? 'bg-white text-cyan-700 shadow' : 'text-gray-500'}`}>Rent Gear</button>
                            <button type="button" onClick={() => setListingType('experience')} className={`flex-1 py-2 text-sm font-bold rounded ${listingType === 'experience' ? 'bg-white text-purple-700 shadow' : 'text-gray-500'}`}>Experience</button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        <div className="space-y-6">
                            <div><label className="block text-sm font-bold text-gray-800">Title for Renter (Marketplace Display)</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-2 block w-full border-gray-300 rounded-md" placeholder="e.g. Sea Ray 210 in Key Biscayne" /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-bold text-gray-800">Category</label><select value={category} onChange={handleCategoryChange} className="mt-2 block w-full border-gray-300 rounded-md">{Object.values(ListingCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                                <div><label className="block text-sm font-bold text-gray-800">Subcategory</label><select value={subcategory} onChange={e => setSubcategory(e.target.value)} disabled={!category} className="mt-2 block w-full border-gray-300 rounded-md">{category && (subcategories[category as ListingCategory] || []).map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}</select></div>
                            </div>
                            <div><label className="block text-sm font-bold text-gray-800">Location</label><input ref={locationInputRef} type="text" value={location} onChange={e => setLocation(e.target.value)} className="mt-2 block w-full border-gray-300 rounded-md" /></div>
                        </div>

                        {/* LEGAL SHIELD SECTION */}
                        <div className="bg-gray-900 text-white rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                             <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheckIcon className="h-48 w-48" /></div>
                             <div className="relative z-10">
                                 <h3 className="text-xl font-bold flex items-center gap-3"><LockIcon className="h-6 w-6 text-cyan-400" /> Legal Protection Shield</h3>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                     <div 
                                        onClick={() => setLegalSelection('standard')}
                                        className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${legalSelection === 'standard' ? 'bg-cyan-500/10 border-cyan-500' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
                                     >
                                         <div className="flex items-center gap-2 mb-3">
                                            <FileSignatureIcon className={`h-5 w-5 ${legalSelection === 'standard' ? 'text-cyan-400' : 'text-gray-500'}`} />
                                            <span className="font-bold text-sm">Goodslister Standard</span>
                                         </div>
                                         <p className="text-xs text-gray-400 leading-relaxed">Instantly deploy professional contracts based on your category.</p>
                                     </div>

                                     <div 
                                        onClick={() => setLegalSelection('custom')}
                                        className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${legalSelection === 'custom' ? 'bg-purple-500/10 border-purple-500' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
                                     >
                                         <div className="flex items-center gap-2 mb-3">
                                            <PenToolIcon className={`h-5 w-5 ${legalSelection === 'custom' ? 'text-purple-400' : 'text-gray-500'}`} />
                                            <span className="font-bold text-sm">Custom Rules</span>
                                         </div>
                                         <p className="text-xs text-gray-400 leading-relaxed">Provide your own specific terms for this rental.</p>
                                     </div>
                                 </div>

                                 {legalSelection === 'standard' && (
                                     <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl animate-in fade-in zoom-in-95 duration-500">
                                         <div className="flex items-center gap-2 mb-4">
                                             <AnchorIcon className="h-5 w-5 text-cyan-400" />
                                             <label className="text-sm font-black uppercase tracking-widest text-cyan-100">Legal Identification (Required)</label>
                                         </div>
                                         <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                             Para que el contrato sea válido ante un tribunal o seguro, el bien debe estar identificado correctamente. **No uses el título comercial de arriba.**
                                         </p>
                                         <input 
                                            type="text" 
                                            value={legalItemName}
                                            onChange={e => setLegalItemName(e.target.value)}
                                            className="w-full bg-gray-800 border-gray-700 text-white rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder:text-gray-600 shadow-inner"
                                            placeholder={category === ListingCategory.BOATS ? "Ej: Sea Ray 210 Select (Hull ID: SER12345B505)" : "Ej: Yamaha VX 1000 (Serial: YAMA-9988X)"}
                                            required={legalSelection === 'standard'}
                                         />
                                         <div className="mt-4 flex items-start gap-2 text-[10px] text-gray-500">
                                             <InfoIcon className="h-3 w-3 mt-0.5" />
                                             <p>Este nombre aparecerá en el contrato digital que el inquilino firmará al pagar.</p>
                                         </div>
                                     </div>
                                 )}

                                 {legalSelection === 'custom' && (
                                     <div className="mt-6 animate-in fade-in">
                                         <textarea 
                                            value={ownerRules}
                                            onChange={e => setOwnerRules(e.target.value)}
                                            rows={4}
                                            className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-3 text-sm"
                                            placeholder="Escribe tus propias reglas legales..."
                                         />
                                     </div>
                                 )}
                             </div>
                        </div>

                        {/* Media */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-800">Photos (Real condition)</label>
                            <AICoverGeneratorStep realPhotoCount={imageUrls.length} onImageGenerated={url => setImageUrls([url, ...imageUrls])} />
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex justify-center cursor-pointer"><label className="text-center cursor-pointer"><UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" /><span className="mt-2 block text-sm text-cyan-600 font-bold">Upload Real Photos</span><input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={isUploading} /></label></div>
                            <div className="grid grid-cols-4 gap-4 mt-4">{imageUrls.map((url, i) => (<div key={i} className="relative group"><img src={url} className="h-20 w-full object-cover rounded" /><button type="button" onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><XIcon className="h-3 w-3" /></button></div>))}</div>
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex justify-between items-center mb-1"><label className="block text-sm font-bold text-gray-800">Description</label></div>
                            <textarea id="description" rows={6} value={description} onChange={e => setDescription(e.target.value)} className="w-full border-gray-300 rounded-md" />
                            <div className="mt-3 flex gap-2">
                                <button type="button" onClick={handleGenerateDescription} className="px-4 py-2 bg-white border text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-gray-50"><WandSparklesIcon className="h-4 w-4 text-cyan-600" /> AI Writer</button>
                                <button type="button" onClick={handleImproveDescription} className="px-4 py-2 bg-white border text-xs font-bold rounded-lg hover:bg-gray-50">Refine Text</button>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border">
                            <div><label className="block text-sm font-bold text-gray-800">Duration</label><div className="mt-2 flex gap-2"><button type="button" onClick={() => setPricingType('daily')} className={`flex-1 py-2 text-sm font-bold rounded ${pricingType === 'daily' ? 'bg-cyan-600 text-white' : 'bg-white border'}`}>Daily</button><button type="button" onClick={() => setPricingType('hourly')} className={`flex-1 py-2 text-sm font-bold rounded ${pricingType === 'hourly' ? 'bg-cyan-600 text-white' : 'bg-white border'}`}>Hourly</button></div></div>
                            <div><label className="block text-sm font-bold text-gray-800">Price ($)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} className="mt-2 block w-full border-gray-300 rounded-md" /></div>
                        </div>

                        <div className="pt-6 border-t flex justify-end gap-4">
                            <button type="button" onClick={onBack} className="px-6 py-2 border rounded-lg font-bold">Cancel</button>
                            <button type="submit" disabled={isSubmitting || (legalSelection === 'standard' && !legalItemName)} className="px-8 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-black disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Publish'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateListingPage;
