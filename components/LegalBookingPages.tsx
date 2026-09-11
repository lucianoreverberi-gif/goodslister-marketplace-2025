import React from 'react';

// ============================================================================
// GOODSLISTER LEGAL BOOKING PAGES — v2.0
// Transactional Core + 8 Category Annexes for per-booking acceptance
// All content is DRAFT pending Florida-licensed attorney review.
// ============================================================================

const LEGAL_VERSION = '2.0';
const LAST_UPDATED = 'September 11, 2026';

const LegalPageLayout: React.FC<{
    title: string;
    subtitle: string;
    metaDescription: string;
    accent?: 'cyan' | 'amber';
    children: React.ReactNode;
}> = ({ title, subtitle, metaDescription, accent = 'cyan', children }) => {
    React.useEffect(() => {
        document.title = `${title} - Goodslister`;
        const meta = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'description' }));
        meta.setAttribute('content', metaDescription);
        window.scrollTo(0, 0);
    }, [title, metaDescription]);

    const gradientClass = accent === 'amber' ? 'from-slate-900 to-amber-950' : 'from-slate-900 to-cyan-950';
    const accentColorClass = accent === 'amber' ? 'text-amber-400' : 'text-cyan-400';

    return (
        <div className="bg-white min-h-screen">
            <div className={`bg-gradient-to-br ${gradientClass} py-12 sm:py-16 text-white`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    <span className={`${accentColorClass} font-bold tracking-wider uppercase text-xs`}>Legal · Version {LEGAL_VERSION}</span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-3">{title}</h1>
                    <p className="text-gray-300 text-base sm:text-lg max-w-3xl">{subtitle}</p>
                    <p className="text-gray-400 text-sm mt-4">Last updated: {LAST_UPDATED}</p>
                </div>
            </div>
            <div className="bg-amber-50 border-b border-amber-200 py-3">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    <p className="text-amber-900 text-sm">
                        <strong>Draft notice:</strong> This document is pending final review by a Florida-licensed attorney. Terms may change before Goodslister's official launch.
                    </p>
                </div>
            </div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
                <div className="prose prose-slate max-w-none prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-gray-700 prose-strong:text-gray-900">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
    <section id={id} className="mb-8">
        <h2>{title}</h2>
        {children}
    </section>
);

// ============================================================================
// TRANSACTIONAL CORE — Applies to every booking (6 modules consolidated)
// ============================================================================
export const TransactionalCorePage: React.FC = () => (
    <LegalPageLayout
        title="Rental Agreement (Transactional Core)"
        subtitle="The 6 core documents that apply to every rental on Goodslister — Lister Agreement, Renter Agreement, Master Rental Agreement, Deposits & Damage, Cancellation, and Assumption of Risk."
        metaDescription="Goodslister Transactional Core - Lister Agreement, Renter Agreement, Master Rental Agreement, Security Deposit and Damage Policy, Cancellation Policy, Assumption of Risk (general)."
        accent="cyan"
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="lister-agreement" title="Module 07 — Lister Agreement">
            <p>By listing an Item, the Lister enters into this Lister Agreement with Goodslister LLC.</p>
            <h3>Representations and warranties</h3>
            <ul>
                <li>Lister owns the Item outright or has documented authority to rent it.</li>
                <li>The Item is registered, titled, insured, and legally rentable in Florida.</li>
                <li>The Item is in safe, functional, mechanically fit condition.</li>
                <li>All known defects, damage, or recalls have been disclosed in the listing.</li>
                <li>All photographs and descriptions are accurate and current.</li>
                <li>For vessels: Lister has obtained a Livery Operator Permit if required under Fla. Stat. § 327.54.</li>
                <li>For motor vehicles, RVs, and ATVs: Lister acknowledges receipt of the Florida Dangerous Instrumentality Notice.</li>
            </ul>
            <h3>Lister obligations</h3>
            <ul>
                <li>Deliver the Item at the agreed time and location in the described condition.</li>
                <li>Complete a Condition Report with photographs at check-in.</li>
                <li>Not misrepresent condition, capabilities, or history.</li>
                <li>Maintain all licenses, permits, and insurance required by law.</li>
                <li>Respond to Renter communications within reasonable time.</li>
                <li>Report incidents, damage, or safety concerns via the Platform within 24 hours.</li>
            </ul>
        </Section>

        <Section id="renter-agreement" title="Module 08 — Renter Agreement">
            <p>By booking an Item, the Renter enters into this Renter Agreement with Goodslister LLC.</p>
            <h3>Representations and warranties</h3>
            <ul>
                <li>Renter is at least 18 years old (or the higher age required by the applicable Category Annex).</li>
                <li>Renter possesses all licenses, endorsements, and certifications required to operate the Item (motorcycle endorsement, Florida Boating Safety ID, valid driver license, etc.).</li>
                <li>Renter is medically and mentally fit to operate the Item.</li>
                <li>Renter will not operate the Item under the influence of alcohol, drugs, or impairing medication.</li>
                <li>Renter has completed identity verification via Stripe Identity before the rental begins.</li>
            </ul>
            <h3>Renter obligations</h3>
            <ul>
                <li>Complete a live face verification at check-in.</li>
                <li>Sign the digital handover inspection, including all required photographs.</li>
                <li>Follow all rules specific to this Item's category (see Category Annex).</li>
                <li>Comply with all applicable federal, state, and local laws.</li>
                <li>Return the Item in substantially the same condition, excluding normal wear and tear.</li>
                <li>Report any damage, incident, or issue immediately via the Platform.</li>
                <li>Not sublet, transfer, or use the Item commercially unless expressly authorized.</li>
            </ul>
        </Section>

        <Section id="master-rental" title="Module 09 — Master Rental Agreement">
            <p>Each confirmed Booking creates a rental agreement <strong>directly between Lister and Renter</strong>. Goodslister LLC is not a party to the rental itself and acts as a marketplace facilitator only.</p>
            <h3>Formation</h3>
            <p>The Master Rental Agreement is formed at the moment the Booking is confirmed and payment authorization succeeds. It incorporates by reference: this Transactional Core, the applicable Category Annex, the Master Terms of Service, and the Assumption of Risk.</p>
            <h3>Rental period</h3>
            <p>The rental period runs from the agreed pickup time to the agreed return time as displayed in the Booking. Late returns are charged per the fee specified by the Lister in the listing, subject to platform-wide minimums and caps.</p>
            <h3>Ownership and title</h3>
            <p>Title to the Item never transfers to the Renter. Renter has a limited, temporary right to possess and use the Item for the rental period only, subject to all restrictions in this Agreement, the Category Annex, and applicable law.</p>
            <h3>Platform role and Section 230</h3>
            <p>Goodslister provides listing infrastructure, payment processing, identity verification, and dispute administration. Goodslister does not own, inspect, maintain, insure, operate, or supervise Items. Goodslister is entitled to the protections of Section 230 of the Communications Decency Act (47 U.S.C. § 230) for User-generated content.</p>
        </Section>

        <Section id="deposit-damage" title="Module 10 — Security Deposit & Damage Policy">
            <h3>Security deposit</h3>
            <p>A security deposit is held (not charged) on the Renter's payment method via Stripe from Booking confirmation until 24 hours after a clean return. Deposit ranges are set by category (see the applicable Category Annex).</p>
            <h3>Damage claims</h3>
            <p>The Lister must report damage within 24 hours of return, with timestamped photographs and description via the Platform. Goodslister reviews evidence from both parties (handover photos, return photos, EXIF metadata) and issues a non-binding administrative determination within 5 business days.</p>
            <h3>Charges</h3>
            <ul>
                <li>Damage below the deposit amount: charged against the deposit.</li>
                <li>Damage exceeding the deposit: charged to the Renter's card on file, subject to notification and dispute rights.</li>
                <li>Late return fee: set by the Lister in the listing (minimum $5/hour, maximum 50% of daily rate per hour, after 30-minute grace period).</li>
                <li>Cleaning, fuel shortage, missing accessories: charged per the Category Annex.</li>
                <li>After 4 hours late, one additional full rental day is charged in lieu of hourly late fees.</li>
            </ul>
            <h3>Damage evidence</h3>
            <p>All photographs uploaded to the Platform are stamped with EXIF metadata (GPS, timestamp, device model, editing-software detection). Photographs that fail verification (edited, out-of-window timestamp, GPS mismatch) are rejected. This creates a tamper-evident record for disputes.</p>
        </Section>

        <Section id="cancellation" title="Module 11 — Cancellation & Refund Policy">
            <h3>Cancellation by Renter</h3>
            <ul>
                <li>More than 24 hours before start: full refund of rental price; Service Fee is non-refundable.</li>
                <li>Between 24 and 2 hours before start: 50% refund of rental price.</li>
                <li>Less than 2 hours before start or no-show: no refund.</li>
            </ul>
            <h3>Cancellation by Lister</h3>
            <ul>
                <li>Full refund of all charges including Service Fee.</li>
                <li>Additional $25 platform credit for inconvenience.</li>
                <li>Lister cancellation rate is tracked and repeated cancellations may result in account suspension.</li>
            </ul>
            <h3>Cancellation by Platform</h3>
            <p>Goodslister may cancel any Booking at its discretion for safety, verification, fraud, or policy-violation reasons. Full refund is issued.</p>
            <h3>Force majeure</h3>
            <p>Cancellations caused by acts of nature (hurricane, tropical storm warning, flooding), government orders, or Platform outages receive full refund regardless of timing.</p>
        </Section>

        <Section id="assumption-risk" title="Module 12 — Assumption of Risk (General Part)">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
                <p className="uppercase font-bold text-rose-900 text-sm">Read this section carefully. It affects your legal rights.</p>
            </div>
            <p className="uppercase font-bold bg-gray-100 p-4 rounded-lg">RENTER ACKNOWLEDGES THAT RENTING AND OPERATING ANY ITEM ON THE GOODSLISTER PLATFORM INVOLVES INHERENT RISKS, INCLUDING BUT NOT LIMITED TO: PROPERTY DAMAGE, PERSONAL INJURY, ILLNESS, DISABILITY, AND DEATH. RENTER VOLUNTARILY ASSUMES ALL SUCH RISKS.</p>
            <h3>General release</h3>
            <p className="uppercase font-bold bg-gray-100 p-4 rounded-lg text-sm">RENTER HEREBY RELEASES, WAIVES, DISCHARGES, AND COVENANTS NOT TO SUE THE LISTER, GOODSLISTER LLC, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, AND SUCCESSORS FROM ANY AND ALL LIABILITY, CLAIMS, DEMANDS, AND CAUSES OF ACTION ARISING FROM RENTER'S USE OF THE ITEM, INCLUDING CLAIMS OF ORDINARY NEGLIGENCE BY THE RELEASED PARTIES.</p>
            <p>This release does not extend to claims of gross negligence, recklessness, or intentional misconduct by the released parties, nor to any claim that cannot be waived under Florida law.</p>
            <h3>Category-specific risks</h3>
            <p>Additional, activity-specific risk disclosures and assumptions of risk are set out in the applicable Category Annex. Renter must read and initial the Category Annex before the Booking is confirmed.</p>
            <h3>Insurance is not provided by Goodslister</h3>
            <p>Renter acknowledges that Goodslister does not provide insurance of any kind. Any protection program offered through the Platform is not insurance, is subject to separate terms, and does not replace Renter's obligation to carry insurance where required by law.</p>
        </Section>
    </LegalPageLayout>
);


// ============================================================================
// CATEGORY ANNEXES — Each applies to ONE category only
// A renter of a bike does NOT see boat rules and vice versa.
// ============================================================================

// ANNEX A — Motorcycles
export const AnnexMotorcyclesPage: React.FC = () => (
    <LegalPageLayout
        title="Annex A — Motorcycle Rules"
        subtitle="Category-specific rules for motorcycle rentals in Florida. Applies only to rentals of Motorcycles."
        metaDescription="Goodslister Annex A - Motorcycle rental rules for Florida. Motorcycle endorsement, DOT helmet, insurance minimums, dangerous instrumentality notice."
        accent="amber"
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="eligibility-motorcycles" title="A1. Eligibility">
            <ul>
                <li>Minimum age: 21 for cruiser/touring; 25 for sport bikes over 600cc.</li>
                <li><strong>Valid motorcycle endorsement</strong> on driver license per Fla. Stat. § 322.03 — verified at check-in.</li>
                <li>Motorcycle Safety Foundation certificate accepted (if within 12 months).</li>
                <li>Clean driving record — no DUI in past 5 years, no reckless driving in past 3 years.</li>
            </ul>
        </Section>

        <Section id="required-gear-motorcycles" title="A2. Required Protective Gear">
            <ul>
                <li><strong>DOT-approved helmet</strong> — mandatory for riders under 21 (Fla. Stat. § 316.211).</li>
                <li>Eye protection mandatory for all riders.</li>
                <li>Provided by Lister at no additional cost.</li>
                <li>Riders 21+ may ride without helmet only if they provide proof of $10,000 medical benefit insurance.</li>
                <li>Long sleeves, long pants, over-ankle boots strongly recommended.</li>
            </ul>
        </Section>

        <Section id="insurance-motorcycles" title="A3. Insurance (Mandatory)">
            <p>Renter must maintain either (a) Goodslister Protect via Cover Genius, or (b) personal motorcycle insurance meeting Florida minimums: $10,000 PIP + $10,000 PDL + $10,000 BI (Fla. Stat. § 627.7407).</p>
            <p>Recommended coverage: $100,000–$300,000 liability plus uninsured motorist.</p>
        </Section>

        <Section id="prohibited-motorcycles" title="A4. Prohibited Conduct">
            <ul>
                <li>Operation under influence of alcohol, drugs, or medication (DUI).</li>
                <li>Racing, stunts, wheelies, or exhibition riding.</li>
                <li>Commercial use (delivery, ride-sharing) unless expressly authorized.</li>
                <li>Track use unless bike is specifically listed as track-capable.</li>
                <li>Off-road use for street bikes.</li>
                <li>Passenger unless motorcycle is equipped with passenger seat and pegs.</li>
                <li>Any modification of the motorcycle.</li>
            </ul>
        </Section>

        <Section id="risks-motorcycles" title="A5. Specific Risks Assumed">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
                <p className="uppercase font-bold text-rose-900 text-sm">RENTER ACKNOWLEDGES THAT MOTORCYCLE OPERATION INVOLVES SUBSTANTIAL RISK OF SERIOUS INJURY OR DEATH, INCLUDING: AMPUTATION, SPINAL CORD INJURY, TRAUMATIC BRAIN INJURY, PARALYSIS, DEATH, BURNS FROM CONTACT WITH HOT EXHAUST PIPES, ROAD RASH FROM FALLS, COLLISIONS WITH OTHER VEHICLES, REDUCED CONSPICUITY TO OTHER DRIVERS (ESPECIALLY AT INTERSECTIONS AND DUSK), MECHANICAL FAILURE, AND WEATHER-RELATED HAZARDS.</p>
                <p className="mt-3">Renter voluntarily assumes all such risks and releases the Lister and Goodslister LLC from any claim arising from motorcycle operation.</p>
            </div>
        </Section>

        <Section id="dangerous-instrumentality-motorcycles" title="A6. Dangerous Instrumentality Notice (for Lister)">
            <p>Under Florida law, an owner who voluntarily entrusts a motor vehicle to another may be held vicariously and strictly liable for injuries caused by that person's negligent operation (Aurbach v. Gallina). The Lister acknowledges this risk and has been advised to consult their own attorney and insurance professional before listing.</p>
        </Section>
    </LegalPageLayout>
);

// ANNEX B — Bikes
export const AnnexBikesPage: React.FC = () => (
    <LegalPageLayout
        title="Annex B — Bike Rules"
        subtitle="Category-specific rules for bicycle rentals — Mountain, Road, Hybrid, BMX, and E-Bikes."
        metaDescription="Goodslister Annex B - Bicycle rental rules. Helmet recommendations, no commercial use, damage waiver, standard cleaning."
        accent="amber"
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="eligibility-bikes" title="B1. Eligibility">
            <ul>
                <li>Minimum age: 16 for standard bikes; 18 for e-bikes over 500W.</li>
                <li>Riders under 16 must be supervised by adult 18+ present at rental.</li>
                <li>Renter self-certifies ability to ride safely.</li>
            </ul>
        </Section>

        <Section id="safety-bikes" title="B2. Safety">
            <ul>
                <li>Helmet strongly recommended for all riders.</li>
                <li>Helmet mandatory for riders under 16 in some Florida municipalities.</li>
                <li>Lights required for dusk/night riding.</li>
                <li>Follow all traffic laws — bicycles are vehicles in Florida.</li>
            </ul>
        </Section>

        <Section id="prohibited-bikes" title="B3. Prohibited Conduct">
            <ul>
                <li>Commercial use (delivery, food services) unless expressly authorized.</li>
                <li>Racing or competitive events unless bike is designed for it.</li>
                <li>Stunts, jumps beyond intended use.</li>
                <li>Operation under influence.</li>
            </ul>
        </Section>

        <Section id="damage-bikes" title="B4. Damage & Loss">
            <p>Security deposit: $100–$300 depending on bike value. Damage exceeding deposit charged to Renter's card. Total loss: full declared value.</p>
        </Section>

        <Section id="risks-bikes" title="B5. Specific Risks Assumed">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
                <p className="uppercase font-bold text-rose-900 text-sm">RENTER ACKNOWLEDGES BICYCLING INVOLVES RISK OF INJURY FROM: FALLS, COLLISIONS WITH VEHICLES, PEDESTRIANS, OR OTHER CYCLISTS, MECHANICAL FAILURE (BRAKES, CHAIN, TIRES), ROAD HAZARDS, TRAFFIC HAZARDS, AND WEATHER CONDITIONS. RENTER VOLUNTARILY ASSUMES ALL SUCH RISKS.</p>
            </div>
        </Section>
    </LegalPageLayout>
);

// ANNEX C — Boats
export const AnnexBoatsPage: React.FC = () => (
    <LegalPageLayout
        title="Annex C — Boat & Vessel Rules"
        subtitle="Category-specific rules for boats, sailboats, pontoons, and yachts in Florida."
        metaDescription="Goodslister Annex C - Boat rental rules for Florida. FL Boater Card, USCG safety equipment, marine insurance, livery notice per Fla. Stat. 327.54."
        accent="amber"
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="florida-compliance-boats" title="C1. Florida Compliance (Mandatory)">
            <ul>
                <li>Renter born after January 1, 1988 <strong>must possess a valid Florida Boating Safety Education ID Card</strong> per Fla. Stat. § 327.395.</li>
                <li>Minimum operator age: 18 (14–17 permitted only with adult 18+ present).</li>
                <li>Vessel must display valid Florida registration decal and hull ID.</li>
                <li>Coast Guard-required safety equipment on board (provided by Lister).</li>
            </ul>
        </Section>

        <Section id="safety-equipment-boats" title="C2. Safety Equipment Required">
            <ul>
                <li>USCG-approved life vest for every person on board (Fla. Stat. § 327.50).</li>
                <li>Type IV throwable device for vessels 16 feet or longer.</li>
                <li>Fire extinguisher(s) sized per vessel.</li>
                <li>Sound-producing device (horn or whistle).</li>
                <li>Navigation lights for dusk or night operation.</li>
                <li>Visual distress signals for offshore vessels.</li>
                <li>Marine VHF radio for offshore vessels.</li>
            </ul>
        </Section>

        <Section id="insurance-boats" title="C3. Marine Insurance (Mandatory)">
            <p>Rental requires either Goodslister Marine Protect via Cover Genius or Lister's marine policy naming Renter as insured. Minimum coverage:</p>
            <ul>
                <li>Yachts (over 30 ft): $1,000,000 liability plus full hull.</li>
                <li>Speedboats and Pontoons: $500,000 liability plus hull.</li>
                <li>Fishing and Sailboats: $500,000 liability plus hull.</li>
            </ul>
            <p>Deductible: $1,000–$5,000 depending on vessel. No uninsured rental permitted.</p>
        </Section>

        <Section id="prohibited-boats" title="C4. Prohibited Conduct">
            <ul>
                <li>Operation under influence — BUI per Fla. Stat. § 327.35, .08 BAC is criminal.</li>
                <li>Towing skiers or tubes unless authorized AND observer age 12+ present (Fla. Stat. § 327.37).</li>
                <li>Reckless operation, wake violations, or dangerous maneuvers.</li>
                <li>Operation in restricted zones (manatee zones, security zones, wildlife refuges).</li>
                <li>Commercial charter unless expressly authorized.</li>
                <li>Fishing without valid Florida fishing license (freshwater or saltwater as applicable).</li>
            </ul>
        </Section>

        <Section id="livery-notice-boats" title="C5. Vessel Livery Notice (for Lister)">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg my-4">
                <p>If Lister advertises and offers a vessel for rent for consideration without providing a USCG-licensed master, Lister may be a "livery" under Florida law and subject to permit, insurance, safety equipment, pre-rental instruction, written agreement, and renter-verification requirements. <strong>Violation is a first-degree misdemeanor</strong> (Fla. Stat. § 327.54). Livery Operator Permits are free from the Florida Fish and Wildlife Conservation Commission.</p>
            </div>
        </Section>

        <Section id="risks-boats" title="C6. Specific Risks Assumed">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
                <p className="uppercase font-bold text-rose-900 text-sm">RENTER ACKNOWLEDGES BOATING INVOLVES SUBSTANTIAL RISK INCLUDING: DROWNING, HYPOTHERMIA, COLLISION WITH OTHER VESSELS OR FIXED OBJECTS, SINKING, CAPSIZING, WEATHER-RELATED EMERGENCIES (SUDDEN STORMS, WATERSPOUTS), MARINE LIFE ENCOUNTERS, GROUNDING, PROPELLER INJURIES, FIRE OR EXPLOSION FROM FUEL VAPORS, AND CARBON MONOXIDE POISONING FROM ENGINE EXHAUST. RENTER VOLUNTARILY ASSUMES ALL SUCH RISKS.</p>
            </div>
        </Section>
    </LegalPageLayout>
);

// ANNEX D — Camping
export const AnnexCampingPage: React.FC = () => (
    <LegalPageLayout
        title="Annex D — Camping Equipment Rules"
        subtitle="Category-specific rules for camping equipment rentals — tents, trailers, power kits, and gear."
        metaDescription="Goodslister Annex D - Camping equipment rental rules. Fire safety, wildlife, park regulations, standard damage."
        accent="amber"
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="eligibility-camping" title="D1. Eligibility">
            <ul>
                <li>Minimum age: 18.</li>
                <li>Renter is responsible for verifying campground permits and reservations independently.</li>
            </ul>
        </Section>

        <Section id="safety-camping" title="D2. Safety">
            <ul>
                <li>Follow all fire safety regulations — no open flames near tents.</li>
                <li>Store food properly to avoid wildlife encounters.</li>
                <li>Comply with National Park, State Park, and private campground rules.</li>
                <li>Do not use propane devices inside enclosed tents (carbon monoxide risk).</li>
                <li>Awnings and shelter tents: retract or secure in wind over 20 mph.</li>
            </ul>
        </Section>

        <Section id="prohibited-camping" title="D3. Prohibited Conduct">
            <ul>
                <li>Commercial use.</li>
                <li>Use in prohibited or unauthorized locations.</li>
                <li>Fire ring or open flame use near equipment.</li>
            </ul>
        </Section>

        <Section id="damage-camping" title="D4. Damage & Cleaning">
            <p>Deposit: $50–$200. Return equipment cleaned of dirt and debris. Water damage from improper storage: full repair. Total loss: full declared value. Excessive cleaning fee: $50–$150.</p>
        </Section>

        <Section id="risks-camping" title="D5. Specific Risks Assumed">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
                <p className="uppercase font-bold text-rose-900 text-sm">RENTER ACKNOWLEDGES CAMPING INVOLVES RISK OF INJURY FROM: WILDLIFE ENCOUNTERS (ALLIGATORS, SNAKES, BEARS, INSECTS), FIRE HAZARDS, WEATHER EVENTS (LIGHTNING, WIND, FLOODING), FALLS ON UNEVEN TERRAIN, HYPOTHERMIA, HEAT STROKE, AND EXPOSURE. RENTER VOLUNTARILY ASSUMES ALL SUCH RISKS.</p>
            </div>
        </Section>
    </LegalPageLayout>
);

// ANNEX E — Winter Sports
export const AnnexWinterSportsPage: React.FC = () => (
    <LegalPageLayout
        title="Annex E — Winter Sports Equipment Rules"
        subtitle="Category-specific rules for winter sports equipment rentals — skis, snowboards, snowshoes."
        metaDescription="Goodslister Annex E - Winter sports rental rules. Helmet recommendations, injury waiver, resort policies."
        accent="amber"
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="eligibility-winter" title="E1. Eligibility">
            <ul>
                <li>Minimum age: 18 for advanced equipment; 12 with adult supervision for beginner equipment.</li>
                <li>Renter self-certifies skill level.</li>
            </ul>
        </Section>

        <Section id="safety-winter" title="E2. Safety">
            <ul>
                <li>Helmet strongly recommended.</li>
                <li>Follow all ski resort policies and marked trail difficulty ratings.</li>
                <li>Do not use equipment beyond skill level.</li>
            </ul>
        </Section>

        <Section id="damage-winter" title="E3. Damage & Loss">
            <p>Deposit: $100–$300. Broken bindings, edges, or major structural damage: repair cost. Total loss: full declared value.</p>
        </Section>

        <Section id="risks-winter" title="E4. Specific Risks Assumed">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
                <p className="uppercase font-bold text-rose-900 text-sm">RENTER ACKNOWLEDGES SKIING, SNOWBOARDING, AND WINTER SPORTS INVOLVE SUBSTANTIAL RISK INCLUDING: SERIOUS INJURY OR DEATH FROM FALLS, COLLISIONS WITH OTHER SKIERS OR FIXED OBJECTS (TREES, LIFT TOWERS), AVALANCHES, HYPOTHERMIA, FROSTBITE, EQUIPMENT FAILURE, CHANGING SNOW AND ICE CONDITIONS, AND ALTITUDE SICKNESS. RENTER VOLUNTARILY ASSUMES ALL SUCH RISKS.</p>
            </div>
        </Section>
    </LegalPageLayout>
);

// ANNEX F — Water Sports (Kayak, SUP, Surf, Wingfoil, Kitesurf, JET SKIS included)
export const AnnexWaterSportsPage: React.FC = () => (
    <LegalPageLayout
        title="Annex F — Water Sports Rules"
        subtitle="Category-specific rules for water sports equipment — kayaks, paddleboards, surf, wingfoil, kitesurf, and jet skis."
        metaDescription="Goodslister Annex F - Water sports rental rules for Florida. PFD required, swimming ability, weather cancellations, jet ski Florida Boater Card compliance."
        accent="amber"
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="eligibility-water" title="F1. Eligibility & Florida Compliance">
            <h3>Non-motorized (Kayak, SUP, Surf, Wingfoil, Kitesurf)</h3>
            <ul>
                <li>Minimum age: 18 (or 14+ with adult supervision).</li>
                <li>Renter must be able to swim.</li>
                <li>Kitesurf/Wingfoil: intermediate skill level or higher (self-declared).</li>
            </ul>
            <h3>Motorized (Jet Ski / PWC)</h3>
            <ul>
                <li>Renter born after January 1, 1988 <strong>must possess Florida Boating Safety Education ID Card</strong> (Fla. Stat. § 327.395).</li>
                <li>Operator must be at least 14 years old (14–15 with adult 18+ signatory).</li>
                <li>No operation between sunset and sunrise (Fla. Stat. § 327.33).</li>
                <li>Vessel must display valid Florida registration decal.</li>
            </ul>
        </Section>

        <Section id="safety-water" title="F2. Safety Requirements">
            <ul>
                <li><strong>USCG-approved life vest must be worn at all times on the water</strong> (Fla. Stat. § 327.50).</li>
                <li>Jet Ski: engine cut-off lanyard attached to operator at all times.</li>
                <li>Minimum 100 feet distance from other vessels, docks, swimmers, and shorelines (Jet Ski at above-idle speed).</li>
                <li>Return before sunset unless equipment includes navigation lights and night-use is authorized.</li>
                <li>Do not use in Small Craft Advisories or marine warnings.</li>
            </ul>
        </Section>

        <Section id="insurance-water" title="F3. Insurance">
            <h3>Non-motorized</h3>
            <p>Renter's security deposit covers damage. Optional Goodslister Protect add-on ($5–$10) extends damage waiver.</p>
            <h3>Motorized (Jet Ski)</h3>
            <p>Rental <strong>requires</strong> either Goodslister Protect via Cover Genius or Lister's marine policy naming Renter. Minimum $500,000 marine liability plus hull damage.</p>
        </Section>

        <Section id="prohibited-water" title="F4. Prohibited Conduct">
            <ul>
                <li>Operation under influence of alcohol or drugs (BUI is criminal — Fla. Stat. § 327.35).</li>
                <li>Reckless operation — wake-jumping near other vessels, weaving through traffic.</li>
                <li>Towing skiers or riders unless expressly authorized AND observer present.</li>
                <li>Operation in restricted zones (manatee zones, marine sanctuaries, security zones).</li>
                <li>Night use of non-motorized equipment without navigation lights.</li>
            </ul>
        </Section>

        <Section id="risks-water" title="F5. Specific Risks Assumed">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
                <p className="uppercase font-bold text-rose-900 text-sm">RENTER ACKNOWLEDGES WATER SPORTS INVOLVE SUBSTANTIAL RISK OF SERIOUS INJURY OR DEATH INCLUDING: DROWNING, HYPOTHERMIA, INJURY FROM WAVES OR IMPACT, MARINE LIFE ENCOUNTERS (JELLYFISH, SHARKS, STINGRAYS), SUN EXPOSURE, COLLISION WITH OTHER WATERCRAFT, PROPELLER INJURY (JET SKI), CAPSIZING, EJECTION, EQUIPMENT FAILURE, AND SUDDEN WEATHER CHANGES. RENTER VOLUNTARILY ASSUMES ALL SUCH RISKS.</p>
            </div>
        </Section>
    </LegalPageLayout>
);

// ANNEX G — RVs
export const AnnexRVsPage: React.FC = () => (
    <LegalPageLayout
        title="Annex G — RV Rules"
        subtitle="Category-specific rules for RV rentals — Class A, Class C, Campervans, Travel Trailers, Fifth Wheels."
        metaDescription="Goodslister Annex G - RV rental rules. Class license requirements, mileage limits, black water disposal, insurance, no smoking policy."
        accent="amber"
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="eligibility-rvs" title="G1. Florida Compliance & Eligibility">
            <ul>
                <li>Class A or C under 26,000 lbs GVWR: standard Class E Florida license.</li>
                <li>Over 26,000 lbs GVWR: Non-Commercial Class B license required.</li>
                <li>Vehicles over 26,000 lbs with air brakes: CDL Class B.</li>
                <li>Minimum age: 25 years.</li>
                <li>Clean driving record — no major violations in past 3 years.</li>
                <li>Additional drivers must be listed and pre-approved.</li>
            </ul>
        </Section>

        <Section id="insurance-rvs" title="G2. Insurance (Mandatory)">
            <p>Either Goodslister RV Protect via Cover Genius or Renter's auto policy extended to RV rental (verified in writing). Minimum $1,000,000 combined single-limit liability plus full comprehensive and collision. Roadside assistance included.</p>
        </Section>

        <Section id="mileage-rvs" title="G3. Mileage & Area">
            <ul>
                <li>Mileage cap: 100–150 miles per day (specified by Lister).</li>
                <li>Excess mileage: $0.35–$0.75 per mile.</li>
                <li>Operating area: continental US.</li>
                <li>International (Mexico, Canada): only with prior written approval and insurance endorsement.</li>
                <li>Alaska and Hawaii: not permitted.</li>
                <li>Off-road use: voids insurance.</li>
            </ul>
        </Section>

        <Section id="utilities-rvs" title="G4. Fuel, Propane & Water Systems">
            <ul>
                <li>Return with full fuel and propane. Shortages: $10/gallon + $50 refuel service; propane $30 refill.</li>
                <li>Black water must be dumped at approved RV dump station before return.</li>
                <li>Improper black water disposal: $250 fee plus actual cleanup cost.</li>
                <li>Generator: do not run while sleeping (carbon monoxide risk).</li>
            </ul>
        </Section>

        <Section id="prohibited-rvs" title="G5. Prohibited Conduct">
            <ul>
                <li>No smoking, vaping, or cannabis use inside RV. $500 cleaning fee if violated.</li>
                <li>No pets unless expressly authorized ($150–$500 pet deposit).</li>
                <li>No commercial use unless authorized.</li>
                <li>Operation under influence.</li>
                <li>Overhead clearance violations — know your height.</li>
                <li>Operation in extreme weather (hurricanes, blizzards).</li>
            </ul>
        </Section>

        <Section id="risks-rvs" title="G6. Specific Risks Assumed">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
                <p className="uppercase font-bold text-rose-900 text-sm">RENTER ACKNOWLEDGES RV OPERATION INVOLVES SUBSTANTIAL RISK INCLUDING: ROLLOVER FROM HIGH CENTER OF GRAVITY, AWNING FAILURES, OVERHEAD STRIKES (BRIDGES, TREES, GAS STATION CANOPIES), FUEL OR PROPANE FIRES, CARBON MONOXIDE POISONING FROM GENERATORS OR APPLIANCES, WILDLIFE HAZARDS, SEVERE WEATHER EVENTS, AND MECHANICAL FAILURE FAR FROM SERVICE. RENTER VOLUNTARILY ASSUMES ALL SUCH RISKS.</p>
            </div>
        </Section>

        <Section id="dangerous-instrumentality-rvs" title="G7. Dangerous Instrumentality Notice (for Lister)">
            <p>RVs are motor vehicles under Florida law. Lister acknowledges the dangerous instrumentality doctrine may impose vicarious liability and has been advised to consult attorney and insurance professional before listing.</p>
        </Section>
    </LegalPageLayout>
);

// ANNEX H — ATVs & UTVs
export const AnnexATVsPage: React.FC = () => (
    <LegalPageLayout
        title="Annex H — ATV & UTV Rules"
        subtitle="Category-specific rules for ATV, UTV, side-by-side, dune buggy rentals in Florida."
        metaDescription="Goodslister Annex H - ATV UTV rental rules for Florida. No public roads, OHV parks only, helmet under 16, insurance requirements."
        accent="amber"
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="florida-compliance-atvs" title="H1. Florida Compliance (Mandatory)">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg my-4">
                <p><strong>ATVs and UTVs cannot be operated on any public road, highway, or right-of-way in Florida</strong> (Fla. Stat. § 316.2074). Operation is restricted to: (a) private property with owner permission, or (b) designated Off-Highway Vehicle (OHV) parks or trails.</p>
            </div>
            <ul>
                <li>Renter is responsible for verifying access permissions to the operating area.</li>
                <li>Riders under 16 must complete FWC safety course and be supervised.</li>
                <li>Youth ATV models restricted per manufacturer age spec.</li>
            </ul>
        </Section>

        <Section id="safety-atvs" title="H2. Safety Equipment (Mandatory)">
            <ul>
                <li>DOT-approved helmet for all riders under 16 (Fla. Stat. § 316.2074(2)).</li>
                <li>Strongly recommended for all riders regardless of age.</li>
                <li>Eye protection (goggles or shield).</li>
                <li>Long sleeves, long pants, over-ankle boots.</li>
                <li>Gloves recommended.</li>
                <li>UTVs: seatbelts required, doors or nets if equipped.</li>
            </ul>
        </Section>

        <Section id="insurance-atvs" title="H3. Insurance (Mandatory)">
            <p>Either Goodslister ATV Protect via Cover Genius or Lister's policy naming Renter. Minimum $500,000 liability plus full damage. Deductible $500–$1,500.</p>
        </Section>

        <Section id="prohibited-atvs" title="H4. Prohibited Conduct">
            <ul>
                <li>Operation on public roads or highways (Florida statute).</li>
                <li>Operation under influence.</li>
                <li>Passengers on Sport ATVs (single-rider design).</li>
                <li>Passengers on Utility ATVs or UTVs only if equipped with proper passenger seat.</li>
                <li>Racing or competitive events.</li>
                <li>Stunts, jumps, or reckless operation.</li>
                <li>Water crossings unless vehicle is designed for it AND authorized.</li>
            </ul>
        </Section>

        <Section id="risks-atvs" title="H5. Specific Risks Assumed">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
                <p className="uppercase font-bold text-rose-900 text-sm">RENTER ACKNOWLEDGES ATV/UTV OPERATION INVOLVES SUBSTANTIAL RISK OF SERIOUS INJURY OR DEATH INCLUDING: ROLLOVER (COMMON DUE TO HIGH CENTER OF GRAVITY AND UNSTABLE TERRAIN), EJECTION, COLLISION, TERRAIN HAZARDS (HIDDEN HOLES, LOGS, ROCKS), IMPACT WITH TREES OR FIXED OBJECTS, DROWNING FROM WATER CROSSINGS, HELMET FAILURE, AND MECHANICAL FAILURE. RENTER VOLUNTARILY ASSUMES ALL SUCH RISKS.</p>
            </div>
        </Section>
    </LegalPageLayout>
);
