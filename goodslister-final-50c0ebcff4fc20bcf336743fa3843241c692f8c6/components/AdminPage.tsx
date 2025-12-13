
import React, { useState, useEffect } from 'react';
import { User, Listing, HeroSlide, Banner, CategoryImagesMap, ListingCategory, Dispute, Coupon } from '../types';
import { LayoutDashboardIcon, UsersIcon, PackageIcon, PaletteIcon, XIcon, CreditCardIcon, CheckCircleIcon, ShieldIcon, LayoutOverlayIcon, LayoutSplitIcon, LayoutWideIcon, EyeIcon, GavelIcon, AlertIcon, CheckSquareIcon, TicketIcon, CogIcon, CalculatorIcon, DollarSignIcon, TrashIcon, MapPinIcon, BarChartIcon, ExternalLinkIcon, LockIcon, ArrowRightIcon, TrendUpIcon, UmbrellaIcon, AlertTriangleIcon } from './icons';
import ImageUploader from './ImageUploader';
import { initialCategoryImages } from '../constants';

type AdminTab = 'dashboard' | 'users' | 'listings' | 'financials' | 'content' | 'billing' | 'disputes' | 'marketing' | 'settings';

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

// Mock Financial Ledger
// Categories: 'revenue' (Service Fees), 'insurance_in' (Protection Fees), 'claim_out' (Damage Payouts), 'deposit' (Held), 'payout' (Owner Rental Fee)
const mockLedger = [
    { id: 'txn_105', date: 'Today, 11:15 AM', category: 'insurance_in', description: 'Premium Protection Plan', amount: 45.00, status: 'cleared', user: 'Guest #9901' },
    { id: 'txn_104', date: 'Today, 10:45 AM', category: 'claim_out', description: 'Damage Coverage Payout (Claim #22)', amount: -320.00, status: 'processed', user: 'Host: Sarah J.' },
    { id: 'txn_101', date: 'Today, 10:23 AM', category: 'revenue', description: 'Fixed Service Fee (Tier 1)', amount: 10.00, status: 'cleared', user: 'Guest #8821' },
    { id: 'txn_102', date: 'Today, 10:23 AM', category: 'payout', description: 'Rental Payment to Host', amount: 85.00, status: 'pending', user: 'Host: Carlos G.' },
    { id: 'txn_103', date: 'Today, 10:23 AM', category: 'deposit', description: 'Security Deposit Hold', amount: 250.00, status: 'held', user: 'Guest #8821' },
    { id: 'txn_99', date: 'Yesterday', category: 'revenue', description: 'Fixed Service Fee (Tier 2)', amount: 25.00, status: 'cleared', user: 'Guest #4412' },
    { id: 'txn_98', date: 'Yesterday', category: 'deposit', description: 'Deposit Release', amount: -250.00, status: 'released', user: 'Guest #1234' },
];

const FinancialsTab: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
                    <p className="text-sm text-gray-500">Track cash flow across platform revenue, risk pools, and user funds.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                    <ExternalLinkIcon className="h-4 w-4" /> Download Report
                </button>
            </div>

            {/* The 4 Buckets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Column 1: OUR MONEY (Revenue) */}
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 flex flex-col h-full relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendUpIcon className="h-20 w-20 text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-4 z-10">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                            <DollarSignIcon className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-emerald-900 text-sm uppercase tracking-wide">Net Revenue</h3>
                    </div>
                    <div className="mb-4 z-10">
                        <p className="text-3xl font-extrabold text-emerald-700">$2,450.00</p>
                        <p className="text-xs text-emerald-600 mt-1 font-medium bg-emerald-100/50 inline-block px-2 py-0.5 rounded">+ $350.00 this week</p>
                    </div>
                    <div className="mt-auto z-10">
                        <div className="text-[10px] text-emerald-800/80 mb-3">
                            Source: Service Fees & Commission.
                        </div>
                        <button className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm text-xs">
                            Withdraw
                        </button>
                    </div>
                </div>

                {/* Column 2: RISK FUND (Insurance) - NEW */}
                <div className="bg-purple-50 rounded-xl border border-purple-100 p-5 flex flex-col h-full relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <UmbrellaIcon className="h-20 w-20 text-purple-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-4 z-10">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                            <ShieldIcon className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-purple-900 text-sm uppercase tracking-wide">Risk & Insurance Fund</h3>
                    </div>
                    <div className="mb-4 z-10">
                        <p className="text-3xl font-extrabold text-purple-700">$8,120.00</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-purple-600 font-medium bg-purple-100/50 inline-block px-2 py-0.5 rounded">Solvency: High</p>
                        </div>
                    </div>
                    <div className="mt-auto z-10">
                        <div className="text-[10px] text-purple-800/80 mb-3">
                            Source: Protection Fees collected. Used for claims.
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="py-2 bg-white text-purple-700 border border-purple-200 font-bold rounded-lg hover:bg-purple-50 text-xs">
                                History
                            </button>
                            <button className="py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-sm text-xs">
                                Pay Claim
                            </button>
                        </div>
                    </div>
                </div>

                {/* Column 3: ESCROW (Deposits) */}
                <div className="bg-amber-50 rounded-xl border border-amber-100 p-5 flex flex-col h-full relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LockIcon className="h-20 w-20 text-amber-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-4 z-10">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                            <LockIcon className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wide">Active Deposits</h3>
                    </div>
                    <div className="mb-4 z-10">
                        <p className="text-3xl font-extrabold text-amber-700">$15,200.00</p>
                        <p className="text-xs text-amber-600 mt-1 font-medium bg-amber-100/50 inline-block px-2 py-0.5 rounded">62 Active Holds</p>
                    </div>
                    <div className="mt-auto z-10">
                        <div className="text-[10px] text-amber-800/80 mb-3">
                            Status: Held in Escrow. Released post-rental.
                        </div>
                        <button className="w-full py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 shadow-sm text-xs">
                            Manage Holds
                        </button>
                    </div>
                </div>

                {/* Column 4: PAYOUTS (Hosts) */}
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 flex flex-col h-full relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <UsersIcon className="h-20 w-20 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-4 z-10">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                            <ArrowRightIcon className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wide">Pending Payouts</h3>
                    </div>
                    <div className="mb-4 z-10">
                        <p className="text-3xl font-extrabold text-blue-700">$4,120.00</p>
                        <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-100/50 inline-block px-2 py-0.5 rounded">Due in 24h</p>
                    </div>
                    <div className="mt-auto z-10">
                        <div className="text-[10px] text-blue-800/80 mb-3">
                            Liability: Rental fees collected for hosts.
                        </div>
                        <button className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm text-xs">
                            Process Batch
                        </button>
                    </div>
                </div>
            </div>

            {/* Detailed Ledger */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <BarChartIcon className="h-5 w-5 text-gray-400" />
                        Unified Ledger
                    </h3>
                    <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded border">Showing last 7 transactions</div>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="p-4">Category</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">User / Entity</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {mockLedger.map((txn) => (
                            <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    {txn.category === 'revenue' && <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold uppercase tracking-wide border border-emerald-200">Revenue</span>}
                                    {txn.category === 'insurance_in' && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-bold uppercase tracking-wide border border-purple-200">Protection</span>}
                                    {txn.category === 'claim_out' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-bold uppercase tracking-wide border border-red-200 flex items-center w-fit gap-1"><AlertTriangleIcon className="h-3 w-3"/> Claim</span>}
                                    {txn.category === 'deposit' && <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-bold uppercase tracking-wide border border-amber-200">Deposit</span>}
                                    {txn.category === 'payout' && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-bold uppercase tracking-wide border border-blue-200">Payout</span>}
                                </td>
                                <td className={`p-4 text-right font-mono font-bold ${
                                    txn.category === 'claim_out' || (txn.amount < 0 && txn.category !== 'deposit') ? 'text-red-600' : 
                                    txn.amount < 0 ? 'text-gray-500' : 
                                    txn.category === 'payout' ? 'text-gray-900' : 'text-green-600'
                                }`}>
                                    {txn.amount < 0 ? '-' : '+'}${Math.abs(txn.amount).toFixed(2)}
                                </td>
                                <td className="p-4 text-gray-800 font-medium">{txn.description}</td>
                                <td className="p-4 text-gray-500 text-xs">{txn.user}</td>
                                <td className="p-4">
                                    <span className="capitalize text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">{txn.status}</span>
                                </td>
                                <td className="p-4 text-gray-400 text-xs">{txn.date}</td>
                            </tr>
                        ))}
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
    const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
    const [showCreate, setShowCreate] = useState(false);
    
    // New Coupon State
    const [newCode, setNewCode] = useState('');
    const [newDiscount, setNewDiscount] = useState(10);
    const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');

    const handleCreateCoupon = () => {
        const newCoupon: Coupon = {
            id: `cpn-${Date.now()}`,
            code: newCode.toUpperCase(),
            discountType: newType,
            discountValue: newDiscount,
            usageLimit: 100,
            usedCount: 0,
            expiryDate: '2025-12-31', // Default future date
            status: 'active'
        };
        setCoupons([...coupons, newCoupon]);
        setShowCreate(false);
        setNewCode('');
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Marketing & Promotions</h2>
            
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Active Coupons</h3>
                <button 
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                    <TicketIcon className="h-4 w-4" /> Create New Coupon
                </button>
            </div>

            {showCreate && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input 
                            type="text" 
                            placeholder="Code (e.g. SUMMER20)" 
                            value={newCode} 
                            onChange={e => setNewCode(e.target.value)} 
                            className="border p-2 rounded"
                        />
                        <select 
                            value={newType} 
                            onChange={e => setNewType(e.target.value as any)} 
                            className="border p-2 rounded"
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                        </select>
                        <input 
                            type="number" 
                            placeholder="Value" 
                            value={newDiscount} 
                            onChange={e => setNewDiscount(Number(e.target.value))} 
                            className="border p-2 rounded"
                        />
                        <button onClick={handleCreateCoupon} className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700">Save Coupon</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="p-4">Code</th>
                            <th className="p-4">Discount</th>
                            <th className="p-4">Usage</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {coupons.map(coupon => (
                            <tr key={coupon.id}>
                                <td className="p-4 font-mono font-bold text-gray-900">{coupon.code}</td>
                                <td className="p-4 text-green-600 font-bold">
                                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `$${coupon.discountValue} OFF`}
                                </td>
                                <td className="p-4 text-gray-600">{coupon.usedCount} / {coupon.usageLimit}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${coupon.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                        {coupon.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-red-500 hover:text-red-700 text-xs font-medium">Deactivate</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminPage: React.FC<AdminPageProps> = ({
    users, listings, heroSlides, banners, logoUrl, paymentApiKey, categoryImages,
    onUpdatePaymentApiKey, onUpdateLogo, onUpdateSlide, onAddSlide, onDeleteSlide,
    onUpdateBanner, onAddBanner, onDeleteBanner, onToggleFeatured, onUpdateCategoryImage,
    onUpdateListingImage, onViewListing, onDeleteListing
}) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Total Users</p>
                                        <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-full text-blue-600"><UsersIcon className="h-6 w-6"/></div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Active Listings</p>
                                        <p className="text-3xl font-bold text-gray-900">{listings.length}</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-full text-green-600"><PackageIcon className="h-6 w-6"/></div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Open Disputes</p>
                                        <p className="text-3xl font-bold text-gray-900">{mockDisputes.filter(d => d.status === 'open').length}</p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-full text-red-600"><AlertIcon className="h-6 w-6"/></div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            
            case 'users':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">User Management</h2>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Status</th></tr></thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="p-4 font-medium">{u.name}</td>
                                            <td className="p-4 text-gray-500">{u.email}</td>
                                            <td className="p-4"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span></td>
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
                        <h2 className="text-2xl font-bold mb-6">Listing Moderation</h2>
                        <div className="space-y-4">
                            {listings.map(l => (
                                <div key={l.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <img src={l.images[0]} className="w-16 h-16 rounded object-cover" />
                                        <div>
                                            <h4 className="font-bold text-gray-900">{l.title}</h4>
                                            <p className="text-sm text-gray-500">{l.owner.name} • {l.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => onToggleFeatured(l.id)} className={`p-2 rounded ${l.isFeatured ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`} title="Toggle Featured">
                                            <CheckCircleIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => onViewListing(l.id)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="View">
                                            <EyeIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => onDeleteListing(l.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Delete">
                                            <XIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'financials':
                return <FinancialsTab />;

            case 'content':
                return (
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xl font-bold mb-4">Brand Assets</h3>
                            <div className="bg-white p-6 rounded-lg shadow flex items-center gap-6">
                                <div className="w-32"><ImageUploader currentImageUrl={logoUrl} onImageChange={onUpdateLogo} label="Logo" /></div>
                                <div className="text-sm text-gray-500">Upload a transparent PNG for the header.</div>
                            </div>
                        </section>
                        <section>
                            <h3 className="text-xl font-bold mb-4">Hero Slides</h3>
                            {heroSlides.map(slide => (
                                <div key={slide.id} className="bg-white p-6 rounded-lg shadow mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-1/3"><ImageUploader currentImageUrl={slide.imageUrl} onImageChange={(url) => onUpdateSlide(slide.id, 'imageUrl', url)} label="Slide Image" /></div>
                                        <div className="flex-1 space-y-4">
                                            <input value={slide.title} onChange={e => onUpdateSlide(slide.id, 'title', e.target.value)} className="w-full border p-2 rounded" placeholder="Title" />
                                            <input value={slide.subtitle} onChange={e => onUpdateSlide(slide.id, 'subtitle', e.target.value)} className="w-full border p-2 rounded" placeholder="Subtitle" />
                                            <button onClick={() => onDeleteSlide(slide.id)} className="text-red-500 text-sm">Remove Slide</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={onAddSlide} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-cyan-500 hover:text-cyan-500">+ Add Slide</button>
                        </section>
                        <section>
                            <h3 className="text-xl font-bold mb-4">Banners</h3>
                            {banners.map(banner => (
                                <div key={banner.id} className="bg-white p-6 rounded-lg shadow mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-1/3"><ImageUploader currentImageUrl={banner.imageUrl} onImageChange={(url) => onUpdateBanner(banner.id, 'imageUrl', url)} label="Banner Image" /></div>
                                        <div className="flex-1 space-y-4">
                                            <input value={banner.title} onChange={e => onUpdateBanner(banner.id, 'title', e.target.value)} className="w-full border p-2 rounded" placeholder="Title" />
                                            <input value={banner.description} onChange={e => onUpdateBanner(banner.id, 'description', e.target.value)} className="w-full border p-2 rounded" placeholder="Description" />
                                            <div className="flex gap-2">
                                                <input value={banner.buttonText} onChange={e => onUpdateBanner(banner.id, 'buttonText', e.target.value)} className="w-1/2 border p-2 rounded" placeholder="Button Text" />
                                                <input value={banner.linkUrl} onChange={e => onUpdateBanner(banner.id, 'linkUrl', e.target.value)} className="w-1/2 border p-2 rounded" placeholder="Link URL (e.g. /explore)" />
                                            </div>
                                            <div className="flex gap-2 items-center text-sm text-gray-600">
                                                <span>Layout:</span>
                                                <button onClick={() => onUpdateBanner(banner.id, 'layout', 'overlay')} className={`p-2 border rounded ${banner.layout === 'overlay' ? 'bg-cyan-100 border-cyan-500' : ''}`}><LayoutOverlayIcon className="h-4 w-4"/></button>
                                                <button onClick={() => onUpdateBanner(banner.id, 'layout', 'split')} className={`p-2 border rounded ${banner.layout === 'split' ? 'bg-cyan-100 border-cyan-500' : ''}`}><LayoutSplitIcon className="h-4 w-4"/></button>
                                                <button onClick={() => onUpdateBanner(banner.id, 'layout', 'wide')} className={`p-2 border rounded ${banner.layout === 'wide' ? 'bg-cyan-100 border-cyan-500' : ''}`}><LayoutWideIcon className="h-4 w-4"/></button>
                                            </div>
                                            <button onClick={() => onDeleteBanner(banner.id)} className="text-red-500 text-sm">Remove Banner</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={onAddBanner} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-cyan-500 hover:text-cyan-500">+ Add Banner</button>
                        </section>
                        <section>
                            <h3 className="text-xl font-bold mb-4">Category Images</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(categoryImages).map(([cat, url]) => (
                                    <div key={cat} className="bg-white p-3 rounded shadow">
                                        <p className="text-sm font-bold mb-2 text-center">{cat}</p>
                                        <ImageUploader currentImageUrl={url} onImageChange={(newUrl) => onUpdateCategoryImage(cat as ListingCategory, newUrl)} label="" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                );

            case 'billing':
                return <BillingSettings currentApiKey={paymentApiKey} onSaveApiKey={onUpdatePaymentApiKey} />;

            case 'disputes':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Dispute Resolution Center</h2>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50"><tr><th className="p-4">ID</th><th className="p-4">Reason</th><th className="p-4">Status</th><th className="p-4">Amount</th><th className="p-4 text-right">Action</th></tr></thead>
                                <tbody>
                                    {mockDisputes.map(d => (
                                        <tr key={d.id} className="border-b">
                                            <td className="p-4">{d.id}</td>
                                            <td className="p-4"><span className="capitalize">{d.reason}</span></td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${d.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>{d.status}</span></td>
                                            <td className="p-4">${d.amountInvolved}</td>
                                            <td className="p-4 text-right"><button className="text-blue-600 font-bold hover:underline">Review</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'marketing':
                return <MarketingTab />;

            case 'settings':
                return <GlobalSettingsTab />;

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-gray-300 flex-shrink-0">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-white tracking-wider uppercase">Admin Panel</h1>
                </div>
                <nav className="space-y-1 px-3">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
                        { id: 'users', label: 'Users', icon: UsersIcon },
                        { id: 'listings', label: 'Listings', icon: PackageIcon },
                        { id: 'financials', label: 'Financials', icon: BarChartIcon },
                        { id: 'content', label: 'Content CMS', icon: PaletteIcon },
                        { id: 'billing', label: 'Billing Config', icon: CreditCardIcon },
                        { id: 'disputes', label: 'Disputes', icon: GavelIcon },
                        { id: 'marketing', label: 'Marketing', icon: TicketIcon },
                        { id: 'settings', label: 'Global Settings', icon: CogIcon },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as AdminTab)}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === item.id ? 'bg-gray-800 text-white' : 'hover:bg-gray-800 hover:text-white'}`}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminPage;
