
import React, { useState, useEffect, useMemo } from 'react';
import { User, Listing, HeroSlide, Banner, CategoryImagesMap, ListingCategory, Dispute, Coupon } from '../types';
import { LayoutDashboardIcon, UsersIcon, PackageIcon, PaletteIcon, XIcon, CreditCardIcon, CheckCircleIcon, ShieldIcon, LayoutOverlayIcon, LayoutSplitIcon, LayoutWideIcon, EyeIcon, GavelIcon, AlertIcon, CheckSquareIcon, TicketIcon, CogIcon, CalculatorIcon, DollarSignIcon, TrashIcon, MapPinIcon, BarChartIcon, ExternalLinkIcon, LockIcon, ArrowRightIcon, TrendUpIcon, UmbrellaIcon, AlertTriangleIcon, MegaphoneIcon, RocketIcon, SlidersIcon, GlobeIcon } from './icons';
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
    { id: 'txn_105', date: 'Today, 11:15 AM', category: 'insurance_in', description: 'Premium Protection Plan', amount: 45.00, status: 'cleared', user: 'Guest #9901' },
    { id: 'txn_104', date: 'Today, 10:45 AM', category: 'claim_out', description: 'Damage Coverage Payout (Claim #22)', amount: -320.00, status: 'processed', user: 'Host: Sarah J.' },
    { id: 'txn_101', date: 'Today, 10:23 AM', category: 'revenue', description: 'Fixed Service Fee (Tier 1)', amount: 10.00, status: 'cleared', user: 'Guest #8821' },
    { id: 'txn_102', date: 'Today, 10:23 AM', category: 'payout', description: 'Rental Payment to Host', amount: 85.00, status: 'pending', user: 'Host: Carlos G.' },
    { id: 'txn_103', date: 'Today, 10:23 AM', category: 'deposit', description: 'Security Deposit Hold', amount: 250.00, status: 'held', user: 'Guest #8821' },
    { id: 'txn_106', date: 'Yesterday', category: 'ad_revenue', description: 'Campaign: Regional Hero (Jet Ski)', amount: 29.99, status: 'cleared', user: 'Host: Carlos G.' }, // New Ad Revenue
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

const RiskFundTab: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UmbrellaIcon className="h-8 w-8 text-purple-600" />
                        Risk & Insurance Fund (Soft Goods Only)
                    </h2>
                    <p className="text-sm text-gray-500">Manage self-insurance pools for eligible soft goods. Hard assets are externally insured.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold border border-green-200">
                    <CheckCircleIcon className="h-4 w-4" /> Solvency Ratio: 4.2x (Healthy)
                </div>
            </div>

            {/* NEW: Insurance Pricing Config Component */}
            <InsuranceStrategyConfig />

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Fund Balance</p>
                    <p className="text-3xl font-bold text-gray-900">$8,120.00</p>
                    <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                        <TrendUpIcon className="h-3 w-3" /> +$450 this week
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active Soft Goods Value</p>
                    <p className="text-3xl font-bold text-gray-900">$12,500</p>
                    <p className="text-xs text-gray-400 mt-2">Total covered inventory currently rented</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active Policies</p>
                    <p className="text-3xl font-bold text-gray-900">14</p>
                    <div className="flex gap-2 mt-2">
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">8 Premium</span>
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">6 Standard</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Loss Ratio (YTD)</p>
                    <p className="text-3xl font-bold text-green-600">5.4%</p>
                    <p className="text-xs text-gray-400 mt-2">Target: &lt; 20%</p>
                </div>
            </div>

            {/* Middle Section: Visuals & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Simulation */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-6">Fund Performance (Premiums vs Claims)</h3>
                    <div className="h-full max-h-64 flex items-end justify-between gap-2 px-2 pb-6">
                        {[40, 65, 45, 80, 55, 90, 70, 100, 85, 120, 60, 95].map((h, i) => (
                            <div key={i} className="w-full bg-purple-50 rounded-t-sm relative group h-48 flex flex-col justify-end">
                                <div 
                                    className="bg-purple-500 hover:bg-purple-600 transition-all rounded-t-sm w-full" 
                                    style={{ height: `${h}%` }}
                                ></div>
                                {/* Claim spike simulation */}
                                {i === 4 && <div className="absolute bottom-0 left-0 right-0 bg-red-400 h-[30%] opacity-80" title="Claim Paid"></div>}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 border-t pt-2">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                    </div>
                </div>

                {/* Risk Distribution Analyst View */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-y-auto max-h-[500px]">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChartIcon className="h-5 w-5 text-gray-500" />
                        <h3 className="font-bold text-gray-800">Soft Goods Risk Analysis</h3>
                    </div>
                    
                    <div className="space-y-6">
                        {/* 1. Winter Sports */}
                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-bold text-gray-700">Winter Sports</span>
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">High Risk</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                                <div className="bg-slate-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                                <strong className="text-gray-700">Analyst Note:</strong> High frequency of claims due to hidden rocks/ice impact on bases. Suggest 20% deductible.
                            </div>
                        </div>

                        {/* 2. Bikes */}
                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-bold text-gray-700">Bikes (MTB/Road)</span>
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded uppercase">Med Risk</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                                <strong className="text-gray-700">Analyst Note:</strong> Moderate risk of derailleur damage and frame scratches during transport.
                            </div>
                        </div>

                        {/* 3. Water Sports (Soft) */}
                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-bold text-gray-700">Water Sports (Soft)</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Low Risk</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                                <strong className="text-gray-700">Analyst Note:</strong> Includes Kayaks/SUP/Surf. Main liability is lost paddles or fins. Hull integrity usually stable.
                            </div>
                        </div>

                        {/* 4. Camping */}
                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-bold text-gray-700">Camping Gear</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Low Risk</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                                <strong className="text-gray-700">Analyst Note:</strong> Low severity claims (zippers, poles). High volume but low cost replacements.
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <h4 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                            <ShieldIcon className="h-4 w-4" /> Reinsurance Status
                        </h4>
                        <p className="text-xs text-purple-700 mt-1">
                            Catastrophic Coverage for Soft Goods active via Lloyd's. Trigger point: $50k single event.
                        </p>
                    </div>
                </div>
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Recent Claims & Payouts</h3>
                    <button className="text-sm text-purple-600 font-semibold hover:underline">View All History</button>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                            <td className="p-4 text-gray-500">Today</td>
                            <td className="p-4"><span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold">Claim Payout</span></td>
                            <td className="p-4 font-medium text-gray-900">Broken Ski Binding (Claim #22)</td>
                            <td className="p-4 text-red-600 font-bold">-$120.00</td>
                            <td className="p-4"><span className="text-gray-500 text-xs uppercase font-bold tracking-wide">Processed</span></td>
                            <td className="p-4 text-right"><button className="text-gray-400 hover:text-gray-600"><ExternalLinkIcon className="h-4 w-4"/></button></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="p-4 text-gray-500">Yesterday</td>
                            <td className="p-4"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">Premium</span></td>
                            <td className="p-4 font-medium text-gray-900">Premium Protection (Booking #992)</td>
                            <td className="p-4 text-green-600 font-bold">+$45.00</td>
                            <td className="p-4"><span className="text-green-600 text-xs uppercase font-bold tracking-wide">Collected</span></td>
                            <td className="p-4 text-right"><button className="text-gray-400 hover:text-gray-600"><ExternalLinkIcon className="h-4 w-4"/></button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FinancialsTab: React.FC = () => {
    // Determine Ad Revenue
    const adRevenueTotal = mockCampaigns.reduce((sum, cmp) => sum + cmp.price, 0);
    // Placeholder Service Fee Revenue
    const serviceFeeRevenue = 2450.00; 

    // State for Ledger Filtering
    const [activeFilter, setActiveFilter] = useState<'all' | 'revenue' | 'payout' | 'deposit' | 'ad_revenue'>('all');

    const filteredLedger = mockLedger.filter(txn => {
        if (activeFilter === 'all') {
            // Default exclusion of internal insurance flows to keep "General" clean, unless specifically requested
            return txn.category !== 'insurance_in' && txn.category !== 'claim_out';
        }
        return txn.category === activeFilter;
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
                    <p className="text-sm text-gray-500">Track platform revenue, escrow holdings, and payouts.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                    <ExternalLinkIcon className="h-4 w-4" /> Download Report
                </button>
            </div>

            {/* Revenue Streams Breakdown (New) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Net Platform Revenue (Total) */}
                <div className="col-span-1 md:col-span-2 bg-emerald-50 rounded-xl border border-emerald-100 p-6 flex flex-col h-full relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4 z-10">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                            <DollarSignIcon className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-emerald-900">Total Platform Revenue</h3>
                    </div>
                    <div className="mb-6 z-10">
                        <p className="text-4xl font-extrabold text-emerald-700">${(serviceFeeRevenue + adRevenueTotal).toFixed(2)}</p>
                        <p className="text-sm text-emerald-600 mt-1 font-medium">+ $450.00 this week</p>
                    </div>
                    <div className="mt-auto z-10 grid grid-cols-2 gap-4">
                        <div className="bg-white/60 p-3 rounded-lg border border-emerald-100">
                            <p className="text-xs text-emerald-800 uppercase font-bold">Booking Fees</p>
                            <p className="text-lg font-bold text-emerald-900">${serviceFeeRevenue.toFixed(2)}</p>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg border border-emerald-100">
                            <p className="text-xs text-emerald-800 uppercase font-bold flex items-center gap-1">Ads & Boosts <RocketIcon className="h-3 w-3" /></p>
                            <p className="text-lg font-bold text-emerald-900">${adRevenueTotal.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Column 2: ESCROW (Deposits) */}
                <div className="bg-amber-50 rounded-xl border border-amber-100 p-6 flex flex-col h-full relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4 z-10">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                            <ShieldIcon className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-amber-900">Held Security Deposits</h3>
                    </div>
                    <div className="mb-6 z-10">
                        <p className="text-3xl font-extrabold text-amber-700">$15,200.00</p>
                        <p className="text-sm text-amber-600 mt-1 font-medium">62 Active Holds</p>
                    </div>
                    <div className="mt-auto z-10">
                        <div className="text-xs text-amber-800 bg-white/60 p-3 rounded-lg border border-amber-100">
                            <strong>Status:</strong> Held in Escrow.
                        </div>
                    </div>
                </div>

                {/* Column 3: PAYOUTS (Hosts) */}
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 flex flex-col h-full relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4 z-10">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                            <ArrowRightIcon className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-blue-900">Pending Host Payouts</h3>
                    </div>
                    <div className="mb-6 z-10">
                        <p className="text-3xl font-extrabold text-blue-700">$4,120.00</p>
                        <p className="text-sm text-blue-600 mt-1 font-medium">Due in next 24h</p>
                    </div>
                    <div className="mt-auto z-10">
                        <div className="text-xs text-blue-800 bg-white/60 p-3 rounded-lg border border-blue-100">
                            <strong>Liability:</strong> Rental fees collected for hosts.
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Ledger */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                         <h3 className="font-bold text-gray-700">General Ledger</h3>
                         <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{filteredLedger.length} items</span>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        <button 
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setActiveFilter('revenue')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeFilter === 'revenue' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                        >
                            Revenue
                        </button>
                        <button 
                            onClick={() => setActiveFilter('payout')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeFilter === 'payout' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                        >
                            Payouts
                        </button>
                        <button 
                            onClick={() => setActiveFilter('deposit')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeFilter === 'deposit' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                        >
                            Deposits
                        </button>
                        <button 
                            onClick={() => setActiveFilter('ad_revenue')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeFilter === 'ad_revenue' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                        >
                            Ads
                        </button>
                    </div>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="p-4">Type</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">User</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredLedger.length > 0 ? (
                            filteredLedger.map((txn) => (
                            <tr key={txn.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    {txn.category === 'revenue' && <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-bold uppercase">Revenue</span>}
                                    {txn.category === 'deposit' && <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-bold uppercase">Deposit</span>}
                                    {txn.category === 'payout' && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold uppercase">Payout</span>}
                                    {txn.category === 'ad_revenue' && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold uppercase flex items-center gap-1 w-fit"><RocketIcon className="h-3 w-3"/> Ad Revenue</span>}
                                    {txn.category === 'insurance_in' && <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-bold uppercase">Premium</span>}
                                    {txn.category === 'claim_out' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold uppercase">Claim</span>}
                                </td>
                                <td className={`p-4 font-mono font-bold ${
                                    txn.amount < 0 ? 'text-gray-500' : 
                                    txn.category === 'payout' ? 'text-gray-900' : 'text-green-600'
                                }`}>
                                    {txn.amount < 0 ? '-' : ''}${Math.abs(txn.amount).toFixed(2)}
                                </td>
                                <td className="p-4 text-gray-800 font-medium">{txn.description}</td>
                                <td className="p-4 text-gray-500">{txn.user}</td>
                                <td className="p-4">
                                    <span className="capitalize text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{txn.status}</span>
                                </td>
                                <td className="p-4 text-gray-400 text-xs">{txn.date}</td>
                            </tr>
                        ))) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500 italic">No transactions found for this filter.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

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
            <h2 className="text-2xl font-bold mb-6">Payment Gateway Configuration</h2>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                        <CreditCardIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">Stripe Integration</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Connect your Stripe account to process payments, handle payouts, and manage refunds securely.
                        </p>
                        <form onSubmit={handleSave}>
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
                            <div className="mt-4 flex justify-end items-center">
                                {saved && <span className="text-sm text-green-600 mr-4 flex items-center gap-1"><CheckCircleIcon className="h-4 w-4"/> Saved!</span>}
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                                >
                                    {isSaving ? 'Connecting...' : 'Update Connection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
