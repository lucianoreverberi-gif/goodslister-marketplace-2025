
import { Listing, ListingCategory, User } from '../types';
import { format } from 'date-fns';

export enum ContractType {
    BAREBOAT = "Bareboat Charter Agreement",
    POWERSPORTS_WAIVER = "Risk Warning, Waiver & Release of Liability",
    MOTOR_VEHICLE = "Private Vehicle Rental & Bailment Agreement",
    EQUIPMENT_RENTAL = "Recreational Equipment Rental Agreement",
    ADVENTURE_WAIVER = "Assumption of Risk & Safety Agreement"
}

export class LegalService {

    /**
     * Determines the most appropriate legal header based on Category and Subcategory.
     */
    public static getContractType(listing: Listing): ContractType {
        const cat = listing.category;
        const sub = (listing.subcategory || '').toLowerCase();

        // 1. BOATS DECISION MATRIX
        if (cat === ListingCategory.BOATS) {
            return ContractType.BAREBOAT;
        }

        // 2. POWERSPORTS DECISION MATRIX (Motorized Water, Land, Snow)
        if (
            cat === ListingCategory.MOTORCYCLES || 
            cat === ListingCategory.ATVS_UTVS ||
            sub.includes('jet ski') || 
            sub.includes('motor') ||
            sub.includes('snowmobile')
        ) {
            return ContractType.POWERSPORTS_WAIVER;
        }

        // 3. VEHICLE DECISION MATRIX
        if (cat === ListingCategory.RVS) {
            return ContractType.MOTOR_VEHICLE;
        }

        // 4. ADVENTURE & SPORT (Manual)
        if (cat === ListingCategory.WINTER_SPORTS || cat === ListingCategory.WATER_SPORTS) {
            return ContractType.ADVENTURE_WAIVER;
        }

        return ContractType.EQUIPMENT_RENTAL;
    }

    /**
     * Returns the specific legal clauses for a Subcategory.
     * This is where your robust lawyer-reviewed texts will live.
     */
    private static getSubcategorySpecificBody(listing: Listing): string {
        const cat = listing.category;
        const sub = (listing.subcategory || '').toLowerCase();

        // --- SPEEDBOAT (BAREBOAT CHARTER) ---
        if (cat === ListingCategory.BOATS && sub.includes('speedboat')) {
            return `
                <h3 class="font-bold border-b border-gray-900 mt-4 mb-2">MARINE PROPULSION & SPEED RESTRICTIONS</h3>
                <p>This Vessel is equipped with high-performance marine engines. Lessee warrants they understand the navigation rules of the road and specific speed limits in local channels. Operating at speeds exceeding safe navigation for current sea states is a material breach of this Charter.</p>
                <h3 class="font-bold border-b border-gray-900 mt-4 mb-2">HULL STRESS & IMPACT</h3>
                <p>Lessee is liable for any structural damage to the hull caused by wave-jumping or improper trim settings during high-speed operation.</p>
            `;
        }

        // --- JET SKI (POWERSPORTS WAIVER) ---
        if (sub.includes('jet ski')) {
            return `
                <h3 class="font-bold text-red-700 mt-4 mb-2">PWC SPECIFIC RISK WARNING</h3>
                <p>Personal Watercraft (PWC) operation involves high risks of collision and ejection. Lessee acknowledges that there is NO BRAKE on this vessel and that steering requires throttle application. Lessee has viewed the required safety video regarding PWC operation.</p>
                <h3 class="font-bold border-b border-gray-900 mt-4 mb-2">IN-TAKE PROTECTION</h3>
                <p>Lessee agrees to keep the vessel in at least 3 feet of water to prevent debris intake. Damage to the impeller caused by ingestion of sand/rocks is the sole responsibility of the Lessee.</p>
            `;
        }

        // --- RV / CAMPER (MOTOR VEHICLE) ---
        if (cat === ListingCategory.RVS) {
            return `
                <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">WASTE & SYSTEMS MANAGEMENT</h3>
                <p>Lessee is responsible for the proper operation of all slide-outs, leveling systems, and septic management. Incorrect operation leading to motor burn-out or system failure will be deducted from the security deposit.</p>
            `;
        }

        // Fallback to Category defaults if subcategory isn't specifically defined yet
        return `
            <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">STANDARD USE OF PROPERTY</h3>
            <p>The ${listing.subcategory || 'item'} shall be used solely for its intended recreational purpose. Commercial use or sub-leasing is strictly prohibited.</p>
        `;
    }

    public static generateContractHtml(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number): string {
        const contractType = this.getContractType(listing);
        const formalItemName = (listing.legalItemName || listing.title).toUpperCase();
        
        const dateStr = format(new Date(), 'MMMM do, yyyy');
        const startStr = format(startDate, 'MMM dd, yyyy h:mm aa');
        const endStr = format(endDate, 'MMM dd, yyyy h:mm aa');

        return `
            <div class="legal-contract font-sans text-sm leading-relaxed text-gray-800">
                <div class="text-center mb-8 border-b-2 border-gray-900 pb-4">
                    <h1 class="text-xl font-black uppercase tracking-tight">${contractType}</h1>
                    <p class="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">
                        Goodslister Precision Version 3.0 | ${listing.category.toUpperCase()} - ${listing.subcategory?.toUpperCase()}
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded border">
                    <div>
                        <p class="text-[10px] text-gray-400 uppercase font-black">Owner / Lessor</p>
                        <p class="font-bold">${listing.owner.name.toUpperCase()}</p>
                    </div>
                    <div>
                        <p class="text-[10px] text-gray-400 uppercase font-black">Renter / Lessee</p>
                        <p class="font-bold">${renter.name.toUpperCase()}</p>
                    </div>
                </div>

                <div class="space-y-4">
                    <p>This Agreement is entered into on <strong>${dateStr}</strong>. Owner hereby rents to Renter the following property: <strong>${formalItemName}</strong> for the period of <strong>${startStr}</strong> through <strong>${endStr}</strong>.</p>
                    
                    ${this.getSubcategorySpecificBody(listing)}

                    <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">INDEMNIFICATION & LIABILITY</h3>
                    <p>Renter agrees to indemnify Owner and Goodslister Inc. from any and all claims, including legal fees, arising from the use or operation of the ${formalItemName}.</p>

                    <div class="mt-8 p-6 bg-gray-900 text-white rounded-xl">
                        <p class="text-[10px] uppercase font-black text-cyan-400 mb-2">Digital Fingerprint</p>
                        <p class="text-[9px] font-mono opacity-60">DOC_REF: ${listing.id.slice(0,8)}-${listing.subcategory?.slice(0,3)}-${Date.now()}</p>
                    </div>
                </div>
            </div>
        `;
    }
}
