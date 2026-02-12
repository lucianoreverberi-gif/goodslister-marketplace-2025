
import React from 'react';
import { AnchorIcon, CheckCircleIcon, ShieldCheckIcon, AlertIcon, ExternalLinkIcon, InfoIcon, FileTextIcon, PhoneIcon } from './icons';

const FloridaCompliancePage: React.FC = () => {
    return (
        <div className="bg-white">
            {/* Hero */}
            <div className="relative bg-cyan-900 py-24 sm:py-32 overflow-hidden">
                <div className="absolute inset-0 opacity-40">
                    <img src="https://images.unsplash.com/photo-1535448033526-27e8576346a0?q=80&w=2000&auto=format&fit=crop" alt="Miami Boat" className="w-full h-full object-cover" />
                </div>
                <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl mb-6">
                        Florida Boating Laws: <br/>What Renters & Owners Need to Know
                    </h1>
                    <p className="text-xl text-cyan-100 max-w-2xl mx-auto font-medium">
                        Navigate Miami & Ft. Lauderdale waters safely and legally with Goodslister.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-16">
                        
                        {/* Section A: Bareboat */}
                        <section id="bareboat">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-cyan-100 p-3 rounded-full text-cyan-700">
                                    <AnchorIcon className="h-8 w-8" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">The "Bareboat" Rule</h2>
                            </div>
                            <div className="prose prose-lg text-gray-600">
                                <p className="mb-4">
                                    In Florida, USCG regulations distinguish strictly between "Renting a Boat" (Bareboat Charter) and "Chartering a Boat with Captain" (Time Charter).
                                </p>
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg my-6">
                                    <h3 className="text-lg font-bold text-blue-900 mb-2">Key Point: You are the "Temporary Owner"</h3>
                                    <p className="text-blue-800 text-sm leading-relaxed">
                                        On Goodslister, most rentals are <strong>'Bareboat Charters'</strong>. This means the Renter takes legal responsibility for the vessel. The Renter must choose their own Captain (or drive themselves). The Owner <u>cannot</u> force a specific captain.
                                    </p>
                                </div>
                                <ul className="space-y-3 mt-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                                        <span>Goodslister provides the standard Demise Charter Agreement automatically at checkout.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                                        <span>Renters have the freedom to select from a list of qualified captains or provide their own.</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <hr className="border-gray-200" />

                        {/* Section B: Who Can Drive */}
                        <section id="license">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-indigo-100 p-3 rounded-full text-indigo-700">
                                    <FileTextIcon className="h-8 w-8" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">Who Can Drive? (FWC Rules)</h2>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Born on or after Jan 1, 1988?</h3>
                                <p className="text-gray-600 mb-6">
                                    If you were born on or after January 1, 1988, you must have a <strong>Boating Safety Education ID Card</strong> to operate a vessel of 10hp or more in Florida. This is Florida State Law.
                                </p>
                                <a 
                                    href="https://www.boat-ed.com/florida/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                                >
                                    Get your Temp License
                                    <ExternalLinkIcon className="h-4 w-4" />
                                </a>
                                <p className="text-xs text-gray-500 mt-3">Link takes you to boat-ed.com, an FWC-approved provider.</p>
                            </div>
                        </section>

                        <hr className="border-gray-200" />

                        {/* Section C: SB 606 */}
                        <section id="sb606">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-green-100 p-3 rounded-full text-green-700">
                                    <ShieldCheckIcon className="h-8 w-8" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">The New Florida Law (SB 606)</h2>
                            </div>
                            <div className="prose prose-lg text-gray-600">
                                <p>
                                    The "Boating Safety Act of 2022" (SB 606) was passed to increase safety and crack down on illegal charters.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                                        <h4 className="font-bold text-gray-800 mb-2">Insurance & Livery Permits</h4>
                                        <p className="text-sm">Owners must carry specific insurance policies or secure proper Livery Permits. Goodslister helps verify these requirements.</p>
                                    </div>
                                    <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                                        <h4 className="font-bold text-gray-800 mb-2">Pre-Rental Instructions</h4>
                                        <p className="text-sm">Owners are required to provide safety instructions, including the proper use of the engine cut-off switch (kill switch).</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-gray-200" />

                        {/* Section D: Jet Ski Rules */}
                        <section id="rules">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-amber-100 p-3 rounded-full text-amber-700">
                                    <AlertIcon className="h-8 w-8" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">Jet Ski, ATV & UTV Rules</h2>
                            </div>
                            <ul className="space-y-4 text-gray-700">
                                <li className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg">
                                    <span className="font-bold text-amber-800 min-w-[80px]">Jet Skis:</span>
                                    <span>Strictly <strong>NO night riding</strong>. Personal Watercraft (PWC) may only be operated between 30 minutes before sunrise and 30 minutes after sunset. Life vests must be worn at all times.</span>
                                </li>
                                <li className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
                                    <span className="font-bold text-red-800 min-w-[80px]">Alcohol:</span>
                                    <span>Florida has <strong>zero tolerance</strong> for BUI (Boating Under Influence). Penalties are severe and can include jail time. Do not drink and drive.</span>
                                </li>
                            </ul>
                        </section>

                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-8">
                            
                            {/* Emergency Card */}
                            <div className="bg-red-50 border border-red-100 rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                                    <AlertIcon className="h-5 w-5" />
                                    Emergency Resources
                                </h3>
                                <ul className="space-y-4">
                                    <li>
                                        <p className="text-xs text-red-700 font-bold uppercase">US Coast Guard (Miami Sector)</p>
                                        <a href="tel:3055354300" className="text-lg font-mono text-gray-900 hover:text-red-600 flex items-center gap-2">
                                            <PhoneIcon className="h-4 w-4" /> (305) 535-4300
                                        </a>
                                    </li>
                                    <li>
                                        <p className="text-xs text-red-700 font-bold uppercase">Florida Fish & Wildlife (FWC)</p>
                                        <a href="tel:8884043922" className="text-lg font-mono text-gray-900 hover:text-red-600 flex items-center gap-2">
                                            <PhoneIcon className="h-4 w-4" /> 888-404-FWCC
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Quick Links */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
                                <ul className="space-y-3 text-sm">
                                    <li>
                                        <a href="https://myfwc.com/boating/safety-education/id/" target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline flex items-center gap-2">
                                            FWC Boating Safety ID
                                            <ExternalLinkIcon className="h-3 w-3" />
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://www.boatus.com/" target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline flex items-center gap-2">
                                            TowBoatUS App
                                            <ExternalLinkIcon className="h-3 w-3" />
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://www.flsenate.gov/Session/Bill/2022/606" target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline flex items-center gap-2">
                                            Read SB 606 Full Text
                                            <ExternalLinkIcon className="h-3 w-3" />
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Trust Badge */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 text-center">
                                <ShieldCheckIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
                                <h4 className="font-bold text-green-900">Verified Compliance</h4>
                                <p className="text-xs text-green-800 mt-2">
                                    Goodslister helps owners and renters stay compliant with local laws through automated contracts and safety checklists.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FloridaCompliancePage;
