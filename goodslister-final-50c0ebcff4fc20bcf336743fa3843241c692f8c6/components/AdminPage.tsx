
import React, { useState, useEffect, useMemo } from 'react';
import { User, Listing, HeroSlide, Banner, CategoryImagesMap, ListingCategory, Dispute, Coupon } from '../types';
import { LayoutDashboardIcon, UsersIcon, PackageIcon, PaletteIcon, XIcon, CreditCardIcon, CheckCircleIcon, ShieldIcon, LayoutOverlayIcon, LayoutSplitIcon, LayoutWideIcon, EyeIcon, GavelIcon, AlertIcon, CheckSquareIcon, TicketIcon, CogIcon, CalculatorIcon, DollarSignIcon, TrashIcon, MapPinIcon, BarChartIcon, ExternalLinkIcon, LockIcon, ArrowRightIcon, TrendUpIcon, UmbrellaIcon, AlertTriangleIcon, MegaphoneIcon, RocketIcon, SlidersIcon, GlobeIcon, UserCheckIcon, SearchIcon } from './icons';
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

// Mock Disputes Data
const mockDisputes: Dispute[] = [
    { id: 'dsp-1', bookingId: 'bk-123', reporterId: 'user-2', reason: 'damage', description: 'Item received with scratches not mentioned in listing.', status: 'open', dateOpened: '2024-03-10', amountInvolved: 150 },
    { id: 'dsp-2', bookingId: 'bk-456', reporterId: 'user-1', reason: 'late_return', description: 'Renter returned item 2 days late.', status: 'escalated', dateOpened: '2024-03-08', amountInvolved: 100 },
];

// Mock Coupons Data
const mockCoupons: Coupon[] = [
    { id: 'cpn-1', code: 'WELCOME10', discountType: 'percentage', discountValue: 10, usageLimit: 100, usedCount: 45, expiryDate: '2025-12-31', status: 'active' },
    { id: 'cpn-2', code: 'SUMMER20', discountType: 'fixed', discountValue: 20, usageLimit: 50, usedCount: 50, expiryDate: '2023-08-31', status: 'expired' },
];

// Mock Ad Campaigns (The Upsell Data)
const mockCampaigns = [
    { id: 'cmp-101', listing: 'Yamaha Jet Ski', owner: 'Carlos Gomez', plan: 'Regional Hero', price: 29.99, status: 'active', startDate: '2024-03-10', endDate: '2024-03-24', impressions: 1240 },
    { id: 'cmp-102', listing: 'Mountain Bike Pro', owner: 'Ana Rodriguez', plan: 'Local Boost', price: 5.99, status: 'active', startDate: '2024-03-12', endDate: '2024-03-15', impressions: 320 },
    { id: 'cmp-103', listing: 'Family RV', owner: 'Carlos Gomez', plan: 'Social Spotlight', price: 14.99, status: 'completed', startDate: '2024-02-01', endDate: '2024-02-08', impressions: 2100 },
];

// Mock Financial Ledger
const mockLedger = [
    { id: 'txn_105', date: '2024-03-15', category: 'insurance_in', description: 'Premium Protection Plan', amount: 45.00, status: 'cleared', user: 'Guest #9901' },
    { id: 'txn_104', date: '2024-03-15', category: 'claim_out', description: 'Damage Coverage Payout (Claim #22)', amount: -320.00, status: 'processed', user: 'Host: Sarah J.' },
    { id: 'txn_101', date: '2024-03-14', category: 'revenue', description: 'Fixed Service Fee (Tier 1)', amount: 10.00, status: 'cleared', user: 'Guest #8821' },
    { id: 'txn_102', date: '2024-03-14', category: 'payout', description: 'Rental Payment to Host', amount: -85.00, status: 'pending', user: 'Host: Carlos G.' },
    { id: 'txn_103', date: '2024-03-14', category: 'deposit', description: 'Security Deposit Hold', amount: 250.00, status: 'held', user: 'Guest #8821' },
    { id: 'txn_106', date: '2024-03-13', category: 'ad_revenue', description: 'Campaign: Regional Hero (Jet Ski)', amount: 29.99, status: 'cleared', user: 'Host: Carlos G.' },
    { id: 'txn_107', date: '2024-03-12', category: 'revenue', description: 'Fixed Service Fee (Tier 2)', amount: 25.00, status: 'cleared', user: 'Guest #1204' },
    { id: 'txn_108', date: '2024-03-12', category: 'payout', description: 'Rental Payment to Host', amount: -200.00, status: 'cleared', user: 'Host: Ana R.' },
];

const InsuranceStrategyConfig: React.FC = () => {
    // Strategy State
    const [strategy, setStrategy] = useState<'percentage' | 'tiered'>('percentage');
    const [deductible, setDeductible] = useState(500);
    const [isSaving, setIsSaving] = useState(false);

    // Percentage Model
    const [percentageRate, setPercentageRate] = useState(15);
    const [minFee, setMinFee] = useState(5);

    // Tiered Model
    const [tier1Limit, setTier1Limit] = useState(100); // Up to $100
    const [tier1Fee, setTier1Fee] = useState(10);
    
    const [tier2Limit, setTier2Limit] = useState(500); // Up to $500
    const [tier2Fee, setTier2Fee] = useState(35);
    
    const [tier3Fee, setTier3Fee] = useState(75); // Above $500

    // Simulator State
    const [simRentalValue, setSimRentalValue] = useState(250);

    const calculateFee = (val: number) => {
        if (strategy === 'percentage') {
            const calc = val * (percentageRate / 100);
            return Math.max(calc, minFee);
        } else {
            if (val <= tier1Limit) return tier1Fee;
            if (val <= tier2Limit) return tier2Fee;
            return tier3Fee;
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1500);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-6 text-white flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <SlidersIcon className="h-6 w-6" />
                        Insurance Pricing Engine
                    </h3>
                    <p className="text-purple-200 text-sm mt-1">Configure how the "Protection Plan" is calculated for renters.</p>
                </div>
                <div className="flex bg-white/10 p-1 rounded-lg">
                    <button 
                        onClick={() => setStrategy('percentage')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${strategy === 'percentage' ? 'bg-white text-purple-900' : 'text-purple-100 hover:bg-white/10'}`}
                    >
                        % Percentage
                    </button>
                    <button 
                        onClick={() => setStrategy('tiered')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${strategy === 'tiered' ? 'bg-white text-purple-900' : 'text-purple-100 hover:bg-white/10'}`}
                    >
                        Fixed Tiers
                    </button>
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Configuration Column */}
                <div className="space-y-8">
                    {/* Common Settings */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <ShieldIcon className="h-4 w-4 text-purple-600" />
                            Deductible (User Liability)
                        </label>
                        <div className="relative rounded-md shadow-sm max-w-xs">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                value={deductible}
                                onChange={(e) => setDeductible(Number(e.target.value))}
                                className="block w-full pl-7 border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Amount the renter pays before insurance kicks in.</p>
                    </div>

                    {strategy === 'percentage' ? (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                                <h4 className="font-bold text-purple-900 mb-4">Percentage Model Settings</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fee Percentage</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={percentageRate} 
                                                onChange={e => setPercentageRate(Number(e.target.value))}
                                                className="block w-full border-gray-300 rounded-md pr-8" 
                                            />
                                            <span className="absolute right-3 top-2 text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minimum Fee Floor</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                                            <input 
                                                type="number" 
                                                value={minFee} 
                                                onChange={e => setMinFee(Number(e.target.value))}
                                                className="block w-full border-gray-300 rounded-md pl-6" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in">
                             <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg space-y-4">
                                <h4 className="font-bold text-indigo-900 mb-2">Tiered Model Settings</h4>
                                
                                {/* Tier 1 */}
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs text-indigo-800 font-medium">Low Value (Up to)</label>
                                        <div className="relative"><span className="absolute left-2 top-1.5 text-xs">$</span><input type="number" value={tier1Limit} onChange={e => setTier1Limit(Number(e.target.value))} className="w-full pl-5 py-1 text-sm rounded border-gray-300"/></div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-indigo-800 font-bold">Charge Fee</label>
                                        <div className="relative"><span className="absolute left-2 top-1.5 text-xs">$</span><input type="number" value={tier1Fee} onChange={e => setTier1Fee(Number(e.target.value))} className="w-full pl-5 py-1 text-sm rounded border-indigo-300 bg-white font-bold text-indigo-700"/></div>
                                    </div>
                                </div>

                                {/* Tier 2 */}
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs text-indigo-800 font-medium">Mid Value (Up to)</label>
                                        <div className="relative"><span className="absolute left-2 top-1.5 text-xs">$</span><input type="number" value={tier2Limit} onChange={e => setTier2Limit(Number(e.target.value))} className="w-full pl-5 py-1 text-sm rounded border-gray-300"/></div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-indigo-800 font-bold">Charge Fee</label>
                                        <div className="relative"><span className="absolute left-2 top-1.5 text-xs">$</span><input type="number" value={tier2Fee} onChange={e => setTier2Fee(Number(e.target.value))} className="w-full pl-5 py-1 text-sm rounded border-indigo-300 bg-white font-bold text-indigo-700"/></div>
                                    </div>
                                </div>

                                {/* Tier 3 */}
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 pt-4">
                                        <span className="text-sm font-medium text-gray-500">High Value (Above)</span>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-indigo-800 font-bold">Charge Fee</label>
                                        <div className="relative"><span className="absolute left-2 top-1.5 text-xs">$</span><input type="number" value={tier3Fee} onChange={e => setTier3Fee(Number(e.target.value))} className="w-full pl-5 py-1 text-sm rounded border-indigo-300 bg-white font-bold text-indigo-700"/></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="px-6 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Update Insurance Model'}
                        </button>
                    </div>
                </div>

                {/* Simulator Column */}
                <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 flex flex-col justify-center">
                    <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <CalculatorIcon className="h-5 w-5 text-gray-500" />
                        Live Pricing Simulator
                    </h4>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Simulated Rental Total</label>
                            <input 
                                type="range" 
                                min="20" 
                                max="2000" 
                                step="10"
                                value={simRentalValue} 
                                onChange={(e) => setSimRentalValue(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <div className="mt-2 text-center font-mono font-bold text-xl text-gray-900">
                                ${simRentalValue}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <span className="text-gray-600">Calculated Insurance Fee</span>
                                <span className="text-2xl font-bold text-purple-600">
                                    ${calculateFee(simRentalValue).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Effective Rate</span>
                                <span className="font-medium text-gray-900">
                                    {((calculateFee(simRentalValue) / simRentalValue) * 100).toFixed(1)}%
                                </span>
                            </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Deductible Applied</span>
                                <span className="font-medium text-gray-900">${deductible}</span>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 text-center">
                            * This is the amount added to the renter's total at checkout.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BillingSettings: React.FC<{
    currentApiKey: string;
    onSaveApiKey: (key: string) => Promise<void>;
}> = ({ currentApiKey, onSaveApiKey }) => {
    // Payment State
    const [apiKey, setApiKey] = useState(currentApiKey);
    
    // Identity State
    const [identityEnabled, setIdentityEnabled] = useState(true);
    const [templateId, setTemplateId] = useState('itm_1234567890');
    
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Save API Key
        await onSaveApiKey(apiKey);
        
        // Simulating saving the Identity Config to site_config
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Gateway & Security Configuration</h2>
            
            {/* Stripe Payments */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                        <CreditCardIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">Stripe Payments</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Connect your Stripe account to process payments, handle payouts, and manage refunds securely.
                        </p>
                        <div>
                            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                                Stripe Secret Key (sk_live_...)
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    type="password"
                                    id="api-key"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                                    placeholder="sk_live_..."
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">This key is stored encrypted in your environment variables.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stripe Identity (New) */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 relative overflow-hidden">
                {identityEnabled && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-100 to-transparent"></div>}
                
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${identityEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <UserCheckIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Identity Verification (KYC)</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Enforce "Know Your Customer" checks using <strong>Stripe Identity</strong>. Requires users to upload a government ID and selfie before booking high-value items.
                                </p>
                            </div>
                            
                            {/* Toggle Switch */}
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={identityEnabled} onChange={() => setIdentityEnabled(!identityEnabled)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>

                        {identityEnabled && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Verification Template ID
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={templateId}
                                        onChange={(e) => setTemplateId(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                                        placeholder="itm_..."
                                    />
                                    <button className="px-3 py-2 text-xs font-bold text-cyan-700 bg-cyan-50 rounded hover:bg-cyan-100 border border-cyan-200">
                                        Test Mode
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Found in your <a href="#" className="text-cyan-600 hover:underline">Stripe Identity Dashboard</a>. Controls document types (Passport, Driver License).
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Action */}
            <div className="mt-6 flex justify-end items-center">
                {saved && <span className="text-sm text-green-600 mr-4 flex items-center gap-1"><CheckCircleIcon className="h-4 w-4"/> Settings Saved!</span>}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-gray-900 hover:bg-black disabled:bg-gray-400 transition-colors"
                >
                    {isSaving ? 'Updating Gateway...' : 'Update Configuration'}
                </button>
            </div>
        </div>
    );
};

// ... (Rest of component remains unchanged: GlobalSettingsTab, MarketingTab, SystemHealth, FinancialsTab, RiskFundTab, AdminPage) ...
const GlobalSettingsTab: React.FC = () => {
    // Tiered Pricing State
    const [feeThreshold, setFeeThreshold] = useState(100);
    const [lowTierFee, setLowTierFee] = useState(10);
    const [highTierFee, setHighTierFee] = useState(25);
    const [ownerFee, setOwnerFee] = useState(3);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => setIsSaving(false), 1000);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Platform Business Model</h2>
            
            {/* Renter Fee Section */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-cyan-500">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-cyan-100 p-2 rounded-full text-cyan-600">
                        <CalculatorIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Renter Service Fees (Tiered Strategy)</h3>
                        <p className="text-xs text-gray-500">Configure dynamic fixed fees based on the rental subtotal.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                    {/* 1. Threshold */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-2">1. Price Threshold</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                value={feeThreshold}
                                onChange={(e) => setFeeThreshold(Number(e.target.value))}
                                className="block w-full border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 pl-7 py-2"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">The breakpoint amount (e.g. rentals under/over $100).</p>
                    </div>

                    {/* 2. Low Fee */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-2">2. Fee for Low Value Rentals</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                value={lowTierFee}
                                onChange={(e) => setLowTierFee(Number(e.target.value))}
                                className="block w-full border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 pl-7 py-2 bg-green-50"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Applied if booking is &lt; ${feeThreshold}.</p>
                    </div>

                    {/* 3. High Fee */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-2">3. Fee for High Value Rentals</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                value={highTierFee}
                                onChange={(e) => setHighTierFee(Number(e.target.value))}
                                className="block w-full border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 pl-7 py-2 bg-blue-50"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Applied if booking is &gt;= ${feeThreshold}.</p>
                    </div>
                </div>

                <div className="mt-6 bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-600">
                    <p><strong>Current Logic:</strong></p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                        <li>If a user rents a kayak for <strong>$50</strong>, they pay a <strong>${lowTierFee}</strong> service fee.</li>
                        <li>If a user rents a boat for <strong>$500</strong>, they pay a <strong>${highTierFee}</strong> service fee.</li>
                    </ul>
                </div>
            </div>

            {/* Owner Fee Section */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-purple-500">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                        <CreditCardIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Owner Commission</h3>
                        <p className="text-xs text-gray-500">Percentage deducted from the payout.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">4. Transaction Fee (%)</label>
                        <div className="relative rounded-md shadow-sm">
                            <input
                                type="number"
                                value={ownerFee}
                                onChange={(e) => setOwnerFee(Number(e.target.value))}
                                className="block w-full border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 pl-3 pr-12 py-2"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">%</span>
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Deducted from the owner's payout.</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-colors shadow-lg flex items-center gap-2"
                >
                    {isSaving ? 'Updating...' : 'Update Billing Strategy'}
                </button>
            </div>
        </div>
    );
};

const MarketingTab: React.FC = () => {
    const [view, setView] = useState<'coupons' | 'campaigns'>('campaigns');
    const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
    const [showCreate, setShowCreate] = useState(false);
    
    // New Coupon State
    const [newCode, setNewCode] = useState('');
    const [newDiscount, setNewDiscount] = useState(10);
    const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');

    const handleCreateCoupon = () => {
        const coupon: Coupon = {
            id: `cpn-${Date.now()}`,
            code: newCode.toUpperCase(),
            discountType: newType,
            discountValue: newDiscount,
            usageLimit: 100,
            usedCount: 0,
            expiryDate: '2025-12-31',
            status: 'active'
        };
        setCoupons([...coupons, coupon]);
        setShowCreate(false);
        setNewCode('');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Marketing Engine</h2>
                    <p className="text-gray-600 text-sm">Manage discount codes and user ad campaigns.</p>
                </div>
                
                {/* Sub-Nav Switcher */}
                <div className="bg-gray-100 p-1 rounded-lg flex">
                    <button 
                        onClick={() => setView('campaigns')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'campaigns' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}
                    >
                        Active Campaigns
                    </button>
                    <button 
                        onClick={() => setView('coupons')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'coupons' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}
                    >
                        Coupons & Discounts
                    </button>
                </div>
            </div>

            {view === 'campaigns' ? (
                // CAMPAIGNS VIEW (NEW)
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                                <MegaphoneIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Active Campaigns</p>
                                <p className="text-2xl font-bold text-gray-900">12</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-full">
                                <DollarSignIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Ad Revenue (MTD)</p>
                                <p className="text-2xl font-bold text-gray-900">$450.00</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                <EyeIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Impressions Delivered</p>
                                <p className="text-2xl font-bold text-gray-900">8,450</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-4 font-medium text-gray-500">Listing</th>
                                    <th className="p-4 font-medium text-gray-500">Owner</th>
                                    <th className="p-4 font-medium text-gray-500">Plan</th>
                                    <th className="p-4 font-medium text-gray-500">Dates</th>
                                    <th className="p-4 font-medium text-gray-500">Performance</th>
                                    <th className="p-4 font-medium text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockCampaigns.map(cmp => (
                                    <tr key={cmp.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-900">{cmp.listing}</td>
                                        <td className="p-4 text-gray-600">{cmp.owner}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                cmp.plan.includes('Hero') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {cmp.plan}
                                            </span>
                                            <div className="text-xs text-gray-400 mt-1">${cmp.price} paid</div>
                                        </td>
                                        <td className="p-4 text-gray-500 text-xs">
                                            {cmp.startDate} - {cmp.endDate}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-green-600 font-bold">
                                                <EyeIcon className="h-3 w-3" /> {cmp.impressions} views
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${cmp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                                {cmp.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // COUPONS VIEW (EXISTING)
                <>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 flex items-center gap-2">
                            <TicketIcon className="h-5 w-5" />
                            Create Coupon
                        </button>
                    </div>

                    {showCreate && (
                        <div className="bg-white p-6 rounded-lg shadow mb-6 border border-cyan-100 animate-in fade-in slide-in-from-top-2">
                            <h3 className="font-bold text-lg mb-4">New Coupon Configuration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code</label>
                                    <input 
                                        type="text" 
                                        value={newCode} 
                                        onChange={e => setNewCode(e.target.value)} 
                                        className="w-full border-gray-300 rounded-md uppercase font-mono" 
                                        placeholder="SUMMER25"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                    <select 
                                        value={newType} 
                                        onChange={e => setNewType(e.target.value as any)} 
                                        className="w-full border-gray-300 rounded-md"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Value</label>
                                    <input 
                                        type="number" 
                                        value={newDiscount} 
                                        onChange={e => setNewDiscount(Number(e.target.value))} 
                                        className="w-full border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                                <button onClick={handleCreateCoupon} disabled={!newCode} className="px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:opacity-50">Launch Coupon</button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-4 font-medium text-gray-500">Code</th>
                                    <th className="p-4 font-medium text-gray-500">Discount</th>
                                    <th className="p-4 font-medium text-gray-500">Usage</th>
                                    <th className="p-4 font-medium text-gray-500">Status</th>
                                    <th className="p-4 font-medium text-gray-500">Expiry</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map(coupon => (
                                    <tr key={coupon.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 font-mono font-bold text-gray-800">{coupon.code}</td>
                                        <td className="p-4 text-green-600 font-bold">
                                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `-$${coupon.discountValue}`}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {coupon.usedCount} / {coupon.usageLimit}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${coupon.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                                {coupon.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500">{coupon.expiryDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
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
                    if (res.status === 404) {
                        setStatus({ blob: false, postgres: false, ai: false });
                        return;
                    }
                    throw new Error(`Server returned ${res.status}`);
                }
                const data = await res.json();
                setStatus(data);
            } catch (err) {
                setStatus({ blob: false, postgres: false, ai: false });
            }
        };
        checkStatus();
    }, []);

    if (!status) return <div className="p-4 text-gray-500">Checking system health...</div>;

    const StatusItem = ({ label, connected, helpText }: { label: string, connected: boolean, helpText: string }) => (
        <div className={`p-4 rounded-lg border ${connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-700">{label}</span>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${connected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {connected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
            </div>
            <p className="text-sm text-gray-600">{connected ? 'Operational.' : helpText}</p>
        </div>
    );

    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Platform Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusItem label="Image Storage" connected={status.blob} helpText="Connect Vercel Blob" />
                <StatusItem label="Database" connected={status.postgres} helpText="Connect Vercel Postgres" />
                <StatusItem label="AI Intelligence" connected={status.ai} helpText="Configure API_KEY" />
            </div>
        </div>
    );
};

const FinancialsTab: React.FC = () => {
    // --- ROBUST FILTERING & CALCULATIONS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    
    // Sort logic (Newest First by default)
    const sortedLedger = [...mockLedger].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filtering Logic
    const filteredLedger = useMemo(() => {
        return sortedLedger.filter(txn => {
            const matchesSearch = 
                txn.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                txn.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                txn.id.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = filterCategory === 'all' 
                ? true 
                : filterCategory === 'income' 
                    ? (txn.category === 'revenue' || txn.category === 'ad_revenue' || txn.category === 'insurance_in')
                    : filterCategory === 'expense'
                        ? (txn.category === 'payout' || txn.category === 'claim_out')
                        : txn.category === filterCategory;

            const matchesStatus = filterStatus === 'all' ? true : txn.status === filterStatus;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [searchTerm, filterCategory, filterStatus, sortedLedger]);

    // Dynamic Stats Calculation
    const stats = useMemo(() => {
        const grossVolume = filteredLedger.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);
        const payoutVolume = filteredLedger.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
        const riskFundBalance = filteredLedger
            .filter(t => t.category === 'insurance_in' || t.category === 'claim_out')
            .reduce((sum, t) => sum + t.amount, 0); // Simplified calc for display
        
        return { grossVolume, payoutVolume, riskFundBalance };
    }, [filteredLedger]);

    const getTypeColor = (cat: string) => {
        if (['revenue', 'ad_revenue', 'insurance_in'].includes(cat)) return 'text-green-600 bg-green-50 border-green-200';
        if (['payout', 'claim_out'].includes(cat)) return 'text-gray-600 bg-gray-50 border-gray-200';
        if (cat === 'deposit') return 'text-blue-600 bg-blue-50 border-blue-200';
        return 'text-gray-600';
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Financial Performance</h2>
            
            {/* Dynamic Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtered Revenue (In)</p>
                    <p className="text-3xl font-extrabold text-gray-900 mt-2">${stats.grossVolume.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    <span className="text-green-600 text-xs font-bold flex items-center mt-2 bg-green-50 inline-block px-2 py-1 rounded">
                        <TrendUpIcon className="h-3 w-3 mr-1" /> Incoming Flow
                    </span>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtered Payouts (Out)</p>
                    <p className="text-3xl font-extrabold text-gray-900 mt-2">-${stats.payoutVolume.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    <p className="text-xs text-gray-400 mt-2">Host transfers & claims</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md border-l-4 border-l-purple-500">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Risk Fund Impact</p>
                    <p className={`text-3xl font-extrabold mt-2 ${stats.riskFundBalance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                        {stats.riskFundBalance >= 0 ? '+' : ''}${stats.riskFundBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Premiums collected vs Claims paid</p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5 text-gray-500" />
                    Ledger Entries
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{filteredLedger.length} records found</span>
            </div>

            {/* --- ROBUST FILTER TOOLBAR --- */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-1/3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search ID, User, or Description..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 h-10"
                    />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <select 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-lg h-10"
                    >
                        <option value="all">All Categories</option>
                        <option value="income">🟢 All Income</option>
                        <option value="expense">🔴 All Expenses</option>
                        <option value="revenue">Service Fees</option>
                        <option value="insurance_in">Insurance Premiums</option>
                        <option value="payout">Host Payouts</option>
                        <option value="claim_out">Claims Paid</option>
                        <option value="deposit">Deposits (Held)</option>
                    </select>

                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-lg h-10"
                    >
                        <option value="all">All Statuses</option>
                        <option value="cleared">✅ Cleared</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="processed">🔄 Processed</option>
                        <option value="held">🔒 Held</option>
                    </select>
                    
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <ExternalLinkIcon className="h-4 w-4" /> Export
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">ID</th>
                            <th className="p-4 font-medium text-gray-500">Date</th>
                            <th className="p-4 font-medium text-gray-500">Category</th>
                            <th className="p-4 font-medium text-gray-500">Description</th>
                            <th className="p-4 font-medium text-gray-500">User</th>
                            <th className="p-4 font-medium text-gray-500 text-right">Amount</th>
                            <th className="p-4 font-medium text-gray-500 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredLedger.length > 0 ? (
                            filteredLedger.map(txn => (
                                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono text-xs text-gray-400">{txn.id}</td>
                                    <td className="p-4 text-gray-600 whitespace-nowrap">{txn.date}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getTypeColor(txn.category)}`}>
                                            {txn.category.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-gray-900">{txn.description}</td>
                                    <td className="p-4 text-gray-600">{txn.user}</td>
                                    <td className={`p-4 font-bold text-right ${txn.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                        {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase inline-flex items-center gap-1 ${
                                            txn.status === 'cleared' ? 'bg-green-100 text-green-800' : 
                                            txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                            txn.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {txn.status === 'cleared' && <CheckCircleIcon className="h-3 w-3"/>}
                                            {txn.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-gray-500">
                                    No transactions found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Mock Pagination */}
            {filteredLedger.length > 0 && (
                <div className="flex justify-end mt-4 gap-2">
                    <button disabled className="px-3 py-1 text-sm border rounded bg-gray-100 text-gray-400 cursor-not-allowed">Previous</button>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 text-gray-700">Next</button>
                </div>
            )}
        </div>
    );
};

const RiskFundTab = InsuranceStrategyConfig;

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
    onUpdateListingImage,
    onViewListing,
    onDeleteListing
}) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [uploadingStates, setUploadingStates] = useState<{[key: string]: boolean}>({});

    // --- NEW: Global Region Context ---
    // In a real app, this might come from a context provider
    const [selectedRegion, setSelectedRegion] = useState<string>('GLOBAL'); // 'GLOBAL', 'US', 'AR', etc.

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
        { id: 'dashboard', name: 'Command Center', icon: LayoutDashboardIcon },
        { id: 'financials', name: 'Financials', icon: DollarSignIcon }, 
        { id: 'risk_fund', name: 'Risk & Insurance', icon: UmbrellaIcon }, // New Robust Tab
        { id: 'disputes', name: 'Disputes', icon: GavelIcon },
        { id: 'marketing', name: 'Marketing', icon: TicketIcon },
        { id: 'users', name: 'Users', icon: UsersIcon },
        { id: 'listings', name: 'All Listings', icon: PackageIcon },
        { id: 'content', name: 'Content', icon: PaletteIcon },
        { id: 'billing', name: 'Gateway', icon: CreditCardIcon },
        { id: 'settings', name: 'Settings', icon: CogIcon },
    ];

    const displayCategoryImages = { ...initialCategoryImages, ...categoryImages };
    
    // --- FILTERING LOGIC FOR SCALABILITY ---
    // If region is GLOBAL, show all. If specific, filter by country code.
    const filteredListings = useMemo(() => {
        if (selectedRegion === 'GLOBAL') return listings;
        return listings.filter(l => l.location.countryCode === selectedRegion);
    }, [listings, selectedRegion]);

    const filteredUsers = useMemo(() => {
        if (selectedRegion === 'GLOBAL') return users;
        // In real app, filter users by their home_region or booking history in that region
        return users.filter(u => u.homeRegion === selectedRegion); 
    }, [users, selectedRegion]);

    const stats = useMemo(() => {
        const totalRevenue = filteredListings.reduce((sum, l) => sum + (l.pricePerDay || 0) * 5, 0); // Mock calc
        return {
            gmv: totalRevenue * 10, // Mock GMV
            revenue: totalRevenue,
            activeListings: filteredListings.length,
            disputes: selectedRegion === 'GLOBAL' ? 2 : 0 // Mock logic
        };
    }, [filteredListings, selectedRegion]);


    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Global Overview</h2>
                             {/* --- REGION SELECTOR (THE SCALABILITY KEY) --- */}
                            <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
                                <GlobeIcon className="h-4 w-4 text-gray-500 ml-2" />
                                <span className="text-xs font-bold text-gray-500 uppercase mr-1">Region:</span>
                                <select 
                                    value={selectedRegion} 
                                    onChange={(e) => setSelectedRegion(e.target.value)}
                                    className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer"
                                >
                                    <option value="GLOBAL">Earth (Global View)</option>
                                    <option value="US">North America (USA)</option>
                                    <option value="AR">South America (Argentina)</option>
                                    <option value="EU">Europe (EU)</option>
                                </select>
                            </div>
                        </div>

                        <SystemHealth />
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {/* Business Intelligence Metrics */}
                            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-6 rounded-lg shadow-lg text-white">
                                <h3 className="text-sm font-medium opacity-90">Gross Merchandise Value (GMV)</h3>
                                <p className="text-3xl font-bold mt-1">${stats.gmv.toLocaleString()}</p>
                                <span className="text-xs bg-white/20 px-2 py-1 rounded mt-2 inline-block">+12% vs last month</span>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500">Net Revenue ({selectedRegion === 'GLOBAL' ? 'Global' : selectedRegion})</h3>
                                <p className="text-3xl font-bold mt-1 text-gray-900">${stats.revenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500">Active Listings</h3>
                                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.activeListings}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500">Open Disputes</h3>
                                <p className="text-3xl font-bold mt-1 text-red-600">{stats.disputes}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Recent Activity in {selectedRegion === 'GLOBAL' ? 'All Regions' : selectedRegion}</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center text-sm text-gray-600">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        New user registration: <strong>Ana Rodriguez</strong>
                                    </li>
                                    <li className="flex items-center text-sm text-gray-600">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                        New listing: <strong>Mountain Bike</strong> in Mendoza
                                    </li>
                                    <li className="flex items-center text-sm text-gray-600">
                                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                        Booking request #492 pending approval
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={() => setActiveTab('listings')} className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-md text-sm font-medium hover:bg-cyan-200">
                                        Manage Listings
                                    </button>
                                    <button onClick={() => setActiveTab('disputes')} className="px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200">
                                        Handle Disputes
                                    </button>
                                    <button onClick={() => setActiveTab('financials')} className="px-4 py-2 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200">
                                        View Financials
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'financials':
                return <FinancialsTab />;
            case 'risk_fund':
                return <RiskFundTab />;
            case 'marketing':
                return <MarketingTab />;
            case 'settings':
                return <GlobalSettingsTab />;
            case 'disputes':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Dispute Resolution Center</h2>
                            <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">2 Active Cases</span>
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-4 font-medium text-gray-500">ID</th>
                                        <th className="p-4 font-medium text-gray-500">Reason</th>
                                        <th className="p-4 font-medium text-gray-500">Amount</th>
                                        <th className="p-4 font-medium text-gray-500">Status</th>
                                        <th className="p-4 font-medium text-gray-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockDisputes.map(dispute => (
                                        <tr key={dispute.id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="p-4 font-mono text-gray-600">{dispute.id}</td>
                                            <td className="p-4">
                                                <span className="font-bold block text-gray-800 capitalize">{dispute.reason.replace('_', ' ')}</span>
                                                <span className="text-xs text-gray-500">{dispute.description}</span>
                                            </td>
                                            <td className="p-4 font-bold">${dispute.amountInvolved}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                                                    dispute.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 
                                                    dispute.status === 'escalated' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {dispute.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button className="text-cyan-600 hover:underline mr-3">View Evidence</button>
                                                <button className="text-gray-600 hover:text-gray-900">Message</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Manage Users ({filteredUsers.length})</h2>
                        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="border-b">
                                            <td className="p-3 font-medium">
                                                {user.name}
                                                <div className="text-xs text-gray-400">Joined: {user.registeredDate}</div>
                                            </td>
                                            <td className="p-3 text-gray-600">{user.email}</td>
                                            <td className="p-3"><span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{user.role || 'USER'}</span></td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isIdVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {user.isIdVerified ? 'Verified' : 'Unverified'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button className="text-xs text-red-600 hover:underline mr-3 font-semibold" onClick={() => alert(`Simulated Ban for ${user.name}`)}>
                                                    Suspend
                                                </button>
                                                <button className="text-xs text-gray-500 hover:text-gray-800 hover:underline" onClick={() => alert(`Reset password email sent to ${user.email}`)}>
                                                    Reset Pass
                                                </button>
                                            </td>
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
                        <h2 className="text-2xl font-bold mb-6">Manage Listings ({filteredListings.length})</h2>
                         <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3">Title</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Owner</th>
                                        <th className="p-3">Price</th>
                                        <th className="p-3">Location</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredListings.map(listing => (
                                        <tr key={listing.id} className="border-b">
                                            <td className="p-3">{listing.title}</td>
                                            <td className="p-3">{listing.category}</td>
                                            <td className="p-3">{listing.owner.name}</td>
                                            <td className="p-3">${listing.pricePerDay} <span className="text-gray-400 text-xs">{listing.currency}</span></td>
                                            <td className="p-3 text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <MapPinIcon className="h-3 w-3" />
                                                    {listing.location.city}, {listing.location.country}
                                                </div>
                                            </td>
                                            <td className="p-3 text-right flex justify-end gap-2">
                                                <button 
                                                    onClick={() => onViewListing(listing.id)}
                                                    className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                                                    title="View Listing Details"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if(confirm(`Are you sure you want to delete "${listing.title}"? This cannot be undone.`)) {
                                                            onDeleteListing(listing.id);
                                                        }
                                                    }}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete Listing"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </td>
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
                                        
                                        {/* Layout Selector */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Banner Layout</label>
                                            <div className="flex gap-4">
                                                {['overlay', 'split', 'wide'].map((layout) => (
                                                    <button
                                                        key={layout}
                                                        onClick={() => onUpdateBanner(banner.id, 'layout', layout)}
                                                        className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                                                            (banner.layout || 'overlay') === layout 
                                                                ? 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500' 
                                                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {layout === 'overlay' && <LayoutOverlayIcon className="w-8 h-8 mb-1" />}
                                                        {layout === 'split' && <LayoutSplitIcon className="w-8 h-8 mb-1" />}
                                                        {layout === 'wide' && <LayoutWideIcon className="w-8 h-8 mb-1" />}
                                                        <span className="text-xs font-medium capitalize">{layout}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Button Link (Optional)</label>
                                            <input 
                                                type="text" 
                                                value={banner.linkUrl || ''} 
                                                onChange={e => onUpdateBanner(banner.id, 'linkUrl', e.target.value)} 
                                                className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                                                placeholder="e.g., /explore or /createListing"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Use local paths (like '/explore') or full URLs.</p>
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
                                            ? 'bg-cyan-600 text-white shadow-md'
                                            : 'hover:bg-gray-200 text-gray-700'
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
