
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

    public static getContractType(listing: Listing): ContractType {
        const { category } = listing;

        switch (category) {
            case ListingCategory.BOATS:
                return ContractType.BAREBOAT;
            
            case ListingCategory.MOTORCYCLES:
            case ListingCategory.ATVS_UTVS:
                return ContractType.POWERSPORTS_WAIVER;

            case ListingCategory.RVS:
                return ContractType.MOTOR_VEHICLE;

            case ListingCategory.WINTER_SPORTS:
            case ListingCategory.WATER_SPORTS:
                // Check if motorized
                if (listing.subcategory?.toLowerCase().includes('jet') || listing.subcategory?.toLowerCase().includes('motor')) {
                    return ContractType.POWERSPORTS_WAIVER;
                }
                return ContractType.ADVENTURE_WAIVER;

            case ListingCategory.BIKES:
            case ListingCategory.CAMPING:
            default:
                return ContractType.EQUIPMENT_RENTAL;
        }
    }

    /**
     * Standardized Clauses for different categories
     */
    private static getCategorySpecificBody(listing: Listing): string {
        const cat = listing.category;
        const sub = listing.subcategory?.toLowerCase() || '';

        if (cat === ListingCategory.CAMPING) {
            return `
                <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">1. SANITATION & CARE</h3>
                <p>Lessee agrees to return all camping equipment (tents, stoves, sleeping gear) in a dry, clean, and organized state. A $50 sanitation fee applies to items returned wet or with significant debris, as this compromises long-term integrity.</p>
                <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">2. FIRE SAFETY</h3>
                <p>Lessee assumes all liability for damages caused by campfire embers, stove misuse, or proximity of heat sources to synthetic fabrics.</p>
            `;
        }

        if (cat === ListingCategory.WINTER_SPORTS) {
            return `
                <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">1. BINDING & SAFETY WARNING</h3>
                <p>Lessee acknowledges that bindings do not release in all circumstances and do not guarantee safety. Lessee assumes all risks inherent in the sport of skiing/snowboarding, including terrain hazards and collisions.</p>
                <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">2. BASE & EDGE PROTECTION</h3>
                <p>Damages to bases (core shots) or edges from rocks/pavement will be billed at standard professional shop rates ($80+ per repair).</p>
            `;
        }

        if (cat === ListingCategory.MOTORCYCLES || cat === ListingCategory.ATVS_UTVS) {
            return `
                <h3 class="font-bold text-red-700 mt-4 mb-2">1. EXTREME ASSUMPTION OF RISK</h3>
                <p>The operation of a ${cat} is an inherently dangerous activity. Lessee acknowledges potential for severe bodily injury or death. Lessee represents they possess the skill and license to operate this specific machine.</p>
                <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">2. GEOGRAPHIC LIMITS</h3>
                <p>The vehicle shall not be operated outside of authorized trails or public roads. Crossing international or state borders without prior written consent from Owner is a material breach.</p>
            `;
        }

        if (cat === ListingCategory.RVS) {
            return `
                <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">1. BAILMENT & ROADSIDE</h3>
                <p>This agreement is a temporary bailment for hire. Lessee is responsible for monitoring all fluid levels and tire pressures during the term. Any mechanical warning lights must result in immediate cessation of operation.</p>
                <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">2. WASTE DISPOSAL</h3>
                <p>Septic tanks (Black/Gray water) must be returned empty. Failure to do so results in a mandatory $150 disposal fee.</p>
            `;
        }

        return `
            <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">1. USE OF PROPERTY</h3>
            <p>The equipment shall be used solely for its intended recreational purpose. Commercial use, sub-leasing, or use in sanctioned competitions is prohibited.</p>
            <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">2. REPLACEMENT VALUE</h3>
            <p>In the event of total loss or theft, Lessee is liable for the full current market replacement value of the item, plus loss-of-use revenue for the Owner during the replacement period.</p>
        `;
    }

    public static generateContractHtml(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number): string {
        const contractType = this.getContractType(listing);
        
        // Handle Florida Bareboat separately as it's highly specialized
        if (contractType === ContractType.BAREBOAT) {
            // ... (Keeping the robust Florida Bareboat logic already implemented) ...
            return this.generateFloridaBareboatContract(listing, renter, startDate, endDate, totalPrice);
        }

        const dateStr = format(new Date(), 'MMMM do, yyyy');
        const startStr = format(startDate, 'MMM dd, yyyy h:mm aa');
        const endStr = format(endDate, 'MMM dd, yyyy h:mm aa');

        return `
            <div class="legal-contract font-sans text-sm leading-relaxed text-gray-800">
                <div class="text-center mb-8 border-b-2 border-gray-900 pb-4">
                    <h1 class="text-xl font-black uppercase tracking-tight">${contractType}</h1>
                    <p class="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">Goodslister Standard Version 2.1</p>
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
                    <p>This Agreement is entered into on <strong>${dateStr}</strong>. Owner hereby rents to Renter the following property: <strong>${listing.title.toUpperCase()}</strong> for the period of <strong>${startStr}</strong> through <strong>${endStr}</strong>.</p>
                    
                    ${this.getCategorySpecificBody(listing)}

                    <h3 class="font-bold border-b border-gray-200 mt-4 mb-2">INDEMNIFICATION</h3>
                    <p>Renter agrees to indemnify, defend, and hold harmless Owner and Goodslister Inc. from any and all claims, actions, suits, procedures, costs, expenses, damages and liabilities, including attorney’s fees brought as a result of Renter's use of the Property.</p>

                    <div class="mt-8 p-4 bg-yellow-50 rounded border border-yellow-200">
                        <p class="text-xs italic"><strong>Note to Owner:</strong> This is a standard template provided by Goodslister for convenience. It does not constitute specific legal advice. Please have your legal counsel review for your local jurisdiction.</p>
                    </div>
                </div>
            </div>
        `;
    }

    private static generateFloridaBareboatContract(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number): string {
        const hostName = listing.owner.name.toUpperCase();
        const startStr = format(startDate, "h:mm aa 'on' MMM dd, yyyy");
        const endStr = format(endDate, "h:mm aa 'on' MMM dd, yyyy");
        const vesselDescription = `${listing.title} (${listing.subcategory || 'Vessel'})`.toUpperCase();
        const cruisingArea = `${listing.location.city}, ${listing.location.state}`;

        return `
            <div class="legal-contract font-serif text-sm leading-relaxed text-justify">
                <div class="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 class="text-2xl font-bold uppercase tracking-wide">Bareboat Charter Agreement</h1>
                    <p class="text-sm font-bold mt-2 text-blue-700 uppercase">Florida Statutory Compliance Edition</p>
                </div>

                <p class="mb-4">This Charter Agreement constitutes a <strong>full demise</strong> of the Vessel from OWNER to RENTER. RENTER shall have full possession, command, and navigation of the Vessel during the Charter Period.</p>

                <div class="space-y-6">
                    <div>
                        <h4 class="font-black text-gray-900 underline uppercase">1. Command and Control</h4>
                        <p>OWNER represents that they shall NOT provide a captain. RENTER has the absolute right to select a captain of their choice, provided the captain is properly licensed by the USCG for the vessel type and size.</p>
                    </div>

                    <div>
                        <h4 class="font-black text-gray-900 underline uppercase">2. Insurance & SB 606</h4>
                        <p>In accordance with Florida SB 606, OWNER warrants that the vessel carries valid liability insurance. RENTER is responsible for any deductible ($${listing.securityDeposit || 500}) in the event of an incident.</p>
                    </div>

                    <div>
                        <h4 class="font-black text-gray-900 underline uppercase">3. Condition and Inspection</h4>
                        <p>RENTER agrees to participate in the Goodslister Digital Handover Inspection. The resulting photos shall be the conclusive evidence of the vessel's condition at time of delivery.</p>
                    </div>
                </div>

                <div class="mt-12 pt-6 border-t border-black text-[10px] text-gray-400">
                    <p>DOCUMENT ID: BARE-FL-${listing.id.slice(-6)}-${Date.now().toString().slice(-4)}</p>
                </div>
            </div>
        `;
    }
}
