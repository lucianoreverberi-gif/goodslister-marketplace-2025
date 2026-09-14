import { sql } from '@vercel/postgres';
import { put, head } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import PDFDocument from 'pdfkit';

const BRAND_COLOR = '#0891b2'; // cyan-600
const GRAY_TEXT = '#4b5563'; // gray-600
const DARK_TEXT = '#111827'; // gray-900

function formatDate(dateStr: string | Date): string {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(amount: number | string | null | undefined): string {
    const n = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return `$${n.toFixed(2)}`;
}

// =========================================================================
// Category-specific legal data (mirrored from components/BookingLegalModal)
// =========================================================================

interface CategoryLegal {
    label: string;
    annexPath: string;
    isMotorized: boolean;
    safetyEquipment: string[];
    eligibility: string[];
    criticalRisks: string[];
    keyNote?: string;
    flStatutes?: string[];
}

const CATEGORY_LEGAL: Record<string, CategoryLegal> = {
    MOTORCYCLES: {
        label: 'Motorcycles',
        annexPath: '/#legalAnnexMotorcycles',
        isMotorized: true,
        safetyEquipment: [
            'DOT-approved helmet (contractually required for ALL riders regardless of any Florida adult helmet exemption)',
            'Eye protection (goggles or full-face shield)',
            'Long pants and closed-toe boots covering the ankle',
            'Abrasion-resistant jacket or riding gear (recommended)',
        ],
        eligibility: [
            'Valid motorcycle endorsement (Fla. Stat. § 322.03) or equivalent from home state',
            'Minimum 21 years old (or as set by listing)',
            'No DUI or reckless driving convictions in the last 5 years',
        ],
        criticalRisks: [
            'Serious injury or DEATH — motorcycles have far higher fatality per mile than cars',
            'Traumatic brain injury even with helmet',
            'Road rash, amputation, spinal cord injury, paralysis',
            'Being struck by a car whose driver fails to see you (esp. at intersections)',
            'Burns from hot exhaust pipes, fuel fire',
            'Loss of control on sand, gravel, painted lines, wet or oily pavement',
        ],
        keyNote: 'DOT-approved helmet is contractually required for ALL riders regardless of any Florida adult helmet exemption.',
        flStatutes: ['Fla. Stat. § 322.03 (motorcycle endorsement)', 'Fla. Stat. § 316.211 (helmet law + $10,000 medical coverage exemption)'],
    },
    BIKES: {
        label: 'Bikes',
        annexPath: '/#legalAnnexBikes',
        isMotorized: false,
        safetyEquipment: ['Helmet (STRONGLY recommended, required if under 16)', 'Front and rear lights if riding at night', 'Reflective clothing at night'],
        eligibility: ['Minimum 12 years old with parental supervision; 16+ for solo rental', 'For e-bikes: valid state ID (18+ for Class 3 e-bikes)'],
        criticalRisks: [
            'Being struck by cars, trucks, or buses (especially at intersections)',
            'Head injury, traumatic brain injury, facial injury even with helmet',
            'Falls from potholes, gravel, sand, wet leaves, painted lines',
            'Brake failure, tire blowout, chain or drivetrain failure',
            'For e-bikes: heavier + faster than regular bikes, longer braking distance',
            'Lithium battery overheating (never charge unattended)',
        ],
    },
    BOATS: {
        label: 'Boats & Vessels',
        annexPath: '/#legalAnnexBoats',
        isMotorized: true,
        safetyEquipment: [
            'USCG-approved life jacket (PFD) for every person on board (Fla. Stat. § 327.50)',
            'Type IV throwable PFD for vessels 16 ft or longer',
            'Fire extinguisher, distress signals, and visual/audible signaling devices',
            'Carbon monoxide detector (mandatory for enclosed cabins)',
        ],
        eligibility: [
            'Valid Florida Boating Safety ID card if born after January 1, 1988 (Fla. Stat. § 327.395)',
            'Minimum 21 years old (or as set by listing)',
            'For chartered vessels: USCG captain\'s license required',
        ],
        criticalRisks: [
            'DROWNING — including after falling overboard, capsizing, or loss of consciousness',
            'Propeller strike causing laceration, amputation, and DEATH',
            'Carbon monoxide poisoning from engine, generator, or station-wagon effect',
            'Sudden storms, waterspouts, squalls, and building seas',
            'Hypothermia even in Florida waters; grounding, sinking, fire',
            'Collision with vessels, docks, pilings, channel markers, sandbars, reefs',
        ],
        keyNote: 'Valid Florida Boating Safety ID required if born after Jan 1, 1988. Help may be hours away.',
        flStatutes: ['Fla. Stat. § 327.395 (Boater Safety ID)', 'Fla. Stat. § 327.50 (USCG equipment)', 'Fla. Stat. § 327.54 (livery — Lister obligations)'],
    },
    CAMPING: {
        label: 'Camping Equipment',
        annexPath: '/#legalAnnexCamping',
        isMotorized: false,
        safetyEquipment: ['Fire extinguisher for stove/grill use', 'Carbon monoxide detector inside any enclosed sleeping area', 'First aid kit', 'Water purification method for remote camps'],
        eligibility: ['18+ years old; 21+ for backcountry / remote trips', 'Basic outdoor first-aid knowledge recommended'],
        criticalRisks: [
            'Carbon monoxide poisoning and DEATH from heaters, stoves, grills, generators in enclosed spaces',
            'Fire, burns, and explosion from propane, butane, campfires, lanterns',
            'Lithium battery thermal runaway, fire, and toxic smoke',
            'Falls from roof top tent or ladder (esp. at night)',
            'Wildlife encounters: bears, snakes, alligators, insect-borne illness',
            'Remote locations with delayed emergency response (measured in hours)',
        ],
        keyNote: 'NEVER run any fuel-burning appliance inside a tent, vehicle, trailer, or enclosed space.',
    },
    WINTER_SPORTS: {
        label: 'Winter Sports',
        annexPath: '/#legalAnnexWinterSports',
        isMotorized: false,
        safetyEquipment: ['Certified snow-sports helmet (ASTM F2040 or CE EN 1077)', 'Goggles rated for ambient conditions', 'Properly fitted boots with bindings adjusted and tested to your specs'],
        eligibility: ['13+ years old with parent-approved lesson history; 18+ for solo rental', 'Self-declared skill level matching terrain (beginner/intermediate/advanced)'],
        criticalRisks: [
            'Serious injury, paralysis, and DEATH from falls and collisions',
            'Collision with trees, lift towers, rocks, other skiers/riders',
            'Traumatic brain injury even with helmet',
            'Knee ligament injury, ACL tear, wrist/clavicle fracture',
            'Binding failure to release, or premature release',
            'Hidden obstacles, tree wells, deep snow immersion suffocation, avalanche',
        ],
        keyNote: 'YOU are solely responsible for having bindings professionally adjusted and tested to your specs before use.',
    },
    WATER_SPORTS: {
        label: 'Water Sports',
        annexPath: '/#legalAnnexWaterSports',
        isMotorized: false,
        safetyEquipment: ['USCG-approved PFD (life jacket) — mandatory even for strong swimmers', 'Leash (for surf/SUP/kite)', 'Impact vest recommended for tow sports', 'Whistle for signaling'],
        eligibility: ['You must be able to swim competently', 'Kitesurf / Wingfoil NOT available to beginners without a certified instructor', 'Age minimums vary by discipline (typically 14+ SUP/surf, 18+ kite/foil)'],
        criticalRisks: [
            'DROWNING — including after impact, entanglement, or exhaustion',
            'Being carried out by rip current, tide, wind, or offshore drift',
            'For Jet Ski: propeller strike causing amputation; orifice injury from jet thrust',
            'For hydrofoils: exceptionally sharp equipment causing severe lacerating injury',
            'Kite: being lofted, dragged, or slammed; line injury and strangulation',
            'Sudden squalls, lightning, unforecast weather; marine animal injury',
        ],
        keyNote: 'You must be able to swim competently. Kitesurf/Wingfoil not available to beginners without an instructor.',
    },
    RVS: {
        label: 'RVs',
        annexPath: '/#legalAnnexRVs',
        isMotorized: true,
        safetyEquipment: ['Working smoke detector, carbon monoxide detector, and LP-gas leak detector', 'Fire extinguisher (minimum 1 per class per RV size)', 'Wheel chocks and leveling blocks'],
        eligibility: ['25+ years old (industry standard) or 21+ with additional deposit', 'Valid driver\'s license appropriate for RV class (some Class A RVs require CDL depending on GVWR)', 'No moving violations in the last 3 years'],
        criticalRisks: [
            'Rollover from high center of gravity, especially in crosswind or emergency swerve',
            'Trailer sway, jackknife, and total loss of control at highway speed',
            'Overhead clearance strikes on bridges, canopies, drive-throughs, tree limbs',
            'Tire blowout on a heavy vehicle causing immediate loss of control',
            'Propane leak, fire, and explosion; refrigerator or wiring fire',
            'Carbon monoxide poisoning from generator, furnace, or engine while sleeping',
        ],
        keyNote: 'RV drives, turns, stops, and reacts to wind completely differently from a car. Plan your route for height, length, weight.',
        flStatutes: ['Fla. Stat. § 627.7483 (RV liability considerations)'],
    },
    ATVS_UTVS: {
        label: 'ATVs & UTVs',
        annexPath: '/#legalAnnexATVs',
        isMotorized: true,
        safetyEquipment: ['DOT-approved helmet + goggles (MANDATORY)', 'Long-sleeve shirt and pants, over-the-ankle boots, gloves', 'Chest protector recommended for high-speed use'],
        eligibility: ['Minimum 16 years old with parent/guardian present for under-18', '18+ for solo rental', 'ATV Safety Institute (ASI) certification recommended'],
        criticalRisks: [
            'Rollover (common due to high center of gravity + unstable terrain)',
            'Ejection, collision, impact with trees or fixed objects',
            'Terrain hazards: hidden holes, logs, rocks, ruts',
            'Drowning from water crossings',
            'Helmet failure; mechanical failure',
            'Serious injury or DEATH',
        ],
        keyNote: 'PROHIBITED on Florida public roads/highways (Fla. Stat. § 316.2074). Operate only on private property or designated OHV areas.',
        flStatutes: ['Fla. Stat. § 316.2074 (ATV/UTV — NOT street-legal on public roads)'],
    },
    PWC: {
        label: 'Personal Watercraft',
        annexPath: '/#legalAnnexPWC',
        isMotorized: true,
        safetyEquipment: [
            'USCG-approved life jacket (PFD) for every rider (Fla. Stat. § 327.50)',
            'Neoprene/wetsuit bottoms MANDATORY to prevent orifice injury from jet thrust',
            'Kill-switch lanyard attached to wrist or PFD at all times',
            'Whistle or signaling device',
            'Eye protection recommended for high-speed operation',
        ],
        eligibility: [
            'Valid Florida Boating Safety ID card if born after January 1, 1988 (Fla. Stat. § 327.395)',
            'Minimum 14 years old for solo operation of PWC (Fla. Stat. § 327.39)',
            'No PWC operation between 30 min after sunset and 30 min before sunrise (Fla. Stat. § 327.39)',
        ],
        criticalRisks: [
            'DROWNING — including after ejection, capsize, or loss of consciousness',
            'Propeller strike causing amputation, laceration, and DEATH',
            'Orifice injury from jet thrust (rectal, vaginal, throat) — wetsuit bottoms mandatory',
            'Collision at high speed with other vessels, docks, swimmers, or floating objects',
            'Ejection at speed causing spine, neck, or head injury',
            'Getting lost, running out of fuel, engine failure far from shore',
        ],
        keyNote: 'Neoprene bottoms + kill-switch lanyard are contractually required. Never operate a PWC at night. Help may be hours away offshore.',
        flStatutes: ['Fla. Stat. § 327.39 (PWC operation — age + hours)', 'Fla. Stat. § 327.395 (Boater Safety ID)', 'Fla. Stat. § 327.50 (USCG equipment)'],
    },
    ELECTRIC_RIDEABLES: {
        label: 'Electric Rideables',
        annexPath: '/#legalAnnexElectricRideables',
        isMotorized: true,
        safetyEquipment: [
            'Certified helmet MANDATORY (bicycle helmet minimum; multi-impact rated preferred)',
            'Wrist guards, knee and elbow pads STRONGLY recommended',
            'Reflective clothing + front/rear lights for any low-light or night riding',
            'Closed-toe shoes with grip',
        ],
        eligibility: [
            'Minimum 18 years old for solo rental',
            'For One Wheel: prior experience or written acknowledgment of "nose dive" risk',
            'No riding while impaired by alcohol, drugs, or prescription medication',
        ],
        criticalRisks: [
            'High-speed falls causing TBI, road rash, and DEATH',
            'For One Wheel: "nose dive" if speed exceeds motor capacity — sudden pitch forward, no warning',
            'Sudden loss of control from software errors, motor cut-outs, or battery drops',
            'Collision with cars, curbs, pedestrians, or fixed obstacles',
            'Being struck by a car — low visibility profile, especially at night',
            'Lithium battery thermal runaway and fire, especially during or after charging',
        ],
        keyNote: 'Never ride above the manufacturer speed rating. Never charge the battery unattended or overnight. If the battery smells odd, swells, or feels hot, stop use immediately.',
    },
    FISHING: {
        label: 'Fishing Gear',
        annexPath: '/#legalAnnexFishing',
        isMotorized: false,
        safetyEquipment: [
            'Sun protection: hat, polarized sunglasses (also protects from hooks), SPF 30+ sunscreen',
            'PFD if using kayak or boat (mandatory)',
            'First aid kit (hook injuries common)',
            'Barbless hooks recommended for beginners; pliers to remove hooks',
        ],
        eligibility: [
            'Valid Florida fishing license required if 16+ (Fla. Stat. § 379.354)',
            'Freshwater and saltwater licenses are separate — verify what your outing needs',
            'Follow FL bag, size, and season limits (violation is a criminal offense)',
        ],
        criticalRisks: [
            'Hook injury to hands, eyes, and face — treble hooks are particularly dangerous',
            'Fishing line entanglement causing lacerations, finger loss, or drowning from a watercraft',
            'If kayak/boat fishing: capsize, drowning, hypothermia',
            'Sun exposure, heat stroke, dehydration during long outings',
            'Wildlife: barracuda, sharks, jellyfish, stingrays, alligators, snakes',
            'Lightning strikes during Florida afternoon storms while on open water',
        ],
        keyNote: 'Valid Florida fishing license required. Follow all bag and size limits — violations carry criminal penalties and equipment forfeiture.',
        flStatutes: ['Fla. Stat. § 379.354 (fishing license)', 'Fla. Stat. § 379.401 (bag + size limits)', 'Fla. Stat. § 379.502 (restricted / prohibited species)'],
    },
    DIVING: {
        label: 'Diving & Snorkeling',
        annexPath: '/#legalAnnexDiving',
        isMotorized: false,
        safetyEquipment: [
            'Certified BCD (Buoyancy Compensator) that fits the diver',
            'Serviced regulator and octopus (annual service required)',
            'Dive computer or depth gauge + timer + submersible pressure gauge',
            'Dive flag (red with white diagonal stripe) — REQUIRED under FL law (Fla. Stat. § 327.331)',
            'Signaling device (surface marker buoy, whistle)',
        ],
        eligibility: [
            'PADI/NAUI/SSI Open Water certification MANDATORY for scuba — no exceptions',
            'Minimum age varies by certification agency (typically 10+ Junior, 15+ Open Water)',
            'Physical fitness self-declaration; no diving within 24 hours of flying',
            'Snorkeling: no certification required but must be a competent swimmer',
        ],
        criticalRisks: [
            'DECOMPRESSION SICKNESS ("the bends") — DEATH, paralysis, nervous system damage',
            'DROWNING from equipment failure, panic, entanglement, or being trapped underwater',
            'Arterial gas embolism from ascending too quickly with a full breath — DEATH',
            'Ear and sinus barotrauma from improper equalization',
            'Marine life encounters: sharks, moray eels, stingrays, jellyfish, fire coral',
            'For deep dives: nitrogen narcosis causing impaired judgment; running out of air',
        ],
        keyNote: 'Never dive alone. Follow safe ascent rate (max 30 ft/min) and safety stops. Fly a dive flag; boat traffic must stay clear. If in doubt about a condition, do NOT dive.',
        flStatutes: ['Fla. Stat. § 327.331 (dive flag required)', 'Fla. Admin. Code 68B-46 (scuba spearfishing regulations)'],
    },
};

function getCategoryLegal(category: string | undefined): CategoryLegal | null {
    if (!category) return null;
    const key = String(category).toUpperCase().replace(/\s+/g, '_');
    return CATEGORY_LEGAL[key] || null;
}

async function autoInitColumns() {
    try {
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS brand TEXT`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS model TEXT`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS full_address TEXT`;
    } catch (e) {
        console.warn('autoInitColumns error (may already exist):', e);
    }
}

async function generatePdfBuffer(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ========== HEADER ==========
        doc.fillColor(BRAND_COLOR).fontSize(24).font('Helvetica-Bold').text('GOODSLISTER', { align: 'center' });
        doc.fillColor(GRAY_TEXT).fontSize(10).font('Helvetica').text('Rental Agreement', { align: 'center' });
        doc.moveDown(0.5);
        doc.strokeColor(BRAND_COLOR).lineWidth(2).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown(1);

        doc.fillColor(DARK_TEXT).fontSize(11).font('Helvetica-Bold').text(`Agreement ID: ${data.booking.id}`);
        doc.font('Helvetica').text(`Effective Date: ${formatDate(new Date())}`);
        doc.moveDown(1);

        let sectionCounter = 0;
        const section = (title: string) => {
            sectionCounter++;
            doc.moveDown(0.8);
            doc.fillColor(BRAND_COLOR).fontSize(13).font('Helvetica-Bold').text(`${sectionCounter}. ${title}`);
            doc.fillColor(DARK_TEXT).fontSize(10).font('Helvetica').moveDown(0.3);
        };
        const bullet = (line: string) => {
            doc.fillColor(GRAY_TEXT).text('  •  ' + line, { align: 'left' });
        };
        const catLegal = getCategoryLegal(data.listing?.category);
        const field = (label: string, value: string) => {
            doc.font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(value);
        };

        // ========== SECTION 1: PARTIES ==========
        section('Parties');
        doc.font('Helvetica-Bold').text('HOST');
        field('Name', data.host.name || 'N/A');
        field('Email', data.host.email || 'N/A');
        field('Identity Verified', data.host.identity_verified ? 'Yes' : 'No');
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('RENTER');
        field('Name', data.renter.name || 'N/A');
        field('Email', data.renter.email || 'N/A');
        field('Identity Verified', data.renter.identity_verified ? 'Yes' : 'No');

        // ========== SECTION 2: ITEM IDENTIFICATION (expanded) ==========
        section('Item Identification');
        field('Listing Title', data.listing.title || 'N/A');
        field('Category', `${data.listing.category || 'N/A'}${data.listing.subcategory ? ` / ${data.listing.subcategory}` : ''}`);
        if (data.listing.brand) field('Brand', data.listing.brand);
        if (data.listing.model) field('Model', data.listing.model);
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text('Pickup/Return Address:');
        doc.font('Helvetica').text(
            data.listing.full_address ||
            `${data.listing.location_city || 'N/A'}, ${data.listing.location_state || 'N/A'}${data.listing.location_country ? `, ${data.listing.location_country}` : ''} (city-level — full address not provided)`
        );

        // ========== NEW SECTION: CATEGORY-SPECIFIC SAFETY & ELIGIBILITY ==========
        if (catLegal) {
            section(`Category-Specific Safety & Eligibility — ${catLegal.label}`);
            doc.font('Helvetica-Bold').fillColor(DARK_TEXT).text('Safety equipment required:');
            doc.font('Helvetica').fillColor(GRAY_TEXT);
            for (const item of catLegal.safetyEquipment) bullet(item);
            doc.moveDown(0.4);
            doc.font('Helvetica-Bold').fillColor(DARK_TEXT).text('Eligibility requirements:');
            doc.font('Helvetica').fillColor(GRAY_TEXT);
            for (const item of catLegal.eligibility) bullet(item);
            if (catLegal.keyNote) {
                doc.moveDown(0.4);
                doc.fillColor('#b45309').font('Helvetica-Bold').fontSize(10).text('KEY REQUIREMENT: ', { continued: true }).font('Helvetica').text(catLegal.keyNote);
            }
        }

        // ========== SECTION: RENTAL PERIOD ==========
        section('Rental Period');
        field('Start Date', formatDate(data.booking.start_date));
        field('End Date', formatDate(data.booking.end_date));
        const startDate = new Date(data.booking.start_date);
        const endDate = new Date(data.booking.end_date);
        const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        field('Duration', `${durationDays} day(s)`);

        // ========== SECTION 4: FINANCIAL TERMS ==========
        section('Financial Terms');
        field('Total Rental Amount', formatCurrency(data.booking.total_price));
        field('Amount Paid Online', formatCurrency(data.booking.amount_paid_online));
        field('Balance Due On Site', formatCurrency(data.booking.balance_due_on_site));
        field('Payment Method', data.booking.payment_method || 'N/A');
        field('Security Deposit (Held on Card)', formatCurrency(data.booking.security_deposit));
        field('Platform Fee', '6% of total (included in Goodslister service)');

        // ========== SECTION 5: SECURITY DEPOSIT POLICY ==========
        section('Security Deposit Policy');
        doc.font('Helvetica').fontSize(10).fillColor(GRAY_TEXT).text(
            'The security deposit is authorized (held) on the Renter\'s payment method at booking. It is NOT charged unless damage is reported. The hold is automatically released 72 hours (3 days) after checkout if no damage claim is filed. Bank processing may take an additional 5-10 business days to reflect on the Renter\'s statement.',
            { align: 'justify' }
        );

        // ========== NEW SECTION: CRITICAL RISKS YOU ARE ASSUMING ==========
        if (catLegal) {
            section('Critical Risks You Are Assuming');
            doc.fillColor('#dc2626').font('Helvetica-Bold').fontSize(10).text('BY ACCEPTING THIS BOOKING, THE RENTER EXPRESSLY ACKNOWLEDGES THE FOLLOWING CATEGORY-SPECIFIC RISKS:');
            doc.moveDown(0.2);
            doc.fillColor(DARK_TEXT).font('Helvetica');
            for (const risk of catLegal.criticalRisks) bullet(risk);
            doc.moveDown(0.3);
            doc.fillColor(GRAY_TEXT).fontSize(9).font('Helvetica-Oblique').text(
                'This list is illustrative, NOT exhaustive. Additional risks are set out in the Category Annex and Master Rental Agreement. The Renter has read, understood, and assumes all such risks voluntarily.',
                { align: 'justify' }
            );
            doc.fontSize(10).font('Helvetica');
        }

        // ========== SECTION: HANDOFF PROTOCOL ==========
        section('Handoff Protocol');
        doc.fillColor(GRAY_TEXT).text(
            'Both Host and Renter must complete the handoff protocol at pickup AND return. This includes: (a) Upload 4-10 photos of the item\'s condition, (b) Confirm receipt/return with a digital signature (checkbox + timestamp + IP address). Failure to complete the handoff protocol may forfeit deposit protection and dispute rights.',
            { align: 'justify' }
        );

        // ========== NEW SECTION: DANGEROUS INSTRUMENTALITY NOTICE (motorized only) ==========
        if (catLegal && catLegal.isMotorized) {
            section('Dangerous Instrumentality Notice');
            doc.fillColor(DARK_TEXT).font('Helvetica').text(
                `Under Florida common law (see Aurbach v. Gallina, 753 So. 2d 60 (Fla. 2000)), the owner of a "dangerous instrumentality" ` +
                `— including motor vehicles, motorcycles, boats, RVs, and other motorized equipment — may be held vicariously liable ` +
                `for negligence in its operation, even by another person to whom the owner has entrusted the vehicle. `,
                { align: 'justify' }
            );
            doc.moveDown(0.3);
            doc.font('Helvetica-Bold').fillColor('#dc2626').text(
                'The Host (Lister) is on notice that renting this motorized ${catLegal.label} on Goodslister may expose the Host to vicarious liability for injuries or property damage caused by the Renter\'s use, in addition to the Renter\'s primary liability. Both parties are strongly advised to verify insurance coverage before handoff.',
                { align: 'justify' }
            );
            if (catLegal.flStatutes && catLegal.flStatutes.length > 0) {
                doc.moveDown(0.3);
                doc.fillColor(GRAY_TEXT).font('Helvetica-Oblique').fontSize(9).text('Applicable Florida statutes:');
                doc.font('Helvetica').fontSize(10);
                for (const stat of catLegal.flStatutes) bullet(stat);
            }
        }

        // ========== SECTION: DAMAGE CLAIMS ==========
        section('Damage Claims');
        doc.fillColor(GRAY_TEXT).text(
            'The Host must report any damage within 48 hours of checkout via the Goodslister platform, including photos, description, and claim amount (not exceeding the security deposit hold). The Renter is notified via email and has 48 hours to accept or dispute the claim. If accepted (or no response), funds are captured to the Host. If disputed, Goodslister admin reviews all evidence (photos from both parties, signatures, condition notes) and issues a fair, final decision.',
            { align: 'justify' }
        );

        // ========== SECTION 8: CANCELLATION ==========
        section('Cancellation');
        doc.fillColor(GRAY_TEXT).text(
            'Cancellation policies are set by the Host and displayed on the listing prior to booking. Eligible refunds are processed automatically via Stripe within 5-10 business days depending on the Renter\'s bank. If the Host cancels a confirmed booking, the Renter receives a full refund automatically.',
            { align: 'justify' }
        );

        // ========== SECTION 9: INSURANCE ==========
        section('Insurance');
        doc.fillColor(GRAY_TEXT).text(
            'The Host is responsible for maintaining valid insurance on the rental item, particularly for high-value equipment (vehicles, boats, jet skis, RVs, ATVs). Personal insurance of the Renter may apply for third-party damages. Goodslister LLC is NOT an insurance provider and does not guarantee coverage. Both parties are strongly advised to verify their respective insurance policies cover this rental transaction prior to handoff.',
            { align: 'justify' }
        );

        // ========== SECTION 10: LIABILITY & ASSUMPTION OF RISK (NEW - separated) ==========
        section('Liability & Assumption of Risk');
        doc.fillColor(GRAY_TEXT).text(
            'ASSUMPTION OF RISK: The Renter acknowledges that the use of adventure and recreational equipment (including but not limited to watercraft, motorcycles, ATVs, camping gear, sports equipment) involves inherent risks of physical injury, property damage, and, in extreme cases, death. The Renter voluntarily assumes all such risks arising from the use of the rented Item.',
            { align: 'justify' }
        );
        doc.moveDown(0.5);
        doc.text(
            'RENTER RESPONSIBILITY: The Renter is fully responsible for (a) any damage to the Item beyond normal wear and tear, (b) any injuries sustained by themselves, their passengers, or third parties during the rental period, (c) compliance with all applicable local, state, and federal laws (including licensing, age requirements, and safety equipment such as life jackets or helmets).',
            { align: 'justify' }
        );
        doc.moveDown(0.5);
        doc.text(
            'HOLD HARMLESS: To the maximum extent permitted by law, the Renter agrees to indemnify and hold harmless the Host and Goodslister LLC from any claims, damages, or legal actions arising from the Renter\'s use, misuse, or negligence with respect to the Item during the rental period. This clause does not waive claims arising from the Host\'s gross negligence or intentional misconduct.',
            { align: 'justify' }
        );

        // ========== SECTION 11: GOVERNING LAW ==========
        section('Governing Law');
        doc.fillColor(GRAY_TEXT).text(
            'This Agreement shall be governed by and construed in accordance with the laws of the State of Florida, USA. Any disputes not resolved through Goodslister\'s admin resolution process shall be subject to the exclusive jurisdiction of the courts located in Miami-Dade County, Florida.',
            { align: 'justify' }
        );

        // ========== SECTION 12: DIGITAL SIGNATURES ==========
        section('Digital Signatures');
        doc.fillColor(DARK_TEXT).font('Helvetica').text('Signatures below confirm acceptance of the terms in this agreement:');
        doc.moveDown(0.8);
        const sigY = doc.y;
        doc.strokeColor(DARK_TEXT).lineWidth(0.5)
            .moveTo(50, sigY + 30).lineTo(270, sigY + 30).stroke()
            .moveTo(310, sigY + 30).lineTo(530, sigY + 30).stroke();
        doc.fontSize(9).fillColor(GRAY_TEXT)
            .text('Host Signature', 50, sigY + 33, { width: 220 })
            .text('Renter Signature', 310, sigY + 33, { width: 220 });
        doc.text(`Name: ${data.host.name || ''}`, 50, sigY + 48, { width: 220 })
           .text(`Name: ${data.renter.name || ''}`, 310, sigY + 48, { width: 220 });
        doc.text('Date: _______________', 50, sigY + 63, { width: 220 })
           .text('Date: _______________', 310, sigY + 63, { width: 220 });

        // ========== NEW SECTION: REFERENCES TO FULL LEGAL DOCUMENTS ==========
        section('References to Full Legal Documents');
        doc.fillColor(GRAY_TEXT).font('Helvetica').text(
            'This agreement is a summary of the terms binding both parties. The full legal package (v2.0), which governs this rental in its entirety, is publicly available at goodslister.com and includes the following documents:',
            { align: 'justify' }
        );
        doc.moveDown(0.3);
        bullet('Universal Core (6 modules): Terms of Service, Privacy Policy, Cookie Policy, Community Guidelines, IP Policy, DMCA — https://goodslister.com/#legalTermsV2');
        bullet('Transactional Core (6 modules): Lister Agreement, Renter Agreement, Master Rental Agreement, Security Deposit & Damage Policy, Cancellation Policy, Assumption of Risk (General Part) — https://goodslister.com/#legalMasterAgreement');
        if (catLegal) {
            bullet(`Category Annex — ${catLegal.label}: full risk disclosure, eligibility, safety equipment, photographic checklist, Lister obligations — https://goodslister.com${catLegal.annexPath}`);
        }
        bullet('Insurance & Verification: https://goodslister.com/#insuranceDisclosure');
        bullet('Trust & Safety: https://goodslister.com/#trustSafety');
        bullet('Dispute Resolution: https://goodslister.com/#disputeResolution');
        doc.moveDown(0.3);
        doc.fillColor(GRAY_TEXT).font('Helvetica-Oblique').fontSize(9).text(
            'In the event of conflict between this summary and the full legal package, the full legal package controls.',
            { align: 'justify' }
        );
        doc.fontSize(10).font('Helvetica');

        // ========== DISCLAIMER (bottom) ==========
        doc.moveDown(3);
        doc.strokeColor(GRAY_TEXT).lineWidth(0.5).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fillColor(GRAY_TEXT).fontSize(8).font('Helvetica-Oblique').text(
            'DISCLAIMER: This is a template rental agreement provided by Goodslister LLC as a convenience for its users. It does not constitute legal advice. For legal counsel specific to your situation, consult a licensed attorney. Goodslister LLC is not a party to this agreement and makes no warranties regarding its enforceability. This agreement was generated automatically based on booking data as of the effective date.',
            { align: 'justify' }
        );
        doc.moveDown(0.5);
        doc.fontSize(8).font('Helvetica').text(
            `Generated by Goodslister on ${formatDate(new Date())} | goodslister.com | support@goodslister.com`,
            { align: 'center' }
        );

        doc.end();
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const bookingId = (req.method === 'POST' ? req.body?.bookingId : req.query?.bookingId) as string;
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

    try {
        // Auto-init new columns (idempotent)
        await autoInitColumns();

        const bookingQuery = await sql`
            SELECT * FROM bookings WHERE id = ${bookingId} LIMIT 1
        `;
        if (bookingQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        const booking = bookingQuery.rows[0];

        const listingQuery = await sql`
            SELECT * FROM listings WHERE id = ${booking.listing_id} LIMIT 1
        `;
        const listing = listingQuery.rows[0] || {};

        const hostQuery = await sql`
            SELECT id, name, email, identity_verified FROM users WHERE id = ${listing.owner_id} LIMIT 1
        `;
        const host = hostQuery.rows[0] || {};

        const renterQuery = await sql`
            SELECT id, name, email, identity_verified FROM users WHERE id = ${booking.renter_id} LIMIT 1
        `;
        const renter = renterQuery.rows[0] || {};

        // Always regenerate for now (skip Blob cache) so v2 improvements are visible on refresh
        const pdfBuffer = await generatePdfBuffer({ booking, listing, host, renter });
        const blobPath = `agreements/${bookingId}.pdf`;
        const uploaded = await put(blobPath, pdfBuffer, {
            access: 'public',
            contentType: 'application/pdf',
            addRandomSuffix: false,
            allowOverwrite: true,
        });

        return res.status(200).json({
            success: true,
            url: uploaded.url,
            filename: `Goodslister-Agreement-${bookingId}.pdf`,
        });
    } catch (error: any) {
        console.error('generate-agreement error:', error?.message, error?.stack);
        return res.status(500).json({
            error: 'Failed to generate agreement',
            details: error?.message || 'Unknown error',
        });
    }
}
