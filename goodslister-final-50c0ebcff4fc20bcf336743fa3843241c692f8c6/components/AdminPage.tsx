
import React, { useState, useEffect, useMemo } from 'react';
import { User, Listing, HeroSlide, Banner, CategoryImagesMap, ListingCategory, Dispute, Coupon } from '../types';
import { 
    LayoutDashboardIcon, UsersIcon, PackageIcon, PaletteIcon, XIcon, CreditCardIcon, 
    CheckCircleIcon, ShieldIcon, LayoutOverlayIcon, LayoutSplitIcon, LayoutWideIcon, 
    EyeIcon, GavelIcon, AlertIcon, CheckSquareIcon, TicketIcon, CogIcon, 
    CalculatorIcon, DollarSignIcon, TrashIcon, MapPinIcon, BarChartIcon, 
    ExternalLinkIcon, LockIcon, ArrowRightIcon, TrendUpIcon, UmbrellaIcon, 
    AlertTriangleIcon, MegaphoneIcon, RocketIcon, SlidersIcon, GlobeIcon, 
    UserCheckIcon, SearchIcon, BrainCircuitIcon 
} from './icons';
import ImageUploader from './ImageUploader';
import { initialCategoryImages } from '../constants';

type AdminTab = 'dashboard' | 'users' | 'listings' | 'financials' | 'risk_fund' | 'disputes' | 'content' | 'billing' | 'marketing' | 'settings';

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
    onUpdateBanner: (id: string, field: keyof Banner, value: any) => Promise<void>;
    onAddBanner: () => Promise<void>;
    onDeleteBanner: (id: string) => Promise<void>;
    onToggleFeatured: (id: string) => Promise<void>;
    onUpdateCategoryImage: (category: ListingCategory, newUrl: string) => Promise<void>;
    onUpdateListingImage: (listingId: string, newImageUrl: string) => Promise<void>;
    onViewListing: (id: string) => void;
    onDeleteListing: (id: string) => Promise<void>;
}

// ... (previous mock data remains same)

const AdminPage: React.FC<AdminPageProps> = ({ 
    users, listings, heroSlides, banners, logoUrl, paymentApiKey, categoryImages,
    onUpdatePaymentApiKey, onUpdateLogo, onUpdateSlide, onAddSlide, onDeleteSlide,
    onUpdateBanner, onAddBanner, onDeleteBanner, onToggleFeatured, onUpdateCategoryImage,
    onUpdateListingImage, onViewListing, onDeleteListing
}) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [selectedRegion, setSelectedRegion] = useState<string>('GLOBAL');

    const stats = useMemo(() => {
        const verifiedUsers = users.filter(u => u.isIdVerified).length;
        const verificationRate = Math.round((verifiedUsers / (users.length || 1)) * 100);
        return {
            gmv: 125400,
            revenue: 12540,
            activeListings: listings.length,
            disputes: 2,
            verificationRate
        };
    }, [users, listings]);

    const renderDashboard = () => (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Platform Command Center</h2>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <GlobeIcon className="h-4 w-4 text-gray-500 ml-2" />
                    <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer">
                        <option value="GLOBAL">Global View</option>
                        <option value="US">North America (USA)</option>
                        <option value="AR">South America (ARG)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-cyan-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
                    <p className="text-xs font-bold uppercase opacity-80">Gross Volume (GMV)</p>
                    <p className="text-3xl font-black mt-1">${stats.gmv.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-bold bg-white/20 w-fit px-2 py-1 rounded">
                        <TrendUpIcon className="h-3 w-3" /> +14.2%
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Verification Rate</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{stats.verificationRate}%</p>
                    <p className="text-xs text-green-600 font-bold mt-4 flex items-center gap-1">
                        <BrainCircuitIcon className="h-3 w-3" /> Powered by AI Guard
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Active Listings</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{stats.activeListings}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Open Disputes</p>
                    <p className="text-3xl font-black text-red-600 mt-1">{stats.disputes}</p>
                </div>
            </div>

            {/* INTEGRITY SECTION */}
            <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldIcon className="h-64 w-64" />
                </div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <BrainCircuitIcon className="h-8 w-8 text-cyan-400" />
                            AI Identity Integrity
                        </h3>
                        <p className="text-indigo-100 leading-relaxed">
                            Nuestra IA ha analizado <strong>245 documentos</strong> este mes. El sistema detectó <strong>3 intentos de fraude</strong> de identidad que fueron bloqueados automáticamente antes del handover.
                        </p>
                        <div className="mt-6 flex gap-4">
                            <button className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl transition-all shadow-lg">View Security Logs</button>
                            <button className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all">Audit AI Models</button>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                        <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-indigo-300">Top Trusted Regions</h4>
                        <div className="space-y-4">
                            {[
                                { name: 'Florida, US', rate: 98, color: 'bg-green-400' },
                                { name: 'Buenos Aires, AR', rate: 92, color: 'bg-cyan-400' },
                                { name: 'California, US', rate: 89, color: 'bg-indigo-400' },
                            ].map(reg => (
                                <div key={reg.name}>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span>{reg.name}</span>
                                        <span>{reg.rate}% Verified</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full ${reg.color}`} style={{ width: `${reg.rate}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const tabs: { id: AdminTab; name: string; icon: React.ElementType }[] = [
        { id: 'dashboard', name: 'Overview', icon: LayoutDashboardIcon },
        { id: 'financials', name: 'Financials', icon: DollarSignIcon },
        { id: 'risk_fund', name: 'Risk & Insurance', icon: UmbrellaIcon },
        { id: 'disputes', name: 'Disputes', icon: GavelIcon },
        { id: 'users', name: 'User Control', icon: UsersIcon },
        { id: 'content', name: 'Site Content', icon: PaletteIcon },
        { id: 'billing', name: 'Gateway', icon: CreditCardIcon },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="md:w-64 space-y-2">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-gray-200'}`}>
                                <tab.icon className="h-5 w-5 mr-3" /> {tab.name}
                            </button>
                        ))}
                    </aside>
                    <main className="flex-1">
                        {activeTab === 'dashboard' ? renderDashboard() : <div className="p-20 text-center text-gray-400 italic">Module loading...</div>}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
