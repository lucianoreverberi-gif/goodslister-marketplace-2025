
import { Listing, ListingCategory, User } from '../types';
import { format } from 'date-fns';

export enum ContractType {
    BAREBOAT = "Bareboat Charter Agreement",
    POWERSPORTS_WAIVER = "Risk Warning, Waiver & Release of Liability",
    STANDARD_RENTAL = "Standard Equipment Rental Agreement"
}

export class LegalService {

    public static getContractType(listing: Listing): ContractType {
        const { category, subcategory } = listing;

        if (category === ListingCategory.BOATS) {
            return ContractType.BAREBOAT;
        }

        // Logic for Powersports (High Risk Bodily Injury)
        // Check for specific subcategories in Water Sports like Jet Ski
        const sub = subcategory ? subcategory.toLowerCase() : '';
        const isJetSki = category === ListingCategory.WATER_SPORTS && sub.includes('jet ski');
                         
        const isPowersport = 
            category === ListingCategory.ATVS_UTVS || 
            category === ListingCategory.MOTORCYCLES || 
            category === ListingCategory.WINTER_SPORTS || // Snowmobiles often here or just risky
            isJetSki;

        if (isPowersport) {
            return ContractType.POWERSPORTS_WAIVER;
        }

        return ContractType.STANDARD_RENTAL;
    }

    /**
     * Generates the specific Liability Waiver for Powersports.
     * Focuses on Bodily Injury Risk and Safety Equipment.
     */
    private static generateLiabilityWaiver(listing: Listing): string {
        const vehicleType = listing.subcategory || listing.category;
        
        return `
            <div class="space-y-6 text-gray-800">
                <div>
                    <h3 class="font-bold text-red-700 text-lg uppercase border-b-2 border-red-200 pb-1 mb-2">I. EXPRESS ASSUMPTION OF RISK</h3>
                    <p>The Renter acknowledges that operating a <strong>${vehicleType}</strong> is an inherently dangerous activity. Risks include, but are not limited to: collisions with other vehicles or stationary objects, overturning, ejection from the vehicle, drowning, and severe bodily injury, paralysis, or death. The Renter voluntarily assumes ALL such risks, known and unknown, even if arising from the negligence of others.</p>
                </div>
                
                <div>
                    <h3 class="font-bold text-red-700 text-lg uppercase border-b-2 border-red-200 pb-1 mb-2">II. MANDATORY SAFETY GEAR & "KILL SWITCH"</h3>
                    <p>The Renter certifies they have received a safety briefing from the Owner. The Renter agrees to wear a USCG-approved Personal Flotation Device (Life Vest) or DOT-approved helmet AT ALL TIMES. Crucially, the Renter agrees to properly attach the engine cut-off switch lanyard ('kill cord') to their person at all times while operating the vehicle.</p>
                </div>

                <div>
                    <h3 class="font-bold text-red-700 text-lg uppercase border-b-2 border-red-200 pb-1 mb-2">III. UNQUALIFIED RELEASE</h3>
                    <p>The Renter hereby releases, waives, and discharges the Owner and Goodslister from any and all claims for damages for death, personal injury, or property damage which they may have, or which may hereafter accrue to them, as a result of using the equipment.</p>
                </div>

                <div>
                    <h3 class="font-bold text-red-700 text-lg uppercase border-b-2 border-red-200 pb-1 mb-2">IV. ZERO TOLERANCE ALCOHOL/DRUGS POLICY</h3>
                    <p>Operation of the equipment under the influence of alcohol, marijuana, or illegal drugs is strictly prohibited and constitutes a material breach of this agreement. The Owner reserves the right to terminate the rental immediately without refund and retain the full security deposit if intoxication is suspected.</p>
                </div>
            </div>
        `;
    }

    /**
     * Generates the Florida Bareboat Rental Agreement.
     * Based on the provided PDF text with dynamic replacements.
     */
    private static generateFloridaBareboatContract(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number): string {
        const hostName = listing.owner.name.toUpperCase();
        // FIX: Escaped the 'on' string literal using single quotes inside the format string.
        // date-fns treats 'o' as ordinal number token, causing errors if not escaped.
        const startStr = format(startDate, "h:mm aa 'on' MMM dd, yyyy");
        const endStr = format(endDate, "h:mm aa 'on' MMM dd, yyyy");
        const vesselDescription = `${listing.title} (${listing.subcategory || 'Vessel'})`.toUpperCase();
        const cruisingArea = `${listing.location.city}, ${listing.location.state} and surrounding coastal waters`;
        const maxGuests = "As per USCG Capacity Plate"; // Default if not in listing data
        const securityDeposit = listing.securityDeposit ? `$${listing.securityDeposit.toFixed(2)}` : "$0.00";

        // Insurance Disclaimer Logic (Clause 15 Modification)
        let insuranceDisclaimer = "";
        if (!listing.hasCommercialInsurance) {
            insuranceDisclaimer = `
                <div style="border: 2px solid red; padding: 10px; margin: 10px 0; background-color: #fff5f5;">
                    <strong style="color: red;">IMPORTANT DISCLAIMER:</strong> 
                    RENTER ACKNOWLEDGES THAT THE VESSEL MAY NOT CARRY COMMERCIAL HULL INSURANCE. 
                    RENTER ASSUMES FULL FINANCIAL RESPONSIBILITY FOR ALL DAMAGE TO THE VESSEL.
                </div>
            `;
        }

        return `
            <div class="legal-contract font-serif text-sm leading-relaxed text-justify">
                <div class="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 class="text-2xl font-bold uppercase tracking-wide">Recreational Bareboat Rental Agreement</h1>
                    <p class="text-sm font-bold mt-2 text-gray-600">FLORIDA EDITION</p>
                </div>

                <div class="grid grid-cols-1 gap-4 mb-6 bg-gray-50 p-4 rounded border border-gray-200">
                    <div class="grid grid-cols-3 gap-2">
                        <span class="font-bold uppercase text-xs text-gray-500">Owner ("OWNER")</span>
                        <span class="col-span-2 font-bold">${hostName}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <span class="font-bold uppercase text-xs text-gray-500">Renter ("RENTER")</span>
                        <span class="col-span-2 font-bold">${renter.name}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <span class="font-bold uppercase text-xs text-gray-500">Vessel</span>
                        <span class="col-span-2 font-bold">${vesselDescription}</span>
                    </div>
                </div>

                <div class="mb-6 p-4 border border-gray-300 rounded">
                    <h3 class="font-bold uppercase border-b border-gray-300 mb-2 pb-1">Rental Particulars</h3>
                    <p><strong>Rental Period:</strong> From ${startStr} to ${endStr}</p>
                    <p><strong>Cruising Area:</strong> ${cruisingArea}</p>
                    <p><strong>Maximum Number of Guests:</strong> ${maxGuests}</p>
                    <p><strong>Rental Fee:</strong> $${totalPrice.toFixed(2)}</p>
                    <p><strong>Security Deposit:</strong> ${securityDeposit}</p>
                </div>

                <div class="space-y-4">
                    <div>
                        <h4 class="font-bold">1. AGREEMENT TO LET AND HIRE.</h4>
                        <p>A. The OWNER agrees to rent the Vessel to the RENTER and not to enter into any other agreement for the Rental of the Vessel for the same period.</p>
                        <p>B. The RENTER agrees to hire the Vessel and shall pay the Rental Fee, the Security Deposit (if any), and any other agreed charges.</p>
                    </div>

                    <div>
                        <h4 class="font-bold">2. DELIVERY.</h4>
                        <p>A. At the beginning of the Rental Period, the OWNER shall deliver the Vessel at the place of delivery agreed by the parties, and the RENTER shall take delivery of the Vessel, in full commission and working order, seaworthy, clean, in good condition throughout, with tanks filled and ready for service, with all equipment required by the U.S. Coast Guard and the Vessel’s flag state.</p>
                    </div>

                    <div>
                        <h4 class="font-bold">3. RE-DELIVERY.</h4>
                        <p>The RENTER shall Re-Deliver the Vessel to the OWNER at the place of delivery free of any debts incurred by the RENTER and in as good a condition as when delivery was taken, except for fair wear and tear arising from ordinary use.</p>
                    </div>

                    <div>
                        <h4 class="font-bold text-red-800">6. RENTER'S AUTHORITY AND RESPONSIBILITIES (DEMISE CLAUSE).</h4>
                        <p class="font-semibold bg-yellow-50 p-2 border-l-4 border-yellow-400">
                            A. This Agreement constitutes a demise rental of the Vessel to the RENTER under the maritime law of the United States. Therefore, the OWNER shall deliver and, during the Rental Period, the RENTER shall accept, full possession, command, and navigation of the Vessel. In addition, the RENTER shall furnish its own crew and pay expenses and operating costs as provided in Clause 8.
                        </p>
                        <p>B. If the RENTER chooses to utilize the services of a captain, the RENTER represents and warrants that such captain will be qualified and, if necessary, licensed, provided that the RENTER shall remain responsible for the operation and management of the Vessel.</p>
                    </div>

                    <div>
                        <h4 class="font-bold">14. INSURANCE.</h4>
                        <p>A. The OWNER shall insure the Vessel throughout the Rental Period with first-class insurers against all risks... The OWNER shall make available for inspection copies of all relevant insurance documentation.</p>
                        ${insuranceDisclaimer}
                        <p>B. The RENTER acknowledges that it is the RENTER’s responsibility to determine, in its sole discretion, whether such insurance coverage, terms, and applicable deductibles are adequate and appropriate for the RENTER’s purposes.</p>
                    </div>

                    <div>
                        <h4 class="font-bold">15. SECURITY DEPOSIT.</h4>
                        <p>Any required Security Deposit will be held by OWNER (or Goodslister) and may be used in, or towards, discharging any liability that the RENTER may incur under any of the provisions of this Agreement. To the extent that the Security Deposit is not so used, then it will be refunded to the RENTER without interest, within <strong>48 hours</strong> after the end of the Rental Period or the settlement of all outstanding questions, whichever occurs later.</p>
                    </div>

                    <div class="mt-8 pt-4 border-t-2 border-gray-400">
                        <h4 class="font-bold text-lg mb-2">23. WAIVER AND RELEASE OF LIABILITY AGREEMENT – FLORIDA.</h4>
                        <div class="text-xs bg-gray-100 p-3 rounded border border-gray-200">
                            <p class="mb-2"><strong>DISCLAIMER</strong> – This Waiver and Release Agreement (the “Release”) is applicable to all renters, operators, passengers, and users of equipment provided by ${hostName}.</p>
                            
                            <p class="mb-2"><strong>24. ACKNOWLEDGEMENT OF RISKS</strong></p>
                            <p class="mb-2">The RENTER hereby acknowledges that some, but not all of the risks of participating in watersport activities include: 1) changing water flow, tides, currents, wave action and ships’ wakes; 2) collisions with any of the following: other participants, the vessel, other vessels, and manmade or natural objects; 3) collision, capsizing, sinking or other hazard which results in wetness, injury, expose to the elements, hypothermia, drowning and/or death.</p>

                            <p class="mb-2"><strong>25. EXPRESS ASSUMPTION OF RISK</strong></p>
                            <p class="mb-2">The RENTER herby agrees that he/she is renting, operating, or using the equipment provided by ${hostName} at his/her own risk. The RENTER assumes full responsibility for the risks of personal injury, accidents or illness, including but not limited to sprains, torn muscles and/or ligaments; fracture or broken bones; eye damage; cuts, wounds, scrapes, abrasions, and/or contusions; head, neck, and/or spinal injuries; animal or insect bite or attack; shock, paralysis, drowning, and/or death.</p>

                            <p class="mb-2"><strong>26. WAIVER/RELEASE OF LIABILITY</strong></p>
                            <p class="mb-0">By the execution of this Release, the RENTER voluntarily releases, forever discharges and agrees to indemnify and hold harmless ${hostName} and Goodslister from any and all liability of any nature for any and all injury or damage arising from personal injuries sustained by the RENTER or any minor children under the RENTER’s custody, care, and control, as a result of any and all activities related to the rental, operation, or use of equipment provided by ${hostName} regardless of the cause. EVEN IN THE EVENT OF NEGLIGENCE OR FAULT BY ${hostName}.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    public static generateContractHtml(listing: Listing, renter: User, startDate: Date, endDate: Date, totalPrice: number): string {
        const contractType = this.getContractType(listing);
        const dateStr = format(new Date(), 'MMMM do, yyyy');
        const startStr = format(startDate, 'MMM dd, yyyy');
        const endStr = format(endDate, 'MMM dd, yyyy');

        // BAREBOAT / FLORIDA BOAT RENTAL LOGIC
        if (contractType === ContractType.BAREBOAT) {
            return this.generateFloridaBareboatContract(listing, renter, startDate, endDate, totalPrice);
        }

        // Header Logic for other contracts
        let headerTitle: string = contractType;
        if (contractType === ContractType.POWERSPORTS_WAIVER) {
            headerTitle = "RISK WARNING, WAIVER AND RELEASE OF LIABILITY, AND INDEMNIFICATION AGREEMENT";
        }

        const header = `
            <div class="text-center mb-8">
                <h1 class="text-2xl font-black uppercase tracking-tight text-gray-900 leading-tight">${headerTitle}</h1>
                <p class="text-sm text-gray-500 mt-2 font-mono">Generated by Goodslister Legal Center on ${dateStr}</p>
            </div>
            <div class="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200 text-sm shadow-sm">
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <p class="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Lessor (Owner)</p>
                        <p class="font-medium text-gray-900 text-base">${listing.owner.name}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Lessee (Renter)</p>
                        <p class="font-medium text-gray-900 text-base">${renter.name}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Item</p>
                        <p class="font-medium text-gray-900 text-base">${listing.title}</p>
                        <p class="text-xs text-gray-500">${listing.category} ${listing.subcategory ? `/ ${listing.subcategory}` : ''}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Rental Period</p>
                        <p class="font-medium text-gray-900 text-base">${startStr} - ${endStr}</p>
                    </div>
                </div>
            </div>
        `;

        let body = '';

        // Switcher Logic for other types
        switch (contractType) {
            case ContractType.POWERSPORTS_WAIVER:
                body = this.generateLiabilityWaiver(listing);
                break;

            default: // STANDARD
                body = `
                    <div class="space-y-6 text-gray-800">
                        <div>
                            <h3 class="font-bold text-lg uppercase mb-2">1. CONDITION OF EQUIPMENT</h3>
                            <p>The Renter acknowledges receiving the equipment in good working order and agrees to return it in the same condition, ordinary wear and tear excepted.</p>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg uppercase mb-2">2. RESPONSIBILITY FOR LOSS</h3>
                            <p>The Renter is responsible for the full replacement cost of the equipment if lost or stolen during the rental period.</p>
                        </div>
                    </div>
                `;
                break;
        }

        const commonClauses = `
            <div class="mt-10 pt-6 border-t-2 border-gray-100">
                <h3 class="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Additional Terms</h3>
                <div class="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
                    <p><strong>SECURITY DEPOSIT:</strong> A security deposit of <strong>$${listing.securityDeposit || 0}</strong> is held by Goodslister to cover potential damages.</p>
                    <p class="mt-2"><strong>INDEMNIFICATION:</strong> The Renter agrees to indemnify and hold harmless the Owner and Goodslister from any claims arising out of the use of the rented item.</p>
                </div>
            </div>
        `;

        const footerPolicy = `
            <div class="mt-8 pt-4 border-t-4 border-gray-200">
                <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Terms of Service Snapshot</h4>
                <div class="bg-gray-100 p-4 rounded-md border border-gray-200 text-xs text-gray-700 font-mono leading-relaxed">
                    <ul class="space-y-2 list-disc list-inside">
                        <li><strong class="text-gray-900">CLAIMS:</strong> Damages must be reported within 48 hours of return. Late claims are void.</li>
                        <li><strong class="text-gray-900">PRIVACY:</strong> Inspection photos are permanently deleted from our servers 72 hours after the rental ends. Owners must download evidence immediately if damage is suspected.</li>
                    </ul>
                </div>
            </div>
        `;

        return header + body + commonClauses + footerPolicy;
    }
}
