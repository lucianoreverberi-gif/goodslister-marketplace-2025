import React from 'react';
import { Booking, Listing } from '../types';
import { TrendUpIcon, DollarSignIcon, PackageIcon, StarIcon, EyeIcon } from './icons';
// FIX: Import format from date-fns to resolve "Cannot find name 'format'" error
import { format } from 'date-fns';

interface AnalyticsDashboardProps {
    bookings: Booking[];
    listings: Listing[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ bookings, listings }) => {
    const totalEarnings = bookings
        .filter(b => b.status === 'completed' || b.status === 'active')
        .reduce((acc, curr) => acc + (curr.balanceDueOnSite || curr.totalPrice), 0);
    
    const activeListings = listings.length;
    const avgRating = listings.length > 0 
        ? listings.reduce((acc, l) => acc + l.rating, 0) / listings.length 
        : 5.0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Your Empire</h2>
                    <p className="text-gray-500 font-medium mt-1">Real-time performance of your adventure gear.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Updates</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-cyan-50/50 group-hover:text-cyan-50 group-hover:scale-110 transition-all">
                        <DollarSignIcon className="h-24 w-24" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Earnings</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">${totalEarnings.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-1 text-green-500 font-bold text-xs">
                        <TrendUpIcon className="h-3 w-3" /> +12.4%
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Listings</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{activeListings}</p>
                    <div className="mt-4 flex items-center gap-2">
                         <div className="flex -space-x-2">
                             {listings.slice(0, 3).map((l, i) => <img key={i} src={l.images[0]} className="w-6 h-6 rounded-full border-2 border-white object-cover" />)}
                         </div>
                         <span className="text-[10px] font-bold text-gray-400">Items online</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50 group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg. Quality</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{avgRating.toFixed(1)}</p>
                    <div className="mt-4 flex text-yellow-400">
                        {[1,2,3,4,5].map(i => <StarIcon key={i} className="h-3 w-3" />)}
                    </div>
                </div>

                <div className="bg-indigo-900 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 text-white">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Profile Views</p>
                    <p className="text-3xl font-black mt-2">1.2k</p>
                    <div className="mt-4 h-1.5 w-full bg-indigo-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 w-3/4 rounded-full"></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm">
                    <h3 className="text-xl font-black text-gray-900 mb-8">Revenue Flow</h3>
                    <div className="h-64 flex items-end gap-3 px-2">
                        {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                <div style={{ height: `${h}%` }} className="w-full bg-gray-100 rounded-t-xl group-hover:bg-cyan-500 transition-all cursor-pointer relative">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">${h * 15}</div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 mt-4">Day {i+1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm">
                    <h3 className="text-xl font-black text-gray-900 mb-6">Upcoming Revenue</h3>
                    <div className="space-y-4">
                        {bookings.filter(b => b.status === 'confirmed').slice(0, 3).map(b => (
                            <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white rounded-xl shadow-sm"><PackageIcon className="h-5 w-5 text-cyan-600" /></div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{b.listing.title}</p>
                                        <p className="text-xs text-gray-500 font-bold">{format(new Date(b.startDate), 'MMM dd')}</p>
                                    </div>
                                </div>
                                <p className="font-black text-gray-900">${b.totalPrice}</p>
                            </div>
                        ))}
                        {bookings.filter(b => b.status === 'confirmed').length === 0 && <p className="text-center py-10 text-gray-400 italic text-sm">No pending payouts.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;