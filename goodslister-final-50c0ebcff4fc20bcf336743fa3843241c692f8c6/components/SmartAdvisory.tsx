
import React from 'react';
import { ListingCategory } from '../types';
import { AnchorIcon, ShieldCheckIcon, LightbulbIcon, CheckCircleIcon, ExternalLinkIcon, ZapIcon } from './icons';

interface SmartAdvisoryProps {
    category: ListingCategory | '';
    subcategory: string;
    location: string;
    onEnable: (enabled: boolean) => void;
    isEnabled: boolean;
}

type AdvisoryContent = {
    title: string;
    text: string;
    hack: string;
    solution: string;
    actionLabel: string;
    icon: React.ElementType;
    externalLink?: { label: string; url: string };
    gradient: string;
};

const SmartAdvisory: React.FC<SmartAdvisoryProps> = ({ category, subcategory, location, onEnable, isEnabled }) => {
    if (!category) return null;

    const getAdvisoryContent = (): AdvisoryContent | null => {
        if (category === ListingCategory.BOATS) {
            return {
                title: "Captain's Legal Strategy: The Bareboat Charter",
                text: "Renting a boat with yourself as captain triggers expensive Commercial Licensing rules.",
                hack: "We use a 'Demise Charter'. You lease the boat to the renter, making them the 'Temporary Owner'. They can then hire you or a crew member separately.",
                solution: "We automatically generate a digital 'Bareboat Charter Agreement' for your renter to sign at checkout.",
                actionLabel: "Enable Bareboat Agreement",
                icon: AnchorIcon,
                gradient: "from-blue-50 to-indigo-100"
            };
        }

        const isPowersport = 
            category === ListingCategory.UTVS || 
            (category === ListingCategory.WATER_SPORTS && (subcategory.includes('Jet Ski') || subcategory.includes('Motor')));

        if (isPowersport) {
            return {
                title: "Powersports Protection: The Ironclad Waiver",
                text: "The risk here is injury, not just maritime law.",
                hack: "Extreme Assumption of Risk. The renter must acknowledge they understand the danger.",
                solution: "We provide a 'Liability Release & Safety Checklist'. You must confirm you've explained the 'Kill Switch' and safety features before handing over the keys.",
                actionLabel: "Enable Liability Waiver",
                icon: ZapIcon,
                gradient: "from-amber-50 to-orange-100"
            };
        }

        if (category === ListingCategory.RVS || category === ListingCategory.MOTORCYCLES) {
            return {
                title: "Road Rental Strategy: The Bailment Hack",
                text: "Your personal auto insurance likely excludes commercial use ('Business Pursuit Exclusion').",
                hack: "We structure this as a 'Private Bailment' (borrowing with a fee), but it's still a grey area.",
                solution: "For total peace of mind, we recommend purchasing a 'Ghost Policy' for the rental period.",
                actionLabel: "Enable Bailment Contract",
                externalLink: { label: "Get Spot Insurance at MBA Insurance", url: "https://mbainsurance.net/" },
                icon: LightbulbIcon,
                gradient: "from-purple-50 to-fuchsia-100"
            };
        }

        return null;
    };

    const content = getAdvisoryContent();

    if (!content) return null;

    const Icon = content.icon;

    return (
        <div className={`my-8 rounded-xl overflow-hidden border border-gray-200 shadow-md bg-gradient-to-br ${content.gradient} animate-in fade-in slide-in-from-top-4 duration-500`}>
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-full shadow-sm text-gray-700 ring-1 ring-gray-100">
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-white/80 text-xs font-bold uppercase tracking-wider text-gray-600 border border-gray-200">Smart Advisory</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{content.title}</h3>
                        
                        <div className="mt-4 space-y-4 text-sm text-gray-800">
                            <p className="leading-relaxed">{content.text}</p>
                            
                            <div className="flex items-start gap-3 bg-white/60 p-4 rounded-lg border border-white/50">
                                <LightbulbIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-gray-900 block mb-1">THE HACK:</span>
                                    <p className="text-gray-700 leading-snug">{content.hack}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-white/80 p-4 rounded-lg border border-white/50 shadow-sm">
                                <ShieldCheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-gray-900 block mb-1">GOODSLISTER SOLUTION:</span>
                                    <p className="text-gray-700 leading-snug">{content.solution}</p>
                                </div>
                            </div>

                            {content.externalLink && (
                                <div className="pt-1">
                                    <a 
                                        href={content.externalLink.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-700 font-semibold hover:bg-gray-50 hover:text-blue-600 transition-colors text-xs"
                                    >
                                        {content.externalLink.label}
                                        <ExternalLinkIcon className="h-3 w-3" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div 
                className={`px-6 py-4 border-t border-gray-200/50 flex items-center justify-between cursor-pointer transition-colors group ${isEnabled ? 'bg-green-50/80' : 'bg-white/50 hover:bg-white/80'}`} 
                onClick={() => onEnable(!isEnabled)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${isEnabled ? 'bg-green-500 border-green-500 scale-110' : 'bg-white border-gray-300 group-hover:border-gray-400'}`}>
                        {isEnabled && <CheckCircleIcon className="h-4 w-4 text-white" />}
                    </div>
                    <span className={`font-bold text-sm ${isEnabled ? 'text-green-800' : 'text-gray-600 group-hover:text-gray-800'}`}>{content.actionLabel}</span>
                </div>
                {isEnabled && (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full uppercase tracking-wide animate-in fade-in">
                        <ShieldCheckIcon className="h-3 w-3" />
                        Protection Active
                    </span>
                )}
            </div>
        </div>
    );
};

export default SmartAdvisory;
