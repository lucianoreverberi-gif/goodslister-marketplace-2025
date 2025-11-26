
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
                icon: AnchorIcon
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
                icon: ZapIcon
            };
        }

        if (category === ListingCategory.RVS || category === ListingCategory.MOTORCYCLES) {
            return {
                title: "Road Rental Strategy: The Bailment Hack",
                text: "Your personal auto insurance likely excludes commercial use ('Business Pursuit Exclusion').",
                hack: "We structure this as a 'Private Bailment' (borrowing with a fee), but it's still a grey area.",
                solution: "For total peace of mind, we recommend purchasing a 'Ghost Policy' for the rental period.",
                actionLabel: "Enable Bailment Contract",
                externalLink: { label: "Get Spot Insurance at MBA Insurance", url: "#" },
                icon: LightbulbIcon
            };
        }

        return null;
    };

    const content = getAdvisoryContent();

    if (!content) return null;

    const Icon = content.icon;

    return (
        <div className="my-8 rounded-xl overflow-hidden border border-indigo-100 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-full shadow-sm text-indigo-600">
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-indigo-900">{content.title}</h3>
                        
                        <div className="mt-3 space-y-3 text-sm text-indigo-800">
                            <p>{content.text}</p>
                            
                            <div className="flex items-start gap-2 bg-white/60 p-3 rounded-lg">
                                <LightbulbIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p><span className="font-bold text-indigo-900">THE HACK:</span> {content.hack}</p>
                            </div>

                            <div className="flex items-start gap-2 bg-white/60 p-3 rounded-lg">
                                <ShieldCheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <p><span className="font-bold text-indigo-900">GOODSLISTER SOLUTION:</span> {content.solution}</p>
                            </div>

                            {content.externalLink && (
                                <a href={content.externalLink.url} className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline mt-1" onClick={(e) => e.preventDefault()}>
                                    {content.externalLink.label}
                                    <ExternalLinkIcon className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-indigo-100/50 px-6 py-4 border-t border-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => onEnable(!isEnabled)}>
                <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isEnabled ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-indigo-300'}`}>
                        {isEnabled && <CheckCircleIcon className="h-4 w-4 text-white" />}
                    </div>
                    <span className={`font-bold ${isEnabled ? 'text-indigo-900' : 'text-indigo-700'}`}>{content.actionLabel}</span>
                </div>
                {isEnabled && <span className="text-xs font-bold text-indigo-600 bg-indigo-200 px-2 py-1 rounded-full uppercase tracking-wide">Active</span>}
            </div>
        </div>
    );
};

export default SmartAdvisory;
