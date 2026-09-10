
import React from 'react';
import { MailIcon, PhoneIcon, SearchIcon, ShieldCheckIcon, SmileIcon, UploadCloudIcon, WalletIcon, MessageSquareIcon, StarIcon, HandshakeIcon, LockIcon, GlobeIcon, BrainIcon, ZapIcon, CheckCircleIcon, MapPinIcon, AlertCircleIcon } from './icons';
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

export const HowItWorksPage: React.FC = () => {
    React.useEffect(() => {
        document.title = 'How Goodslister Works - Rent or List Adventure Gear Safely';
        const meta = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'description' }));
        meta.setAttribute('content', 'Rent adventure gear in 3 steps or list yours in minutes. Every rental protected by biometric ID verification, EXIF photo authentication, and dual-signature digital contracts.');
    }, []);

    return (
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


        {/* Trust Technology Section — showcases real anti-fraud stack */}
        <div className="bg-gray-900 py-16 sm:py-24 text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-cyan-400 font-bold tracking-wider uppercase text-sm">Powered by trust technology</span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">Enterprise-grade verification at every step</h2>
                    <p className="text-gray-400 mt-4 max-w-2xl mx-auto">The same anti-fraud technology used by Turo and Getaround, applied to every kind of adventure gear.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        <div className="bg-cyan-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheckIcon className="h-6 w-6 text-cyan-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Biometric ID</h3>
                        <p className="text-gray-400 text-sm">Government ID + live selfie verification via Stripe Identity before any renter can book. One-time, then trusted forever.</p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        <div className="bg-indigo-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <BrainIcon className="h-6 w-6 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Live Face Match</h3>
                        <p className="text-gray-400 text-sm">At check-in, the person picking up the gear takes a live selfie. Client-side face matching against their ID photo.</p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        <div className="bg-amber-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <ZapIcon className="h-6 w-6 text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Photo Authentication</h3>
                        <p className="text-gray-400 text-sm">EXIF metadata checked for GPS, timestamp, and editing software. Fraudsters can't reuse old photos or edit damage.</p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        <div className="bg-green-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <LockIcon className="h-6 w-6 text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Digital Contracts</h3>
                        <p className="text-gray-400 text-sm">Both parties sign a legally-binding digital agreement before pickup. Full audit trail stored securely.</p>
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <a href="/#aboutUs" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors inline-flex items-center gap-2">
                        Read more about our trust stack →
                    </a>
                </div>
            </div>
        </div>

        <FAQSection />

        <div className="bg-gray-900 py-16">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
                <p className="text-gray-400 mb-8">Join the launch in Miami and South Florida.</p>
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
};

export const AboutUsPage: React.FC = () => {
    React.useEffect(() => {
        document.title = 'About Goodslister - Trust-First P2P Adventure Gear Marketplace';
        const meta = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'description' }));
        meta.setAttribute('content', 'Goodslister is a peer-to-peer adventure gear marketplace built on enterprise-grade trust technology: biometric ID verification, EXIF photo verification, and dual-signature digital contracts. Miami-first, launching 2026.');
    }, []);

    return (
    <div className="bg-white">
        <BrandHeader 
            title="Adventure, powered by trust" 
            subtitle="A peer-to-peer marketplace where owners of adventure gear can rent to travelers safely — with biometric verification, digital contracts, and photo authentication at every step."
            imageUrl="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop"
        />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Story - product-focused, no founder narrative */}
            <div className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed mb-20 space-y-6">
                <p>
                    Goodslister exists because the biggest problem in peer-to-peer rentals isn't finding gear — it's <strong>trust</strong>.
                </p>
                <p>
                    Renters worry the gear won't be as described. Owners worry the renter might not be who they say they are. Both worry about what happens if something goes wrong. Traditional marketplaces solve this with insurance disclaimers and hope for the best.
                </p>
                <p>
                    We took a different approach: we built the <strong>same trust infrastructure that Turo and Getaround use</strong> — biometric ID verification, live face matching, EXIF photo authenticity checks, dual-signature digital contracts — and made it work for any kind of adventure gear. Kayaks, jetskis, mountain bikes, kitesurfing kits, camping sets, whatever.
                </p>
                <p>
                    We're launching in <strong>Miami and South Florida</strong> in 2026, then expanding to adventure hubs across the US.
                </p>
            </div>

            {/* What We're Building — real product features */}
            <div className="mb-20">
                <div className="text-center mb-12">
                    <span className="text-cyan-600 font-bold tracking-wider uppercase text-sm">What we're building</span>
                    <h2 className="text-3xl font-bold text-gray-900 mt-2">A trust stack, not a listings site</h2>
                    <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Every rental on Goodslister passes through five layers of verification.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-cyan-50 p-8 rounded-2xl border border-cyan-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
                                <ShieldCheckIcon className="h-6 w-6 text-cyan-600" />
                            </div>
                            <span className="text-xs font-black text-cyan-600 uppercase tracking-wider">Layer 1</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Verified onboarding</h3>
                        <p className="text-gray-600">Every renter completes Stripe Identity verification with a government ID and live selfie before their first booking.</p>
                    </div>

                    <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
                                <LockIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Layer 2</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Digital contracts</h3>
                        <p className="text-gray-600">Both renter and host sign a digital agreement before pickup. Renter signs first — check-in is blocked until they do.</p>
                    </div>

                    <div className="bg-green-50 p-8 rounded-2xl border border-green-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
                                <BrainIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <span className="text-xs font-black text-green-600 uppercase tracking-wider">Layer 3</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Live face matching</h3>
                        <p className="text-gray-600">At handover, the person picking up the gear takes a live selfie. Our system matches it against their ID photo — client-side, private, real-time.</p>
                    </div>

                    <div className="bg-amber-50 p-8 rounded-2xl border border-amber-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
                                <ZapIcon className="h-6 w-6 text-amber-600" />
                            </div>
                            <span className="text-xs font-black text-amber-600 uppercase tracking-wider">Layer 4</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Photo authentication</h3>
                        <p className="text-gray-600">Handover and return photos are checked against EXIF metadata — GPS location, timestamp, and edit-software detection. Duplicates get rejected.</p>
                    </div>

                    <div className="bg-rose-50 p-8 rounded-2xl border border-rose-100 md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
                                <StarIcon className="h-6 w-6 text-rose-600" />
                            </div>
                            <span className="text-xs font-black text-rose-600 uppercase tracking-wider">Layer 5</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Double-blind reviews</h3>
                        <p className="text-gray-600">Reviews stay hidden until both parties submit theirs (or 3 days pass). No retaliation, no negotiation — just honest feedback.</p>
                    </div>
                </div>
            </div>

            {/* Values grounded in product */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                <div className="p-8">
                    <div className="bg-cyan-100 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                        <ShieldCheckIcon className="h-8 w-8 text-cyan-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Trust as infrastructure</h3>
                    <p className="text-gray-600">We invest in verification technology because you shouldn't have to hope a rental goes well — the platform should make it certain.</p>
                </div>
                <div className="p-8">
                    <div className="bg-indigo-100 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                        <MapPinIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Miami-first, local roots</h3>
                    <p className="text-gray-600">Every adventure spot has its own gear culture. We're starting in South Florida — kayaks, jetskis, kitesurfing — and expanding city by city.</p>
                </div>
                <div className="p-8">
                    <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                        <BrainIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">AI where it matters</h3>
                    <p className="text-gray-600">Natural-language search, listing optimization, face matching. Not "AI" for marketing — AI applied to specific problems that save time.</p>
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gray-900 rounded-2xl py-16 px-6 sm:px-12 text-center text-white">
                <h2 className="text-3xl font-bold mb-4">Ready to try it?</h2>
                <p className="text-gray-300 mb-8 max-w-xl mx-auto">Browse verified gear in Miami and South Florida, or list yours and start earning.</p>
                <div className="flex justify-center gap-4 flex-wrap">
                    <a href="/#explore" className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors">
                        Explore Gear
                    </a>
                    <a href="/#createListing" className="px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                        List Your Gear
                    </a>
                </div>
            </div>
        </div>
    </div>
    );
};

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

export const HelpCenterPage: React.FC = () => {
    const [search, setSearch] = React.useState('');
    const [openId, setOpenId] = React.useState<string | null>(null);

    React.useEffect(() => {
        document.title = 'Help Center - Goodslister';
        const meta = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'description' }));
        meta.setAttribute('content', 'Answers to common questions about renting and hosting adventure gear on Goodslister. Booking, payments, verification, cancellations, safety, and more.');
    }, []);

    // 6 categories × 5-6 FAQs = 32 FAQs total
    const categories = [
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: <SmileIcon className="h-6 w-6" />,
            color: 'cyan',
            faqs: [
                { q: 'What is Goodslister?', a: 'Goodslister is a peer-to-peer marketplace for adventure gear rentals. Owners list their kayaks, jetskis, mountain bikes, kitesurfing kits, and more. Renters book them by the day or hour with full payment protection and verified handovers.' },
                { q: 'How do I create an account?', a: 'Click "Log In" at the top of the page, then choose "Sign Up". You can register with email or Google. After registration, you\'ll be asked to verify your identity via Stripe Identity (government ID + selfie) before your first booking.' },
                { q: 'Do I need to verify my identity?', a: 'Yes — all renters must complete a one-time identity verification with a government ID and live selfie. This protects hosts and keeps the community trustworthy. It takes about 2 minutes.' },
                { q: 'Is Goodslister available in my area?', a: 'We\'re launching in Miami and South Florida in 2026, then expanding to other adventure hubs across the US. Check the Explore page to see what\'s available near you.' },
                { q: 'How much does it cost to use Goodslister?', a: 'It\'s free to sign up and browse. Renters pay the listing price + service fee at booking. Hosts pay a 3% platform fee on payouts — they keep 97% of the rental price.' },
            ],
        },
        {
            id: 'renting',
            title: 'Renting Gear',
            icon: <SearchIcon className="h-6 w-6" />,
            color: 'indigo',
            faqs: [
                { q: 'How does the booking process work?', a: 'Search or browse for the gear you want, select your dates, and click Reserve. The host reviews your request. Once approved, you sign the digital rental contract, then coordinate pickup with the host on the scheduled date.' },
                { q: 'Can I book multiple items at once?', a: 'Yes — you can book multiple items from different hosts. Each booking is handled independently with its own contract, verification, and check-in.' },
                { q: 'What happens at pickup?', a: 'The host walks through the item with you, checks your identity via live face match, and confirms the condition with photos. You both sign the check-in inspection. The rental period officially begins.' },
                { q: 'What if the gear isn\'t as described?', a: 'Contact the host first — most misunderstandings are resolved directly. If you can\'t reach an agreement, use the "Report Damage" button in your booking to open a formal dispute. Our team reviews evidence and can issue a refund.' },
                { q: 'How do I return the gear?', a: 'Meet the host at the return time and location. Both parties inspect the item together, take return photos, and confirm no damage. Once approved, your security deposit is released within 24 hours.' },
                { q: 'Can I extend my rental?', a: 'Yes, if the host has availability. Contact the host through the chat before your rental ends. Extensions are processed as separate bookings for clean accounting.' },
            ],
        },
        {
            id: 'hosting',
            title: 'Hosting Your Gear',
            icon: <UploadCloudIcon className="h-6 w-6" />,
            color: 'green',
            faqs: [
                { q: 'How do I list my gear?', a: 'Click "List Your Item" in the top nav. Upload 4-6 clear photos, add a description (our AI can help optimize it), set your price and availability, and publish. Most listings go live in under 10 minutes.' },
                { q: 'How much can I earn?', a: 'Depends on the item, location, and how often you make it available. In Miami, a jetski typically earns $150-300/day. A kayak $50-80/day. A kitesurfing kit $100-150/day. You keep 97% of the listing price.' },
                { q: 'When do I get paid?', a: 'Payouts arrive via Stripe direct deposit within 24 hours after the rental starts. First-time hosts may have a 2-3 day hold on their first payout while Stripe verifies the account.' },
                { q: 'What if the renter damages my gear?', a: 'You document the damage with photos at return inspection, then submit a claim via the "Report Damage" button. Your renter\'s security deposit is held pending review. If the claim is valid, you\'re reimbursed from the deposit within 5 business days.' },
                { q: 'Do I have to accept every booking?', a: 'No — you review each request and can approve or reject. Rejecting doesn\'t affect your listing visibility, but consistent rejections may. Consider using our Instant Book flag if you want automatic acceptance for verified renters.' },
                { q: 'Can I set my own rules?', a: 'Yes. In your listing you can require a minimum age, disallow specific uses (e.g. no whitewater), require a captain\'s license, or add custom rules. All rules are shown to renters before they book.' },
            ],
        },
        {
            id: 'payments',
            title: 'Payments & Refunds',
            icon: <WalletIcon className="h-6 w-6" />,
            color: 'amber',
            faqs: [
                { q: 'What payment methods do you accept?', a: 'All major credit and debit cards (Visa, Mastercard, Amex, Discover), plus Apple Pay and Google Pay. Payments are processed by Stripe and never touch our servers.' },
                { q: 'When is my card charged?', a: 'When you complete the booking, Stripe places an authorization hold for the total (rental + deposit). The rental amount is captured when the host approves. The deposit hold is released within 24 hours after a clean return.' },
                { q: 'What is the security deposit?', a: 'A refundable hold to cover potential damage. It varies by item — usually 20-50% of the rental value. The deposit is held on your card, not charged, and released after inspection.' },
                { q: 'How do refunds work?', a: 'Full refund if the host cancels or rejects your booking, or if you cancel more than 24 hours before start time. Partial refund for later cancellations. Refunds arrive on your original payment method within 5-10 business days.' },
                { q: 'Is there a service fee?', a: 'Yes — a small service fee (typically 8-12% of the rental) is added at checkout. This covers payment processing, identity verification, and platform infrastructure. It\'s shown clearly before you confirm.' },
                { q: 'Do I need to report earnings to the IRS?', a: 'US hosts earning $600+ per year receive a 1099-K from Stripe. You\'re responsible for reporting rental income on your tax return. We recommend consulting a tax professional if you\'re earning significant income.' },
            ],
        },
        {
            id: 'safety',
            title: 'Trust & Safety',
            icon: <ShieldCheckIcon className="h-6 w-6" />,
            color: 'rose',
            faqs: [
                { q: 'How does identity verification work?', a: 'Powered by Stripe Identity — you upload a photo of your government ID and take a live selfie. Stripe matches the two using biometric analysis. Takes 2 minutes, one-time per account.' },
                { q: 'What is the live face match at pickup?', a: 'At handover, the person picking up the gear takes a live selfie. Our system compares it to the ID selfie you provided during onboarding. This prevents "identity swap" fraud where the person who booked isn\'t the person who shows up.' },
                { q: 'How do photo verification checks work?', a: 'All handover and return photos are checked against EXIF metadata (GPS coordinates, timestamp, and edit-software detection). Old, misplaced, or Photoshopped photos are automatically rejected. This protects both parties in a dispute.' },
                { q: 'Are digital contracts legally binding?', a: 'Yes. Digital signatures are legally enforceable in the US under ESIGN Act (2000) and in most countries under similar laws. Every contract includes a full audit trail with IP, timestamp, and biometric-verified identity.' },
                { q: 'What data do you collect?', a: 'Only what\'s needed for verification, payments, and communication. Your government ID is processed by Stripe and never stored on our servers. Photos and messages are stored securely and only accessible to you and the other party.' },
                { q: 'Someone contacted me outside the platform. What should I do?', a: 'Don\'t engage. All communication and payment must happen on Goodslister for you to be protected. Report the contact via "Report user" on their profile. We investigate and can suspend accounts for policy violations.' },
            ],
        },
        {
            id: 'cancellations',
            title: 'Cancellations & Disputes',
            icon: <AlertCircleIcon className="h-6 w-6" />,
            color: 'slate',
            faqs: [
                { q: 'How do I cancel my booking?', a: 'Go to My Bookings, find the reservation, and click Cancel. If you\'re more than 24 hours before start, you get a full refund. Between 24 and 2 hours, 50% refund. Under 2 hours or no-show, no refund.' },
                { q: 'What if the host cancels?', a: 'Full refund immediately, plus a credit for the inconvenience. We also investigate the host — repeated cancellations affect their standing and can lead to account suspension.' },
                { q: 'What if the host doesn\'t show up?', a: 'Wait 30 minutes past the pickup time, then mark it as "Host no-show" in the app. You get a full refund + credit. Contact support if you need help.' },
                { q: 'The item was damaged during my rental. What do I do?', a: 'Report it immediately via the "Report Damage" button. Take photos, describe what happened. Your security deposit may cover minor damage. For larger claims, our team reviews evidence from both parties.' },
                { q: 'How long do disputes take to resolve?', a: 'Most disputes are resolved within 3-5 business days. Complex cases with multiple pieces of evidence may take up to 10 days. We\'ll email you at each step so you know where things stand.' },
            ],
        },
    ];

    const colorClasses: Record<string, { bg: string; text: string; light: string }> = {
        cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', light: 'bg-cyan-50' },
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', light: 'bg-indigo-50' },
        green: { bg: 'bg-green-100', text: 'text-green-600', light: 'bg-green-50' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600', light: 'bg-amber-50' },
        rose: { bg: 'bg-rose-100', text: 'text-rose-600', light: 'bg-rose-50' },
        slate: { bg: 'bg-slate-100', text: 'text-slate-600', light: 'bg-slate-50' },
    };

    // Filter FAQs by search
    const searchLower = search.toLowerCase().trim();
    const filteredCategories = searchLower
        ? categories.map(cat => ({
            ...cat,
            faqs: cat.faqs.filter(f =>
                f.q.toLowerCase().includes(searchLower) ||
                f.a.toLowerCase().includes(searchLower)
            ),
        })).filter(cat => cat.faqs.length > 0)
        : categories;

    const totalFaqs = categories.reduce((sum, c) => sum + c.faqs.length, 0);
    const shownFaqs = filteredCategories.reduce((sum, c) => sum + c.faqs.length, 0);

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="bg-cyan-900 py-16 sm:py-24 text-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">How can we help you?</h1>
                    <div className="max-w-2xl mx-auto relative">
                        <input 
                            type="text" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search for answers (e.g. 'refund', 'insurance', 'verification')..." 
                            className="w-full py-4 pl-12 pr-4 rounded-full shadow-2xl border-none focus:ring-4 focus:ring-cyan-400/50 text-gray-900 outline-none text-lg"
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                            <SearchIcon className="h-6 w-6" />
                        </div>
                    </div>
                    {searchLower && (
                        <p className="mt-4 text-cyan-100 text-sm">
                            {shownFaqs === 0 ? 'No answers found.' : `Showing ${shownFaqs} of ${totalFaqs} answers matching "${search}"`}
                        </p>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
                {filteredCategories.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-4"><SearchIcon className="h-12 w-12 mx-auto" /></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No results found</h3>
                        <p className="text-gray-600">Try different keywords, or <button onClick={() => setSearch('')} className="text-cyan-600 font-bold hover:underline">clear search</button> to browse all categories.</p>
                    </div>
                )}

                {filteredCategories.map((cat) => {
                    const color = colorClasses[cat.color];
                    return (
                        <div key={cat.id} className="mb-10">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <div className={`${color.bg} p-2 rounded-lg ${color.text}`}>
                                    {cat.icon}
                                </div>
                                {cat.title}
                                <span className="text-sm font-normal text-gray-400">({cat.faqs.length})</span>
                            </h2>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                                {cat.faqs.map((faq, idx) => {
                                    const faqId = `${cat.id}-${idx}`;
                                    const isOpen = openId === faqId;
                                    return (
                                        <div key={faqId}>
                                            <button
                                                onClick={() => setOpenId(isOpen ? null : faqId)}
                                                className="w-full text-left px-6 py-5 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
                                            >
                                                <span className="font-semibold text-gray-900 text-base">{faq.q}</span>
                                                <span className={`${color.text} font-black text-xl transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
                                            </button>
                                            {isOpen && (
                                                <div className={`px-6 pb-6 ${color.light}`}>
                                                    <p className="text-gray-700 text-sm leading-relaxed pt-4 border-t border-gray-200">{faq.a}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                <div className="text-center mt-16 bg-gradient-to-br from-gray-900 to-slate-800 rounded-2xl p-8 sm:p-12 text-white">
                    <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
                    <p className="text-gray-300 mb-6 max-w-xl mx-auto">Our support team responds to all inquiries within 24 hours (usually much faster).</p>
                    <a href="/#contactUs" className="inline-block px-8 py-3 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 transition-colors shadow-lg">Contact Support</a>
                </div>
            </div>
        </div>
    );
};

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
    <LegalLayout title="Terms of Service" lastUpdated="May 14, 2026">
        <p className="lead">Please read these Terms of Service ("Terms") carefully before using the GOODSLISTER LLC. ("Goodslister") marketplace. By accessing or using our platform, you agree to be bound by these Terms.</p>

        <h3>1. Account Registration & Identity Verification</h3>
        <p>To access certain features, you must register for an account. You agree to provide accurate, current, and complete information. Goodslister uses <strong>Stripe Identity</strong> for identity verification of hosts and renters. You authorize us to share your information with Stripe to confirm your identity and prevent fraud.</p>

        <h3>2. Marketplace Services</h3>
        <p>Goodslister provides a platform that connects Owners ("Hosts") with Renters. We are not a party to any rental agreement between users. We do not own, create, sell, or manage any Listings. Hosts are solely responsible for their Listings and the quality, safety, and legality of the items they offer.</p>

        <h3>3. Payment Processing</h3>
        <p>Payment services for users on Goodslister are provided by <strong>Stripe</strong> and are subject to the Stripe Connected Account Agreement. By using Goodslister, you agree to be bound by the Stripe Terms. We collect a platform fee for each successful booking, which is clearly disclosed during the checkout process.</p>

        <h3>4. Cancellation & Refund Policy</h3>
        <p>Cancellations are subject to the specific policy selected by the Host at the time of listing (e.g., Flexible, Moderate, or Strict). In cases of equipment failure or significant misrepresentation, Goodslister reserves the right to issue refunds at our sole discretion.</p>

        <h3>5. Dispute Resolution</h3>
        <p>Users are encouraged to resolve disputes directly. If a resolution cannot be reached, Goodslister may provide mediation services. All users agree that any legal claim arising out of these Terms will be settled by binding arbitration in <strong>Miami-Dade County, Florida</strong>.</p>

        <h3>6. Limitation of Liability</h3>
        <p>To the maximum extent permitted by law, Goodslister shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the marketplace, including but not limited to property damage, personal injury, or loss of profits.</p>

        <h3>7. Governing Law</h3>
        <p>These Terms shall be governed by and construed in accordance with the laws of the <strong>State of Florida, United States</strong>, without regard to its conflict of law provisions.</p>
    </LegalLayout>
);

export const PrivacyPolicyPage: React.FC = () => (
    <LegalLayout title="Privacy Policy" lastUpdated="May 14, 2026">
        <p className="lead">At GOODSLISTER LLC. ("Goodslister"), your privacy is our priority. This policy explains how we collect, use, and protect your personal information.</p>

        <h3>1. Information We Collect</h3>
        <p>We collect information you provide directly to us (registration, listing creation, messages) and information collected automatically (IP address, location, cookies). This includes:</p>
        <ul>
            <li><strong>Identity Data:</strong> Name, government-issued ID (via Stripe Identity), and date of birth.</li>
            <li><strong>Financial Data:</strong> Bank account info for payouts and card info for payments (processed by Stripe).</li>
            <li><strong>Location Data:</strong> GPS coordinates for listings and search accuracy (via Google Maps).</li>
            <li><strong>Communication Data:</strong> Chat history and email interactions.</li>
        </ul>

        <h3>2. Data Processors & Third Parties</h3>
        <p>We share information with trusted service providers to run our platform:</p>
        <ul>
            <li><strong>Firebase (Google Cloud):</strong> Authentication, real-time database (Firestore), and hosting.</li>
            <li><strong>Stripe:</strong> Payment processing and identity verification.</li>
            <li><strong>Twilio:</strong> SMS notifications and phone number verification.</li>
            <li><strong>Resend:</strong> Transactional email delivery.</li>
            <li><strong>Google Gemini:</strong> AI-powered listing optimization and assistant services.</li>
            <li><strong>Vercel:</strong> Website performance monitoring and analytics.</li>
        </ul>

        <h3>3. Your Rights (GDPR & CCPA)</h3>
        <p>Depending on your location, you have rights regarding your data:</p>
        <ul>
            <li><strong>Access & Portability:</strong> Request a copy of your data in a machine-readable format.</li>
            <li><strong>Rectification:</strong> Correct inaccurate information.</li>
            <li><strong>Erasure:</strong> Request permanent deletion of your account and data.</li>
            <li><strong>Right to Know & Opt-Out (CCPA):</strong> California residents can request disclosure of categories of data collected and opt-out of the "sale" of data (which we do not do).</li>
        </ul>

        <h3>4. Data Retention</h3>
        <p>We retain data for as long as your account is active or as needed to provide services. We also retain and use data to comply with legal obligations, resolve disputes, and enforce agreements.</p>

        <h3>5. Children's Privacy</h3>
        <p>Goodslister is strictly for users aged 18 and older. We do not knowingly collect data from minors.</p>

        <h3>6. Contact Us</h3>
        <p>For privacy-related inquiries, please email <a href="mailto:privacy@goodslister.com">privacy@goodslister.com</a>.</p>
    </LegalLayout>
);

export const CookiePolicyPage: React.FC = () => {
    const handleOpenPreferences = () => {
        window.dispatchEvent(new CustomEvent('openCookiePreferences'));
    };

    return (
        <LegalLayout title="Cookie Policy" lastUpdated="May 14, 2026">
            <p className="lead">We use cookies to improve your experience, analyze our traffic, and for security purposes.</p>

            <h3>What are cookies?</h3>
            <p>Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.</p>

            <h3>Cookies We Use</h3>
            <div className="overflow-x-auto my-8">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-100 rounded-xl overflow-hidden text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-bold text-gray-900 border-b border-gray-200">Category</th>
                            <th className="px-4 py-3 text-left font-bold text-gray-900 border-b border-gray-200">Purpose</th>
                            <th className="px-4 py-3 text-left font-bold text-gray-900 border-b border-gray-200">Provider</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="px-4 py-4 font-bold text-gray-900">Essential</td>
                            <td className="px-4 py-4">Auth session, CSRF protection, and security.</td>
                            <td className="px-4 py-4">Firebase, Stripe</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-4 font-bold text-gray-900">Analytics</td>
                            <td className="px-4 py-4">Traffic analysis and performance monitoring.</td>
                            <td className="px-4 py-4">Vercel, Goodslister</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-4 font-bold text-gray-900">Functional</td>
                            <td className="px-4 py-4">UI preferences, theme settings, and language.</td>
                            <td className="px-4 py-4">Goodslister</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-4 font-bold text-gray-900">Marketing</td>
                            <td className="px-4 py-4">Ad conversion tracking and geolocated maps.</td>
                            <td className="px-4 py-4">Google Maps, Stripe</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3>Managing Your Cookies</h3>
            <p>Most web browsers allow some control of most cookies through the browser settings. You can also update your preferences on our platform at any time.</p>
            
            <div className="mt-8 p-6 bg-cyan-50 rounded-2xl border border-cyan-100 text-center">
                <button 
                    onClick={handleOpenPreferences}
                    className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-all shadow-lg"
                >
                    Manage Cookie Preferences
                </button>
            </div>
        </LegalLayout>
    );
};

export const DoNotSellPage: React.FC = () => (
    <LegalLayout title="Do Not Sell My Info" lastUpdated="May 14, 2026">
        <p className="lead">GOODSLISTER LLC. ("Goodslister") does not "sell" your personal information in the traditional sense for monetary compensation.</p>

        <h3>California Residents</h3>
        <p>Under the California Consumer Privacy Act (CCPA), residents have the right to opt-out of the "sale" of their personal information. While we do not sell your data to third parties for money, we share some data with service providers (like analytics and marketing tools) that might fall under the broad definition of a "sale" in California law.</p>

        <h3>Opt-Out Request</h3>
        <p>If you wish to opt-out of sharing your data for non-essential purposes (like analytics and marketing), you can do so by adjusting your cookie preferences.</p>

        <div className="mt-12 bg-gray-50 p-8 rounded-3xl border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-4">Request Data Deletion</h4>
            <p className="text-sm text-gray-600 mb-6">If you would like to request a complete deletion of your data from our systems, please click the button below. This action will permanently close your account.</p>
            <button className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">
                Request Account & Data Deletion
            </button>
        </div>
    </LegalLayout>
);
