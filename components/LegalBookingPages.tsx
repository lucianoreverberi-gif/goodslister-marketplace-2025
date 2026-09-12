import React from 'react';

// ============================================================================
// GOODSLISTER LEGAL BOOKING PAGES — v2.0 (Phase 3b Robust Content)
// Full-length content adapted from the internal legal package v2.0 MD files.
// All content is DRAFT pending Florida-licensed attorney review.
// ============================================================================

const LEGAL_VERSION = '2.0';
const LAST_UPDATED = 'September 12, 2026';

// ============================================================================
// SHARED LAYOUT + SUBCOMPONENTS
// ============================================================================

const LegalPageLayout: React.FC<{
    title: string;
    subtitle: string;
    metaDescription: string;
    accent?: 'cyan' | 'amber' | 'rose';
    children: React.ReactNode;
}> = ({ title, subtitle, metaDescription, accent = 'cyan', children }) => {
    React.useEffect(() => {
        document.title = `${title} - Goodslister`;
        const meta = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'description' }));
        meta.setAttribute('content', metaDescription);
        window.scrollTo(0, 0);
    }, [title, metaDescription]);

    const gradientClass = accent === 'amber' ? 'from-slate-900 to-amber-950' : accent === 'rose' ? 'from-slate-900 to-rose-950' : 'from-slate-900 to-cyan-950';
    const accentColorClass = accent === 'amber' ? 'text-amber-400' : accent === 'rose' ? 'text-rose-400' : 'text-cyan-400';

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
                <div className="prose prose-slate max-w-none prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-gray-700 prose-strong:text-gray-900 prose-table:text-sm">
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

const RiskCallout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
        <div className="uppercase font-bold text-rose-900 text-sm space-y-3">
            {children}
        </div>
    </div>
);

const AllCapsBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="uppercase font-bold bg-gray-100 border-l-4 border-gray-400 p-4 rounded-lg text-sm leading-relaxed">
        {children}
    </p>
);

const InfoBox: React.FC<{ children: React.ReactNode; kind?: 'info' | 'warn' | 'note' }> = ({ children, kind = 'info' }) => {
    const bg = kind === 'warn' ? 'bg-amber-50 border-amber-500' : kind === 'note' ? 'bg-gray-50 border-gray-400' : 'bg-cyan-50 border-cyan-500';
    return (
        <div className={`${bg} border-l-4 p-4 rounded-lg my-4 text-sm`}>
            {children}
        </div>
    );
};

// ============================================================================
// TRANSACTIONAL CORE — Modules 07-12
// Applies to every Booking. Signed alongside the applicable Category Annex.
// ============================================================================
export const TransactionalCorePage: React.FC = () => (
    <LegalPageLayout
        title="Rental Agreement (Transactional Core)"
        subtitle="The 6 core rental documents that apply to every rental on Goodslister — Lister Agreement, Renter Agreement, Master Rental Agreement, Deposits & Damage, Cancellation, and general Assumption of Risk. Signed together with the applicable Category Annex (A through H)."
        metaDescription="Goodslister Rental Agreement (Transactional Core) - Lister Agreement, Renter Agreement, Master Rental Agreement, Security Deposit and Damage Policy, Cancellation and Refund Policy, Assumption of Risk (general)."
        accent="cyan"
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: {LAST_UPDATED} · Version {LEGAL_VERSION}</p>

        <InfoBox kind="note">
            <strong>How to read this document:</strong> The Transactional Core sets the shared rules for every rental. Category-specific eligibility, required safety equipment, prohibited uses, and specific risk disclosures are set out in the <strong>Category Annex</strong> (Annex A through H) for the item you are renting. Both parts must be accepted together at booking.
        </InfoBox>

        {/* MÓDULO 07 — LISTER AGREEMENT */}
        <Section id="lister-agreement" title="Module 07 — Lister (Owner) Agreement">
            <p>This Lister Agreement supplements the Terms of Service and applies to every User who lists an Item.</p>

            <h3>1. Independent status</h3>
            <p>You are an independent business or individual owner. You control your Item, your pricing (within Platform limits), your availability, your handoff process, and your interactions with Renters. Nothing creates an employment, agency, or partnership relationship with Goodslister.</p>

            <h3>2. Representations and warranties</h3>
            <p>You represent and warrant, at listing and continuously through each Rental Period, that:</p>
            <ul>
                <li><strong>Title and authority.</strong> You are the registered legal owner of the Item or hold express written authority from the owner to rent it. You will provide proof on request within 48 hours.</li>
                <li><strong>Liens.</strong> No lienholder, lessor, or finance company prohibits rental use, or you have written consent.</li>
                <li><strong>Legal compliance.</strong> The Item is currently registered, titled, and where applicable inspected and decaled per Florida law. Vessels require valid Florida registration; RVs and motorcycles require registration and minimum financial responsibility coverage where applicable.</li>
                <li><strong>Condition and maintenance.</strong> The Item is safe, sound, and fully functional; maintained per manufacturer specifications; has no known unrepaired safety defect or open safety recall; and includes all legally required safety equipment in working order.</li>
                <li><strong>Category-specific obligations.</strong> You have read, and you comply with, the Lister Obligations block of the Category Annex applicable to your Item (Annex A–H), which is incorporated here by reference. <strong>Certain categories carry criminal exposure for non-compliance — most notably vessels under Fla. Stat. § 327.54. Read your Annex before publishing.</strong></li>
                <li><strong>Insurance.</strong> You maintain insurance appropriate to the Item and rental use, and have confirmed in writing with your insurer that peer-to-peer rental use is not excluded.</li>
                <li><strong>Accuracy.</strong> All listing information, photographs, availability, pricing, and fees are accurate and not misleading.</li>
            </ul>

            <h3>3. Operational obligations</h3>
            <ul>
                <li><strong>Pre-rental inspection</strong> before each handoff for safe operating condition, fluid levels, tires/hull, brakes, lights, and safety equipment.</li>
                <li><strong>Condition Report</strong> completed on the Platform at checkout and check-in, including timestamped photographs of every side of the Item, close-ups of any existing damage, odometer/hour meter/engine hours, and fuel level. Photographs must be captured through the Platform. Off-Platform photographs may be given reduced weight in a damage determination.</li>
                <li><strong>Verification at handoff.</strong> Personally verify the Renter's government-issued photo ID matches the Platform-verified account, and verify all required licenses, endorsements, and certifications per the applicable Annex.</li>
                <li><strong>Refusal.</strong> You may and should refuse handoff if the Renter appears impaired, is unlicensed, is not the verified account holder, refuses safety equipment, or presents any credible safety concern. Refusal on these grounds is not penalized under the Cancellation Policy, provided you report it immediately on-Platform.</li>
                <li><strong>Safety briefing</strong> covering operational characteristics, safe operation, right-of-way rules, local conditions, emergency procedures, and required safety equipment — and every point listed in the Instruction block of the applicable Annex. For some categories, including vessels, pre-rental instruction is mandatory by statute.</li>
                <li><strong>Records retention</strong> — rental agreements, condition records, and maintenance records for at least five (5) years.</li>
                <li><strong>Incident reporting</strong> — report any accident, injury, theft, or law-enforcement contact within 24 hours and cooperate fully with investigation.</li>
            </ul>

            <h3>4. Prohibited Lister conduct</h3>
            <p>You may not: list an Item you do not control; misrepresent condition; use stock or outdated photographs as the Item; require off-Platform payment; discriminate against Renters on any protected-class basis; install undisclosed recording devices in an Item's interior; retain a Renter's identification documents; or use a Renter's personal information for any purpose other than the Booking.</p>

            <h3>5. Fees and payout</h3>
            <p>Goodslister deducts the Service Fee (10–15%) plus applicable processing fees from the Rental Price. Net proceeds are paid to your connected Stripe Connect account. You are solely responsible for your own taxes and for any Form 1099-K reporting.</p>

            <h3>6. Damage claims</h3>
            <p>You must open a damage claim within <strong>24 hours</strong> of scheduled return, supported by Condition Report photographs from both checkout and check-in, a written description, and a repair estimate or invoice. Claims filed late or without matched before/after photographic evidence may be denied. See Module 10.</p>

            <h3>7. Lister indemnification</h3>
            <AllCapsBlock>
                You agree to defend, indemnify, and hold harmless Goodslister and its personnel from any claim, loss, liability, or expense (including attorneys' fees) arising from or relating to your Item, its condition, its maintenance, its entrustment to any person, your compliance or non-compliance with any licensing or permitting requirement, or any injury, death, or property damage occurring before, during, or after a Rental Period.
            </AllCapsBlock>
            <AllCapsBlock>
                You acknowledge that under Florida's Dangerous Instrumentality Doctrine, the owner of a motor vehicle who voluntarily entrusts it to another may be held vicariously and strictly liable for that person's negligent operation. You assume this risk entirely and acknowledge Goodslister has advised you to consult your own attorney and insurance professional before listing.
            </AllCapsBlock>

            <h3>8. Term and termination</h3>
            <p>Either party may terminate at any time. Termination does not affect Bookings already confirmed, accrued payment obligations, or Sections 2, 6, and 7, which survive.</p>
        </Section>

        {/* MÓDULO 08 — RENTER AGREEMENT */}
        <Section id="renter-agreement" title="Module 08 — Renter Agreement">
            <p>This Renter Agreement supplements the Terms of Service and applies to every User who books an Item.</p>

            <h3>1. Eligibility</h3>
            <ul>
                <li>You are at least 18 years old, or the higher minimum age for the category under the applicable Annex.</li>
                <li>You hold a valid, unexpired, unsuspended government-issued license appropriate to the Item, including a motorcycle endorsement for motorcycles.</li>
                <li>You meet every eligibility requirement in the Category Annex applicable to your Item (Annex A–H), including any higher minimum age and any license, endorsement, or certification, and you will present proof at handoff. Some categories require documentation beyond a driver license.</li>
                <li>You have completed identity verification through Stripe Identity and the verified identity is your own.</li>
                <li>You are the sole authorized operator. <strong>No other person may operate the Item unless added as an Authorized Operator on-Platform and separately verified and released.</strong></li>
            </ul>

            <h3>2. Your obligations</h3>
            <ul>
                <li>Operate the Item lawfully, safely, sober, and within your skill level and the manufacturer's specifications.</li>
                <li>Use all required safety equipment, including PFDs and helmets, and require the same of all passengers.</li>
                <li>Complete the Condition Report at checkout and check-in with clear, timestamped photographs.</li>
                <li>Return the Item on time, at the agreed location, in the same condition as received (ordinary wear excepted), with the agreed fuel level.</li>
                <li>Immediately report any accident, mechanical failure, injury, theft, citation, or law-enforcement contact to the Lister and to Goodslister, and file a police report where required.</li>
                <li>Not leave the Item unsecured or unattended in violation of the Rental Agreement.</li>
                <li>Pay all fines, tolls, citations, impound fees, and towing costs incurred during the Rental Period, plus an administrative fee per item.</li>
                <li>Cooperate fully with any insurance or law-enforcement investigation.</li>
            </ul>

            <h3>3. Prohibited uses</h3>
            <p>You may not: operate under the influence of alcohol, cannabis, or any impairing substance; permit an unauthorized operator; sublease or re-rent; use the Item for racing, timed events, competition, jumping, stunt riding, off-road use of an on-road Item, towing beyond rated capacity, teaching or instruction, commercial hauling, ride-hail or delivery services, or any illegal purpose; transport hazardous materials, illegal substances, or more passengers than the rated capacity; take the Item outside the Geographic Limits without written consent; tamper with GPS, telematics, kill switches, governors, or odometers; smoke or vape in an RV or campervan without express permission; or transport pets where prohibited by the listing.</p>
            <AllCapsBlock>
                Violation of this Section 3 constitutes a material breach, voids any protection program, may void the Lister's insurance, and makes you fully liable for all resulting loss, plus attorneys' fees.
            </AllCapsBlock>

            <h3>4. Financial responsibility</h3>
            <ul>
                <li>You are responsible for the full cost of any loss, damage, theft, vandalism, salvage, towing, recovery, storage, diminished value, and loss of rental income during repair, subject to Module 10.</li>
                <li>You authorize Goodslister and Stripe to charge your payment method for the Security Deposit, approved damage amounts, late fees, cleaning fees, fuel charges, fines, and administrative fees, consistent with Module 10.</li>
                <li>You will not initiate a chargeback for amounts validly owed. Fraudulent chargebacks may result in account termination and collection action.</li>
            </ul>

            <h3>5. Assumption of risk</h3>
            <p>You confirm you have separately read, understood, and executed the <strong>Assumption of Risk, Waiver and Release of Liability (Module 12 + Category Annex)</strong> and that it is a condition of every Booking.</p>

            <h3>6. Renter indemnification</h3>
            <AllCapsBlock>
                You agree to defend, indemnify, and hold harmless Goodslister, the Lister, and their respective personnel from any claim, loss, liability, or expense (including attorneys' fees) arising from your use or misuse of the Item, your breach of this Agreement, or any injury or damage caused by you, your passengers, or your guests.
            </AllCapsBlock>
        </Section>

        {/* MÓDULO 09 — MASTER RENTAL AGREEMENT */}
        <Section id="master-rental" title="Module 09 — Master Rental Agreement (Lister ↔ Renter)">
            <p><strong>This is the actual rental contract. It is formed directly between the Lister and the Renter. Goodslister is not a party.</strong></p>

            <h3>Schedule of terms (auto-populated by the Platform at booking)</h3>
            <p>Each confirmed Booking populates a Schedule with: Agreement ID, Lister and Renter contact details, additional Authorized Operators, Item identification (category, subcategory, year, make, model, VIN or HIN, registration or title number), Rental Period (start and end date/time), pickup and return location, Rental Price, Service Fee, Security Deposit hold, included mileage or engine hours, overage rate, fuel policy, Geographic Limits, delivery option, and included safety equipment.</p>

            <h3>1. Grant</h3>
            <p>Owner rents the Item to Renter for the Rental Period on these terms. <strong>This is a bailment for hire, not a sale, lease-purchase, or transfer of any ownership interest.</strong> Title remains with Owner at all times.</p>

            <h3>2. Condition Report — binding evidence</h3>
            <p>The parties will jointly complete a Platform Condition Report at checkout and at check-in with timestamped, geotagged photographs of all sides of the Item, close-ups of pre-existing damage, the odometer/hour meter/engine hours, and fuel level.</p>
            <AllCapsBlock>
                The parties agree that the Condition Reports constitute the primary and controlling evidence of the Item's condition at the start and end of the Rental Period. Damage visible in the check-in Condition Report but not in the checkout Condition Report is presumed to have occurred during the Rental Period and is the Renter's responsibility, subject to rebuttal by clear evidence.
            </AllCapsBlock>
            <p>A party who fails to complete a Condition Report waives the right to contest the other party's report on grounds of insufficient documentation.</p>

            <h3>3. Delivery and acceptance</h3>
            <p>Renter's completion of the checkout Condition Report and departure with the Item constitutes acceptance of the Item in the documented condition, and acknowledgment that Renter has received operating instruction and all required safety equipment.</p>

            <h3>4. Permitted use</h3>
            <p>Renter will use the Item only for lawful, personal, recreational purposes, within the Geographic Limits, within rated capacity, and consistent with Module 08 Section 3 and the applicable Category Annex.</p>

            <h3>5. Operators</h3>
            <p>Only the Renter and Additional Authorized Operators listed in the Schedule may operate the Item. <strong>Permitting operation by any other person is a material breach and makes Renter fully liable for all resulting loss.</strong></p>

            <h3>6. Maintenance and breakdown</h3>
            <p>Renter will maintain fluid levels and report any warning light, unusual noise, or performance issue immediately and cease operation if continued use would be unsafe. Renter will not perform repairs or authorize repairs above $100 without Owner's written consent. Mechanical failure not caused by Renter misuse is Owner's responsibility; Owner will offer a replacement Item or issue a pro-rata refund as the sole remedy.</p>

            <h3>7. Return</h3>
            <p>Renter will return the Item at the agreed time and location, clean, with the agreed fuel level, and with all keys, documents, accessories, and safety equipment. Late return incurs the per-hour fee set by the Lister in the listing (minimum $5, maximum 50% of the daily rate per hour), plus any consequential loss to Owner from a subsequent booking. After 4 hours late, one additional full rental day is charged in lieu of hourly late fees.</p>

            <h3>8. Non-return / conversion</h3>
            <p>Failure to return the Item within 24 hours of the scheduled return time, without Owner's written consent, constitutes unlawful possession and may be reported to law enforcement as theft or conversion. Renter is liable for the full replacement value plus recovery costs.</p>

            <h3>9. Loss and damage</h3>
            <p>Renter is liable for all loss, damage, theft, vandalism, salvage, towing, recovery, storage, and Owner's documented loss of rental income during repair, up to the actual cash value of the Item. See Module 10.</p>

            <h3>10. Insurance</h3>
            <AllCapsBlock>
                Owner represents that Owner maintains insurance covering the Item and confirms rental use is not excluded. Renter acknowledges that Renter's personal policies and credit card benefits likely do NOT cover this rental. Goodslister provides NO insurance.
            </AllCapsBlock>
            <p>Each party is responsible for its own coverage.</p>

            <h3>11. Fines and citations</h3>
            <p>Renter is liable for all tolls, parking tickets, moving violations, marine citations, impound, and towing incurred during the Rental Period, plus an administrative fee per event.</p>

            <h3>12. Assumption of risk and release</h3>
            <p>Renter has executed the Assumption of Risk, Waiver and Release of Liability — General Part (Module 12) together with the Category Annex applicable to the Item, both of which are incorporated in full and are a material condition of this Agreement.</p>

            <h3>13. Renter indemnification of Owner</h3>
            <p>Renter will defend, indemnify, and hold harmless Owner from all claims arising from Renter's use, misuse, or possession of the Item during the Rental Period, except to the extent caused by Owner's own gross negligence or willful misconduct.</p>

            <h3>14. Owner indemnification of Renter</h3>
            <p>Owner will defend, indemnify, and hold harmless Renter from all claims arising from Owner's failure to maintain the Item in safe condition, Owner's failure to disclose a known defect, or Owner's failure to hold required registrations, permits, or licenses.</p>

            <h3>15. Goodslister not a party</h3>
            <p>The parties acknowledge Goodslister is not a party to this Agreement, is a third-party beneficiary of Sections 12, 13, 14, 16, and 17, and has no obligation or liability under this Agreement.</p>

            <h3>16. Dispute resolution</h3>
            <p>Disputes between Owner and Renter will first be submitted to the Goodslister Resolution Center under Module 10 for a period of 30 days. Unresolved disputes are subject to binding individual arbitration in Broward County, Florida, under AAA Consumer Arbitration Rules, with a class action waiver. Either party may bring an individual claim in small-claims court.</p>
        </Section>

        {/* MÓDULO 10 — SECURITY DEPOSIT & DAMAGE */}
        <Section id="deposit-damage" title="Module 10 — Security Deposit & Damage Policy">
            <h3>1. Security deposit</h3>
            <p>A security deposit is <strong>held (not charged)</strong> on the Renter's payment method via Stripe from Booking confirmation until 24 hours after a clean return. Deposit ranges are set by category (see the applicable Category Annex).</p>

            <h3>2. Damage claim window and evidence</h3>
            <p>The Lister must open a damage claim within <strong>24 hours</strong> of the scheduled return time, supported by:</p>
            <ul>
                <li>Timestamped, geotagged photographs from the check-in Condition Report</li>
                <li>Matched photographs from the checkout Condition Report showing the Item's prior condition</li>
                <li>Written description of the damage</li>
                <li>A repair estimate or invoice from a qualified provider</li>
            </ul>
            <p>Claims filed late, or without matched before/after evidence, may be denied.</p>

            <h3>3. Administrative review</h3>
            <p>Goodslister reviews evidence from both parties (handover photos, return photos, EXIF metadata, timestamps, GPS) and issues a non-binding administrative determination within 5 business days.</p>

            <h3>4. Charges</h3>
            <ul>
                <li><strong>Damage below the deposit amount:</strong> charged against the deposit.</li>
                <li><strong>Damage exceeding the deposit:</strong> charged to the Renter's card on file, subject to notification and dispute rights.</li>
                <li><strong>Late return fee:</strong> per-hour rate set by the Lister in the listing (minimum $5/hour, maximum 50% of daily rate per hour), after 30-minute grace period. After 4 hours late, one additional full rental day is charged in lieu of hourly late fees.</li>
                <li><strong>Cleaning fee:</strong> $50–$500 depending on category and severity.</li>
                <li><strong>Fuel shortage:</strong> at market rate plus $25 service fee.</li>
                <li><strong>Missing accessories:</strong> at replacement cost.</li>
                <li><strong>Fines, tolls, citations, impound, towing:</strong> pass-through cost plus $25 administrative fee per event.</li>
            </ul>

            <h3>5. Damage evidence integrity</h3>
            <p>All photographs uploaded to the Platform are stamped with EXIF metadata (GPS, timestamp, device model, editing-software detection). Photographs that fail verification (edited, out-of-window timestamp, GPS mismatch) are rejected. This creates a tamper-evident record for disputes.</p>

            <h3>6. Dispute rights</h3>
            <p>The Renter may dispute a damage determination within 7 days by submitting counter-evidence. Goodslister will review and issue a final administrative determination within 10 business days. Either party may pursue formal dispute resolution per Module 09 Section 16 if unsatisfied.</p>
        </Section>

        {/* MÓDULO 11 — CANCELLATION */}
        <Section id="cancellation" title="Module 11 — Cancellation & Refund Policy">
            <h3>1. Cancellation by Renter</h3>
            <ul>
                <li><strong>More than 24 hours before start:</strong> full refund of rental price. Service Fee is non-refundable.</li>
                <li><strong>Between 24 hours and 2 hours before start:</strong> 50% refund of rental price.</li>
                <li><strong>Less than 2 hours before start, or no-show:</strong> no refund.</li>
            </ul>

            <h3>2. Cancellation by Lister</h3>
            <ul>
                <li>Full refund of all charges including Service Fee.</li>
                <li>Additional $25 platform credit to Renter for inconvenience.</li>
                <li>Lister cancellation rate is tracked. Repeated cancellations may result in account suspension or removal.</li>
            </ul>

            <h3>3. Cancellation by Platform</h3>
            <p>Goodslister may cancel any Booking at its discretion for safety, verification, fraud, or policy-violation reasons. Full refund is issued.</p>

            <h3>4. Force majeure</h3>
            <p>Cancellations caused by acts of nature (hurricane, tropical storm warning, flooding), government orders, or Platform outages receive full refund regardless of timing.</p>

            <h3>5. Modifications</h3>
            <p>Booking modifications (date changes, extensions, additions) require mutual written consent through the Platform. Extensions are treated as new Bookings for cancellation purposes.</p>
        </Section>

        {/* MÓDULO 12 — ASSUMPTION OF RISK */}
        <Section id="assumption-risk" title="Module 12 — Assumption of Risk, Waiver and Release of Liability (General Part)">
            <RiskCallout>
                <p>Read this section carefully. It affects your legal rights. It is a condition of every Booking on Goodslister.</p>
            </RiskCallout>

            <p>This is the <strong>General Part</strong>. It is signed together with the applicable <strong>Category Annex (A–H)</strong>, which contains the specific risk disclosures for the activity you are booking. Neither part stands alone.</p>

            <h3>1. General assumption of risk</h3>
            <AllCapsBlock>
                Renter acknowledges that renting and operating any Item on the Goodslister Platform involves inherent risks, including but not limited to: property damage, personal injury, illness, disability, and death. Renter voluntarily assumes all such risks.
            </AllCapsBlock>

            <h3>2. General release, waiver, and covenant not to sue</h3>
            <AllCapsBlock>
                Renter hereby releases, waives, discharges, and covenants not to sue the Lister, Goodslister LLC, its officers, directors, employees, agents, affiliates, and successors (collectively "Released Parties") from any and all liability, claims, demands, and causes of action arising from Renter's use of the Item, including claims of ordinary negligence by the Released Parties.
            </AllCapsBlock>
            <p>This release does not extend to claims of gross negligence, recklessness, or intentional misconduct by the Released Parties, nor to any claim that cannot be waived under Florida law.</p>

            <h3>3. Indemnification</h3>
            <AllCapsBlock>
                Renter agrees to defend, indemnify, and hold harmless the Released Parties from any claim brought by Renter's passengers, guests, invitees, or any third party arising from Renter's use of the Item or Renter's breach of any provision of the Rental Agreement or applicable Category Annex.
            </AllCapsBlock>

            <h3>4. Category-specific risks</h3>
            <p>Additional, activity-specific risk disclosures and assumptions of risk are set out in the applicable <strong>Category Annex</strong>. Renter must read and initial the Category Annex before the Booking is confirmed.</p>

            <h3>5. Insurance is not provided by Goodslister</h3>
            <p>Renter acknowledges that Goodslister does not provide insurance of any kind. Any protection program offered through the Platform is not insurance, is subject to separate terms, and does not replace Renter's obligation to carry insurance where required by law.</p>

            <h3>6. Class action waiver</h3>
            <AllCapsBlock>
                Renter agrees that any dispute will be resolved by individual arbitration and not as a class, collective, or representative action. Renter waives the right to participate in a class action against the Released Parties.
            </AllCapsBlock>
            <p>Renter may opt out of arbitration within 30 days of first accepting these terms by written notice to legal@goodslister.com. Opting out does not affect any other provision of this Agreement.</p>

            <h3>7. Governing law and venue</h3>
            <p>This waiver is governed by Florida law without regard to conflict-of-law rules. Any judicial proceeding permitted despite the arbitration clause will be filed exclusively in the state or federal courts located in Broward County, Florida.</p>

            <h3>8. Severability</h3>
            <p>If any provision of this waiver is found unenforceable, the remaining provisions remain in full effect. Where a provision may be enforced in a narrower form, it shall be construed to the maximum extent permitted by Florida law.</p>

            <AllCapsBlock>
                Participant acknowledgment (general part): I have read this general part in full. I understand it and voluntarily agree to it, including the release of ordinary negligence in Section 2, the indemnification in Section 3, and the class action waiver in Section 6. I have also read and signed the Category Annex applicable to my booking.
            </AllCapsBlock>
        </Section>
    </LegalPageLayout>
);


// ============================================================================
// CATEGORY ANNEXES — Signed together with Module 12 (General Part).
// Each annex applies ONLY to items of its category.
// ============================================================================

// ANNEX A — MOTORCYCLES
export const AnnexMotorcyclesPage: React.FC = () => (
    <LegalPageLayout
        title="Annex A — Motorcycles"
        subtitle="Adventure · Cruiser · Sport · Touring · Dual-Sport · e-moto · Scooters & Mopeds · Three-Wheelers & Slingshots · Dirt bikes. Signed together with Module 12 (General Part). Does not stand alone."
        metaDescription="Goodslister Annex A - Motorcycle rental rules for Florida. Motorcycle endorsement, DOT helmet mandatory, dangerous instrumentality notice, specific risk disclosure."
        accent="rose"
    >
        <InfoBox kind="warn">
            <strong>This Annex is part of a two-part agreement.</strong> It is signed together with the Assumption of Risk, Waiver and Release of Liability — General Part (Module 12) and the Rental Agreement (Transactional Core). It does not stand alone.
        </InfoBox>

        <Section id="eligibility-motorcycles" title="A1. Eligibility — Blocking requirements">
            <ul>
                <li><strong>Minimum age:</strong> 21; <strong>25</strong> for Sport and any Item over 750cc.</li>
                <li><strong>License:</strong> valid, unexpired driver license with <strong>motorcycle endorsement</strong> for every street-legal Item (Fla. Stat. § 322.03).</li>
                <li><strong>Experience:</strong> minimum 2 years licensed riding experience for Items over 600cc.</li>
                <li><strong>Identity:</strong> Stripe Identity verification completed; ID at handoff must match the verified account.</li>
                <li><strong>Three-Wheelers / Slingshots:</strong> confirm the endorsement class required for the specific vehicle type.</li>
                <li><strong>Dirt bikes / e-moto:</strong> no street license required if off-road only, but the Renter must confirm a lawful place to ride.</li>
            </ul>
            <AllCapsBlock>
                If you do not meet every requirement above, you may not book. Misrepresenting your license, endorsement, or experience is a material breach, voids any protection program, may void the Owner's insurance, and makes you fully liable for all resulting loss.
            </AllCapsBlock>
        </Section>

        <Section id="safety-motorcycles" title="A2. Required safety equipment — Mandatory at all times">
            <ul>
                <li><strong>DOT-approved helmet for the operator and every passenger.</strong> Goodslister requires helmets as a contractual condition of every motorcycle rental <em>regardless of any Florida adult helmet exemption</em>. Riding without a helmet is a breach of this Annex.</li>
                <li>Eye protection (face shield, goggles, or shatter-resistant glasses).</li>
                <li>Over-the-ankle footwear, full-finger gloves, and long pants.</li>
                <li>An abrasion-resistant jacket is strongly recommended.</li>
            </ul>
        </Section>

        <Section id="use-motorcycles" title="A3. Permitted use and Geographic Limits">
            <p>Lawful, personal, recreational road riding only, within the posted Geographic Limits, within the manufacturer's rated capacity. Dirt bikes and e-moto Items are <strong>off-road only</strong> unless the listing expressly states the Item is street-legal and registered.</p>
        </Section>

        <Section id="prohibited-motorcycles" title="A4. Prohibited uses">
            <p>Track days, racing, timed events, or any competition; stunt riding, wheelies, burnouts, or jumping; lane splitting where unlawful; carrying a passenger unless the listing and the Item permit it; group-ride escort or lead-rider services; instruction or teaching; delivery, courier, or ride-hail work; off-road use of a street Item; towing; operating with any alcohol or impairing substance in your system; modifying, disabling, or removing exhaust, lighting, ECU, or safety equipment; and operating outside the Geographic Limits.</p>
        </Section>

        <Section id="risks-motorcycles" title="A5. Specific risk disclosure — Motorcycles">
            <RiskCallout>
                <p>I understand that riding a motorcycle is one of the most dangerous forms of road transportation and carries a substantially higher risk of death and catastrophic injury per mile than driving an automobile. There is no enclosure, no airbag, and no crumple zone between my body and the road or another vehicle.</p>
            </RiskCallout>
            <p>I specifically understand and assume the risks of:</p>
            <ul>
                <li>Being struck by a car, truck, or other vehicle whose driver fails to see me or fails to yield;</li>
                <li>Low-side and high-side loss of control;</li>
                <li>Loss of traction on sand, gravel, painted lines, wet or oily pavement, tar snakes, and metal surfaces;</li>
                <li>Road debris, potholes, and pavement seams; collision with an animal;</li>
                <li><strong>Road rash, degloving injury, compound fracture, amputation, spinal cord injury, traumatic brain injury, paralysis, and death;</strong></li>
                <li>Being trapped or crushed under the motorcycle;</li>
                <li>Contact with hot exhaust pipes and engine components causing serious burns; fuel fire;</li>
                <li>Countersteering and braking behavior that differs sharply from a car;</li>
                <li>Wind blast, crosswind, and truck turbulence at speed;</li>
                <li><strong>Reduced conspicuity to other drivers, especially at intersections and at dusk;</strong></li>
                <li>Passenger weight altering handling, braking distance, and cornering;</li>
                <li>Three-wheeler or Slingshot handling that differs from both a motorcycle and a car and can behave unpredictably to a rider trained on either.</li>
            </ul>
            <p>For <strong>dirt bikes and off-road Items</strong> I additionally assume the risks of jumps and airborne landings, hidden terrain hazards, ruts, rocks, stumps, water crossings, remote locations with delayed emergency response, and collision with trees and other riders.</p>
        </Section>

        <Section id="photos-motorcycles" title="A6. Photographic checklist — Condition Report">
            <p>Front · rear · both sides · both three-quarter angles · odometer · fuel gauge · <strong>fairings and bodywork close-up</strong> · <strong>exhaust</strong> · levers and controls · mirrors · <strong>chain, belt, or shaft</strong> · front and rear tire tread and sidewall · brake discs and pads · turn signals and lights on · <strong>helmet interior and shell condition</strong> · any pre-existing scratch, dent, or crack in close-up.</p>
        </Section>

        <Section id="lister-motorcycles" title="A7. Lister obligations — Motorcycles">
            <ul>
                <li>Valid registration and, where required, minimum financial responsibility coverage; provide proof on request.</li>
                <li>Written confirmation from your insurer that peer-to-peer rental use is not excluded.</li>
                <li>Verify the Renter's motorcycle endorsement in person at handoff and photograph the license in the Platform (do not retain a copy yourself).</li>
                <li>Supply a correctly sized DOT-approved helmet for the operator and each permitted passenger, clean and free of impact damage.</li>
                <li>Inspect tires, brakes, chain or belt tension, lights, and fluid levels before every handoff.</li>
                <li>Deliver a pre-ride briefing covering controls, brake feel, throttle response, ABS or traction control behavior, fuel type and range, and local road conditions.</li>
            </ul>
            <InfoBox kind="warn">
                <strong>Dangerous Instrumentality Notice:</strong> Under Florida law the owner of a motor vehicle who voluntarily entrusts it to another may be held vicariously and strictly liable for that person's negligent operation. This can expose you personally to a judgment far exceeding the value of the motorcycle. Consult your own attorney and insurance professional before listing.
            </InfoBox>
        </Section>

        <Section id="acknowledgment-motorcycles" title="A8. Participant acknowledgment — This annex">
            <AllCapsBlock>
                I have read this annex in full. I understand the specific risks of this activity described in Section A5. I meet every eligibility requirement in Section A1. I will use the safety equipment in Section A2 at all times and I will not engage in any prohibited use in Section A4. I accept and assume these risks voluntarily, and I agree that the release and indemnity in the general part (Module 12) apply to every risk described here, including risks arising from the ordinary negligence of the Released Parties.
            </AllCapsBlock>
        </Section>
    </LegalPageLayout>
);

// ANNEX B — BIKES
export const AnnexBikesPage: React.FC = () => (
    <LegalPageLayout
        title="Annex B — Bikes"
        subtitle="Mountain · Road · Hybrid · BMX · E-Bike. Signed together with Module 12 (General Part). Does not stand alone."
        metaDescription="Goodslister Annex B - Bicycle rental rules. Helmet required, e-bike specifics, lithium battery safety, specific risk disclosure."
        accent="rose"
    >
        <InfoBox kind="warn">
            <strong>This Annex is part of a two-part agreement.</strong> Signed together with Module 12 (General Part) and the Rental Agreement. Does not stand alone.
        </InfoBox>

        <Section id="eligibility-bikes" title="B1. Eligibility — Blocking requirements">
            <ul>
                <li><strong>Minimum age (Renter of record):</strong> 18.</li>
                <li>Minors riding permitted only with the Minor Participant Consent (Doc 13) signed by parent or guardian, and with adult supervision.</li>
                <li>License: none required.</li>
                <li>E-Bike throttle: no throttle operation by any rider under 16.</li>
                <li>Identity: Stripe Identity verification completed.</li>
            </ul>
        </Section>

        <Section id="safety-bikes" title="B2. Required safety equipment — Mandatory at all times">
            <ul>
                <li><strong>Helmet for every rider,</strong> correctly fitted, free of impact damage. Goodslister requires helmets contractually for all riders of every age.</li>
                <li>Front white light and rear red light for any riding between sunset and sunrise, plus a rear reflector.</li>
                <li>Closed-toe footwear.</li>
            </ul>
        </Section>

        <Section id="use-bikes" title="B3. Permitted use and Geographic Limits">
            <p>Lawful, personal, recreational riding on public roads, bike lanes, and paths where bicycles are permitted, and on trails appropriate to the Item type. Ride with traffic, obey all traffic control devices, and yield to pedestrians.</p>
        </Section>

        <Section id="prohibited-bikes" title="B4. Prohibited uses">
            <p>Competitive racing or timed events; downhill bike park, dirt jump, or lift-served terrain unless the listing expressly permits it; carrying a passenger on a bike not designed for one; carrying cargo beyond the rated capacity; child seats or trailers unless the listing permits them and they are properly installed; riding under the influence; delivery or courier work; tampering with an e-bike's speed controller or class setting; and leaving the Item unlocked or unattended in public.</p>
        </Section>

        <Section id="risks-bikes" title="B5. Specific risk disclosure — Bicycles and E-Bikes">
            <RiskCallout>
                <p>I understand that cycling involves a real risk of serious injury and death, principally from collision with motor vehicles and from falls.</p>
            </RiskCallout>
            <p>I specifically understand and assume the risks of:</p>
            <ul>
                <li>Being struck by a car, truck, or bus, including at intersections and by a driver who fails to see me;</li>
                <li>Being doored by a parked vehicle;</li>
                <li>Collision with a pedestrian, another cyclist, or a fixed object;</li>
                <li>Falls caused by potholes, gravel, sand, wet leaves, painted lines, railroad tracks, storm grates, and uneven pavement;</li>
                <li><strong>Head injury, concussion, traumatic brain injury, facial and dental injury, clavicle and wrist fracture, road rash, spinal injury, and death;</strong></li>
                <li>Brake failure, tire blowout, chain or drivetrain failure, and quick-release or thru-axle failure;</li>
                <li>Loss of control descending; heat illness, dehydration, and sun exposure;</li>
                <li>Dog and wildlife encounters.</li>
            </ul>
            <p>For <strong>e-bikes</strong> I additionally understand and assume that the Item is substantially heavier and faster than a conventional bicycle, requires a longer braking distance, accelerates in a way that can surprise an inexperienced rider, and increases the severity of any crash; and that <strong>lithium battery packs can overheat, and must not be charged unattended, charged with a non-original charger, or used if damaged, swollen, or wet.</strong></p>
            <p>For <strong>mountain biking and BMX</strong> I additionally assume the risks of rocks, roots, drops, jumps, technical descents, trail obstacles, and remote locations with delayed rescue.</p>
        </Section>

        <Section id="photos-bikes" title="B6. Photographic checklist — Condition Report">
            <p>Both sides · front · rear · <strong>drivetrain and chain</strong> · <strong>brake pads and rotors or rims</strong> · both tires including sidewall · saddle and seatpost · handlebar and grips · frame close-up at head tube, down tube, and chainstay · any pre-existing scratch, dent, or crack · <strong>e-bike: battery, charge level display, charger, and key</strong> · helmet interior and shell · lights and lock.</p>
        </Section>

        <Section id="lister-bikes" title="B7. Lister obligations — Bicycles">
            <ul>
                <li>Confirm brakes, tire pressure, quick-release or thru-axle security, and drivetrain function before every handoff.</li>
                <li>Supply a correctly sized, undamaged helmet with each Item and a functioning lock.</li>
                <li>Adjust saddle height for the Renter and confirm reach and standover clearance.</li>
                <li>Disclose the e-bike class (1, 2, or 3), top assisted speed, range, and any local restriction on where that class may be ridden.</li>
                <li>Supply the original manufacturer charger and battery-safety instructions.</li>
                <li>Do not list a bicycle with a cracked frame, a recalled fork, or a damaged carbon component.</li>
            </ul>
        </Section>

        <Section id="acknowledgment-bikes" title="B8. Participant acknowledgment — This annex">
            <AllCapsBlock>
                I have read this annex in full. I understand the specific risks of this activity described in Section B5. I meet every eligibility requirement in Section B1. I will use the safety equipment in Section B2 at all times and I will not engage in any prohibited use in Section B4. I accept and assume these risks voluntarily, and I agree that the release and indemnity in the general part (Module 12) apply to every risk described here.
            </AllCapsBlock>
        </Section>
    </LegalPageLayout>
);


// ANNEX C — BOATS & VESSELS
export const AnnexBoatsPage: React.FC = () => (
    <LegalPageLayout
        title="Annex C — Boats & Vessels"
        subtitle="Speedboat · Fishing Boat · Sailboat · Pontoon · Yacht. MAXIMUM LEGAL RISK CATEGORY. Signed together with Module 12 (General Part). Does not stand alone."
        metaDescription="Goodslister Annex C - Boat rental rules for Florida. Boating Safety ID required, USCG safety equipment, livery permit under Fla. Stat. 327.54, specific risk disclosure."
        accent="rose"
    >
        <InfoBox kind="warn">
            <strong>Maximum legal risk category.</strong> Lister: read Section C7 before publishing. Non-compliance with Fla. Stat. § 327.54 may constitute a first-degree misdemeanor in Florida.
        </InfoBox>

        <Section id="eligibility-boats" title="C1. Eligibility — Blocking requirements">
            <ul>
                <li><strong>Minimum age (operator):</strong> 21; <strong>25</strong> for any vessel over 26 feet.</li>
                <li><strong>Boating safety:</strong> operator must present a <strong>Florida Boating Safety Education Identification Card</strong> where required under Fla. Stat. § 327.395, or qualify for a statutory exemption. The Platform blocks checkout until this is confirmed.</li>
                <li>Photo ID matching the Stripe Identity verified account.</li>
                <li><strong>Capacity:</strong> the number of persons intending to board may never exceed the capacity plate limit. Renting in excess of the maximum safety load is prohibited by statute.</li>
                <li>Self-declared experience level; the Lister may decline handoff for insufficient competency.</li>
            </ul>
        </Section>

        <Section id="safety-boats" title="C2. Required safety equipment — Mandatory at all times">
            <ul>
                <li><strong>USCG-approved personal flotation device for every person aboard,</strong> correctly sized, accessible, and worn by all children as required by law.</li>
                <li>All safety equipment required by Fla. Stat. § 327.50 and federal regulation: fire extinguisher with a current tag, visual distress signals, sound-producing device, navigation lights, and throwable flotation where applicable.</li>
                <li><strong>Engine cut-off switch lanyard worn by the operator at all times</strong> where the vessel is equipped.</li>
                <li>Functional bilge pump, VHF radio or charged mobile phone in a waterproof case, anchor and rode, and a first aid kit.</li>
            </ul>
        </Section>

        <Section id="use-boats" title="C3. Permitted use and Geographic Limits — Mandatory">
            <p>Lawful, personal, recreational boating only, within the stated Geographic Limits, in daylight unless the listing expressly permits night operation, and within the vessel's design category and the prevailing conditions.</p>
            <p><strong>Default limits unless the listing states otherwise:</strong> Florida inland and coastal waters only · no international crossings · no operation during a Small Craft Advisory or higher.</p>
        </Section>

        <Section id="prohibited-boats" title="C4. Prohibited uses">
            <p>Carrying passengers for hire or operating any charter; commercial fishing; towing skiers, tubers, wakeboarders, or any person unless the listing expressly permits it <strong>and a dedicated spotter is aboard</strong>; overnight habitation unless the listing permits; anchoring on or contacting coral, seagrass, or protected habitat; operating in a manatee protection zone above posted speed; discharging waste unlawfully; operating with any alcohol or impairing substance in the operator's system (BUI is criminal — Fla. Stat. § 327.35); exceeding the capacity plate; disabling the bilge pump, kill switch, or navigation lights; beaching a vessel not designed for beaching; and operating in a named tropical storm or hurricane warning area.</p>
        </Section>

        <Section id="risks-boats" title="C5. Specific risk disclosure — Vessels">
            <RiskCallout>
                <p>I understand that boating involves the risk of drowning and death. Help may be hours away. There is no guarantee of rescue.</p>
            </RiskCallout>
            <p>I specifically understand and assume the risks of:</p>
            <ul>
                <li><strong>DROWNING,</strong> including after a fall overboard, after capsizing, and after loss of consciousness;</li>
                <li>Capsizing, swamping, broaching, and sinking;</li>
                <li>Being struck by the vessel or by another vessel;</li>
                <li><strong>Propeller strike causing laceration, amputation, and death;</strong></li>
                <li>Carbon monoxide poisoning from the engine, generator, or from the station-wagon effect at the swim platform;</li>
                <li>Collision with another vessel, a dock, a piling, a channel marker, a sandbar, a reef, a rock, or a submerged or floating object;</li>
                <li>Grounding and the need for salvage;</li>
                <li>Sudden and unforecast weather change, thunderstorms, lightning strike, waterspouts, squalls, and building seas;</li>
                <li>Wake, current, tide, and rip current;</li>
                <li><strong>Hypothermia even in Florida waters,</strong> and heat illness, dehydration, and severe sun exposure;</li>
                <li>Marine animal injury including sharks, rays, jellyfish, and coral abrasion;</li>
                <li>Fire, explosion, and fuel vapor ignition;</li>
                <li>Mechanical or electrical failure leaving the vessel disabled far from shore;</li>
                <li>Loss of navigation or communications;</li>
                <li>Falls on wet decks, ladders, and swim platforms;</li>
                <li>Injury while docking, anchoring, or line handling;</li>
                <li>Injury to passengers, including children and non-swimmers, for whom I am responsible.</li>
            </ul>
            <p>For <strong>sailing vessels</strong> I additionally assume the risks of accidental gybe, boom strike, rigging and line injury, winch injury, knockdown, and dismasting.</p>
            <AllCapsBlock>
                I affirm that I and every person aboard are adequately informed of these risks, and that I have assessed the swimming ability of every person aboard.
            </AllCapsBlock>
        </Section>

        <Section id="photos-boats" title="C6. Photographic checklist — Condition Report">
            <p>Bow · stern · port · starboard · <strong>hull below the waterline where visible</strong> · <strong>propeller and lower unit</strong> · engine bay · <strong>bilge</strong> · helm and gauges · engine hour meter · fuel gauge · upholstery and deck · <strong>all PFDs laid out and counted</strong> · <strong>fire extinguisher tag showing current date</strong> · registration decal and capacity plate · anchor and ground tackle · trailer if included · any pre-existing gelcoat crack, blister, or scratch in close-up.</p>
        </Section>

        <Section id="lister-boats" title="C7. Lister obligations — Vessels — READ BEFORE PUBLISHING">
            <InfoBox kind="warn">
                <p><strong>7.1 Livery status.</strong> Florida defines a "livery" as a person who advertises and offers a vessel for use by another in exchange for consideration and who does not provide, or require the renter to provide, a USCG-licensed master. A livery <strong>may not offer a vessel for lease or rent without first obtaining a no-cost livery permit from the commission, renewed annually,</strong> and must: provide a list of all vessels offered, hold valid insurance, keep on site enough USCG-approved PFDs for the capacity of all vessels offered, keep on site all safety equipment required under Fla. Stat. § 327.50, and display the required boating safety information. Changes must be reported within 10 days. <strong>A violation is a misdemeanor of the first degree.</strong> (Fla. Stat. § 327.54)</p>
            </InfoBox>

            <p><strong>7.2 Prohibited rentals.</strong> A livery may not knowingly rent a vessel: where the number of persons intending to use it exceeds the maximum safety load on the capacity plate; where motor horsepower exceeds the vessel's capacity; without the safety equipment required by § 327.50; where the vessel is not <strong>seaworthy</strong>, is derelict, or is at risk of becoming derelict; <strong>without providing pre-rental or pre-ride instruction</strong>; without displaying boating safety information visibly; <strong>without a written agreement with the renter</strong>; or to a person subject to § 327.395 who does not present the required documentation or qualify for an exemption.</p>

            <p><strong>7.3 Mandatory pre-rental instruction.</strong> You must instruct the Renter on, at minimum: the operational characteristics of the specific vessel; safe vessel operation and right-of-way rules; the operator's responsibility for safe and proper operation; and the local characteristics of the waterway where the vessel will be operated.</p>

            <p><strong>7.4 Seaworthiness.</strong> "Seaworthy" means the vessel and all of its parts and equipment, <strong>including engines, bilge pumps, and kill switches,</strong> are functional and reasonably fit for their intended purpose. You warrant this at every handoff.</p>

            <p><strong>7.5 Other obligations.</strong> Maintain current Florida vessel registration; maintain insurance confirmed in writing to cover rental use; verify and photograph the Renter's boating safety education documentation in the Platform; and never allow a handoff where the passenger count exceeds the capacity plate.</p>

            <AllCapsBlock>
                7.6 YOU ARE SOLELY RESPONSIBLE FOR DETERMINING WHETHER YOU ARE A LIVERY AND FOR FULL COMPLIANCE. GOODSLISTER DOES NOT MAKE THAT DETERMINATION FOR YOU AND STRONGLY ADVISES YOU TO CONSULT A FLORIDA ATTORNEY BEFORE LISTING A VESSEL.
            </AllCapsBlock>
        </Section>

        <Section id="acknowledgment-boats" title="C8. Participant acknowledgment — This annex">
            <AllCapsBlock>
                I have read this annex in full. I understand the specific risks of this activity described in Section C5. I meet every eligibility requirement in Section C1. I will use the safety equipment in Section C2 at all times and I will not engage in any prohibited use in Section C4. I accept and assume these risks voluntarily, and I agree that the release and indemnity in the general part (Module 12) apply to every risk described here.
            </AllCapsBlock>
        </Section>
    </LegalPageLayout>
);

// ANNEX D — CAMPING
export const AnnexCampingPage: React.FC = () => (
    <LegalPageLayout
        title="Annex D — Camping"
        subtitle="Roof Top Tents · Overlanding Trailers · Off-Grid Power Kits · Family Glamping Kits · Portable AC/Heaters · Winter Expedition Gear. Signed together with Module 12 (General Part)."
        metaDescription="Goodslister Annex D - Camping equipment rental rules. Carbon monoxide warning, fire safety, wildlife, lithium battery safety, specific risk disclosure."
        accent="rose"
    >
        <InfoBox kind="warn">
            <strong>This Annex is part of a two-part agreement.</strong> Signed together with Module 12 (General Part) and the Rental Agreement.
        </InfoBox>

        <Section id="eligibility-camping" title="D1. Eligibility — Blocking requirements">
            <ul>
                <li><strong>Minimum age:</strong> 18.</li>
                <li>Roof top tents: Renter must confirm the dynamic and static roof load rating of the intended vehicle and that the rack system is rated for the tent.</li>
                <li>Overlanding trailers: valid driver license; tow vehicle within rated towing capacity; functional trailer lights, brakes where required, and safety chains.</li>
                <li>Identity: Stripe Identity verification completed.</li>
            </ul>
        </Section>

        <Section id="safety-camping" title="D2. Required safety equipment — Mandatory">
            <ul>
                <li><strong>Working carbon monoxide detector in any enclosed sleeping space where a fuel-burning appliance or generator is used nearby.</strong></li>
                <li>Fire extinguisher rated for the appliances included.</li>
                <li>First aid kit and a means of emergency communication appropriate to the location.</li>
                <li>Manufacturer instructions for every appliance, supplied with the Item.</li>
            </ul>
        </Section>

        <Section id="use-camping" title="D3. Permitted use">
            <p>Lawful, personal, recreational camping on permitted campgrounds, private land with the owner's permission, and designated dispersed camping areas. Comply with all fire restrictions and burn bans.</p>
        </Section>

        <Section id="prohibited-camping" title="D4. Prohibited uses">
            <AllCapsBlock>
                Operating any fuel-burning heater, stove, lantern, grill, or generator inside a tent, vehicle, trailer, awning, or any enclosed or partially enclosed space.
            </AllCapsBlock>
            <p>Also prohibited: use during an active burn ban without full compliance; modification, repair, or adaptation of any gas appliance, regulator, or hose; using a non-original charger with a power station or lithium battery; charging a damaged, swollen, or wet battery; exceeding a roof rack's rated load; towing beyond the tow vehicle's rated capacity; leaving children unattended in or under a roof top tent; and using winter expedition gear outside its rated temperature range.</p>
        </Section>

        <Section id="risks-camping" title="D5. Specific risk disclosure — Camping and Overlanding">
            <RiskCallout>
                <p>I understand that carbon monoxide is colorless, odorless, and kills people in tents and vehicles every year. I will never run a heater, stove, grill, or generator in an enclosed space.</p>
            </RiskCallout>
            <p>I specifically understand and assume the risks of:</p>
            <ul>
                <li><strong>Carbon monoxide poisoning and death</strong> from heaters, stoves, grills, generators, and vehicle exhaust;</li>
                <li><strong>Fire, burns, and explosion</strong> from propane, butane, liquid fuel, campfires, and lanterns;</li>
                <li><strong>Lithium battery thermal runaway, fire, and toxic smoke</strong> from power stations, battery packs, and chargers;</li>
                <li>Electrical shock from generators, shore power, inverters, and wet connections;</li>
                <li><strong>Falls from a roof top tent, its ladder, or a vehicle roof, including at night and while half-asleep,</strong> causing fracture, spinal injury, and death;</li>
                <li>Roof top tent or rack failure and collapse;</li>
                <li>Trailer sway, jackknife, unhitching, and loss of control while towing;</li>
                <li><strong>Remote locations with no cellular signal and emergency response measured in hours, not minutes;</strong></li>
                <li>Hypothermia, frostbite, heat stroke, and dehydration;</li>
                <li>Severe weather, lightning, flash flooding, and falling trees or limbs;</li>
                <li>Wildlife encounters including bears, snakes, alligators, and rodents, and insect-borne illness;</li>
                <li>Contaminated water and foodborne illness;</li>
                <li>Cuts, burns, and crush injuries during setup and takedown;</li>
                <li>Injury to children and pets, for whom I am solely responsible.</li>
            </ul>
        </Section>

        <Section id="lister-camping" title="D7. Lister obligations — Camping">
            <ul>
                <li>Supply and test a working carbon monoxide detector with any enclosed-space Item or fuel-burning appliance, and photograph it working in the Condition Report.</li>
                <li>Inspect every gas hose, regulator, and fitting for cracks and leaks before each handoff, and leak-test connections.</li>
                <li>Supply the original manufacturer charger for every battery or power station; never list a swollen, damaged, or previously water-damaged battery.</li>
                <li>Brief the Renter on: appliance operation and shutoff, CO danger, fire safety, ladder and roof top tent use at night, weight ratings, and setup and takedown.</li>
                <li>For trailers: confirm the coupler, chains, lights, brakes, and tire condition and provide the loaded weight and tongue weight.</li>
                <li>Do not list any appliance that has been modified, repaired with non-original parts, or is subject to an open recall.</li>
            </ul>
        </Section>

        <Section id="acknowledgment-camping" title="D8. Participant acknowledgment — This annex">
            <AllCapsBlock>
                I have read this annex in full. I understand the specific risks of this activity described in Section D5. I meet every eligibility requirement in Section D1. I will use the safety equipment in Section D2 at all times and I will not engage in any prohibited use in Section D4. I accept and assume these risks voluntarily.
            </AllCapsBlock>
        </Section>
    </LegalPageLayout>
);

// ANNEX E — WINTER SPORTS
export const AnnexWinterSportsPage: React.FC = () => (
    <LegalPageLayout
        title="Annex E — Winter Sports"
        subtitle="Skis · Snowboard · Snowshoes · Sled · Ice Skates. Signed together with Module 12 (General Part)."
        metaDescription="Goodslister Annex E - Winter sports rental rules. Binding responsibility, backcountry safety, specific risk disclosure."
        accent="rose"
    >
        <InfoBox kind="warn">
            <strong>This Annex is part of a two-part agreement.</strong> Signed together with Module 12 (General Part) and the Rental Agreement.
        </InfoBox>

        <Section id="eligibility-winter" title="E1. Eligibility — Blocking requirements">
            <ul>
                <li><strong>Minimum age (Renter of record):</strong> 18.</li>
                <li>Minors permitted only with the Minor Participant Consent (Doc 13) and adult supervision.</li>
                <li><strong>Binding settings:</strong> the Renter is solely responsible for having ski or snowboard bindings adjusted and tested by a certified technician to their height, weight, boot sole length, age, and skier type before use.</li>
                <li>Identity: Stripe Identity verification completed.</li>
            </ul>
        </Section>

        <Section id="safety-winter" title="E2. Required safety equipment">
            <ul>
                <li>Helmet: strongly recommended for all users, and <strong>required</strong> for minors and for any terrain park use.</li>
                <li>Eye protection (goggles or sunglasses) and sun protection.</li>
                <li>Wrist guards strongly recommended for snowboarders and skaters.</li>
                <li>Backcountry use, if permitted by the listing: avalanche transceiver, probe, and shovel, plus documented avalanche training.</li>
            </ul>
        </Section>

        <Section id="use-winter" title="E3. Permitted use">
            <p>Lawful, personal, recreational use at open, patrolled resorts and on public terrain appropriate to the Item and to your ability, in accordance with <strong>Your Responsibility Code</strong> and all posted signage and closures.</p>
        </Section>

        <Section id="prohibited-winter" title="E4. Prohibited uses">
            <p>Competitive racing or timed events; terrain park, halfpipe, rail, or jump use unless the listing expressly permits it; <strong>backcountry or out-of-bounds travel without avalanche training and a full avalanche safety kit</strong>; use on closed terrain or during avalanche control; skiing or riding under the influence; sledding on roads, near traffic, or on unmarked terrain with obstacles; ice skating on natural ice that has not been verified safe by an authority; and <strong>adjusting, altering, or attempting to service the bindings yourself.</strong></p>
        </Section>

        <Section id="risks-winter" title="E5. Specific risk disclosure — Winter sports">
            <RiskCallout>
                <p>I understand that snow sports involve the risk of serious injury, paralysis, and death, and that changing conditions and obstacles may not be marked or visible.</p>
            </RiskCallout>
            <p>I specifically understand and assume the risks of:</p>
            <ul>
                <li>Falls at speed;</li>
                <li><strong>Collision with trees, lift towers, snow guns, rocks, fences, and other skiers or riders;</strong></li>
                <li><strong>Head injury and traumatic brain injury even while wearing a helmet;</strong></li>
                <li>Knee ligament injury, wrist and clavicle fracture, shoulder dislocation, and spinal cord injury;</li>
                <li><strong>Binding failure to release, causing lower-leg and knee injury, or premature release, causing a fall</strong> — I understand that no binding can prevent all injury and that binding function depends on correct professional adjustment;</li>
                <li>Variable and changing snow conditions including ice, slush, powder, crust, moguls, and man-made snow;</li>
                <li><strong>Hidden obstacles under the snow surface, tree wells, and deep snow immersion suffocation;</strong></li>
                <li>Cliffs, drop-offs, cornices, and unmarked hazards;</li>
                <li><strong>Avalanche;</strong></li>
                <li>Frostbite, hypothermia, snow blindness, altitude illness, and dehydration;</li>
                <li>Chairlift loading, riding, and unloading injury;</li>
                <li>Collision caused by the negligence of another skier or rider;</li>
                <li>Delayed ski patrol response and delayed evacuation;</li>
                <li>Equipment that is worn, mis-sized, or unsuited to my ability.</li>
            </ul>
        </Section>

        <Section id="lister-winter" title="E7. Lister obligations — Winter sports">
            <ul>
                <li><strong>Do not adjust bindings yourself and do not represent that bindings are set for the Renter.</strong> State in the listing that the Renter must have bindings professionally adjusted and tested, and include this in the handoff briefing.</li>
                <li>Disclose the last professional shop service date and the current release setting shown on the binding.</li>
                <li>Do not list skis or a board with a cracked edge, a core shot to the base, delamination, a bent binding, or a helmet with any impact history.</li>
                <li>Confirm boot sole length compatibility and disclose the binding's compatible sole norms.</li>
                <li>Supply clean, undamaged, correctly sized helmets where included.</li>
                <li>Brief the Renter on Your Responsibility Code, the resort's boundary and closure policy, and local avalanche conditions where relevant.</li>
            </ul>
        </Section>

        <Section id="acknowledgment-winter" title="E8. Participant acknowledgment — This annex">
            <AllCapsBlock>
                I have read this annex in full. I understand the specific risks of this activity described in Section E5. I meet every eligibility requirement in Section E1. I will use the safety equipment in Section E2 at all times and I will not engage in any prohibited use in Section E4. I accept and assume these risks voluntarily.
            </AllCapsBlock>
        </Section>
    </LegalPageLayout>
);


// ANNEX F — WATER SPORTS
export const AnnexWaterSportsPage: React.FC = () => (
    <LegalPageLayout
        title="Annex F — Water Sports"
        subtitle="Kayak · Surfboard · Paddleboard · Wakeboard · Jet Ski · Wingfoil · Kitesurf. Signed together with Module 12 (General Part)."
        metaDescription="Goodslister Annex F - Water sports rental rules for Florida. PFD mandatory, Florida Boating Card for Jet Ski, swimming ability required, specific risk disclosure."
        accent="rose"
    >
        <InfoBox kind="warn">
            <strong>This Annex is part of a two-part agreement.</strong> Signed together with Module 12 (General Part) and the Rental Agreement.
        </InfoBox>

        <Section id="eligibility-water" title="F1. Eligibility — Blocking requirements">
            <ul>
                <li><strong>Minimum age:</strong> 18; <strong>21 for Jet Ski / personal watercraft.</strong></li>
                <li><strong>Jet Ski / PWC:</strong> Florida Boating Safety Education Identification Card where required under Fla. Stat. § 327.395. The Platform blocks checkout until confirmed.</li>
                <li><strong>Swimming ability:</strong> the Renter affirms that they and every participant can swim competently in the conditions expected. This is a blocking self-certification.</li>
                <li><strong>Kitesurf / Wingfoil:</strong> prior certified instruction or demonstrated competency required. These Items are not available to beginners without an instructor.</li>
                <li>Identity: Stripe Identity verification completed.</li>
            </ul>
        </Section>

        <Section id="safety-water" title="F2. Required safety equipment — Mandatory at all times">
            <ul>
                <li><strong>USCG-approved PFD worn at all times</strong> for jet ski, kayak, paddleboard, and wingfoil; carried and available for surf and wake use as required.</li>
                <li><strong>Engine cut-off switch lanyard attached to the operator at all times on any Jet Ski / PWC.</strong></li>
                <li>Leash for surfboard, paddleboard, and wingfoil; quick-release safety leash and functioning depower system for kitesurf.</li>
                <li>Helmet and impact vest strongly recommended for wakeboard, kitesurf, and wingfoil.</li>
                <li>Whistle or sound-producing device, and a means of communication or signaling appropriate to the location.</li>
            </ul>
        </Section>

        <Section id="use-water" title="F3. Permitted use and Geographic Limits">
            <p>Lawful, personal, recreational use in daylight only, within the stated distance from shore, in conditions appropriate to your skill, and away from swimmers, moorings, channels, and restricted areas.</p>
            <p><strong>Default limits unless the listing states otherwise:</strong> daylight only · maximum distance from shore per listing · no operation during a Small Craft Advisory or higher · no operation in a designated swim zone.</p>
        </Section>

        <Section id="prohibited-water" title="F4. Prohibited uses">
            <p>Operating a jet ski between sunset and sunrise; <strong>jumping the wake of another vessel within 100 feet</strong>; weaving through congested traffic, or any reckless operation; carrying more riders than the manufacturer's rated capacity; towing any person without a dedicated spotter aboard and without the listing's express permission; operating in a surf zone or designated swim area where swimmers are present; exceeding the stated distance from shore; use under the influence of alcohol or any impairing substance; kitesurfing or wingfoiling in offshore wind, in a thunderstorm, or above the rider's certified skill level; removing or disabling the cut-off lanyard, leash, or quick-release; and use by any person who cannot swim.</p>
        </Section>

        <Section id="risks-water" title="F5. Specific risk disclosure — Water sports">
            <RiskCallout>
                <p>I understand that water sports carry a real risk of drowning and death, that I may be separated from my equipment and from shore, and that rescue may be delayed or may not come.</p>
            </RiskCallout>
            <p>I specifically understand and assume the risks of:</p>
            <ul>
                <li><strong>DROWNING,</strong> including after impact, loss of consciousness, entanglement, or exhaustion;</li>
                <li>Being carried out by <strong>rip current, tide, wind, and offshore drift</strong>;</li>
                <li>Separation from my board, craft, or leash;</li>
                <li><strong>Impact with my own board, fin, mast, or foil, and with the seabed, causing laceration, fracture, spinal injury, and death</strong> — I understand that hydrofoil equipment is exceptionally sharp and causes severe lacerating injury;</li>
                <li>Collision with another rider, a swimmer, a vessel, a dock, a piling, a buoy, a sandbar, a reef, or a submerged object;</li>
                <li><strong>Shallow-water diving and neck injury;</strong></li>
                <li><strong>Propeller strike on a jet ski, causing amputation,</strong> and <strong>orifice injury from jet thrust,</strong> for which a wetsuit bottom is recommended;</li>
                <li>Capsizing and entrapment in a kayak;</li>
                <li><strong>Hypothermia even in Florida waters,</strong> and heat illness, dehydration, and severe sun exposure;</li>
                <li>Marine animal injury including sharks, rays, jellyfish, and coral;</li>
                <li><strong>Being lofted, dragged, or slammed by a kite,</strong> and kite line injury, entanglement, and strangulation;</li>
                <li>Sudden squalls, wind shifts, lightning, and unforecast weather;</li>
                <li>Mechanical failure of a jet ski leaving me adrift;</li>
                <li>Being struck by a boat whose operator does not see me.</li>
            </ul>
            <AllCapsBlock>
                I affirm that I and every participant can swim competently in the conditions expected, and that I have honestly represented my skill level.
            </AllCapsBlock>
        </Section>

        <Section id="lister-water" title="F7. Lister obligations — Water sports">
            <ul>
                <li>Supply correctly sized, USCG-approved PFDs and confirm the Renter will wear them.</li>
                <li>For any Jet Ski / PWC: maintain current Florida vessel registration and insurance confirmed for rental use; <strong>verify and photograph the Renter's boating safety education documentation</strong>; supply and demonstrate the engine cut-off lanyard.</li>
                <li><strong>Read Annex C Section 7 — if you advertise and rent a personal watercraft for consideration you may be a "livery" under Fla. Stat. § 327.54, with permit, insurance, equipment, instruction, and written-agreement obligations, and violation is a first-degree misdemeanor.</strong></li>
                <li>Deliver a pre-ride briefing covering the specific craft, right-of-way, local hazards, tide and current, wind direction, distance limits, and what to do if separated from the equipment or the craft fails.</li>
                <li>Verify certification or demonstrated competency before handing over kitesurf or wingfoil equipment, and refuse handoff to a beginner.</li>
                <li>Inspect leashes, quick-releases, fin screws, foil hardware, and kite lines before every handoff and replace anything worn.</li>
                <li>Never list equipment with a compromised leash plug, a cracked foil mast, or frayed kite lines.</li>
            </ul>
        </Section>

        <Section id="acknowledgment-water" title="F8. Participant acknowledgment — This annex">
            <AllCapsBlock>
                I have read this annex in full. I understand the specific risks of this activity described in Section F5. I meet every eligibility requirement in Section F1. I will use the safety equipment in Section F2 at all times and I will not engage in any prohibited use in Section F4. I accept and assume these risks voluntarily.
            </AllCapsBlock>
        </Section>
    </LegalPageLayout>
);

// ANNEX G — RVs
export const AnnexRVsPage: React.FC = () => (
    <LegalPageLayout
        title="Annex G — RVs"
        subtitle="Class A · Class C · Campervan · Travel Trailer · Fifth Wheel. Signed together with Module 12 (General Part)."
        metaDescription="Goodslister Annex G - RV rental rules. Class license requirements, mileage limits, CO detector, no smoking, dangerous instrumentality notice, specific risk disclosure."
        accent="rose"
    >
        <InfoBox kind="warn">
            <strong>This Annex is part of a two-part agreement.</strong> Signed together with Module 12 (General Part) and the Rental Agreement.
        </InfoBox>

        <Section id="eligibility-rvs" title="G1. Eligibility — Blocking requirements">
            <ul>
                <li><strong>Minimum age:</strong> 25.</li>
                <li><strong>License:</strong> valid driver license. The Renter must confirm the license class required for the Item's GVWR in every state of travel. Some combinations require a non-commercial Class B or an endorsement.</li>
                <li><strong>Towing:</strong> for any towed Item, the tow vehicle must meet or exceed the trailer's GVWR and tongue weight, with a rated hitch, functioning trailer brakes where required, safety chains, and sway control.</li>
                <li><strong>Occupancy:</strong> occupants while in motion may not exceed the number of seatbelt-equipped seating positions.</li>
                <li>Identity: Stripe Identity verification completed.</li>
            </ul>
        </Section>

        <Section id="safety-rvs" title="G2. Required safety equipment — Mandatory">
            <ul>
                <li><strong>Functional carbon monoxide detector, propane detector, and smoke detector,</strong> tested at handoff and photographed in the Condition Report.</li>
                <li>Fire extinguisher with a current charge.</li>
                <li>Wheel chocks, leveling blocks, and a tire pressure gauge.</li>
                <li>Roadside emergency kit including reflective triangles.</li>
            </ul>
        </Section>

        <Section id="use-rvs" title="G3. Permitted use and Geographic Limits">
            <p>Lawful, personal, recreational travel and camping only. The Renter must plan a route accounting for the Item's <strong>height, length, weight, and bridge and tunnel restrictions,</strong> and must comply with all propane transport restrictions.</p>
        </Section>

        <Section id="prohibited-rvs" title="G4. Prohibited uses">
            <p>Use as a permanent or primary residence; commercial hauling, moving services, or freight; <strong>smoking or vaping anywhere inside</strong> (violation: $500 cleaning fee); unauthorized towing behind the Item; open flame, candles, or charcoal grilling inside; operating the generator while sleeping without a verified working CO detector; <strong>dumping wastewater anywhere except an approved dump station</strong>; driving while any occupant is unrestrained in a moving Item; exceeding GVWR, GCWR, or axle ratings; off-road or unimproved-road travel unless the listing permits it; operating outside the Geographic Limits; and pets unless the listing permits them.</p>
        </Section>

        <Section id="risks-rvs" title="G5. Specific risk disclosure — RVs and trailers">
            <RiskCallout>
                <p>I understand that an RV drives, turns, stops, and reacts to wind completely differently from a car, and that my ordinary driving experience does not prepare me for it.</p>
            </RiskCallout>
            <p>I specifically understand and assume the risks of:</p>
            <ul>
                <li><strong>Rollover due to a high center of gravity,</strong> especially in a crosswind, an emergency swerve, or an off-camber shoulder;</li>
                <li><strong>Trailer sway, jackknife, and total loss of control,</strong> which can develop suddenly at highway speed;</li>
                <li>Braking distances far longer than a car's;</li>
                <li><strong>Overhead clearance strikes on bridges, canopies, drive-throughs, and tree limbs</strong> — the single most common RV claim and one that is entirely my responsibility;</li>
                <li>Wide turns, tail swing, and rear overhang striking objects, vehicles, and people;</li>
                <li>Blind spots and severely limited rear visibility;</li>
                <li><strong>Tire blowout, which on a heavy vehicle can cause immediate loss of control;</strong></li>
                <li><strong>Propane leak, fire, and explosion;</strong></li>
                <li><strong>Carbon monoxide poisoning from the generator, the furnace, or the engine,</strong> including while sleeping;</li>
                <li>Electrical shock from shore power, the inverter, or a miswired pedestal;</li>
                <li><strong>Fire from the refrigerator, wiring, or an appliance;</strong></li>
                <li>Slips and falls on steps, ladders, and wet floors;</li>
                <li>Injury from unsecured objects becoming projectiles in a sudden stop;</li>
                <li>Awning and slide-out injury and damage in wind;</li>
                <li>Injury while hitching, unhitching, and leveling;</li>
                <li><strong>Wastewater and sewage exposure;</strong></li>
                <li>Remote breakdown with delayed assistance.</li>
            </ul>
        </Section>

        <Section id="lister-rvs" title="G7. Lister obligations — RVs">
            <ul>
                <li>Provide and test working CO detector, propane detector, and smoke detector at handoff; photograph in Condition Report.</li>
                <li>Provide, in writing, the Item's GVWR, GCWR, tongue weight, height, length, and overhang measurements.</li>
                <li>Brief the Renter on: propane shutoff, generator operation, black/gray water dump procedures, leveling, awning use in wind, and low-clearance route planning.</li>
                <li>Supply the original manufacturer chargers and manuals for every appliance.</li>
                <li>Maintain current registration and insurance confirmed for peer-to-peer rental use.</li>
            </ul>
            <InfoBox kind="warn">
                <strong>Dangerous Instrumentality Notice:</strong> RVs are motor vehicles under Florida law. Lister acknowledges the dangerous instrumentality doctrine may impose vicarious liability and has been advised to consult attorney and insurance professional before listing.
            </InfoBox>
        </Section>

        <Section id="acknowledgment-rvs" title="G8. Participant acknowledgment — This annex">
            <AllCapsBlock>
                I have read this annex in full. I understand the specific risks of this activity described in Section G5. I meet every eligibility requirement in Section G1. I will use the safety equipment in Section G2 at all times and I will not engage in any prohibited use in Section G4. I accept and assume these risks voluntarily.
            </AllCapsBlock>
        </Section>
    </LegalPageLayout>
);

// ANNEX H — ATVs & UTVs
export const AnnexATVsPage: React.FC = () => (
    <LegalPageLayout
        title="Annex H — ATVs & UTVs"
        subtitle="Sport ATV (Quad) · Utility ATV (4x4) · Sport Side-by-Side · Utility UTV · 4-Seater Crew · Dune Buggy · Youth ATV. Signed together with Module 12 (General Part)."
        metaDescription="Goodslister Annex H - ATV UTV rental rules for Florida. Not street-legal on public roads (Fla. Stat. 316.2074), rollover risk, helmet mandatory, specific risk disclosure."
        accent="rose"
    >
        <InfoBox kind="warn">
            <strong>This Annex is part of a two-part agreement.</strong> Signed together with Module 12 (General Part) and the Rental Agreement.
        </InfoBox>

        <Section id="eligibility-atvs" title="H1. Eligibility — Blocking requirements">
            <ul>
                <li><strong>Minimum age (operator):</strong> 21; <strong>25</strong> for Sport Side-by-Side and Dune Buggy.</li>
                <li><strong>Youth ATV:</strong> operator must be within the manufacturer's stated age and size range, must be directly and continuously supervised by a signing adult, and requires the Minor Participant Consent (Doc 13).</li>
                <li><strong>Riding location:</strong> the Renter must identify a <strong>lawful place to ride</strong>: a permitted trail system, a designated OHV area, or private land with the owner's documented permission.</li>
                <li><strong>Passengers:</strong> never more than the manufacturer's rated seating. <strong>No passenger on a single-rider ATV, ever.</strong></li>
                <li>Identity: Stripe Identity verification completed.</li>
            </ul>
        </Section>

        <Section id="safety-atvs" title="H2. Required safety equipment — Mandatory at all times">
            <ul>
                <li><strong>Helmet and eye protection for every operator and every rider.</strong> Under Fla. Stat. § 316.2074, no person under sixteen may operate or ride an ATV without a safety helmet meeting the applicable standard. Goodslister requires them for every rider of every age as a contractual condition.</li>
                <li><strong>Seat belts fastened and doors or safety nets closed at all times in every SxS and UTV.</strong></li>
                <li>Over-the-ankle boots, long pants, long sleeves, and gloves.</li>
                <li>Means of communication or signaling appropriate to a remote location.</li>
            </ul>
        </Section>

        <Section id="use-atvs" title="H3. Permitted use and Geographic Limits">
            <p>Lawful, personal, recreational off-highway use only, on permitted trails, in designated OHV areas, or on private land with the owner's permission, at a speed appropriate to terrain, visibility, and skill.</p>
            <AllCapsBlock>
                Off-highway vehicles are generally NOT street-legal on public paved roads in Florida.
            </AllCapsBlock>
        </Section>

        <Section id="prohibited-atvs" title="H4. Prohibited uses">
            <p>Operation on any public paved road except where expressly and lawfully permitted; <strong>carrying a passenger on a single-rider ATV</strong>; exceeding the rated seating capacity; <strong>riding with a seat belt unfastened or a door or net open in an SxS</strong>; jumps, dune riding, and water crossings unless the listing expressly permits them; racing, timed events, and competition; <strong>any alcohol or impairing substance at any level</strong>; night riding unless the listing permits it and the Item is properly lit; towing beyond the rated capacity; carrying a passenger in a cargo bed; operating a Youth ATV without continuous adult supervision; disabling or removing a governor, speed limiter, roll cage, net, door, or seat belt; and riding alone in a remote area without telling someone the route and return time.</p>
        </Section>

        <Section id="risks-atvs" title="H5. Specific risk disclosure — ATVs and UTVs">
            <RiskCallout>
                <p>I understand that ATVs and UTVs roll over easily — even at low speed, even on flat ground, and even with an experienced operator — and that rollovers crush and kill people. I understand these machines do not handle like a car.</p>
            </RiskCallout>
            <p>I specifically understand and assume the risks of:</p>
            <ul>
                <li><strong>Rollover and crush injury, including crush injury to the head, chest, and limbs, and death;</strong></li>
                <li><strong>Limbs being crushed outside the roll cage in a rollover if I do not keep them inside</strong> — I understand that in an SxS I must keep my arms and legs entirely inside the cage at all times;</li>
                <li>Ejection from the vehicle;</li>
                <li>Loss of traction and control on sand, gravel, mud, loose rock, wet grass, and off-camber terrain;</li>
                <li><strong>Sudden and violent handling changes when a wheel lifts, when braking in a turn, or when a rear wheel catches;</strong></li>
                <li>Jumps and airborne landings;</li>
                <li><strong>Hidden terrain hazards including ruts, stumps, rocks, holes, drop-offs, barbed wire, and cables;</strong></li>
                <li>Collision with trees, other vehicles, and other riders;</li>
                <li><strong>Being struck by a car if I ride on or cross a road;</strong></li>
                <li>Contact with hot exhaust and engine components causing severe burns;</li>
                <li>Dust reducing visibility to zero behind another rider;</li>
                <li>Water crossing, submersion, and drowning;</li>
                <li><strong>Remote locations with no cellular signal and emergency response measured in hours;</strong></li>
                <li>Heat illness, dehydration, and sun exposure;</li>
                <li>Wildlife and insect encounters;</li>
                <li>Whole-body vibration and fatigue;</li>
                <li>Injury to passengers and to minors, for whom I am solely and personally responsible.</li>
            </ul>
            <p>For a <strong>Youth ATV</strong> I additionally acknowledge that the machine is sized for a specific age and body size range, that a child outside that range is at markedly higher risk, and that I will supervise continuously and will not allow a passenger.</p>
        </Section>

        <Section id="lister-atvs" title="H7. Lister obligations — ATVs and UTVs">
            <ul>
                <li>Supply correctly sized helmets and eye protection for every rider, undamaged and clean.</li>
                <li>Verify that all seat belts, nets, doors, and the roll cage are intact and functional before every handoff; <strong>never list an Item with a modified, cut, or repaired roll cage.</strong></li>
                <li>Do not remove or disable governors or speed limiters on Youth or entry-level Items.</li>
                <li>Confirm with the Renter, before handoff, <strong>where they intend to ride and that it is lawful.</strong></li>
                <li>Deliver a pre-ride briefing covering: rollover risk and how to react, keeping limbs inside the cage, throttle and brake feel, four-wheel-drive and differential lock engagement, terrain reading, dust spacing between riders, and the recovery and emergency plan.</li>
                <li>Confirm the Youth ATV rider is within the manufacturer's age and size range and that an adult will supervise continuously.</li>
                <li>Maintain any registration or OHV decal required for the intended riding area.</li>
            </ul>
            <InfoBox kind="warn">
                <strong>Dangerous Instrumentality Notice:</strong> Under Florida law the owner of a motor vehicle who voluntarily entrusts it to another may be held vicariously and strictly liable for that person's negligent operation. This can expose you personally to a judgment far exceeding the value of the machine. Consult your own attorney and insurance professional before listing.
            </InfoBox>
        </Section>

        <Section id="acknowledgment-atvs" title="H8. Participant acknowledgment — This annex">
            <AllCapsBlock>
                I have read this annex in full. I understand the specific risks of this activity described in Section H5. I meet every eligibility requirement in Section H1. I will use the safety equipment in Section H2 at all times and I will not engage in any prohibited use in Section H4. I accept and assume these risks voluntarily.
            </AllCapsBlock>
        </Section>
    </LegalPageLayout>
);
