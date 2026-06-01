import React, { useState, useEffect, useMemo } from 'react';
import { User, Listing, HeroSlide, Banner, CategoryImagesMap, ListingCategory, Dispute, Coupon, Booking } from '../types';
import { LayoutDashboardIcon, UsersIcon, PackageIcon, PaletteIcon, XIcon, CreditCardIcon, CheckCircleIcon, ShieldIcon, LayoutOverlayIcon, LayoutSplitIcon, LayoutWideIcon, EyeIcon, GavelIcon, AlertIcon, CheckSquareIcon, TicketIcon, CogIcon, CalculatorIcon, DollarSignIcon, TrashIcon, MapPinIcon, BarChartIcon, ExternalLinkIcon, LockIcon, ArrowRightIcon, TrendUpIcon, UmbrellaIcon, AlertTriangleIcon, MegaphoneIcon, RocketIcon, SlidersIcon, GlobeIcon, UserCheckIcon, SearchIcon, RefreshCwIcon, CalendarIcon, SparklesIcon, StarIcon } from './icons';
import ImageUploader from './ImageUploader';
import { initialCategoryImages } from '../constants';

type AdminTab = 'dashboard' | 'users' | 'listings' | 'bookings' | 'financials' | 'risk_fund' | 'disputes' | 'content' | 'billing' | 'marketing' | 'settings' | 'boosts' | 'ai_ops';

interface AdminPageProps {
    users: User[];
    listings: Listing[];
    bookings: Booking[];
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
    onUpdateDepositStatus: (bookingId: string, newStatus: 'held' | 'released' | 'disputed' | 'claimed') => void;
}

// Restored missing mock data definitions required by the Admin dashboard components
const mockDisputes: Dispute[] = [
    { id: 'dsp-1', bookingId: 'bk-123', reporterId: 'user-2', reason: 'damage', description: 'Item received with scratches not mentioned in listing.', status: 'open', dateOpened: '2024-03-10', amountInvolved: 150 },
    { id: 'dsp-2', bookingId: 'bk-456', reporterId: 'user-1', reason: 'late_return', description: 'Renter returned item 2 days late.', status: 'escalated', dateOpened: '2024-03-08', amountInvolved: 100 },
];

const mockCoupons: Coupon[] = [
    { id: 'cpn-1', code: 'WELCOME10', discountType: 'percentage', discountValue: 10, usageLimit: 100, usedCount: 45, expiryDate: '2025-12-31', status: 'active' },
    { id: 'cpn-2', code: 'SUMMER20', discountType: 'fixed', discountValue: 20, usageLimit: 50, usedCount: 50, expiryDate: '2023-08-31', status: 'expired' },
];

const mockCampaigns = [
    { id: 'cmp-101', listing: 'Yamaha Jet Ski', owner: 'Carlos Gomez', plan: 'Regional Hero', price: 29.99, status: 'active', startDate: '2024-03-10', endDate: '2024-03-24', impressions: 1240 },
    { id: 'cmp-102', listing: 'Mountain Bike Pro', owner: 'Ana Rodriguez', plan: 'Local Boost', price: 5.99, status: 'active', startDate: '2024-03-12', endDate: '2024-03-15', impressions: 320 },
    { id: 'cmp-103', listing: 'Family RV', owner: 'Carlos Gomez', plan: 'Social Spotlight', price: 14.99, status: 'completed', startDate: '2024-02-01', endDate: '2024-02-08', impressions: 2100 },
];

// Financial Ledger Data
const mockLedger = [
    { id: 'txn_105', date: '2024-05-15', category: 'INSURANCE IN', description: 'Premium Protection Plan', amount: 45.00, status: 'CLEARED', user: 'Guest #9901' },
    { id: 'txn_104', date: '2024-05-15', category: 'CLAIM OUT', description: 'Damage Coverage Payout (Claim #22)', amount: -320.00, status: 'PROCESSED', user: 'Host: Sarah J.' },
    { id: 'txn_101', date: '2024-05-14', category: 'REVENUE', description: 'Fixed Service Fee (Tier 1)', amount: 10.00, status: 'CLEARED', user: 'Guest #8821' },
    { id: 'txn_102', date: '2024-05-14', category: 'PAYOUT', description: 'Rental Payment to Host', amount: -85.00, status: 'PENDING', user: 'Host: Carlos G.' },
    { id: 'txn_103', date: '2024-05-14', category: 'DEPOSIT', description: 'Security Deposit Hold', amount: 250.00, status: 'HELD', user: 'Guest #8821' },
    { id: 'txn_106', date: '2024-05-13', category: 'AD REVENUE', description: 'Campaign: Regional Hero (Jet Ski)', amount: 29.99, status: 'CLEARED', user: 'Host: Carlos G.' },
    { id: 'txn_107', date: '2024-05-12', category: 'REVENUE', description: 'Fixed Service Fee (Tier 2)', amount: 25.00, status: 'CLEARED', user: 'Guest #1204' },
    { id: 'txn_108', date: '2024-05-12', category: 'PAYOUT', description: 'Rental Payment to Host', amount: -200.00, status: 'CLEARED', user: 'Host: Ana R.' },
];

const FinancialsTab: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All Categories');
    const [filterStatus, setFilterStatus] = useState('All Statuses');

    const categories = ['All Categories', 'REVENUE', 'PAYOUT', 'INSURANCE IN', 'CLAIM OUT', 'DEPOSIT', 'AD REVENUE'];
    const statuses = ['All Statuses', 'CLEARED', 'PROCESSED', 'PENDING', 'HELD'];

    const filteredEntries = useMemo(() => {
        return mockLedger.filter(item => {
            const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 item.user.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'All Categories' || item.category === filterCategory;
            const matchesStatus = filterStatus === 'All Statuses' || item.status === filterStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [searchQuery, filterCategory, filterStatus]);

    const stats = useMemo(() => {
        const revenue = filteredEntries
            .filter(item => item.amount > 0 && item.category !== 'DEPOSIT')
            .reduce((sum, item) => sum + item.amount, 0);
        
        const payouts = filteredEntries
            .filter(item => item.amount < 0)
            .reduce((sum, item) => sum + item.amount, 0);

        const riskFundImpact = filteredEntries
            .filter(item => item.category === 'INSURANCE IN' || item.category === 'CLAIM OUT')
            .reduce((sum, item) => sum + item.amount, 0);

        return { revenue, payouts, riskFundImpact };
    }, [filteredEntries]);

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'INSURANCE IN': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'REVENUE': return 'bg-cyan-50 text-cyan-600 border-cyan-100';
            case 'AD REVENUE': return 'bg-lime-50 text-lime-600 border-lime-100';
            case 'DEPOSIT': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'PAYOUT': return 'bg-gray-50 text-gray-600 border-gray-100';
            case 'CLAIM OUT': return 'bg-red-50 text-red-600 border-red-100 font-bold';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'CLEARED': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
            case 'PROCESSED': return 'text-blue-500 bg-blue-50 border-blue-200';
            case 'PENDING': return 'text-orange-500 bg-orange-50 border-orange-200';
            case 'HELD': return 'text-slate-400 bg-slate-50 border-slate-200';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Performance</h2>
            
            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Revenue (IN)</p>
                    <h4 className="text-3xl font-bold text-slate-900 tracking-tight">${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
                    <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold mt-4">
                        <TrendUpIcon className="h-4 w-4" /> Incoming Flow
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Payouts (OUT)</p>
                    <h4 className="text-3xl font-bold text-slate-900 tracking-tight">-${Math.abs(stats.payouts).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mt-4">
                        <ArrowRightIcon className="h-4 w-4 rotate-45" /> Host transfers & claims
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[1.5rem] border border-purple-500 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <UmbrellaIcon className="h-20 w-20 text-purple-900" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Fund Impact</p>
                    <h4 className={`text-3xl font-bold mt-1 tracking-tight ${stats.riskFundImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {stats.riskFundImpact < 0 ? '-' : ''}${Math.abs(stats.riskFundImpact).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h4>
                    <p className="text-slate-400 text-[10px] font-semibold mt-4">Collected Premiums vs Claims paid</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <CalculatorIcon className="h-5 w-5 text-slate-400" />
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Transaction Ledger</h3>
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ml-2">{filteredEntries.length} records</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search ID, User, or Description"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none font-medium text-slate-700"
                            />
                        </div>
                        
                        <select 
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>

                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                        >
                            {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>

                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-sm">
                            <ExternalLinkIcon className="h-4 w-4" /> Export
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest">ID</th>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Date</th>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Category</th>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Description</th>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest">User Actor</th>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-right">Amount</th>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredEntries.length > 0 ? (
                                filteredEntries.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-mono text-[11px] text-slate-400 font-bold">{txn.id}</td>
                                        <td className="p-4 text-slate-600 font-medium">{txn.date}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-tighter ${getCategoryStyles(txn.category)}`}>
                                                {txn.category}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-slate-800">{txn.description}</td>
                                        <td className="p-4 text-slate-500 font-bold">{txn.user}</td>
                                        <td className={`p-4 font-black text-right ${txn.amount > 0 ? 'text-emerald-500' : 'text-slate-900'}`}>
                                            {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 justify-center w-fit ml-auto ${getStatusStyles(txn.status)}`}>
                                                {txn.status === 'CLEARED' && <CheckCircleIcon className="h-3 w-3" />}
                                                {txn.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 italic">No transactions found matching your filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

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
                        Promo Codes
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
                <>
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-8">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <TicketIcon className="h-5 w-5 text-cyan-500" />
                                Create Promo Code
                            </h3>
                            <p className="text-xs text-slate-400 font-bold uppercase mt-1">Generate new discount vouchers for the community</p>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Code Name</label>
                                    <input 
                                        type="text" 
                                        value={newCode} 
                                        onChange={e => setNewCode(e.target.value)} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-cyan-500/20 outline-none uppercase font-mono placeholder:lowercase" 
                                        placeholder="e.g. SUMMER25"
                                    />
                                </div>
                                <div className="space-y-2 text-sm font-bold">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount Type</label>
                                    <select 
                                        value={newType} 
                                        onChange={e => setNewType(e.target.value as any)} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={newDiscount} 
                                            onChange={e => setNewDiscount(Number(e.target.value))} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                            {newType === 'percentage' ? '%' : '$'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</label>
                                    <input 
                                        type="date" 
                                        defaultValue="2025-12-31"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleCreateCoupon} 
                                    disabled={!newCode} 
                                    className="px-8 py-3 bg-cyan-600 text-white font-black rounded-2xl hover:bg-cyan-700 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                                >
                                    <SparklesIcon className="h-5 w-5" />
                                    CREATE PROMO CODE
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400">
                                <tr>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest">Code</th>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest">Discount</th>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest">Usage</th>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest">Status</th>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest">Expiry</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map(coupon => (
                                    <tr key={coupon.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                        <td className="p-4 font-mono font-black text-slate-800 text-lg tracking-tighter">{coupon.code}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 rounded border border-emerald-100 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                                                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `-$${coupon.discountValue}`}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 font-bold">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden w-24">
                                                    <div 
                                                        className="h-full bg-cyan-500" 
                                                        style={{ width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px]">{coupon.usedCount}/{coupon.usageLimit}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${coupon.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                {coupon.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 font-bold text-xs">{coupon.expiryDate}</td>
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

const RiskFundTab = InsuranceStrategyConfig;

const BookingsTab: React.FC<{ bookings: Booking[], onUpdateDepositStatus: (id: string, status: 'held' | 'released' | 'disputed' | 'claimed') => void }> = ({ bookings, onUpdateDepositStatus }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All Statuses');
    const [filterDeposit, setFilterDeposit] = useState('All Deposits');

    const statuses = ['All Statuses', 'confirmed', 'active', 'completed', 'cancelled'];
    const depositStatuses = ['All Deposits', 'held', 'released', 'disputed', 'claimed'];

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const matchesSearch = b.listing.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 b.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'All Statuses' || b.status === filterStatus;
            const matchesDeposit = filterDeposit === 'All Deposits' || b.depositStatus === filterDeposit;
            return matchesSearch && matchesStatus && matchesDeposit;
        });
    }, [bookings, searchQuery, filterStatus, filterDeposit]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'active': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'completed': return 'bg-gray-50 text-gray-600 border-gray-100';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    const getDepositStyles = (status: string) => {
        switch (status) {
            case 'held': return 'bg-cyan-50 text-cyan-600 border-cyan-100';
            case 'released': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'disputed': return 'bg-red-50 text-red-600 border-red-100 font-bold';
            case 'claimed': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Booking Management</h2>
                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-2xl border border-amber-100 text-sm font-bold">
                    <LockIcon className="h-4 w-4" />
                    <span>Escrow Control Active</span>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-slate-400" />
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Reservations</h3>
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ml-2">{filteredBookings.length} total</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search Booking ID or Listing"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none font-medium text-slate-700"
                            />
                        </div>
                        
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                        >
                            {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>

                        <select 
                            value={filterDeposit}
                            onChange={(e) => setFilterDeposit(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                        >
                            {depositStatuses.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Booking ID</th>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Listing</th>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Status</th>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Security Deposit</th>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Deposit Status</th>
                                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-mono text-[11px] text-slate-400 font-bold">{b.id}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={b.listing.images[0]} className="w-8 h-8 rounded-lg object-cover" />
                                                <span className="font-bold text-slate-800">{b.listing.title}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(b.status)}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-black text-slate-900">
                                            {b.securityDeposit ? `$${b.securityDeposit}` : 'N/A'}
                                        </td>
                                        <td className="p-4">
                                            {b.securityDeposit ? (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getDepositStyles(b.depositStatus || 'held')}`}>
                                                    {b.depositStatus || 'held'}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Consistent Action for all bookings */}
                                                <button 
                                                    onClick={() => alert(`Showing details for booking ${b.id}`)}
                                                    className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg hover:bg-slate-200 transition-all uppercase"
                                                >
                                                    View Details
                                                </button>

                                                {/* Status Specific Actions */}
                                                {b.status === 'pending' && (
                                                    <>
                                                        <button 
                                                            onClick={() => alert(`Approved booking ${b.id}`)}
                                                            className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg hover:bg-emerald-600 transition-all"
                                                        >
                                                            APPROVE
                                                        </button>
                                                        <button 
                                                            onClick={() => alert(`Rejected booking ${b.id}`)}
                                                            className="px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg hover:bg-red-600 transition-all"
                                                        >
                                                            REJECT
                                                        </button>
                                                    </>
                                                )}
                                                {b.status === 'active' && (
                                                    <button 
                                                        onClick={() => alert(`Cancelled booking ${b.id}`)}
                                                        className="px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg hover:bg-red-600 transition-all"
                                                    >
                                                        CANCEL
                                                    </button>
                                                )}
                                                {b.status === 'completed' && null}

                                                {/* Deposit Escrow Actions */}
                                                {b.securityDeposit && (b.depositStatus === 'held' || b.depositStatus === 'disputed' || !b.depositStatus) && (
                                                    <div className="flex border-l border-slate-100 pl-2 gap-2">
                                                        <button 
                                                            onClick={() => onUpdateDepositStatus(b.id, 'released')}
                                                            className="p-1 px-2 border border-emerald-500 text-emerald-600 text-[9px] font-black rounded hover:bg-emerald-50 transition-all"
                                                            title="Release Escrow"
                                                        >
                                                            RELEASE
                                                        </button>
                                                        <button 
                                                            onClick={() => onUpdateDepositStatus(b.id, 'claimed')}
                                                            className="p-1 px-2 border border-red-500 text-red-600 text-[9px] font-black rounded hover:bg-red-50 transition-all"
                                                            title="Claim Escrow"
                                                        >
                                                            CLAIM
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 italic font-bold">No bookings found matching your filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const AdminPage: React.FC<AdminPageProps> = ({ 
    users, 
    listings, 
    bookings,
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
    onDeleteListing,
    onUpdateDepositStatus
}) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [uploadingStates, setUploadingStates] = useState<{[key: string]: boolean}>({});

    // --- Global Region Context ---
    const [selectedRegion, setSelectedRegion] = useState<string>('GLOBAL'); 
    const [disputes, setDisputes] = useState<Dispute[]>(mockDisputes);

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
        { id: 'bookings', name: 'Bookings', icon: CalendarIcon },
        { id: 'financials', name: 'Financials', icon: DollarSignIcon }, 
        { id: 'risk_fund', name: 'Risk & Insurance', icon: UmbrellaIcon },
        { id: 'disputes', name: 'Disputes', icon: GavelIcon },
        { id: 'marketing', name: 'Marketing', icon: TicketIcon },
        { id: 'ai_ops', name: 'AI Admin Agents', icon: SparklesIcon },
        { id: 'boosts', name: 'Marketplace Boosts', icon: RocketIcon },
        { id: 'users', name: 'Users', icon: UsersIcon },
        { id: 'listings', name: 'All Listings', icon: PackageIcon },
        { id: 'content', name: 'Content', icon: PaletteIcon },
        { id: 'billing', name: 'Gateway', icon: CreditCardIcon },
        { id: 'settings', name: 'Settings', icon: CogIcon },
    ];

    const displayCategoryImages = { ...initialCategoryImages, ...categoryImages };
    
    // --- FILTERING LOGIC ---
    const filteredListings = useMemo(() => {
        if (selectedRegion === 'GLOBAL') return listings;
        return listings.filter(l => l.location.countryCode === selectedRegion);
    }, [listings, selectedRegion]);

    const filteredUsers = useMemo(() => {
        if (selectedRegion === 'GLOBAL') return users;
        return users.filter(u => u.homeRegion === selectedRegion); 
    }, [users, selectedRegion]);

    const stats = useMemo(() => {
        const totalRevenue = filteredListings.reduce((sum, l) => sum + (l.pricePerDay || 0) * 5, 0); 
        return {
            gmv: totalRevenue * 10, 
            revenue: totalRevenue,
            activeListings: filteredListings.length,
            disputes: selectedRegion === 'GLOBAL' ? 2 : 0 
        };
    }, [filteredListings, selectedRegion]);


    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Global Overview</h2>
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
            case 'bookings':
                return <BookingsTab bookings={bookings} onUpdateDepositStatus={onUpdateDepositStatus} />;
            case 'financials':
                return <FinancialsTab />;
            case 'risk_fund':
                return <RiskFundTab />;
            case 'marketing':
                return <MarketingTab />;
            case 'ai_ops':
                return <AiOpsTab listings={listings} />;
            case 'settings':
                return <GlobalSettingsTab />;
            case 'boosts':
                return <div className="p-10 text-center"><button onClick={() => window.location.hash = 'adminBoosts'} className="px-8 py-4 bg-cyan-600 text-white font-black rounded-2xl shadow-xl hover:bg-cyan-700 transition-all flex items-center gap-2 mx-auto"><RocketIcon className="h-5 w-5" /> Open Boost Control Center</button></div>;
            case 'disputes':
                return (
                    <div className="animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Dispute Resolution Center</h2>
                            <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">Active Cases</span>
                        </div>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400">
                                    <tr>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">ID</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Reason</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Amount</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Status</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {disputes.map(dispute => (
                                        <tr key={dispute.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                            <td className="p-4 font-mono text-gray-600 text-xs">{dispute.id}</td>
                                            <td className="p-4">
                                                <span className="font-bold block text-slate-800 capitalize">{dispute.reason.replace('_', ' ')}</span>
                                                <span className="text-xs text-slate-400 line-clamp-1">{dispute.description}</span>
                                            </td>
                                            <td className="p-4 font-black text-slate-900">${dispute.amountInvolved}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                    dispute.status === 'open' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                                                    dispute.status === 'escalated' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                    {dispute.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <button className="text-cyan-600 hover:bg-cyan-50 px-2 py-1 rounded text-xs font-bold transition-colors">View Evidence</button>
                                                        <button className="text-slate-400 hover:text-slate-900 px-2 py-1 rounded text-xs font-bold">Message</button>
                                                    </div>
                                                    {!dispute.status.startsWith('Resolved') && dispute.status !== 'resolved' && (
                                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                                                            <button 
                                                                onClick={() => {
                                                                    setDisputes(prev => prev.map(d => d.id === dispute.id ? { ...d, status: 'Resolved-Host' } : d));
                                                                    alert('Resolved in Favor of Host');
                                                                }}
                                                                className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-black rounded hover:bg-emerald-600 transition-all"
                                                            >
                                                                FAVOR HOST
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setDisputes(prev => prev.map(d => d.id === dispute.id ? { ...d, status: 'Resolved-Renter' } : d));
                                                                    alert('Resolved in Favor of Renter');
                                                                }}
                                                                className="px-2 py-1 bg-blue-500 text-white text-[10px] font-black rounded hover:bg-blue-600 transition-all"
                                                            >
                                                                FAVOR RENTER
                                                            </button>
                                                            <button 
                                                                onClick={() => alert('Information Requested')}
                                                                className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded hover:bg-slate-200 transition-all"
                                                            >
                                                                REQUEST INFO
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
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
                    <div className="animate-in fade-in duration-500">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">User Management ({filteredUsers.length})</h2>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400">
                                    <tr>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Name</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Email</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Role</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Status</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                            <td className="p-4 font-medium">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{user.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-black">Joined: {user.registeredDate}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600">{user.email}</td>
                                            <td className="p-4">
                                                <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest">{user.role || 'USER'}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.isIdVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                    {user.isIdVerified ? 'Verified' : 'Unverified'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black rounded-lg hover:bg-indigo-600 transition-all" 
                                                        onClick={() => alert(`Promoted ${user.name}`)}
                                                    >
                                                        PROMOTE
                                                    </button>
                                                    <button 
                                                        className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-lg hover:bg-red-200 transition-all" 
                                                        onClick={() => alert(`Simulated Ban for ${user.name}`)}
                                                    >
                                                        SUSPEND
                                                    </button>
                                                    <button 
                                                        className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg hover:bg-slate-200 transition-all uppercase" 
                                                        onClick={() => alert(`Reset password email sent to ${user.email}`)}
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
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
                    <div className="animate-in fade-in duration-500">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">Inventory Control ({filteredListings.length})</h2>
                         <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400">
                                    <tr>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Title</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Category</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Owner</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Price</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Location</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredListings.map(listing => (
                                        <tr key={listing.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                            <td className="p-4 font-bold text-slate-800">{listing.title}</td>
                                            <td className="p-4">
                                                <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest">{listing.category}</span>
                                            </td>
                                            <td className="p-4 text-slate-600">{listing.owner.name}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900">${listing.pricePerDay}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">{listing.currency} / DAY</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-500 font-bold">
                                                <div className="flex items-center gap-1">
                                                    <MapPinIcon className="h-3 w-3 text-slate-400" />
                                                    {listing.location.city}, {listing.location.country}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => onToggleFeatured(listing.id)}
                                                        className={`p-2 rounded transition-colors ${listing.isFeatured ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500'}`}
                                                        title={listing.isFeatured ? "Unfeature" : "Feature"}
                                                    >
                                                        <StarIcon className="h-4 w-4" fill={listing.isFeatured ? "currentColor" : "none"} />
                                                    </button>
                                                    <button 
                                                        onClick={() => onViewListing(listing.id)}
                                                        className="p-2 bg-slate-100 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                                                        title="View Details"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => alert(`Suspended ${listing.title}`)}
                                                        className="p-2 bg-slate-100 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                        title="Suspend Listing"
                                                    >
                                                        <LockIcon className="h-4 w-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if(confirm(`Are you sure you want to delete "${listing.title}"? This cannot be undone.`)) {
                                                                onDeleteListing(listing.id);
                                                            }
                                                        }}
                                                        className="p-2 bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete Listing"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
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
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Site Logo</h3>
                                <ImageUploader
                                    label="Logo (JPG or PNG). Will be displayed in the header and footer."
                                    currentImageUrl={logoUrl}
                                    onImageChange={(newUrl) => wrapImageUpdate('logo', () => onUpdateLogo(newUrl))}
                                    isLoading={uploadingStates['logo']}
                                />
                            </div>
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
                    <main className="flex-1">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

interface AiOpsTabProps {
    listings: Listing[];
}

const AiOpsTab: React.FC<AiOpsTabProps> = ({ listings }) => {
    const [subTab, setSubTab] = useState<'auditor' | 'guard' | 'mediator' | 'marketing'>('marketing');

    // --- Tab 1: Listing Scam Audit State ---
    const [scamListingId, setScamListingId] = useState<string>('');
    const [scamTitle, setScamTitle] = useState<string>('');
    const [scamCategory, setScamCategory] = useState<string>('');
    const [scamPrice, setScamPrice] = useState<string>('');
    const [scamDescription, setScamDescription] = useState<string>('');
    const [scamLoading, setScamLoading] = useState<boolean>(false);
    const [scamResult, setScamResult] = useState<any>(null);

    // --- Tab 2: Chat Safety Compliance Guard State ---
    const [chatText, setChatText] = useState<string>('Host: hey, let’s settle the payment outside so we avoid both of us paying the platform transaction fee! Send me $350 directly to my Zelle account at safehost@email.com and I’ll secure your dates.');
    const [chatLoading, setChatLoading] = useState<boolean>(false);
    const [chatResult, setChatResult] = useState<any>(null);

    // --- Tab 3: Smart Dispute Mediator State ---
    const [dispTitle, setDispTitle] = useState<string>('Scratched Jet Ski Hull Dispute');
    const [dispDetails, setDispDetails] = useState<string>('Renter returned the Jet Ski with deep scratches along the starboard side hull. Renter claims they didn’t hit anything and those scratches were already there. They demand their full security deposit refund of $500.');
    const [hostStatement, setHostStatement] = useState<string>('Digital Inspector app check-in photos from 9:02 AM show an immaculate hull. Checkout photos from 5:15 PM show a fresh 12-inch scrape with matching GPS timestamp matching coordinates of the public boat launch ramp.');
    const [renterStatement, setRenterStatement] = useState<string>('I just rode it in open water. I think the trailer had those scratches already or maybe it was there before. I shouldn’t be charged!');
    const [dispDeposit, setDispDeposit] = useState<number>(500);
    const [dispLoading, setDispLoading] = useState<boolean>(false);
    const [dispResult, setDispResult] = useState<any>(null);

    // --- Tab 4: Marketing Generator State ---
    const [mktListingId, setMktListingId] = useState<string>('');
    const [mktTitle, setMktTitle] = useState<string>('');
    const [mktCategory, setMktCategory] = useState<string>('');
    const [mktPrice, setMktPrice] = useState<string>('');
    const [mktDescription, setMktDescription] = useState<string>('');
    const [mktFocusKeyword, setMktFocusKeyword] = useState<string>('Bareboat Demise Charter & No Captain License');
    const [mktLoading, setMktLoading] = useState<boolean>(false);
    const [mktResult, setMktResult] = useState<any>(null);

    // Sync listing dropdown with scam auditor fields
    useEffect(() => {
        if (scamListingId) {
            const list = listings.find(l => l.id === scamListingId);
            if (list) {
                setScamTitle(list.title || '');
                setScamCategory(list.category || '');
                setScamPrice(list.pricePerDay?.toString() || list.pricePerHour?.toString() || '0');
                setScamDescription(list.description || '');
            }
        }
    }, [scamListingId, listings]);

    // Sync listing dropdown with marketing copy fields
    useEffect(() => {
        if (mktListingId) {
            const list = listings.find(l => l.id === mktListingId);
            if (list) {
                setMktTitle(list.title || '');
                setMktCategory(list.category || '');
                setMktPrice(list.pricePerDay?.toString() || list.pricePerHour?.toString() || '0');
                setMktDescription(list.description || '');
            }
        }
    }, [mktListingId, listings]);

    // Fast load templates for chat
    const loadChatTemplate = (type: 'bypass' | 'safefun') => {
        if (type === 'bypass') {
            setChatText('Renter: Hi! Is there any way to rent this boat without the deposit hold? Can we exchange numbers? My cell is 305-555-0199.\nHost: Sure, hit me up on WhatsApp 305-555-0199. You can just bring cash for the deposit and we can bypass platform fees!');
        } else {
            setChatText('Renter: Sounds great! Excited to rent the RV. I’ve signed the Liability Waiver checklist.\nHost: Excellent. Please complete the Digital Inspector photos on check-in so we both have verified timestamped proof for protection!');
        }
        setChatResult(null);
    };

    // Fast load templates for dispute
    const loadDisputeTemplate = (type: 'jetski' | 'rv_late') => {
        if (type === 'jetski') {
            setDispTitle('Deep Scrapes on Jet Ski Hull');
            setDispDetails('Host reports renter scraped the bottom hull on rocks. Renter claims hull was worn previously.');
            setHostStatement('Check-in photos on Digital Inspector show an immaculate fiberglass hull. Checkout photos show 3 fresh, deep parallel rock gouges. GPS timestamp is identical to renter’s checkout location.');
            setRenterStatement('We didn’t hit any rocks! Maybe someone else did it while it was docked at the beach diner.');
            setDispDeposit(500);
        } else {
            setDispTitle('5-Hour Late RV Return');
            setDispDetails('Renter returned the RV 5 hours after scheduled drop-off time. Host wants a $200 late fee claimed from the deposit.');
            setHostStatement('Agreement drop-off was 11:00 AM. Digital Inspector checkout photos completed at 4:12 PM. Renter did not communicate delay beforehand.');
            setRenterStatement('We got stuck in extremely bad highway construction traffic. It wasn’t our fault!');
            setDispDeposit(300);
        }
        setDispResult(null);
    };

    // Generic API CALL handler
    const runAiAgent = async (action: string, payload: any, setLoading: (l: boolean) => void, setResult: (r: any) => void) => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/admin/ai-agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_email: 'lucianoreverberi@gmail.com', // Authenticates as administrator
                    action,
                    data: payload
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Error ${res.status}`);
            }
            const data = await res.json();
            setResult(data.result);
        } catch (error: any) {
            console.error(error);
            alert(`AI Operational Agent Error: ${error.message || 'Server timeout'}`);
        } finally {
            setLoading(false);
        }
    };

    const runScamCheck = () => {
        runAiAgent('scam_check', {
            title: scamTitle,
            category: scamCategory,
            price: Number(scamPrice) || 0,
            description: scamDescription
        }, setScamLoading, setScamResult);
    };

    const runChatAudit = () => {
        runAiAgent('chat_audit', { conversation: chatText }, setChatLoading, setChatResult);
    };

    const runDisputeMediate = () => {
        runAiAgent('dispute_mediate', {
            disputeTitle: dispTitle,
            disputeDetails: dispDetails,
            renterClaim: renterStatement,
            hostClaim: hostStatement,
            depositAmount: dispDeposit
        }, setDispLoading, setDispResult);
    };

    const runMarketingGen = () => {
        runAiAgent('generate_marketing', {
            title: mktTitle,
            description: mktDescription,
            price: Number(mktPrice) || 0,
            category: mktCategory,
            focusKeyword: mktFocusKeyword
        }, setMktLoading, setMktResult);
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <SparklesIcon className="h-8 w-8 text-cyan-500" />
                        AI Operational Control Center
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Empower hosts, simplify conflict management, secure chats, and generate promo materials automatically.</p>
                </div>

                {/* Sub-Tabs Switcher */}
                <div className="bg-slate-100 p-1 rounded-2xl flex flex-wrap gap-1 shadow-inner max-w-full">
                    <button
                        onClick={() => setSubTab('marketing')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${subTab === 'marketing' ? 'bg-white shadow-md text-cyan-600' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <MegaphoneIcon className="h-3.5 w-3.5 inline mr-1.5" />
                        Marketing Creator
                    </button>
                    <button
                        onClick={() => setSubTab('auditor')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${subTab === 'auditor' ? 'bg-white shadow-md text-cyan-600' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <ShieldIcon className="h-3.5 w-3.5 inline mr-1.5" />
                        Scam Scanner
                    </button>
                    <button
                        onClick={() => setSubTab('guard')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${subTab === 'guard' ? 'bg-white shadow-md text-cyan-600' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <SlidersIcon className="h-3.5 w-3.5 inline mr-1.5" />
                        Chat Compliance
                    </button>
                    <button
                        onClick={() => setSubTab('mediator')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${subTab === 'mediator' ? 'bg-white shadow-md text-cyan-600' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <GavelIcon className="h-3.5 w-3.5 inline mr-1.5" />
                        Smart disputes
                    </button>
                </div>
            </div>

            {/* --- CORE SUB-TABS INTERFACES --- */}

            {/* --- SUB-TAB: MARKETING GENERATOR --- */}
            {subTab === 'marketing' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="pb-4 border-b border-slate-50">
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Admin Marketing Engine</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase mt-1">Convert asset potentials into social ads & email copiers</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Load Existing Listing</label>
                                <select
                                    value={mktListingId}
                                    onChange={e => setMktListingId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                >
                                    <option value="">-- Or enter custom assets manually --</option>
                                    {listings.map(l => (
                                        <option key={l.id} value={l.id}>{l.title} (${l.pricePerDay || l.pricePerHour}/day)</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Item Title</label>
                                <input
                                    type="text"
                                    value={mktTitle}
                                    onChange={e => setMktTitle(e.target.value)}
                                    placeholder="e.g. 21ft Yamaha Jet Boat"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Price / Day ($)</label>
                                    <input
                                        type="number"
                                        value={mktPrice}
                                        onChange={e => setMktPrice(e.target.value)}
                                        placeholder="350"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                                    <input
                                        type="text"
                                        value={mktCategory}
                                        onChange={e => setMktCategory(e.target.value)}
                                        placeholder="Boats"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description (Prompt Details)</label>
                                <textarea
                                    value={mktDescription}
                                    onChange={e => setMktDescription(e.target.value)}
                                    placeholder="Enter listing features or owner description..."
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Campaign Focus Concept</label>
                                <select
                                    value={mktFocusKeyword}
                                    onChange={e => setMktFocusKeyword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                >
                                    <option value="Bareboat Demise Charter & No Captain License">Bareboat Charter (No License Required Solution)</option>
                                    <option value="Deposit & Waiver Security Protection">Smart Safety (Liability Waivers & Holds Highlight)</option>
                                    <option value="Sunset Weekend Cruises">Weekend Vacation Vibes</option>
                                    <option value="Premium Host Passive Income Generation">Host Support Passive Income Pitch</option>
                                </select>
                            </div>

                            <button
                                onClick={runMarketingGen}
                                disabled={mktLoading}
                                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold tracking-tight text-white rounded-2xl py-3 px-4 hover:from-cyan-600 hover:to-indigo-700 transition duration-300 flex items-center justify-center gap-2"
                            >
                                {mktLoading ? (
                                    <>
                                        <RefreshCwIcon className="h-5 w-5 animate-spin" />
                                        <span>Summoning Creative AI...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="h-5 w-5" />
                                        <span>Generate High-Converting Copies</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-12 xl:col-span-7 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-start">
                        {mktResult ? (
                            <div className="space-y-6">
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase self-start">Copies Generated Successfully</span>

                                {/* Instagram Card */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-lg">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Instagram & Facebook Copy</span>
                                        <button onClick={() => { navigator.clipboard.writeText(`${mktResult.instagram?.hook}\n\n${mktResult.instagram?.caption}`); alert('Copied!'); }} className="text-xs text-cyan-600 hover:underline font-bold">Copy Ad</button>
                                    </div>
                                    <p className="text-sm font-black text-slate-900 border-l-2 border-cyan-500 pl-3">{mktResult.instagram?.hook}</p>
                                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{mktResult.instagram?.caption}</p>
                                </div>

                                {/* Newsletter Card */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-lg">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Community Newsletter Spotlight</span>
                                        <button onClick={() => { navigator.clipboard.writeText(`Subject: ${mktResult.newsletter?.subjectLine}\n\n${mktResult.newsletter?.bodyCopy}`); alert('Copied!'); }} className="text-xs text-cyan-600 hover:underline font-bold">Copy Email</button>
                                    </div>
                                    <div className="text-xs text-slate-700">
                                        <p className="font-black mb-1 text-slate-950">Subject: <span className="font-bold text-slate-800">{mktResult.newsletter?.subjectLine}</span></p>
                                        <div className="whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100 mt-2 font-medium">{mktResult.newsletter?.bodyCopy}</div>
                                    </div>
                                </div>

                                {/* Google Ads Card */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-lg">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Google Ad Headline & Description Pairings</span>
                                        <button onClick={() => { navigator.clipboard.writeText(`Headlines:\n${mktResult.googleAds?.headlines?.join('\n')}\n\nDescriptions:\n${mktResult.googleAds?.descriptions?.join('\n')}`); alert('Copied!'); }} className="text-xs text-cyan-600 hover:underline font-bold">Copy All</button>
                                    </div>
                                    <div className="space-y-3 text-xs text-slate-600 font-medium">
                                        <div>
                                            <p className="font-black uppercase text-[10px] tracking-wider text-slate-400 mb-1">Recommended Headlines (Max 30 Chars)</p>
                                            <ul className="list-disc leading-loose pl-5 text-slate-900 font-bold">
                                                {mktResult.googleAds?.headlines?.map((h: string, idx: number) => (
                                                    <li key={idx} className="hover:text-cyan-600">{h}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-[10px] tracking-wider text-slate-400 mb-1">Recommended Descriptions (Max 90 Chars)</p>
                                            <ul className="list-disc pl-5 text-slate-700 leading-relaxed font-semibold">
                                                {mktResult.googleAds?.descriptions?.map((d: string, idx: number) => (
                                                    <li key={idx} className="mt-1">{d}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="my-auto text-center py-10 space-y-3 max-w-md mx-auto">
                                <MegaphoneIcon className="h-12 w-12 text-slate-300 mx-auto" />
                                <h4 className="text-base font-bold text-slate-700">Awaiting Ad Generation Request</h4>
                                <p className="text-xs text-slate-400 font-medium">Select a live asset on the left or type manual inputs, select your focus angle, and click "Generate". Our conversion writing bot will deliver polished ad copies for multiple platform distributions.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- SUB-TAB: SCAM AUDITOR --- */}
            {subTab === 'auditor' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="pb-4 border-b border-slate-50">
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Fraud & Scam Scanner</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase mt-1">Audit listing features, prices, and copy syntax for protection</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Load Active Listing</label>
                                <select
                                    value={scamListingId}
                                    onChange={e => setScamListingId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                >
                                    <option value="">-- Manual/Test post inspect --</option>
                                    {listings.map(l => (
                                        <option key={l.id} value={l.id}>{l.title} (${l.pricePerDay || l.pricePerHour}/day)</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Post Title</label>
                                <input
                                    type="text"
                                    value={scamTitle}
                                    onChange={e => setScamTitle(e.target.value)}
                                    placeholder="e.g. BRAND NEW ATV FOR FREE"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Day Price ($)</label>
                                    <input
                                        type="number"
                                        value={scamPrice}
                                        onChange={e => setScamPrice(e.target.value)}
                                        placeholder="200"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                                    <input
                                        type="text"
                                        value={scamCategory}
                                        onChange={e => setScamCategory(e.target.value)}
                                        placeholder="ATVs & UTVs"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Post Copy / Description</label>
                                <textarea
                                    value={scamDescription}
                                    onChange={e => setScamDescription(e.target.value)}
                                    placeholder="Enter listing features, suspicious sentences (e.g. Zelle deposit required first, cash only), etc."
                                    rows={5}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>

                            <button
                                onClick={runScamCheck}
                                disabled={scamLoading}
                                className="w-full bg-rose-600 font-bold tracking-tight text-white rounded-2xl py-3 px-4 hover:bg-rose-700 transition duration-300 flex items-center justify-center gap-2"
                            >
                                {scamLoading ? (
                                    <>
                                        <RefreshCwIcon className="h-5 w-5 animate-spin" />
                                        <span>Auditing Listing Deeply...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldIcon className="h-5 w-5" />
                                        <span>Perform Multi-Vector Fraud Audit</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-7 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-start">
                        {scamResult ? (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <span className="bg-cyan-100 text-cyan-800 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">Audit Analysis Completed</span>
                                    <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                        scamResult.recommendedAction === 'Approve' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                        scamResult.recommendedAction === 'Block' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-yellow-50 text-yellow-600 border-yellow-105'
                                    }`}>
                                        Action recommendation: {scamResult.recommendedAction}
                                    </span>
                                </div>

                                {/* Risk rating Gauge */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-slate-800">Scam Probability Index</span>
                                        <span className={`text-2xl font-black ${scamResult.riskScore > 60 ? 'text-rose-600' : scamResult.riskScore > 30 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                                            {scamResult.riskScore}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                scamResult.riskScore > 60 ? 'bg-rose-500' : scamResult.riskScore > 30 ? 'bg-yellow-500' : 'bg-emerald-505 bg-emerald-500'
                                            }`}
                                            style={{ width: `${scamResult.riskScore}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Verdict detail */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        Verdict summary
                                    </h4>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">{scamResult.verdict}</p>
                                </div>

                                {/* List of Reasons */}
                                {scamResult.reasons && scamResult.reasons.length > 0 && (
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Identified Red Flags / Anomaly Vectors</h4>
                                        <ul className="space-y-2">
                                            {scamResult.reasons.map((r: string, idx: number) => (
                                                <li key={idx} className="flex gap-2.5 items-start text-xs font-bold text-slate-700">
                                                    <span className="p-1 bg-rose-50 text-rose-600 rounded-lg mt-0.5"><AlertTriangleIcon className="h-3.5 w-3.5" /></span>
                                                    <span>{r}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="my-auto text-center py-10 space-y-3 max-w-md mx-auto">
                                <ShieldIcon className="h-12 w-12 text-slate-300 mx-auto" />
                                <h4 className="text-base font-bold text-slate-700">Awaiting Listing Audit Request</h4>
                                <p className="text-xs text-slate-400 font-medium">Select a live asset to inspect or manually input details on the left, then click check. Our safety audit model will run sentiment analysis, check listing parameters, and deliver security verdicts.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- SUB-TAB: COMPLIANCE SAFEGUARD (CHAT) --- */}
            {subTab === 'guard' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="pb-4 border-b border-slate-50 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Chat Rule Safeguard</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase mt-1">Identify off-platform bypasses or phishing patterns</p>
                            </div>
                        </div>

                        {/* Presets switcher */}
                        <div className="space-y-2">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Simulated Conversation Template</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => loadChatTemplate('bypass')} className="p-2.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-800 text-left rounded-xl transition duration-300 block">
                                    <p className="text-xs font-black">Scam Suggestion</p>
                                    <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">Cash discount, Whatsapp swap</p>
                                </button>
                                <button onClick={() => loadChatTemplate('safefun')} className="p-2.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-800 text-left rounded-xl transition duration-300 block">
                                    <p className="text-xs font-black">Safe Compliance</p>
                                    <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">Photos, waivers check</p>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Conversation / Chat Box Transcript</label>
                                <textarea
                                    value={chatText}
                                    onChange={e => setChatText(e.target.value)}
                                    placeholder="Type conversation lines here..."
                                    rows={8}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>

                            <button
                                onClick={runChatAudit}
                                disabled={chatLoading}
                                className="w-full bg-cyan-600 font-bold tracking-tight text-white rounded-2xl py-3 px-4 hover:bg-cyan-700 transition duration-300 flex items-center justify-center gap-2"
                            >
                                {chatLoading ? (
                                    <>
                                        <RefreshCwIcon className="h-5 w-5 animate-spin" />
                                        <span>Auditing Chat Patterns...</span>
                                    </>
                                ) : (
                                    <>
                                        <SlidersIcon className="h-5 w-5" />
                                        <span>Analyze Conversation Compliance</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-7 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-start">
                        {chatResult ? (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <span className="bg-cyan-100 text-cyan-800 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">Chat Compliance Audit Completed</span>
                                    <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                        chatResult.violatesRules ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    }`}>
                                        {chatResult.violatesRules ? 'Violates Platform Rules' : 'Platform Compliant'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Analyzer Confidence</p>
                                        <p className="text-sm font-bold text-slate-900">{chatResult.confidence} Confidence</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Detected Bypass Patterns</p>
                                        <p className="text-sm font-bold text-slate-900">{chatResult.detectedPatterns?.length || 0} Patterns Identified</p>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Analysis Breakdown</h4>
                                    <p className="text-sm font-medium text-slate-800 leading-relaxed">{chatResult.explain}</p>
                                </div>

                                {chatResult.detectedPatterns && chatResult.detectedPatterns.length > 0 && (
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Specific Violation Indicators</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {chatResult.detectedPatterns.map((p: string, idx: number) => (
                                                <span key={idx} className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-xl border border-rose-100 text-slate-800">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        Suggested Automated Advice & Prompt Warn Message (Coaching Tone)
                                    </h4>
                                    <div className="bg-slate-50 border-l-4 border-cyan-500 p-4 rounded-r-xl">
                                        <p className="text-xs text-slate-600 italic font-medium whitespace-pre-wrap">{chatResult.mediationSuggestion}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="my-auto text-center py-10 space-y-3 max-w-md mx-auto">
                                <SlidersIcon className="h-12 w-12 text-slate-300 mx-auto" />
                                <h4 className="text-base font-bold text-slate-700">Awaiting Safety Verification</h4>
                                <p className="text-xs text-slate-400 font-medium">Select a preset template or enter simulated chat dialogues on the Left. Our rules guard engine will spot payment bypass leaks and suggest supportive coaching actions.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- SUB-TAB: SMART DISPUTE MEDIATOR --- */}
            {subTab === 'mediator' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="pb-4 border-b border-slate-50">
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Smart Disputes Mediator</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase mt-1">Resolve claims easily using Liability Waiver & Digital Inspector photos</p>
                        </div>

                        {/* Presets */}
                        <div className="space-y-2">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Load Typical Conflict Scenario</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => loadDisputeTemplate('jetski')} className="p-2.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-800 text-left rounded-xl transition duration-300 block">
                                    <p className="text-xs font-black">Jet Ski Damage</p>
                                    <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">Scratch dispute hull checks</p>
                                </button>
                                <button onClick={() => loadDisputeTemplate('rv_late')} className="p-2.5 bg-yellow-50 border border-yellow-105 hover:bg-yellow-100 text-yellow-800 text-left rounded-xl transition duration-300 block">
                                    <p className="text-xs font-black">Late Return Fee</p>
                                    <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">RV return Delay check</p>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Conflict Matter / Title</label>
                                <input
                                    type="text"
                                    value={dispTitle}
                                    onChange={e => setDispTitle(e.target.value)}
                                    placeholder="Scratched jet ski engine cover"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Deposit In Play ($)</label>
                                    <input
                                        type="number"
                                        value={dispDeposit}
                                        onChange={e => setDispDeposit(Number(e.target.value) || 0)}
                                        placeholder="500"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <p className="text-[9px] text-slate-400 italic leading-relaxed">Deposit held successfully on renter credit card via gateway.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">General Host Description of Incident</label>
                                <textarea
                                    value={dispDetails}
                                    onChange={e => setDispDetails(e.target.value)}
                                    placeholder="Drop-off detail, damages..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">Verified Host Photographic Proof (Digital Inspector)</label>
                                <textarea
                                    value={hostStatement}
                                    onChange={e => setHostStatement(e.target.value)}
                                    placeholder="Explain Digital Inspector photos on check-in vs checkout..."
                                    rows={3}
                                    className="w-full bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-xs font-medium text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Renter Claim statement</label>
                                <textarea
                                    value={renterStatement}
                                    onChange={e => setRenterStatement(e.target.value)}
                                    placeholder="Renter's comments..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>

                            <button
                                onClick={runDisputeMediate}
                                disabled={dispLoading}
                                className="w-full bg-indigo-600 font-bold tracking-tight text-white rounded-2xl py-3 px-4 hover:bg-indigo-700 transition duration-300 flex items-center justify-center gap-2"
                            >
                                {dispLoading ? (
                                    <>
                                        <RefreshCwIcon className="h-5 w-5 animate-spin" />
                                        <span>Analyzing Digital Photos/GPS Proofs...</span>
                                    </>
                                ) : (
                                    <>
                                        <GavelIcon className="h-5 w-5" />
                                        <span>Propose Smart AI Resolution</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-12 xl:col-span-7 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-start">
                        {dispResult ? (
                            <div className="space-y-6">
                                <span className="bg-cyan-100 text-cyan-800 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase self-start">Smart Mediation Projections Made</span>

                                {/* Distribution result */}
                                <div className="grid grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="text-center p-3 bg-red-50 text-red-700 rounded-xl">
                                        <p className="text-[10px] font-black uppercase tracking-wider">Host Gets (Payout)</p>
                                        <p className="text-3xl font-black mt-2">${dispResult.proposedDistribution?.host_gets ?? 0}</p>
                                    </div>
                                    <div className="text-center p-3 bg-cyan-50 text-cyan-700 rounded-xl">
                                        <p className="text-[10px] font-black uppercase tracking-wider">Renter gets (Refunded)</p>
                                        <p className="text-3xl font-black mt-2">${dispResult.proposedDistribution?.renter_refund ?? 0}</p>
                                    </div>
                                </div>

                                {/* Justification */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Waiver & Evidence Justification</h4>
                                    <p className="text-sm font-medium text-slate-800 leading-relaxed font-sans">{dispResult.justification}</p>
                                </div>

                                {/* Payout Coaching support email */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Host Coach Notification (Empowering Tone)</span>
                                        <button onClick={() => { navigator.clipboard.writeText(dispResult.coachingEmailHost); alert('Copied!'); }} className="text-xs text-emerald-700 hover:underline font-bold">Copy Email</button>
                                    </div>
                                    <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap font-medium">
                                        {dispResult.coachingEmailHost}
                                    </div>
                                </div>

                                {/* Renter dispute verdict */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center bg-slate-100 px-3 py-1.5 rounded-lg">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Renter Notification Letter (Objective Proof Evidence)</span>
                                        <button onClick={() => { navigator.clipboard.writeText(dispResult.coachingEmailRenter); alert('Copied!'); }} className="text-xs text-slate-600 hover:underline font-bold">Copy Letter</button>
                                    </div>
                                    <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap font-medium">
                                        {dispResult.coachingEmailRenter}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="my-auto text-center py-10 space-y-3 max-w-md mx-auto">
                                <GavelIcon className="h-12 w-12 text-slate-300 mx-auto" />
                                <h4 className="text-base font-bold text-slate-700">Awaiting Evidence Verification</h4>
                                <p className="text-xs text-slate-400 font-medium">Select a preset dispute conflict on the Left, or manually input claims and GPS timestamp data of checkout photos. Our expert mediator agent automatically parses the evidence to distribute holds fairly.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
