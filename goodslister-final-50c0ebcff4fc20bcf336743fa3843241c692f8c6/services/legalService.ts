
import { Listing, ListingCategory, User } from '../types';
import { format } from 'date-fns';

export enum ContractType {
    BAREBOAT = "Bareboat Charter Agreement",
    POWERSPORTS_WAIVER = "Risk Warning, Waiver & Release of Liability",
    MOTOR_VEHICLE = "Private Vehicle Rental & Bailment Agreement",
    EQUIPMENT_RENTAL = "Recreational Equipment Rental Agreement",
    ADVENTURE_WAIVER = "Assumption of Risk & Safety Agreement",
    BICYCLE_RENTAL = "Bicycle Rental Agreement",
    SURFBOARD_RENTAL = "Surfboard Rental Agreement",
    PADDLEBOARD_RENTAL = "SUP Rental Agreement"
}

export class LegalService {

    /**
     * Decision Matrix: Determines the specific legal template based on category/subcategory.
     */
    public static getContractType(listing: Listing): ContractType {
        const cat = listing.category;
        const sub = (listing.subcategory || '').toLowerCase();

        // 1. WATER SPORTS BRANCH
        if (cat === ListingCategory.WATER_SPORTS) {
            if (sub.includes('surfboard')) return ContractType.SURFBOARD_RENTAL;
            if (sub.includes('paddleboard') || sub.includes('sup')) return ContractType.PADDLEBOARD_RENTAL;
        }

        // 2. BIKE SPECIFIC (Excluding Scooters)
        if (cat === ListingCategory.BIKES && !sub.includes('scooter')) {
            return ContractType.BICYCLE_RENTAL;
        }

        // 3. BOATS (Bareboat/Demise Charter)
        if (cat === ListingCategory.BOATS) {
            return ContractType.BAREBOAT;
        }

        // 4. POWERSPORTS (Motorized)
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

        // Default fallback for general equipment
        return ContractType.EQUIPMENT_RENTAL;
    }

    /**
     * Main entry point for generating contract HTML.
     */
    public static generateContractHtml(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number): string {
        const contractType = this.getContractType(listing);
        
        switch (contractType) {
            case ContractType.PADDLEBOARD_RENTAL:
                return this.generatePaddleboardContract(listing, renter, startDate, endDate, totalPrice);
            case ContractType.SURFBOARD_RENTAL:
                return this.generateSurfboardContract(listing, renter, startDate, endDate, totalPrice);
            case ContractType.BICYCLE_RENTAL:
                return this.generateBicycleContract(listing, renter, startDate, endDate, totalPrice);
            case ContractType.BAREBOAT:
                return this.generateFloridaBareboatContract(listing, renter, startDate, endDate, totalPrice);
            default:
                return this.generateDefaultContract(listing, renter, startDate, endDate, totalPrice, contractType);
        }
    }

    /**
     * TEMPLATE: PADDLEBOARD (SUP) RENTAL AGREEMENT
     */
    private static generatePaddleboardContract(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number): string {
        const formalItemName = (listing.legalItemName || listing.title).toUpperCase();
        const location = `${listing.location.city}, ${listing.location.state}`;
        const currentDate = format(new Date(), 'MMMM do, yyyy');
        const startStr = format(startDate, 'MMM dd, yyyy p');
        const endStr = format(endDate, 'MMM dd, yyyy p');

        return `
            <div class="legal-contract font-serif text-sm leading-relaxed text-gray-800 text-justify">
                <div class="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 class="text-2xl font-bold uppercase tracking-wide">STAND UP PADDLEBOARD (SUP) RENTAL AGREEMENT</h1>
                    <p class="text-[10px] mt-1 text-gray-500 uppercase font-bold tracking-widest">Goodslister Marine-V1.4 | Watersports Division</p>
                </div>

                <p class="mb-6">This Rental Agreement ("Agreement") is made on <strong>${currentDate}</strong> in <strong>${location}</strong>.</p>

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
                        <p>The Owner agrees to rent the following Stand Up Paddleboard (SUP) equipment:</p>
                        <p class="mt-2 p-3 bg-white border font-bold text-blue-900">Item: ${formalItemName}</p>
                        <p class="text-[10px] text-gray-500 mt-1">Included Accessories: [ ] Paddle [ ] Leash [ ] PFD/Life Jacket [ ] Fin(s)</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2">2. PERIOD & PAYMENT</h4>
                        <p class="text-xs"><strong>DATES:</strong> ${startStr} to ${endStr}</p>
                        <p class="text-xs"><strong>TOTAL PRICE:</strong> $${totalPrice.toFixed(2)} | <strong>DEPOSIT:</strong> $${listing.securityDeposit || 0}</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2 text-red-700">4. HEAT & INFLATION WARNING (CRITICAL)</h4>
                        <p>Renter shall <strong>NEVER</strong> leave an inflated SUP exposed to direct sunlight on land. Heat causes air expansion which can lead to <strong>explosion or seam rupture</strong>. Renter is 100% liable for replacement if heat damage occurs.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2">5. SHALLOW WATER & LOSS</h4>
                        <p><strong>a) Fins:</strong> Do not ride in shallow water or onto sand. This breaks the fin box. <strong>b) Lost Accessories:</strong> Renter agrees to fixed replacement costs: <strong>Lost Paddle: $100.00</strong> | <strong>Lost Fin: $50.00</strong>.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2">6. RELEASE OF LIABILITY</h4>
                        <p>The Renter assumes all risks including drowning and currents. The Renter releases and agrees to <strong>hold harmless</strong> the Owner from any claims regarding injury, death, or property damage.</p>
                    </section>
                </div>

                <div class="mt-12 pt-8 border-t border-black grid grid-cols-2 gap-12 text-center">
                    <div>
                        <p class="font-bold italic text-blue-900 border-b border-black mb-1">${listing.owner.name.toUpperCase()}</p>
                        <p class="text-[9px] uppercase font-black text-gray-400">Owner Signature</p>
                    </div>
                    <div>
                        <p class="font-bold italic text-blue-900 border-b border-black mb-1">${renter.name.toUpperCase()}</p>
                        <p class="text-[9px] uppercase font-black text-gray-400">Renter Signature</p>
                    </div>
                </div>

                <div class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 text-[10px] text-gray-600">
                    <p><strong>Glosario:</strong> <b>Inflation Damage:</b> Explosión por calor. <b>Fin Box:</b> La base de la quilla; se rompe al tocar fondo en la orilla.</p>
                </div>
            </div>
        `;
    }

    /**
     * TEMPLATE: SURFBOARD RENTAL AGREEMENT
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
                        <p>The Owner agrees to rent to the Renter the following equipment (hereinafter referred to as the "Surfboard"):</p>
                        <p class="mt-2 p-3 bg-white border font-bold text-blue-900">Item Description: ${formalItemName}</p>
                        <p class="mt-2 text-xs italic"><strong>Condition:</strong> Renter confirms board is free of open cracks or delamination.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2">3. PAYMENT AND SECURITY DEPOSIT</h4>
                        <p>Total Price: $${totalPrice.toFixed(2)} | Security Deposit: $${listing.securityDeposit || 0}</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2 text-red-700">4. USE AND CARE (DELAMINATION)</h4>
                        <p>Renter shall NEVER leave the board in direct sunlight or inside a hot vehicle. Heat causes <strong>delamination</strong> (bubbles). Renter is fully liable for this damage.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2">5. DAMAGE AND DESTRUCTION</h4>
                        <p>If the board suffers a <strong>structural buckle</strong> or is snapped, the Renter agrees to pay the <strong>full replacement value</strong>.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase mb-2">6. RELEASE OF LIABILITY</h4>
                        <p>The Renter hereby releases and agrees to <strong>hold harmless</strong> the Owner from any claims regarding injury or death arising from surfing.</p>
                    </section>
                </div>

                <div class="mt-12 pt-8 border-t border-black grid grid-cols-2 gap-12 text-center">
                    <div>
                        <p class="font-bold italic text-blue-900 border-b border-black mb-1">${listing.owner.name.toUpperCase()}</p>
                        <p class="text-[9px] uppercase font-black text-gray-400">Digital Signature: Owner</p>
                    </div>
                    <div>
                        <p class="font-bold italic text-blue-900 border-b border-black mb-1">${renter.name.toUpperCase()}</p>
                        <p class="text-[9px] uppercase font-black text-gray-400">Digital Signature: Renter</p>
                    </div>
                </div>

                <div class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 text-[10px] text-gray-600">
                    <p><strong>Glosario:</strong> <b>Delamination:</b> Daño por calor que arruina la tabla. <b>Buckle:</b> Arruga estructural que indica que la tabla está por partirse.</p>
                </div>
            </div>
        `;
    }

    /**
     * TEMPLATE: BICYCLE RENTAL AGREEMENT
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
                    <p class="text-xs mt-1 text-gray-500 uppercase">Goodslister Standard Bike-V1.0</p>
                </div>

                <p class="mb-6">This Agreement is made on <strong>${currentDate}</strong> in <strong>${location}</strong>.</p>

                <div class="mb-6">
                    <p><strong>OWNER:</strong> ${listing.owner.name.toUpperCase()}</p>
                    <p><strong>RENTER:</strong> ${renter.name.toUpperCase()}</p>
                </div>

                <div class="space-y-6">
                    <section>
                        <h4 class="font-bold underline uppercase">1. RENTAL EQUIPMENT</h4>
                        <p class="p-2 bg-gray-50 border-l-4 border-gray-400 font-bold">Item: ${formalItemName}</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase">3. PAYMENT</h4>
                        <p>Rental: $${totalPrice.toFixed(2)} | Deposit: $${listing.securityDeposit || 0}</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase">5. LOSS AND THEFT</h4>
                        <p>In case of theft, Renter is liable for the <strong>full replacement value</strong> of the equipment.</p>
                    </section>

                    <section>
                        <h4 class="font-bold underline uppercase">6. INDEMNIFICATION</h4>
                        <p>The Renter agrees to <strong>indemnify and hold harmless</strong> the Owner from any and all claims arising out of injury resulting from use.</p>
                    </section>
                </div>

                <div class="mt-12 pt-8 border-t border-gray-300 grid grid-cols-2 gap-8 text-center">
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
