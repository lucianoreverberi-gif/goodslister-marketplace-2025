
import React, { useState, useEffect } from 'react';
import { User, Listing, HeroSlide, Banner, CategoryImagesMap, ListingCategory } from '../types';
import { LayoutDashboardIcon, UsersIcon, PackageIcon, PaletteIcon, XIcon, CreditCardIcon, CheckCircleIcon, ShieldIcon } from './icons';
import ImageUploader from './ImageUploader';
import { initialCategoryImages } from '../constants';

type AdminTab = 'dashboard' | 'users' | 'listings' | 'content' | 'billing';

interface AdminPageProps {
    users: User[];
    listings: Listing[];
    heroSlides: HeroSlide[];
    banners: Banner[];
    logoUrl: string;
    paymentApiKey: string;
    categoryImages: CategoryImagesMap;
    onUpdatePaymentApiKey: (key: string) => Promise<void>;
    onUpdateLogo: (newUrl: string) => Promise<void>;
    onUpdateSlide: (id: string, field: keyof HeroSlide, value: string) => Promise<void>;
    onAddSlide: () => Promise<void>;
    onDeleteSlide: (id: string) => Promise<void>;
    onUpdateBanner: (id: string, field: keyof Banner, value: string) => Promise<void>;
    onAddBanner: () => Promise<void>;
    onDeleteBanner: (id: string) => Promise<void>;
    onToggleFeatured: (id: string) => Promise<void>;
    onUpdateCategoryImage: (category: ListingCategory, newUrl: string) => Promise<void>;
    onUpdateListingImage: (listingId: string, newImageUrl: string) => Promise<void>;
}

const BillingSettings: React.FC<{
    currentApiKey: string;
    onSaveApiKey: (key: string) => Promise<void>;
}> = ({ currentApiKey, onSaveApiKey }) => {
    const [apiKey, setApiKey] = useState(currentApiKey);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSaveApiKey(apiKey);
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Payment Gateway Settings</h2>
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-1">Stripe API Key</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Enter your Stripe API key here to process payments. Your key is stored securely.
                </p>
                <form onSubmit={handleSave}>
                    <div>
                        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                            API Key (e.g., pk_live_... or sk_live_...)
                        </label>
                        <input
                            type="text"
                            id="api-key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="Enter your API key"
                        />
                    </div>
                    <div className="mt-4 flex justify-end items-center">
                        {saved && <span className="text-sm text-green-600 mr-4">API Key saved successfully!</span>}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400"
                        >
                            {isSaving ? 'Saving...' : 'Save Key'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SystemHealth: React.FC = () => {
    const [status, setStatus] = useState<{ blob: boolean; postgres: boolean; ai: boolean } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/config-status');
                if (!res.ok) {
                    throw new Error(`Server returned ${res.status}`);
                }
                const data = await res.json();
                setStatus(data);
            } catch (err) {
                console.error("Failed to check system status:", err);
                // Fallback to all disconnected state if API fails, to allow UI to render
                setStatus({ blob: false, postgres: false, ai: false });
                setError("Could not connect to server configuration.");
            }
        };
        checkStatus();
    }, []);

    // Show loading only if we have neither status nor a fallback result yet
    if (!status) return <div className="p-4 text-gray-500">Checking system health...</div>;

    const StatusItem = ({ label, connected, helpText }: { label: string, connected: boolean, helpText: string }) => (
        <div className={`p-4 rounded-lg border ${connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-700">{label}</span>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${connected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {connected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
            </div>
            <p className="text-sm text-gray-600">{connected ? 'Ready for production.' : helpText}</p>
        </div>
    );

    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">System Health & Production Readiness</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusItem 
                    label="Image Storage (Blob)" 
                    connected={status.blob} 
                    helpText="Go to Vercel > Storage > Create 'Blob'. Required for uploading public images."
                />
                <StatusItem 
                    label="Database (Postgres)" 
                    connected={status.postgres} 
                    helpText="Go to Vercel > Storage > Create 'Postgres'. Required to save listings/users permanently."
                />
                <StatusItem 
                    label="AI Assistant (Gemini)" 
                    connected={status.ai} 
                    helpText="Add GEMINI_API_KEY to Vercel Environment Variables."
                />
            </div>
            {(!status.postgres || !status.blob || error) && (
                <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 text-sm">
                    <strong>Tip:</strong> Currently, the app is using <em>Simulation Mode</em> (Local Storage). Changes you make here are only visible to you. Connect the services above in Vercel to go fully live.
                </div>
            )}
        </div>
    );
};


const AdminPage: React.FC<AdminPageProps> = ({ 
    users, 
    listings, 
    heroSlides, 
    banners, 
    logoUrl,
    paymentApiKey,
    categoryImages,
    onUpdatePaymentApiKey,
    onUpdateLogo,
    onUpdateSlide, 
    onAddSlide,
    onDeleteSlide,
    onUpdateBanner, 
    onAddBanner,
    onDeleteBanner,
    onToggleFeatured,
    onUpdateCategoryImage,
    onUpdateListingImage
}) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [uploadingStates, setUploadingStates] = useState<{[key: string]: boolean}>({});

    // FIX: Replaced the previous buggy handleImageUpload with this robust wrapper.
    // It separates the "key used for loading state" (loadingKey) from the actual update logic (updateFn).
    // This allows us to pass correct IDs to the update functions while still tracking loading for specific UI elements.
    const wrapImageUpdate = async (loadingKey: string, updateFn: () => Promise<void>) => {
        setUploadingStates(prev => ({ ...prev, [loadingKey]: true }));
        try {
            await updateFn();
        } catch (error) {
            console.error("Failed to update image:", error);
            alert("Failed to save image update. Please try again.");
        } finally {
            setUploadingStates(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    const tabs: { id: AdminTab; name: string; icon: React.ElementType }[] = [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboardIcon },
        { id: 'users', name: 'Users', icon: UsersIcon },
        { id: 'listings', name: 'Listings', icon: PackageIcon },
        { id: 'content', name: 'Content', icon: PaletteIcon },
        { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    ];

    // FIX: Merge props categoryImages with initialCategoryImages.
    // This ensures that even if the database (categoryImages prop) only returns a partial list 
    // (e.g., only 2 edited categories), the Admin Panel will still display all 8 original categories
    // so the admin can edit any of them.
    const displayCategoryImages = { ...initialCategoryImages, ...categoryImages };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div>
                        <SystemHealth />
                        <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-500">Total Users</h3>
                                <p className="text-3xl font-bold mt-2">{users.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-500">Total Listings</h3>
                                <p className="text-3xl font-bold mt-2">{listings.length}</p>
                            </div>
                             <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-500">Pending Verifications</h3>
                                <p className="text-3xl font-bold mt-2 text-orange-500">3</p>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Manage Users</h2>
                        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Registration Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-b">
                                            <td className="p-3">{user.name}</td>
                                            <td className="p-3">{user.email}</td>
                                            <td className="p-3">{user.registeredDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'listings':
                 return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Manage Listings</h2>
                         <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3">Title</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Subcategory</th>
                                        <th className="p-3">Owner</th>
                                        <th className="p-3">Price/day</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listings.map(listing => (
                                        <tr key={listing.id} className="border-b">
                                            <td className="p-3">{listing.title}</td>
                                            <td className="p-3">{listing.category}</td>
                                            <td className="p-3">{listing.subcategory}</td>
                                            <td className="p-3">{listing.owner.name}</td>
                                            <td className="p-3">${listing.pricePerDay}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'content':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Edit Homepage Content</h2>
                        <div className="space-y-8">
                            {/* Logo Editor */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Site Logo</h3>
                                <ImageUploader
                                    label="Logo (JPG or PNG). Will be displayed in the header and footer."
                                    currentImageUrl={logoUrl}
                                    onImageChange={(newUrl) => wrapImageUpdate('logo', () => onUpdateLogo(newUrl))}
                                    isLoading={uploadingStates['logo']}
                                />
                            </div>
                            {/* Hero Slides Editor */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Hero Section</h3>
                                {heroSlides.map(slide => (
                                    <div key={slide.id} className="relative space-y-4 border rounded-lg p-4 pt-8 mb-6 last:mb-0">
                                        <button 
                                            onClick={() => onDeleteSlide(slide.id)} 
                                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                            aria-label="Delete slide"
                                        >
                                            <XIcon className="h-5 w-5" />
                                        </button>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Title</label>
                                            <input type="text" value={slide.title} onChange={e => onUpdateSlide(slide.id, 'title', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"/>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Subtitle</label>
                                            <input type="text" value={slide.subtitle} onChange={e => onUpdateSlide(slide.id, 'subtitle', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"/>
                                        </div>
                                        <ImageUploader 
                                            label="Background Image"
                                            currentImageUrl={slide.imageUrl}
                                            onImageChange={(newUrl) => wrapImageUpdate(slide.id, () => onUpdateSlide(slide.id, 'imageUrl', newUrl))}
                                            isLoading={uploadingStates[slide.id]}
                                        />
                                    </div>
                                ))}
                                <button onClick={onAddSlide} className="mt-4 w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-cyan-500 hover:text-cyan-600 font-semibold transition-colors">
                                    + Add New Slide
                                </button>
                            </div>
                             {/* Category Images Editor */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Category Images</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(displayCategoryImages).map(([category, imageUrl]) => (
                                        <div key={category}>
                                            <ImageUploader
                                                label={category}
                                                currentImageUrl={imageUrl}
                                                onImageChange={(newUrl) => wrapImageUpdate(category, () => onUpdateCategoryImage(category as ListingCategory, newUrl))}
                                                isLoading={uploadingStates[category]}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                             {/* Banners Editor */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Promotional Banners</h3>
                                {banners.map(banner => (
                                    <div key={banner.id} className="relative space-y-4 border rounded-lg p-4 pt-8 mb-6 last:mb-0">
                                        <button 
                                            onClick={() => onDeleteBanner(banner.id)} 
                                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                            aria-label="Delete banner"
                                        >
                                            <XIcon className="h-5 w-5" />
                                        </button>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Title</label>
                                            <input type="text" value={banner.title} onChange={e => onUpdateBanner(banner.id, 'title', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"/>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <textarea value={banner.description} onChange={e => onUpdateBanner(banner.id, 'description', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500" rows={3}/>
                                        </div>
                                        <ImageUploader
                                            label="Banner Image"
                                            currentImageUrl={banner.imageUrl}
                                            onImageChange={(newUrl) => wrapImageUpdate(banner.id, () => onUpdateBanner(banner.id, 'imageUrl', newUrl))}
                                            isLoading={uploadingStates[banner.id]}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Button Text</label>
                                            <input type="text" value={banner.buttonText} onChange={e => onUpdateBanner(banner.id, 'buttonText', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"/>
                                        </div>
                                    </div>
                                ))}
                                 <button onClick={onAddBanner} className="mt-4 w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-cyan-500 hover:text-cyan-600 font-semibold transition-colors">
                                    + Add New Banner
                                </button>
                            </div>
                            {/* Featured Products */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Featured Items</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Select which items appear on the homepage. You can also update the main image for any featured item.
                                </p>
                                <div className="space-y-6">
                                    {listings.map(listing => (
                                        <div key={listing.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{listing.title}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={!!listing.isFeatured} onChange={() => onToggleFeatured(listing.id)} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-cyan-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                                    <span className="ml-3 text-sm font-medium text-gray-900">Featured</span>
                                                </label>
                                            </div>
                                            {listing.isFeatured && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <ImageUploader
                                                        label="Update Featured Image"
                                                        currentImageUrl={listing.images[0]}
                                                        onImageChange={(newUrl) => wrapImageUpdate(`listing-${listing.id}`, () => onUpdateListingImage(listing.id, newUrl))}
                                                        isLoading={uploadingStates[`listing-${listing.id}`]}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'billing':
                return <BillingSettings currentApiKey={paymentApiKey} onSaveApiKey={onUpdatePaymentApiKey} />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="md:w-1/4 lg:w-1/5">
                        <nav className="flex flex-col space-y-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-4 py-2 rounded-lg text-left transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-cyan-600 text-white'
                                            : 'hover:bg-gray-200'
                                    }`}
                                >
                                    <tab.icon className="h-5 w-5 mr-3" />
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </aside>
                    {/* Main Content */}
                    <main className="flex-1">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
