
import React from 'react';
import { Booking, Listing } from '../types';
import { DollarSignIcon, EyeIcon, StarIcon, TrendUpIcon, BarChartIcon, CalendarIcon } from './icons';

interface AnalyticsDashboardProps {
    bookings: Booking[];
    listings: Listing[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ bookings, listings }) => {
    // Basic Calcs
    const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed' || b.status === 'active');
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.balanceDueOnSite || 0), 0);
    const avgRating = listings.reduce((sum, l) => sum + l.rating, 0) / (listings.length || 1);
    
    // Growth simulation (fake data for visualization)
    const stats = [
        { label: 'Total Earnings', value: `$${totalEarnings.toLocaleString()}`, icon: DollarSignIcon, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Active Rentals', value: completedBookings.length, icon: CalendarIcon, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { label: 'Avg. Rating', value: avgRating.toFixed(1), icon: StarIcon, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        { label: 'Profile Views', value: '1,240', icon: EyeIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    return (
        <div className="animate-in fade-in space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Your Performance</h2>
                    <p className="text-gray-500">Track your earnings and equipment reach.</p>
                </div>
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                    <TrendUpIcon className="h-3 w-3" /> +12% this month
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Earnings Projection Placeholder */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <BarChartIcon className="h-5 w-5 text-cyan-600" /> Earnings Over Time
                    </h3>
                    <div className="h-48 bg-gray-50 rounded-lg flex items-end justify-between p-4 gap-2">
                        {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                            <div key={i} style={{ height: `${h}%` }} className="w-full bg-cyan-200 rounded-t-md hover:bg-cyan-500 transition-all cursor-pointer relative group">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    ${(h * 10).toFixed(0)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                {/* Top Listings */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Top Performing Items</h3>
                    <div className="space-y-4">
                        {listings.slice(0, 3).map((l, i) => (
                            <div key={l.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                                <img src={l.images[0]} className="w-12 h-12 rounded-lg object-cover" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 truncate">{l.title}</p>
                                    <p className="text-xs text-gray-500">{l.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-cyan-700">${(l.pricePerDay || 0) * 4}</p>
                                    <p className="text-[10px] text-gray-400 uppercase">This month</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
