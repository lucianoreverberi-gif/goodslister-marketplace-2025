
import { Listing, ListingCategory, User } from '../types';
import { format } from 'date-fns';

export enum ContractType {
    BAREBOAT = "Bareboat Charter Agreement",
    POWERSPORTS_WAIVER = "Risk Warning, Waiver & Release of Liability",
    MOTOR_VEHICLE = "Private Vehicle Rental & Bailment Agreement",
    EQUIPMENT_RENTAL = "Recreational Equipment Rental Agreement",
    ADVENTURE_WAIVER = "Assumption of Risk & Safety Agreement",
    BICYCLE_RENTAL = "Bicycle Rental Agreement",
    SURFBOARD_RENTAL = "Surfboard Rental Agreement"
}

export class LegalService {

    /**
     * Decision Matrix to determine the specific legal template.
     */
    public static getContractType(listing: Listing): ContractType {
        const cat = listing.category;
        const sub = (listing.subcategory || '').toLowerCase();

        // 1. SURFBOARD SPECIFIC
        if (cat === ListingCategory.WATER_SPORTS && sub.includes('surfboard')) {
            return ContractType.SURFBOARD_RENTAL;
        }

        // 2. BIKE SPECIFIC (Excluding Scooters)
        if (cat === ListingCategory.BIKES && !sub.includes('scooter')) {
            return ContractType.BICYCLE_RENTAL;
        }

        // 3. BOATS (Bareboat)
        if (cat === ListingCategory.BOATS) {
            return ContractType.BAREBOAT;
        }

        // 4. POWERSPORTS (Motorized Water/Land)
        if (
            cat === ListingCategory.MOTORCYCLES || 
            cat === ListingCategory.ATVS_UTVS ||
            sub.includes('jet ski') || 
            sub.includes('motor') ||
            sub.includes('snowmobile')
        ) {
            return ContractType.POWERSPORTS_WAIVER;
        }

        // 5. VEHICLE / RV
        if (cat === ListingCategory.RVS) {
            return ContractType.MOTOR_VEHICLE;
        }

        return ContractType.EQUIPMENT_RENTAL;
    }

    public static generateContractHtml(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number): string {
        const contractType = this.getContractType(listing);
        
        // Dispatch to specific generators
        if (contractType === ContractType.SURFBOARD_RENTAL) {
            return this.generateSurfboardContract(listing, renter, startDate, endDate, totalPrice);
        }
        
        if (contractType === ContractType.BICYCLE_RENTAL) {
            return this.generateBicycleContract(listing, renter, startDate, endDate, totalPrice);
        }
        
        if (contractType === ContractType.BAREBOAT) {
            return this.generateFloridaBareboatContract(listing, renter, startDate, endDate, totalPrice);
        }

        // Default Fallback
        return this.generateDefaultContract(listing, renter, startDate, endDate, totalPrice, contractType);
    }

    /**
     * GENERATOR: SURFBOARD RENTAL AGREEMENT
     */
    private static generateSurfboardContract(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number): string {
        const formalItemName = (listing.legalItemName || listing.title).toUpperCase();
        const location = `${listing.location.city}, ${listing.location.state}`;
        const currentDate = format(new Date(), 'MMMM do, yyyy');
        const startStr = format(startDate, 'MMM dd, yyyy p');
        const endStr = format(endDate, 'MMM dd, yyyy p');

        return `
            <div class="legal-contract font-serif text-sm leading-relaxed text-gray-800 text-justify">
                <div class="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 class="text-2xl font-bold uppercase tracking-wide">SURFBOARD RENTAL AGREEMENT</h1>
                    <p class="text-[10px] mt-1 text-gray-500 uppercase font-bold tracking-widest">Goodslister Marine-V1.2 | Water Sports Certified</p>
                </div>

                <p class="mb-6">This Rental Agreement ("Agreement") is made and entered into on this date <strong>${currentDate}</strong> in <strong>${location}</strong>.</p>

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

                <div class="space-y-6">
                    <section>
                        <h4 class="font-bold underline uppercase mb-2">1. RENTAL EQUIPMENT</h4>
                        <p>The Owner agrees to rent to the Renter, and the Renter agrees to rent the following equipment (hereinafter referred to as the "Surfboard" or "Equipment"):</p>
                        <p class="mt-2 p-3 bg-white border font-bold text-blue-900">Item Description: ${formalItemName}</p>
                        
                        <div class="mt-3 p-3 border border-dashed border-gray-300 rounded">
                            <p class="text-xs font-bold mb-1">Included Accessories:</p>
                            <p class="text-xs">[ ] Leash/Leg rope &nbsp;&nbsp; [ ] Fins &nbsp;&nbsp; [ ] Board Bag &nbsp;&nbsp; [ ] Wetsuit</p>
                        </div>
                        
                        <p class="mt-2 text-xs italic"><strong>Condition:</strong> The Renter acknowledges that they have inspected the Surfboard (including the deck, bottom, rails, and fins) and confirms that it is in good condition, free of open cracks, deep dings, or delamination, except as otherwise noted in writing.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2">2. RENTAL PERIOD</h4>
                        <div class="grid grid-cols-2 gap-4 text-xs font-bold">
                            <div class="p-2 border bg-gray-50">START: ${startStr}</div>
                            <div class="p-2 border bg-gray-50">END: ${endStr}</div>
                        </div>
                        <p class="mt-2 text-xs">The Equipment must be returned by the agreed date and time. Late returns may be subject to additional fees.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2">3. PAYMENT AND SECURITY DEPOSIT</h4>
                        <ul class="space-y-1">
                            <li><strong>Total Rental Price:</strong> $${totalPrice.toFixed(2)}</li>
                            <li><strong>Security Deposit:</strong> $${listing.securityDeposit || 0}</li>
                        </ul>
                        <p class="mt-2 text-xs"><strong>Use of Deposit:</strong> Deductions will be made for professional repair costs for dings, cracks, broken fin boxes, excessive cleaning (removal of tar/wax in prohibited areas), or loss of accessories.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2 text-red-700">4. USE, CARE AND SPECIFIC PROHIBITIONS</h4>
                        <p><strong>a) Heat and Sun Damage (Delamination):</strong> The Renter shall NEVER leave the Surfboard exposed to direct sunlight when not in use, nor inside a hot vehicle. Heat causes the fiberglass to separate from the foam ("delamination"). <strong>The Renter is fully liable for this specific damage.</strong></p>
                        <p class="mt-1"><strong>b) Handling:</strong> The Surfboard must not be dragged across sand, rocks, or pavement.</p>
                        <p class="mt-1"><strong>c) Competency:</strong> The Renter certifies that they are a competent swimmer and possess sufficient skills to handle the Surfboard in the prevailing ocean conditions.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2">5. DAMAGE, DESTRUCTION, AND LOSS</h4>
                        <p><strong>a) Minor Damage:</strong> Renter pays for repairs of any dings or cracks. <strong>b) Total Destruction ("Snap" or "Buckle"):</strong> If the Surfboard is snapped in half or suffers structural buckling, the Renter agrees to pay the <strong>full replacement value</strong> of the board. <strong>c) Theft or Loss at Sea:</strong> Renter is liable for the full replacement value.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2">6. RELEASE OF LIABILITY AND ASSUMPTION OF RISK</h4>
                        <p>The Renter understands that surfing is a hazardous activity. <strong>a) Assumption of Risk:</strong> Renter knowingly assumes all risks including drowning, collisions, and marine life interaction. <strong>b) Indemnification:</strong> The Renter hereby releases and agrees to <strong>hold harmless</strong> the Owner from any claims regarding injury, death, or property damage.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2">7. GOVERNING LAW</h4>
                        <p>This Agreement shall be governed by the laws of <strong>${location}</strong>.</p>
                    </section>
                </div>

                <div class="mt-10 pt-6 border-t border-black">
                    <div class="grid grid-cols-2 gap-12">
                        <div class="text-center">
                            <p class="font-bold italic text-blue-900 border-b border-black mb-1">${listing.owner.name.toUpperCase()}</p>
                            <p class="text-[9px] uppercase font-black text-gray-400">Digital Signature: Owner</p>
                        </div>
                        <div class="text-center">
                            <p class="font-bold italic text-blue-900 border-b border-black mb-1">${renter.name.toUpperCase()}</p>
                            <p class="text-[9px] uppercase font-black text-gray-400">Digital Signature: Renter</p>
                        </div>
                    </div>
                </div>

                <div class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 text-[10px] text-gray-600 space-y-2">
                    <p class="font-bold text-blue-900 uppercase">Key Terms Explained (Glosario):</p>
                    <p>• <strong>Delamination (Cláusula 4a):</strong> Fiber separating from foam due to heat. Avoid direct sun or hot cars.</p>
                    <p>• <strong>Buckle (Cláusula 5b):</strong> Structural crease/wrinkle in the board, making it unsafe/unusable.</p>
                    <p>• <strong>Indemnification:</strong> Renter takes responsibility for third-party damages, protecting the Owner's assets.</p>
                </div>
            </div>
        `;
    }

    /**
     * GENERATOR: BICYCLE RENTAL AGREEMENT
     */
    private static generateBicycleContract(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number): string {
        const formalItemName = (listing.legalItemName || listing.title).toUpperCase();
        const location = `${listing.location.city}, ${listing.location.state}`;
        const currentDate = format(new Date(), 'MMMM do, yyyy');
        const startStr = format(startDate, 'MMM dd, yyyy p');
        const endStr = format(endDate, 'MMM dd, yyyy p');

        return `
            <div class="legal-contract font-serif text-sm leading-relaxed text-gray-800 text-justify">
                <div class="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 class="text-2xl font-bold uppercase tracking-wide">BICYCLE RENTAL AGREEMENT</h1>
                    <p class="text-xs mt-1">Goodslister Standard Bike-V1.0</p>
                </div>
                <p class="mb-6">This Rental Agreement ("Agreement") is made and entered into on this date <strong>${currentDate}</strong> in <strong>${location}</strong>.</p>
                <div class="mb-6 space-y-2">
                    <p><strong>BETWEEN:</strong> THE OWNER: ${listing.owner.name.toUpperCase()} <strong>AND</strong> THE RENTER: ${renter.name.toUpperCase()}</p>
                </div>
                <div class="space-y-6">
                    <section>
                        <h4 class="font-bold underline uppercase">1. RENTAL EQUIPMENT</h4>
                        <p class="p-2 bg-gray-50 border-l-4 border-gray-400 font-bold">Item: ${formalItemName}</p>
                    </section>
                    <section>
                        <h4 class="font-bold underline uppercase">3. PAYMENT AND SECURITY DEPOSIT</h4>
                        <p>Rental Price: $${totalPrice.toFixed(2)} | Deposit: $${listing.securityDeposit || 0}</p>
                    </section>
                    <section>
                        <h4 class="font-bold underline uppercase">6. RELEASE OF LIABILITY</h4>
                        <p>The Renter hereby releases, waives, and agrees to <strong>indemnify and hold harmless</strong> the Owner from any and all claims.</p>
                    </section>
                </div>
                <div class="mt-12 pt-8 border-t border-gray-300 grid grid-cols-2 gap-8">
                    <div class="border-b border-black pb-2 font-bold italic text-blue-900">${listing.owner.name.toUpperCase()}</div>
                    <div class="border-b border-black pb-2 font-bold italic text-blue-900">${renter.name.toUpperCase()}</div>
                </div>
            </div>
        `;
    }

    private static generateDefaultContract(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number, type: ContractType): string {
        const formalItemName = (listing.legalItemName || listing.title).toUpperCase();
        return `
            <div class="legal-contract font-sans text-sm leading-relaxed text-gray-800 p-4">
                <h1 class="text-xl font-black uppercase mb-4">${type}</h1>
                <p>Owner: ${listing.owner.name}</p>
                <p>Renter: ${renter.name}</p>
                <p>Property: ${formalItemName}</p>
                <div class="mt-4 p-4 bg-gray-100 rounded">Terms for ${listing.category} apply.</div>
            </div>
        `;
    }

    private static generateFloridaBareboatContract(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number): string {
        const formalItemName = (listing.legalItemName || listing.title).toUpperCase();
        return `
            <div class="legal-contract font-serif text-sm leading-relaxed text-justify">
                <div class="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 class="text-2xl font-bold uppercase tracking-wide">Bareboat Charter Agreement</h1>
                    <p class="text-sm font-bold mt-2 text-blue-700 uppercase">Florida Statutory Compliance Edition</p>
                </div>
                <p class="mb-4">This Charter Agreement constitutes a <strong>full demise</strong> of the Vessel identified as: <strong>${formalItemName}</strong> from OWNER to RENTER.</p>
                <div class="mt-4 p-4 border rounded">Details for Florida SB 606 included.</div>
            </div>
        `;
    }
}
