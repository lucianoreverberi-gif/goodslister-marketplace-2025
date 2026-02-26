
import React from 'react';
import { MailIcon, PhoneIcon, SearchIcon, ShieldCheckIcon, SmileIcon, UploadCloudIcon, WalletIcon, MessageSquareIcon, StarIcon, HandshakeIcon, LockIcon, GlobeIcon, BrainIcon, ZapIcon, CheckCircleIcon, MapPinIcon } from './icons';
import FAQSection from './FAQSection';

// --- Shared Layouts ---

const LegalLayout: React.FC<{ title: string; lastUpdated: string; children: React.ReactNode }> = ({ title, lastUpdated, children }) => (
    <div className="bg-gray-50 min-h-screen py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-900 px-8 py-10 sm:px-12 sm:py-16 text-center">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">{title}</h1>
                    <p className="mt-4 text-sm text-gray-400 font-mono">Last Updated: {lastUpdated}</p>
                </div>
                <div className="px-8 py-10 sm:px-12 sm:py-12 prose prose-lg prose-cyan max-w-none text-gray-600">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

const BrandHeader: React.FC<{ title: string; subtitle: string; imageUrl?: string }> = ({ title, subtitle, imageUrl }) => (
    <div className="relative bg-gray-900 py-24 sm:py-32 overflow-hidden isolate">
        <div className="absolute inset-0 -z-10">
            <img 
                src={imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"} 
                alt="" 
                className="w-full h-full object-cover opacity-20" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-gray-900/10"></div>
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-6xl mb-6 drop-shadow-md">{title}</h1>
            <p className="text-xl text-gray-100 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">{subtitle}</p>
        </div>
    </div>
);

// --- Pages ---

export const HowItWorksPage: React.FC = () => (
    <div className="bg-white">
        <BrandHeader 
            title="How Goodslister Works" 
            subtitle="Whether you're looking for adventure or looking to earn, we've made the process simple, safe, and seamless."
            imageUrl="https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=2073&auto=format&fit=crop"
        />

        <div className="py-16 sm:py-24 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* For Renters Section */}
                <div className="mb-20">
                    <div className="text-center mb-12">
                        <span className="text-cyan-600 font-bold tracking-wider uppercase text-sm">For Adventurers</span>
                        <h2 className="text-3xl font-bold text-gray-900 mt-2">Rent Unique Gear</h2>
                        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Access high-quality equipment without the cost of ownership. Find exactly what you need, right where you need it.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                                <SearchIcon className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">1. Find Your Gear</h3>
                            <p className="text-gray-600">Use our AI-powered search to describe what you need. Browse listings with verified photos, reviews, and detailed descriptions.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                                <ShieldCheckIcon className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">2. Book Securely</h3>
                            <p className="text-gray-600">Select your dates and choose a protection plan. Pay securely through the platform or coordinate directly with the owner.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                                <SmileIcon className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">3. Enjoy & Return</h3>
                            <p className="text-gray-600">Pick up the item, enjoy your adventure, and return it on time. Leave a review to help build our trusted community.</p>
                        </div>
                    </div>
                </div>

                {/* Comparison Section */}
                <div className="mb-20 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="p-8 sm:p-12 text-center bg-gray-900 text-white">
                        <h2 className="text-3xl font-bold">Choose Your Way to Rent</h2>
                        <p className="mt-4 text-gray-300">Flexibility is key. Choose the booking method that works best for you.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                        <div className="p-8 sm:p-12 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-green-100 p-3 rounded-full text-green-600">
                                    <LockIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Secure Platform Booking</h3>
                            </div>
                            <ul className="space-y-4 text-gray-600">
                                <li className="flex items-start gap-3">
                                    <ShieldCheckIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                                    <span><strong>Full Insurance Coverage:</strong> Items are protected against damage and theft.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ShieldCheckIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                                    <span><strong>Payment Protection:</strong> Funds are held securely until the rental starts.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ShieldCheckIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                                    <span><strong>Verified Reviews:</strong> Only completed bookings can leave feedback.</span>
                                </li>
                            </ul>
                            <div className="mt-8">
                                <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Recommended</span>
                            </div>
                        </div>

                        <div className="p-8 sm:p-12 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                                    <HandshakeIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Direct Arrangement</h3>
                            </div>
                            <ul className="space-y-4 text-gray-600">
                                <li className="flex items-start gap-3">
                                    <ShieldCheckIcon className="h-6 w-6 text-amber-500 flex-shrink-0" />
                                    <span><strong>Flexible Payments:</strong> Pay via cash, Venmo, or other methods upon meeting.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ShieldCheckIcon className="h-6 w-6 text-amber-500 flex-shrink-0" />
                                    <span><strong>Direct Communication:</strong> Negotiate terms directly with the owner.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ShieldCheckIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                                    <span><span className="text-gray-500">Note:</span> No platform insurance coverage included.</span>
                                </li>
                            </ul>
                            <div className="mt-8">
                                <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Flexible</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 my-12"></div>

                {/* For Owners Section */}
                <div>
                    <div className="text-center mb-12">
                        <span className="text-green-600 font-bold tracking-wider uppercase text-sm">For Owners</span>
                        <h2 className="text-3xl font-bold text-gray-900 mt-2">Earn from Your Gear</h2>
                        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Turn your idle equipment into a passive income stream. It's free to list, and you're covered by our protection plans.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                <UploadCloudIcon className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">1. List for Free</h3>
                            <p className="text-gray-600">Create a listing in minutes. Upload photos, set your price, and let our AI optimize your description for maximum visibility.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                <MessageSquareIcon className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">2. Accept Bookings</h3>
                            <p className="text-gray-600">Receive requests from verified renters. Chat directly to coordinate pickup times and answer questions.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                <WalletIcon className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">3. Get Paid</h3>
                            <p className="text-gray-600">Secure payments are deposited directly into your account after the rental starts. You keep 97% of the listing price.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <FAQSection />

        <div className="bg-gray-900 py-16">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
                <p className="text-gray-400 mb-8">Join thousands of adventurers and owners today.</p>
                <div className="flex justify-center gap-4">
                    <a href="/explore" className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors">
                        Explore Gear
                    </a>
                    <a href="/createListing" className="px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                        List Your Item
                    </a>
                </div>
            </div>
        </div>
    </div>
);

export const AboutUsPage: React.FC = () => (
    <div className="bg-white">
        <BrandHeader 
            title="About Goodslister" 
            subtitle="We are on a mission to democratize adventure and unlock the potential of the world's idle gear."
            imageUrl="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop"
        />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed mb-16 space-y-6">
                <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-cyan-600 first-letter:mr-3 float-left">
                    G
                </p>
                <p>
                    oodslister was born from a simple observation: countless kayaks, mountain bikes, snowboards, and camping sets were collecting dust in garages. Meanwhile, thousands of people dreamed of weekend getaways but were held back by the high cost and logistics of owning gear.
                </p>
                <p>
                    In 2023, we launched with a vision to bridge this gap using <strong>AI technology</strong>. We built a platform that not only connects owners and renters but does so intelligently—simplifying legal contracts, optimizing listings, and ensuring safety for every transaction.
                </p>
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                <div className="bg-cyan-50 p-8 rounded-2xl border border-cyan-100 hover:shadow-lg transition-shadow">
                    <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <GlobeIcon className="h-8 w-8 text-cyan-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Accessibility</h3>
                    <p className="text-gray-600">Making the outdoors accessible to everyone, regardless of ownership status.</p>
                </div>
                <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-100 hover:shadow-lg transition-shadow">
                    <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <BrainIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Innovation</h3>
                    <p className="text-gray-600">Leveraging AI to remove friction from rentals, from contracts to discovery.</p>
                </div>
                <div className="bg-green-50 p-8 rounded-2xl border border-green-100 hover:shadow-lg transition-shadow">
                    <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <ShieldCheckIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Trust</h3>
                    <p className="text-gray-600">Building a community rooted in safety, verification, and mutual respect.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-900 rounded-2xl py-16 px-6 sm:px-12 text-center text-white relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                    <div className="space-y-2">
                        <div className="text-4xl sm:text-5xl font-extrabold text-cyan-400">50k+</div>
                        <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Active Users</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-4xl sm:text-5xl font-extrabold text-cyan-400">12k+</div>
                        <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Listings</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-4xl sm:text-5xl font-extrabold text-cyan-400">$5M+</div>
                        <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Owner Earnings</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-4xl sm:text-5xl font-extrabold text-cyan-400">15+</div>
                        <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Countries</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const CareersPage: React.FC = () => (
    <div className="bg-white">
        <BrandHeader 
            title="Join the Adventure" 
            subtitle="Build the future of the sharing economy with a team of explorers, engineers, and dreamers."
            imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            
            {/* Perks */}
            <div className="mb-20">
                <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Why Work With Us?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: "Remote First", desc: "Work from anywhere in the world.", icon: GlobeIcon },
                        { title: "Gear Stipend", desc: "$1,000/year to spend on rentals.", icon: WalletIcon },
                        { title: "Innovation", desc: "Work with cutting-edge AI & tech.", icon: ZapIcon },
                        { title: "Equity", desc: "Own a piece of the company.", icon: StarIcon },
                    ].map((perk, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center p-8 bg-gray-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all duration-300 group">
                            <div className="bg-white p-3 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                <perk.icon className="h-8 w-8 text-cyan-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">{perk.title}</h3>
                            <p className="text-sm text-gray-600 mt-2">{perk.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Positions */}
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Open Positions</h2>
                <div className="space-y-4">
                    {[
                        { title: "Senior Frontend Engineer (React + AI)", loc: "Remote", type: "Full-time", dept: "Engineering" },
                        { title: "Data Scientist (NLP Focus)", loc: "San Francisco / Remote", type: "Full-time", dept: "Data" },
                        { title: "Growth Marketing Manager", loc: "New York / Remote", type: "Full-time", dept: "Marketing" },
                        { title: "Customer Success Lead", loc: "Remote (US Timezones)", type: "Full-time", dept: "Support" },
                    ].map((job, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row justify-between items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-cyan-500 hover:shadow-lg transition-all group cursor-pointer">
                            <div className="mb-4 sm:mb-0 text-center sm:text-left">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-cyan-700">{job.title}</h3>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 justify-center sm:justify-start">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded">{job.dept}</span>
                                    <span>•</span>
                                    <span>{job.loc}</span>
                                    <span>•</span>
                                    <span>{job.type}</span>
                                </div>
                            </div>
                            <button className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors shadow-sm">
                                Apply Now
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export const PressPage: React.FC = () => (
    <div className="bg-white">
        <BrandHeader 
            title="Press Room" 
            subtitle="Latest news, updates, and resources from the Goodslister team."
            imageUrl="https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-4xl">
            <div className="space-y-12">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div className="text-sm text-cyan-600 font-bold uppercase tracking-wider">Press Release</div>
                        <div className="text-sm text-gray-500">July 15, 2024</div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Goodslister Launches AI-Powered Contract Assistant</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        We announced the launch of our Smart Contracts feature, leveraging generative AI to create customized rental agreements in seconds, enhancing safety and trust within our community.
                    </p>
                    <a href="#" className="text-cyan-600 font-semibold hover:underline inline-flex items-center gap-1">
                        Read full release <span aria-hidden="true">&rarr;</span>
                    </a>
                </div>

                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">Company News</div>
                        <div className="text-sm text-gray-500">May 2, 2024</div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Goodslister Secures $5M Seed Funding</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        The funding will be used to enhance our neural search technology, expand into new markets across North and South America, and grow our engineering team.
                    </p>
                    <a href="#" className="text-gray-900 font-semibold hover:underline inline-flex items-center gap-1">
                        Read full release <span aria-hidden="true">&rarr;</span>
                    </a>
                </div>
            </div>

            <div className="mt-20 bg-gray-900 text-white p-10 rounded-2xl text-center shadow-xl">
                <h3 className="text-2xl font-bold mb-4">Media Inquiries</h3>
                <p className="text-gray-300 mb-8 max-w-lg mx-auto">For interviews, brand assets, or other press-related inquiries, please contact our dedicated media team.</p>
                <a href="mailto:press@goodslister.com" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                    <MailIcon className="h-5 w-5" />
                    press@goodslister.com
                </a>
            </div>
        </div>
    </div>
);

export const HelpCenterPage: React.FC = () => (
    <div className="bg-gray-50 min-h-screen">
        <div className="bg-cyan-900 py-16 sm:py-24 text-center px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">How can we help you?</h1>
                <div className="max-w-2xl mx-auto relative">
                    <input 
                        type="text" 
                        placeholder="Search for answers (e.g. 'How to refund', 'Insurance policy')..." 
                        className="w-full py-4 pl-12 pr-4 rounded-full shadow-2xl border-none focus:ring-4 focus:ring-cyan-400/50 text-gray-900 outline-none text-lg"
                    />
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                        <SearchIcon className="h-6 w-6" />
                    </div>
                </div>
            </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="bg-cyan-100 p-2 rounded-lg text-cyan-600">
                            <SmileIcon className="h-6 w-6" />
                        </div>
                        For Renters
                    </h2>
                    <ul className="space-y-4">
                        {[
                            { q: "How does the booking process work?", a: "Search, select dates, request booking, and pay securely." },
                            { q: "What if the item is damaged?", a: "Document with photos and contact support immediately." },
                            { q: "Cancellation Policy", a: "Free cancellation up to 24 hours before start date." }
                        ].map((item, idx) => (
                            <li key={idx} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                <button className="text-left w-full group">
                                    <span className="font-semibold text-gray-800 group-hover:text-cyan-600 transition-colors text-lg">{item.q}</span>
                                    <p className="text-sm text-gray-500 mt-1">{item.a}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                            <UploadCloudIcon className="h-6 w-6" />
                        </div>
                        For Owners
                    </h2>
                    <ul className="space-y-4">
                        {[
                            { q: "How do I get paid?", a: "Direct deposit via Stripe 24h after rental start." },
                            { q: "Insurance Coverage", a: "Learn about our $1M liability protection plan." },
                            { q: "Creating a great listing", a: "Tips on photos, pricing, and descriptions." }
                        ].map((item, idx) => (
                            <li key={idx} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                <button className="text-left w-full group">
                                    <span className="font-semibold text-gray-800 group-hover:text-cyan-600 transition-colors text-lg">{item.q}</span>
                                    <p className="text-sm text-gray-500 mt-1">{item.a}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            <div className="text-center mt-16 bg-gray-100 rounded-xl p-8 max-w-3xl mx-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Still need help?</h3>
                <p className="text-gray-600 mb-6">Our support team is available 24/7 to assist you with any issues.</p>
                <a href="/contactUs" className="inline-block px-8 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg">Contact Support</a>
            </div>
        </div>
    </div>
);

export const ContactUsPage: React.FC = () => (
    <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Contact Info */}
                <div className="space-y-10">
                    <div>
                        <span className="text-cyan-600 font-bold uppercase tracking-wider text-sm">Contact Us</span>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-2 mb-6">Get in touch</h1>
                        <p className="text-xl text-gray-600 leading-relaxed">
                            We'd love to hear from you. Whether you have a question about a rental, need help with your account, or just want to say hello, our team is ready to answer.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-start gap-5">
                            <div className="bg-cyan-100 p-4 rounded-xl text-cyan-600 flex-shrink-0">
                                <MailIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Support</h3>
                                <p className="text-gray-600 mb-1">Our friendly support team is here to help.</p>
                                <a href="mailto:support@goodslister.com" className="text-cyan-600 font-semibold hover:underline text-lg">support@goodslister.com</a>
                            </div>
                        </div>
                        <div className="flex items-start gap-5">
                            <div className="bg-cyan-100 p-4 rounded-xl text-cyan-600 flex-shrink-0">
                                <MessageSquareIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">General Info</h3>
                                <p className="text-gray-600 mb-1">For general inquiries and partnerships.</p>
                                <a href="mailto:info@goodslister.com" className="text-cyan-600 font-semibold hover:underline text-lg">info@goodslister.com</a>
                            </div>
                        </div>
                        <div className="flex items-start gap-5">
                            <div className="bg-cyan-100 p-4 rounded-xl text-cyan-600 flex-shrink-0">
                                <MapPinIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Office</h3>
                                <p className="text-gray-600 mb-1">Come say hello at our HQ.</p>
                                <p className="text-gray-900 font-medium">100 Lincoln Rd, Miami Beach, FL 33139</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-gray-50 p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl">
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">First name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-white" placeholder="Jane" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Last name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-white" placeholder="Doe" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-white" placeholder="jane@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                            <textarea rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-white" placeholder="How can we help you?"></textarea>
                        </div>
                        <button type="submit" className="w-full py-4 px-6 text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
);

export const TermsPage: React.FC = () => (
    <LegalLayout title="Terms & Conditions" lastUpdated="July 20, 2024">
        <h3>1. Accounts</h3>
        <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>

        <h3>2. User Content</h3>
        <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.</p>
        
        <h3>3. Rentals</h3>
        <p>Goodslister is a marketplace that allows users to offer, search, and book rentals of recreational goods. We act as an intermediary and are not a party to any rental agreement. We are not responsible for the condition of the items rented or the actions of our users.</p>

        <p><strong>Disclaimer:</strong> This is a sample document. Consult with a legal professional to create the Terms and Conditions for your business.</p>
    </LegalLayout>
);

export const PrivacyPolicyPage: React.FC = () => (
    <LegalLayout title="Privacy Policy" lastUpdated="July 20, 2024">
        <h3>1. Information Collection and Use</h3>
        <p>We collect several different types of information for various purposes to provide and improve our Service to you. Types of Data collected may include, but are not limited to: Email address, First name and last name, Phone number, Address, Usage Data.</p>

        <h3>2. Use of Data</h3>
        <p>Goodslister Inc. uses the collected data for various purposes:</p>
        <ul>
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our Service</li>
        </ul>
        
        <h3>3. Security of Data</h3>
        <p>The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>

        <p><strong>Disclaimer:</strong> This is a sample document. Consult with a legal professional to create a Privacy Policy for your business.</p>
    </LegalLayout>
);
