import React, { useState, useEffect } from 'react';
import { Session } from '../types';
import { 
    BarChartIcon, ShieldIcon, CheckCircleIcon, XIcon, SearchIcon, 
    SlidersIcon as FilterIcon, ExternalLinkIcon as DownloadIcon, RefreshCwIcon, RocketIcon, ZapIcon,
    MailIcon, UsersIcon as UserIcon, ClockIcon, DollarSignIcon, TrendUpIcon as TrendingUpIcon
} from './icons';
import { format } from 'date-fns';

interface AdminBoostsPageProps {
    user: Session;
}

const AdminBoostsPage: React.FC<AdminBoostsPageProps> = ({ user }) => {
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expired' | 'waitlist'>('all');
    const [filterTier, setFilterTier] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/boosts?user_email=${user.email}&tab=${activeTab}&tier=${filterTier}`);
                const json = await res.json();
                setData(json.data || []);
                if (json.stats) setStats(json.stats);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.email, activeTab, filterTier]);

    if (user.email !== 'lucianoreverberi@gmail.com') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <ShieldIcon className="h-16 w-16 text-slate-300 mb-4" />
                <h1 className="text-2xl font-black text-slate-900">404 - Page Not Found</h1>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <RocketIcon className="h-8 w-8 text-cyan-600" /> Boost Control Center
                        </h1>
                        <p className="text-slate-500 font-medium">Manage marketplace promotions and revenue.</p>
                    </div>
                    <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:bg-slate-50 flex items-center gap-2">
                        <DownloadIcon className="h-4 w-4" /> Export CSV
                    </button>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue (L30D)</p>
                            <h4 className="text-3xl font-black mt-1 text-slate-900">${Number(stats.total_revenue).toLocaleString()}</h4>
                            <div className="mt-4 flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                                <TrendingUpIcon className="h-3 w-3" /> +12% from last month
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Boosts</p>
                            <h4 className="text-3xl font-black mt-1 text-slate-900">{stats.active_count}</h4>
                            <div className="mt-4 flex items-center gap-1 text-cyan-500 text-[10px] font-bold">
                                <ZapIcon className="h-3 w-3" /> Real-time exposure
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Views / Boost</p>
                            <h4 className="text-3xl font-black mt-1 text-slate-900">{Math.round(stats.avg_views)}</h4>
                            <div className="mt-4 flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                                <TrendingUpIcon className="h-3 w-3" /> Efficient delivery
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marketplace Tax</p>
                            <h4 className="text-3xl font-black mt-1 text-slate-900">15.4%</h4>
                            <div className="mt-4 flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                                <DollarSignIcon className="h-3 w-3" /> Processing fees incl.
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between gap-6 items-center">
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            {(['all', 'active', 'expired', 'waitlist'] as const).map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <select 
                                value={filterTier} 
                                onChange={e => setFilterTier(e.target.value)}
                                className="bg-slate-50 border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/20"
                            >
                                <option value="all">All Tiers</option>
                                <option value="local">Local Boost</option>
                                <option value="spotlight">Spotlight</option>
                                <option value="regional">Regional Hero</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-5">Created</th>
                                    <th className="px-8 py-5">User</th>
                                    <th className="px-8 py-5">Listing</th>
                                    <th className="px-8 py-5">Tier</th>
                                    <th className="px-8 py-5">Value</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5">Performance</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center">
                                            <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto text-slate-200" />
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                                            No {activeTab} records found.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="text-xs font-bold text-slate-900">{format(new Date(item.created_at), 'MMM dd, yyyy')}</p>
                                                <p className="text-[10px] font-medium text-slate-400">{format(new Date(item.created_at), 'HH:mm')}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                        <UserIcon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900">{item.user_name || 'Guest'}</p>
                                                        <p className="text-[10px] font-medium text-slate-400">{item.user_email || item.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{item.listing_title || 'Unknown'}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    item.tier === 'regional' ? 'bg-indigo-100 text-indigo-700' :
                                                    item.tier === 'spotlight' ? 'bg-cyan-100 text-cyan-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {item.tier || item.desired_tier}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 font-black text-slate-900 text-xs">
                                                {item.price_paid ? `$${Number(item.price_paid).toFixed(2)}` : '--'}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    item.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                    item.status === 'expired' ? 'bg-slate-100 text-slate-500' :
                                                    item.status === 'waitlist' || activeTab === 'waitlist' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.status || 'WAITING'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                {activeTab === 'waitlist' ? (
                                                    <span className="text-[10px] text-slate-400 font-medium italic">Pending Launch</span>
                                                ) : (
                                                    <div className="flex items-center gap-4">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Views</p>
                                                            <p className="text-xs font-black text-slate-900">{item.views_count}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Inqs</p>
                                                            <p className="text-xs font-black text-slate-900">{item.inquiries_count}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {activeTab === 'waitlist' ? (
                                                        <button 
                                                            className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                                            title="Notify"
                                                        >
                                                            <MailIcon className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                className="p-2 text-slate-400 hover:text-cyan-600 rounded-lg transition-colors cursor-help"
                                                                title="Available once Stripe is connected"
                                                            >
                                                                <DollarSignIcon className="h-4 w-4" />
                                                            </button>
                                                            <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors" title="Manage">
                                                                <FilterIcon className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBoostsPage;
