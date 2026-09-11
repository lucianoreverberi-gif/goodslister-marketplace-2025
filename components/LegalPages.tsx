import React from 'react';

// ============================================================================
// GOODSLISTER LEGAL PAGES — v2.0
// Modular architecture per legal package v2.0 (September 2026)
// All content is DRAFT pending review by Florida-licensed attorney.
// ============================================================================

const LEGAL_VERSION = '2.0';
const LAST_UPDATED = 'September 11, 2026';

// Shared layout for all legal pages
const LegalPageLayout: React.FC<{
    title: string;
    subtitle: string;
    metaDescription: string;
    children: React.ReactNode;
}> = ({ title, subtitle, metaDescription, children }) => {
    React.useEffect(() => {
        document.title = `${title} - Goodslister`;
        const meta = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'description' }));
        meta.setAttribute('content', metaDescription);
        window.scrollTo(0, 0);
    }, [title, metaDescription]);

    return (
        <div className="bg-white min-h-screen">
            <div className="bg-gradient-to-br from-slate-900 to-cyan-950 py-12 sm:py-16 text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    <span className="text-cyan-400 font-bold tracking-wider uppercase text-xs">Legal · Version {LEGAL_VERSION}</span>
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
                <div className="prose prose-slate max-w-none prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-gray-700 prose-strong:text-gray-900 prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Small helper for section headings
const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
    <section id={id} className="mb-8">
        <h2>{title}</h2>
        {children}
    </section>
);

// ============================================================================
// MÓDULO 01 — TERMS OF SERVICE
// ============================================================================
export const TermsOfServicePage: React.FC = () => (
    <LegalPageLayout
        title="Terms of Service"
        subtitle="These Terms govern your access to and use of Goodslister. By using our platform, you agree to be bound by these Terms."
        metaDescription="Goodslister Terms of Service. Legally binding agreement governing use of goodslister.com and related services. Peer-to-peer adventure gear rental marketplace, Florida."
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="acceptance" title="1. Acceptance of Terms">
            <p>These Terms of Service ("Terms") constitute a legally binding agreement between you and <strong>Goodslister LLC</strong>, a Florida limited liability company ("Goodslister," "we," "us," or "our"), governing your access to and use of goodslister.com, our mobile applications, and all related services (collectively, the "Platform").</p>
            <p className="uppercase font-bold bg-gray-100 p-4 rounded-lg text-sm">By creating an account, listing an item, booking a rental, or otherwise using the Platform, you agree to be bound by these Terms, including the binding arbitration agreement and class action waiver in Section 20. If you do not agree, do not use the Platform.</p>
        </Section>

        <Section id="definitions" title="2. Definitions">
            <ul>
                <li><strong>"Item"</strong> means any vehicle, vessel, equipment, or other property listed for rental on the Platform, including motorcycles, bicycles, boats, camping equipment, winter sports equipment, water sports equipment, recreational vehicles (RVs), and ATVs/UTVs.</li>
                <li><strong>"Lister"</strong> (also "Owner") means a User who lists an Item for rental.</li>
                <li><strong>"Renter"</strong> means a User who books or uses an Item.</li>
                <li><strong>"Booking"</strong> means a confirmed reservation of an Item through the Platform.</li>
                <li><strong>"Rental Period"</strong> means the period from the agreed pickup time to the agreed return time.</li>
                <li><strong>"Rental Agreement"</strong> means the Master Rental Agreement formed directly between a Lister and a Renter.</li>
                <li><strong>"Service Fee"</strong> means the commission and fees retained by Goodslister, currently between 10% and 15% of the Rental Price, as disclosed at checkout.</li>
                <li><strong>"Condition Report"</strong> means the timestamped photographic and written record of an Item's condition captured at checkout and check-in.</li>
                <li><strong>"User"</strong> means any person accessing the Platform.</li>
            </ul>
        </Section>

        <Section id="marketplace" title="3. Goodslister Is a Marketplace, Not a Rental Company">
            <h3>3.1 Our role</h3>
            <p>Goodslister operates an online marketplace that connects Listers with Renters. Goodslister is <strong>not</strong> a party to any Rental Agreement. Goodslister does not own, lease, operate, control, inspect, maintain, repair, store, transport, deliver, insure, or supervise any Item.</p>
            <h3>3.2 No agency</h3>
            <p>No agency, partnership, joint venture, employment, or franchise relationship is created between Goodslister and any User.</p>
            <h3>3.3 Not a rental car company, livery, broker, or insurer</h3>
            <p>Goodslister is not a rental car company, a vessel livery, an insurance producer, an insurer, a common carrier, a travel agency, or a transportation provider.</p>
            <h3>3.4 Contract formation</h3>
            <p>When a Booking is confirmed, a Rental Agreement is formed <strong>directly and exclusively between the Lister and the Renter</strong>.</p>
            <h3>3.5 Verification is limited</h3>
            <p>Goodslister may use third-party services, including Stripe Identity, to verify certain User information. <strong>Verification is not an endorsement, guarantee, or warranty</strong> of any User's identity, background, character, skill, licensure, competence, insurance status, or fitness to operate any Item.</p>
            <h3>3.6 Listings are User content</h3>
            <p>Goodslister does not verify the accuracy, legality, condition, safety, roadworthiness, seaworthiness, registration status, title, or mechanical fitness of any Item.</p>
        </Section>

        <Section id="eligibility" title="4. Eligibility and Account Registration">
            <h3>4.1 Minimum age</h3>
            <p>You must be at least eighteen (18) years old to create an account. Certain Item categories impose higher minimum ages under the applicable Category Annex.</p>
            <h3>4.2 Accurate information</h3>
            <p>You agree to provide accurate, current, and complete information and to keep it updated.</p>
            <h3>4.3 Identity verification</h3>
            <p>You authorize Goodslister and its vendors (including Stripe) to collect and verify your identity documents, selfie images, and related data.</p>
            <h3>4.4 One account</h3>
            <p>You may maintain only one account unless expressly authorized in writing.</p>
            <h3>4.5 Account security</h3>
            <p>You are responsible for all activity under your account and must notify us immediately at <a href="mailto:trust@goodslister.com">trust@goodslister.com</a> of unauthorized use.</p>
            <h3>4.6 Suspension and termination</h3>
            <p>We may suspend, restrict, or terminate any account at any time, with or without notice, including for suspected fraud, safety risk, misrepresentation, Terms violation, chargeback abuse, or where required by law or by our payment processor.</p>
        </Section>

        <Section id="listing" title="5. Listing Items">
            <p>By listing an Item, you represent and warrant on a continuing basis that: (a) you own the Item outright or hold documented legal authority to rent it; (b) the Item is free of liens or lease restrictions that prohibit rental, or you have obtained written lienholder consent; (c) the Item is registered, titled, and, where required, insured and inspected in accordance with applicable law; (d) the Item is in safe, functional, and legally compliant condition; (e) you have disclosed all known defects, damage, recalls, and mechanical issues; (f) all photographs and descriptions are current and accurate; (g) renting the Item does not violate any law, ordinance, HOA rule, marina rule, insurance policy, or manufacturer restriction; and (h) you hold all licenses, registrations, and permits required, <strong>including, for vessels, any livery permit and related obligations under Fla. Stat. § 327.54</strong>.</p>
            <h3>No circumvention</h3>
            <p>Listers and Renters must not solicit or complete transactions off-Platform for Bookings initiated on the Platform. Circumvention may result in fee assessment equal to the Service Fee that would have been payable, plus termination.</p>
        </Section>

        <Section id="booking" title="6. Booking and Rentals">
            <p>A Booking becomes binding when confirmed on the Platform and payment authorization succeeds. Every Booking incorporates by reference the Master Rental Agreement, the Assumption of Risk and Release (General Part + Category Annex), the Security Deposit and Damage Policy, the Cancellation Policy, and the applicable Category Rules.</p>
            <h3>Condition Reports are mandatory</h3>
            <p>Both parties must complete a Condition Report at checkout and at check-in, including timestamped, geotagged photographs. <strong>Failure by a party to complete a Condition Report may be construed against that party in any damage dispute.</strong></p>
            <h3>Licenses and certifications</h3>
            <p>Renters must hold and present all licenses, endorsements, and certifications required by law for the Item, including a motorcycle endorsement, a valid driver license, and a <strong>Florida Boating Safety Education Identification Card where required under Fla. Stat. § 327.395</strong>.</p>
        </Section>

        <Section id="fees" title="7. Fees, Payments, and Taxes">
            <p>All payments are processed through the Platform via Stripe Connect. Service Fees are disclosed at checkout and are non-refundable except as required by law. Applicable taxes (sales, tourist development, marketplace facilitator) are collected and remitted where required.</p>
        </Section>

        <Section id="prohibited" title="8. Prohibited Conduct">
            <p>You may not: (a) use the Platform for illegal activities; (b) impersonate any person or entity; (c) collect other Users' data without consent; (d) interfere with or disrupt the Platform's operation; (e) attempt to gain unauthorized access; (f) circumvent the Service Fee; (g) engage in fraud or misrepresentation.</p>
        </Section>

        <Section id="ip" title="9. Intellectual Property">
            <p>All content and functionality on the Platform, excluding User-submitted content, is owned by Goodslister and protected by copyright, trademark, and other laws.</p>
        </Section>

        <Section id="disclaimer" title="10. Disclaimers">
            <p className="uppercase font-bold bg-gray-100 p-4 rounded-lg text-sm">The Platform is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. Goodslister does not warrant that the Platform will be uninterrupted, error-free, or secure.</p>
        </Section>

        <Section id="limitation" title="11. Limitation of Liability">
            <p className="uppercase font-bold bg-gray-100 p-4 rounded-lg text-sm">To the maximum extent permitted by law, Goodslister's total liability for any claim arising from or related to the Platform will not exceed the greater of (i) the amount you paid Goodslister in Service Fees in the 12 months preceding the claim, or (ii) $100.</p>
        </Section>

        <Section id="indemnity" title="12. Indemnification">
            <p>You agree to indemnify, defend, and hold harmless Goodslister and its officers, directors, employees, and agents from any claim, loss, liability, damage, or cost arising from your use of the Platform, your violation of these Terms, or your violation of any third-party rights.</p>
        </Section>

        <Section id="termination" title="13. Termination">
            <p>Either party may terminate this agreement at any time. Upon termination, your right to use the Platform ceases immediately. Provisions that by their nature should survive termination will survive.</p>
        </Section>

        <Section id="modifications" title="14. Modifications">
            <p>We may modify these Terms at any time. Material changes will be notified via email or in-Platform notice at least 30 days before taking effect. Continued use after changes constitutes acceptance.</p>
        </Section>

        <Section id="governing-law" title="15. Governing Law and Venue">
            <p>These Terms are governed by the laws of the State of Florida, without regard to conflict of law principles. Venue for any court proceeding is Broward County, Florida.</p>
        </Section>

        <Section id="notices" title="16. Notices">
            <p>Notices to Goodslister must be sent to <a href="mailto:legal@goodslister.com">legal@goodslister.com</a>. Notices to you will be sent to the email address associated with your account.</p>
        </Section>

        <Section id="assignment" title="17. Assignment">
            <p>You may not assign your rights or obligations under these Terms without our prior written consent. We may assign our rights freely.</p>
        </Section>

        <Section id="severability" title="18. Severability">
            <p>If any provision is held unenforceable, the remaining provisions will continue in full force.</p>
        </Section>

        <Section id="entire-agreement" title="19. Entire Agreement">
            <p>These Terms, together with the Privacy Policy, all other policies referenced herein, and any Rental Agreements formed on the Platform, constitute the entire agreement between you and Goodslister.</p>
        </Section>

        <Section id="arbitration" title="20. Binding Arbitration and Class Action Waiver">
            <p className="uppercase font-bold bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg text-sm">Please read this section carefully. It affects your rights.</p>
            <h3>20.1 Informal resolution</h3>
            <p>Before initiating arbitration, you and Goodslister will attempt to resolve any dispute informally by sending written notice to the other party. If the dispute is not resolved within 60 days, either party may initiate arbitration.</p>
            <h3>20.2 Arbitration agreement</h3>
            <p>You and Goodslister agree that any dispute arising from or related to these Terms or the Platform will be resolved through <strong>binding individual arbitration</strong> administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. Arbitration will take place in Broward County, Florida, or remotely at your election.</p>
            <h3>20.3 Class action waiver</h3>
            <p className="uppercase font-bold">You and Goodslister waive the right to participate in a class action, collective action, or representative proceeding of any kind. Any arbitration will be conducted on an individual basis only.</p>
            <h3>20.4 Small claims</h3>
            <p>Either party may bring an individual claim in small-claims court instead of arbitration.</p>
            <h3>20.5 Opt out</h3>
            <p>You may opt out of this arbitration agreement within 30 days of first accepting these Terms by emailing <a href="mailto:legal@goodslister.com">legal@goodslister.com</a>. Opting out will not affect your account.</p>
            <h3>20.6 Deadline</h3>
            <p>Claims must be brought within <strong>one (1) year</strong> of when they arose.</p>
        </Section>

        <Section id="contact" title="21. Contact">
            <p>Questions about these Terms? Contact us at <a href="mailto:legal@goodslister.com">legal@goodslister.com</a>.</p>
            <p className="text-sm text-gray-500 mt-6">Goodslister LLC<br/>Pembroke Pines, Florida</p>
        </Section>
    </LegalPageLayout>
);

// Additional legal pages (Módulos 02-06) are exported from separate sections below.
// See individual exports.


// ============================================================================
// MÓDULO 02 — PRIVACY POLICY
// ============================================================================
export const PrivacyPolicyPageV2: React.FC = () => (
    <LegalPageLayout
        title="Privacy Policy"
        subtitle="How Goodslister collects, uses, shares, and protects your personal information. Your rights under GDPR, CCPA, and Florida's Digital Bill of Rights (FDBR)."
        metaDescription="Goodslister Privacy Policy. How we collect, use, and protect your data. Rights under GDPR, CCPA, FDBR. Biometric identity verification via Stripe Identity."
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="scope" title="1. Scope and Data Controller">
            <p>This Privacy Policy describes how <strong>Goodslister LLC</strong> ("Goodslister," "we") collects, uses, discloses, and safeguards your information when you use goodslister.com and related services. Goodslister is the data controller for the personal information we collect.</p>
        </Section>

        <Section id="information-collected" title="2. Information We Collect">
            <h3>2.1 Account information</h3>
            <p>Name, email, phone, password (hashed), date of birth, driver license or government ID, and billing address.</p>
            <h3>2.2 Identity verification data</h3>
            <p>Government-issued ID scans, selfie photographs, and biometric data used to verify your identity through <strong>Stripe Identity</strong>. Biometric data is processed by Stripe and is not stored on Goodslister's servers beyond the verification result.</p>
            <h3>2.3 Transaction data</h3>
            <p>Booking details, rental history, payment method (via Stripe), earnings (for Listers), and messages between Users.</p>
            <h3>2.4 Photos and Condition Reports</h3>
            <p>Photographs uploaded during handover and return, including <strong>EXIF metadata</strong> (GPS, timestamp, device model, editing software indicators). This data is used for anti-fraud verification.</p>
            <h3>2.5 Usage and device data</h3>
            <p>IP address, browser type, device identifiers, pages visited, session recordings, and interaction data (via PostHog analytics).</p>
            <h3>2.6 Location data</h3>
            <p>Approximate location from IP address and precise location if you grant permission for pickup/return coordination.</p>
        </Section>

        <Section id="use" title="3. How We Use Your Information">
            <ul>
                <li>To provide, operate, and improve the Platform</li>
                <li>To verify your identity and prevent fraud</li>
                <li>To process payments and payouts</li>
                <li>To facilitate rental transactions between Users</li>
                <li>To communicate with you about your account and Bookings</li>
                <li>To personalize your experience and provide recommendations</li>
                <li>To comply with legal obligations and enforce our Terms</li>
                <li>To defend against legal claims and investigate policy violations</li>
            </ul>
        </Section>

        <Section id="sharing" title="4. Sharing Your Information">
            <h3>4.1 With other Users</h3>
            <p>Your name, profile photo, verification badges, ratings, reviews, and listings are visible to other Users. Contact information is shared only after a Booking is confirmed.</p>
            <h3>4.2 With service providers (subprocessors)</h3>
            <p>We share necessary information with vetted providers:</p>
            <ul>
                <li><strong>Stripe</strong> — payment processing, identity verification (Stripe Identity)</li>
                <li><strong>Google Firebase</strong> — authentication, real-time messaging</li>
                <li><strong>Neon</strong> — primary database hosting</li>
                <li><strong>Vercel</strong> — website hosting and file storage</li>
                <li><strong>Resend</strong> — transactional email delivery</li>
                <li><strong>ImprovMX</strong> — email routing</li>
                <li><strong>PostHog</strong> — product analytics and session replay</li>
                <li><strong>Google Maps</strong> — location services</li>
            </ul>
            <h3>4.3 Legal disclosures</h3>
            <p>We may disclose information in response to valid legal process (subpoenas, court orders), to protect our rights or the safety of Users, or to comply with law.</p>
        </Section>

        <Section id="rights" title="5. Your Rights">
            <h3>5.1 EU / UK residents (GDPR)</h3>
            <p>You have the right to access, rectify, delete, restrict processing, and port your data. You also have the right to object to processing based on legitimate interests. Contact <a href="mailto:privacy@goodslister.com">privacy@goodslister.com</a> to exercise these rights.</p>
            <h3>5.2 California residents (CCPA/CPRA)</h3>
            <p>You have the right to know what personal information we collect, delete it, correct it, opt out of "sale" or "sharing" (we do not sell personal information), limit use of sensitive personal information, and to non-discrimination for exercising your rights. See our <a href="/do-not-sell">Do Not Sell My Information</a> page.</p>
            <h3>5.3 Florida residents (FDBR)</h3>
            <p>Under the Florida Digital Bill of Rights, you have similar rights to those described above. To exercise them, contact <a href="mailto:privacy@goodslister.com">privacy@goodslister.com</a>.</p>
            <h3>5.4 Biometric consent</h3>
            <p>Where identity verification includes biometric processing, you provide separate, informed consent at the time of verification. You may revoke consent by deleting your account.</p>
        </Section>

        <Section id="security" title="6. Data Security">
            <p>We use encryption in transit (TLS 1.2+) and at rest for sensitive data. We limit access to personal information on a need-to-know basis. However, no system is 100% secure. Notify us immediately at <a href="mailto:trust@goodslister.com">trust@goodslister.com</a> of any suspected compromise.</p>
        </Section>

        <Section id="retention" title="7. Data Retention">
            <p>We retain personal information for as long as your account is active or as needed to provide services. Transaction records, signed agreements, Condition Reports, and dispute evidence are retained for <strong>seven (7) years</strong> to comply with legal, tax, and defense obligations.</p>
        </Section>

        <Section id="international" title="8. International Data Transfers">
            <p>Your information may be processed in the United States. If you are located outside the US, you consent to the transfer and processing of your information in the US, which may have different data protection laws than your jurisdiction.</p>
        </Section>

        <Section id="cookies" title="9. Cookies">
            <p>We use cookies and similar technologies for authentication, security, analytics, and personalization. See our <a href="/cookies">Cookie Policy</a> for details.</p>
        </Section>

        <Section id="minors" title="10. Minors">
            <p>The Platform is not intended for individuals under 18. Where a minor participates in a rental (e.g., Youth ATV), a parent or guardian must complete the Minor Participant Consent form. We do not knowingly collect personal information from children under 13.</p>
        </Section>

        <Section id="changes" title="11. Changes to This Policy">
            <p>We may update this Privacy Policy. Material changes will be notified via email or in-Platform notice at least 30 days before taking effect.</p>
        </Section>

        <Section id="contact-privacy" title="12. Contact Us">
            <p>Questions about this Privacy Policy or your data? Contact our Data Protection Contact at <a href="mailto:privacy@goodslister.com">privacy@goodslister.com</a>.</p>
            <p className="text-sm text-gray-500 mt-6">Goodslister LLC<br/>Pembroke Pines, Florida</p>
        </Section>
    </LegalPageLayout>
);

// ============================================================================
// MÓDULO 03 — PAYMENTS AND STRIPE CONNECT
// ============================================================================
export const PaymentsTermsPage: React.FC = () => (
    <LegalPageLayout
        title="Payments & Stripe Connect Terms"
        subtitle="How payments, deposits, payouts, and refunds work on Goodslister. All processing is handled by Stripe."
        metaDescription="Goodslister Payments and Stripe Connect Terms. Payment processing, security deposits, payouts, refunds, taxes for peer-to-peer rentals."
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="processor" title="1. Payment Processor">
            <p>All payments on the Platform are processed by <strong>Stripe, Inc.</strong> Goodslister does not store your full payment card details. By using the Platform, you also agree to Stripe's <a href="https://stripe.com/legal/consumer" target="_blank" rel="noopener noreferrer">Consumer Terms</a> and, if you are a Lister, <a href="https://stripe.com/connect-account/legal" target="_blank" rel="noopener noreferrer">Stripe Connect Terms</a>.</p>
        </Section>

        <Section id="renter-payments" title="2. How Renters Pay">
            <p>At Booking confirmation, Stripe places a temporary authorization hold on your card for the total amount (Rental Price + Service Fee + Security Deposit + applicable taxes).</p>
            <ul>
                <li>The Rental Price is captured when the Lister approves the Booking.</li>
                <li>The Security Deposit hold remains until 24 hours after a clean return, then released.</li>
                <li>The Service Fee is captured at Booking confirmation and is non-refundable except as required by law.</li>
                <li>Accepted methods: credit/debit cards (Visa, Mastercard, Amex, Discover), Apple Pay, Google Pay.</li>
            </ul>
        </Section>

        <Section id="lister-payouts" title="3. How Listers Get Paid">
            <p>Payouts are processed via <strong>Stripe Connect</strong>. Listers must complete Stripe Connect onboarding, including identity verification and bank account linking, before receiving payouts.</p>
            <ul>
                <li>Payout timing: within 24 hours after the rental starts. First-time payouts may have a 2-3 day hold.</li>
                <li>Payouts are net of the Service Fee retained by Goodslister.</li>
                <li>Bank transfer fees or delays are governed by Stripe's terms.</li>
                <li>Payouts may be delayed or withheld pending investigation of chargebacks, disputes, or policy violations.</li>
            </ul>
        </Section>

        <Section id="deposits" title="4. Security Deposits">
            <p>Security Deposits are held on the Renter's payment method (not charged) via Stripe. Amounts vary by Item category and value as set in the applicable Category Annex. Refer to the specific rental listing for the exact deposit.</p>
        </Section>

        <Section id="fees" title="5. Fees">
            <p>The Goodslister <strong>Service Fee</strong> is disclosed at checkout before Booking confirmation and typically ranges from 10% to 15% of the Rental Price. Additional fees may include late return fees (as set by the Lister in the Listing), cleaning fees, damage claims, and refuel/replacement fees per the applicable Category Annex.</p>
        </Section>

        <Section id="refunds" title="6. Refunds">
            <p>Refund eligibility is governed by our <a href="/cancellation">Cancellation and Refund Policy</a>. Approved refunds are credited to the original payment method within 5-10 business days.</p>
        </Section>

        <Section id="taxes" title="7. Taxes">
            <p>Goodslister may be required to collect and remit sales tax, tourist development tax, or other transaction taxes as a marketplace facilitator. Listers are responsible for their own income taxes. US Listers earning $600+ per year receive a Form 1099-K from Stripe.</p>
        </Section>

        <Section id="chargebacks" title="8. Chargebacks and Disputes">
            <p>If you dispute a charge with your card issuer without first contacting us, we reserve the right to suspend your account pending resolution and to pass along any chargeback fees. Please contact <a href="mailto:support@goodslister.com">support@goodslister.com</a> before initiating a chargeback.</p>
        </Section>

        <Section id="currency" title="9. Currency">
            <p>All amounts are in U.S. Dollars (USD).</p>
        </Section>

        <Section id="payments-contact" title="10. Contact">
            <p>Payment questions? Contact <a href="mailto:support@goodslister.com">support@goodslister.com</a>.</p>
        </Section>
    </LegalPageLayout>
);

// ============================================================================
// MÓDULO 04 — INSURANCE AND VERIFICATION DISCLOSURE
// ============================================================================
export const InsuranceDisclosurePage: React.FC = () => (
    <LegalPageLayout
        title="Insurance & Verification Disclosure"
        subtitle="Goodslister does not provide insurance. Verification is not a guarantee. Read this carefully before listing or booking."
        metaDescription="Goodslister Insurance and Verification Disclosure. We are not an insurer. Verification is not a guarantee. Florida dangerous instrumentality and livery notices."
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-lg mb-8">
            <p className="text-rose-900 font-bold uppercase text-sm">Read this document before you list or rent an item on Goodslister. It affects your rights and your financial exposure.</p>
        </div>

        <Section id="not-an-insurer" title="1. Goodslister Is Not an Insurer">
            <p className="uppercase font-bold bg-gray-100 p-4 rounded-lg">Goodslister is a marketplace platform. Goodslister does not provide, underwrite, sell, or produce insurance of any kind for Users, Items, or transactions on the Platform.</p>
        </Section>

        <Section id="lister-responsibility" title="2. Insurance Is the Lister's Responsibility">
            <p>Each Lister is solely responsible for maintaining any insurance required by law, by the manufacturer, by their finance or lease agreement, by their marina or storage facility, and by any applicable HOA or regulatory body. Renting an Item without proper insurance may expose the Lister to substantial personal liability.</p>
        </Section>

        <Section id="no-guarantee" title="3. No Guarantee of Lister Insurance">
            <p>Goodslister may collect representations about insurance from Listers but <strong>does not verify, monitor, audit, or guarantee</strong> that any Lister maintains insurance, that any policy is in force, that any policy covers rental use, or that any policy limit is adequate.</p>
        </Section>

        <Section id="verification-not-guarantee" title="4. Verification Is Not a Guarantee">
            <p>Identity verification through Stripe Identity confirms only that a submitted identity document appears genuine and matches a submitted selfie. <strong>It does not confirm that a person is a safe operator, is licensed, has a clean driving or boating record, has no criminal history, is insured, is financially able to pay for damage, or is trustworthy.</strong> Goodslister does not perform criminal background checks or motor vehicle record checks unless expressly stated for a specific program.</p>
        </Section>

        <Section id="protection-not-insurance" title="5. No Protection Program Is Insurance">
            <p>Any Goodslister guarantee, reimbursement, or protection program is <strong>not insurance</strong>, is not regulated as insurance, is subject to separate terms, limits, exclusions, deductibles, and conditions, and may be modified or discontinued at any time.</p>
        </Section>

        <Section id="dangerous-instrumentality" title="6. Florida Dangerous Instrumentality Notice — For Listers">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
                <p className="uppercase font-bold text-amber-900">Under Florida law, the owner of a motor vehicle who voluntarily entrusts it to another may be held vicariously and strictly liable for injuries caused by that person's negligent operation.</p>
                <p className="mt-3">This doctrine applies broadly to motor vehicles and can expose you personally to a judgment far exceeding the value of your Item and the income from a rental. <strong>Goodslister strongly advises you to consult your own attorney and insurance professional before listing any motorized Item.</strong></p>
            </div>
        </Section>

        <Section id="livery-notice" title="7. Vessel Livery Notice — For Listers">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
                <p>If you advertise and offer a vessel for rent for consideration without providing a USCG-licensed master, you may be a "livery" under Florida law and subject to permit, insurance, safety equipment, pre-rental instruction, written agreement, and renter-verification requirements. <strong>Violation is a first-degree misdemeanor</strong> (Fla. Stat. § 327.54). Compliance is your sole responsibility.</p>
                <p className="text-sm text-amber-800 mt-3">Livery Operator Permits are issued at no cost by the Florida Fish and Wildlife Conservation Commission. See <a href="https://myfwc.com/boating/regulations/liveries/" target="_blank" rel="noopener noreferrer" className="underline">myfwc.com/boating/regulations/liveries</a>.</p>
            </div>
        </Section>

        <Section id="recommended-action" title="8. Recommended Action">
            <p>Before listing or booking, obtain written confirmation of coverage from a licensed insurance professional. Consider commercial rental coverage, an umbrella policy, or a specialty peer-to-peer rental policy.</p>
        </Section>

        <Section id="acknowledgment" title="9. Acknowledgment">
            <p>By using the Platform, you acknowledge that: (a) Goodslister provides no insurance; (b) verification is not a guarantee of safety, licensure, or financial responsibility; and (c) you accept full responsibility for arranging your own insurance.</p>
        </Section>
    </LegalPageLayout>
);

// ============================================================================
// MÓDULO 05 — DISPUTE RESOLUTION SUMMARY
// ============================================================================
export const DisputeResolutionPage: React.FC = () => (
    <LegalPageLayout
        title="Dispute Resolution"
        subtitle="How disputes are handled on Goodslister. Plain-language summary of Section 20 of our Terms of Service."
        metaDescription="Goodslister Dispute Resolution. Binding arbitration, class action waiver, 60-day informal resolution period. AAA Consumer Arbitration Rules in Broward County, Florida."
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>
        <p className="italic text-gray-600 mb-8">This is a plain-language summary. The full <a href="/terms#arbitration">Terms of Service Section 20</a> controls.</p>

        <div className="bg-gradient-to-br from-cyan-50 to-white border border-cyan-100 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">The 4-step process</h3>
            <ol className="space-y-4 text-gray-700">
                <li><strong className="text-cyan-700">Step 1 — Talk to the other party.</strong> Most issues resolve through Platform messaging. Contact your Lister or Renter directly first.</li>
                <li><strong className="text-cyan-700">Step 2 — Resolution Center.</strong> For damage, deposits, refunds, or cancellations, open a case in the Resolution Center. Upload your Condition Report photographs and documentation. Goodslister will issue a non-binding administrative determination. <em>Goodslister is a payment administrator, not a judge or an insurance adjuster.</em></li>
                <li><strong className="text-cyan-700">Step 3 — Notice of Dispute.</strong> For a dispute with Goodslister, email <a href="mailto:legal@goodslister.com">legal@goodslister.com</a> with your name, account email, a description of the claim, and the relief you want. We have <strong>60 days</strong> to try to resolve it informally.</li>
                <li><strong className="text-cyan-700">Step 4 — Individual arbitration.</strong> If it is not resolved, the dispute goes to <strong>binding individual arbitration</strong> with the AAA under its Consumer Arbitration Rules, in Broward County, Florida, or remotely at your election.</li>
            </ol>
        </div>

        <Section id="waiver" title="Important: You waive certain rights">
            <p className="uppercase font-bold bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg">By agreeing to our Terms, you give up the right to a jury trial and the right to participate in a class action.</p>
            <p className="mt-4">Any arbitration is conducted on an individual basis only. You cannot join a class of other Users, and you cannot serve as a class representative.</p>
        </Section>

        <Section id="small-claims" title="Small claims option">
            <p>Either party may instead bring an individual claim in small-claims court for disputes that fall within the jurisdiction of the small-claims court.</p>
        </Section>

        <Section id="opt-out" title="Opt out (30 days)">
            <p>You may opt out of arbitration within <strong>30 days</strong> of first accepting the Terms by emailing <a href="mailto:legal@goodslister.com">legal@goodslister.com</a> with your name, account email, and a statement that you want to opt out of arbitration.</p>
            <p>Opting out will not affect your account. If you do not opt out within 30 days, you are bound by the arbitration agreement.</p>
        </Section>

        <Section id="deadline" title="One-year deadline">
            <p>Claims must be brought within <strong>one (1) year</strong> of when they arose. Claims brought after that deadline are permanently barred.</p>
        </Section>

        <Section id="dispute-contact" title="Contact">
            <p>Questions about dispute resolution? Contact <a href="mailto:legal@goodslister.com">legal@goodslister.com</a>.</p>
        </Section>
    </LegalPageLayout>
);

// ============================================================================
// MÓDULO 06 — TRUST, SAFETY, AND CONTENT POLICY
// ============================================================================
export const TrustSafetyPage: React.FC = () => (
    <LegalPageLayout
        title="Trust, Safety & Content Policy"
        subtitle="What's allowed, what's not, and how to report violations. Making Goodslister safe for everyone."
        metaDescription="Goodslister Trust, Safety and Content Policy. Prohibited content, non-discrimination, reporting, DMCA copyright, accessibility."
    >
        <p className="text-sm text-gray-500 italic mb-8">Effective Date: September 11, 2026 · Version {LEGAL_VERSION}</p>

        <Section id="prohibited" title="1. Prohibited Content">
            <p>The following content is not permitted on Goodslister:</p>
            <ul>
                <li>Illegal, fraudulent, misleading, or defamatory content</li>
                <li>Harassment, hate speech, or discriminatory content</li>
                <li>Sexually explicit content</li>
                <li>Content that infringes intellectual property</li>
                <li>Stock photographs presented as the actual Item</li>
                <li>Fake or incentivized reviews</li>
                <li>Personal information of others posted without consent</li>
                <li>Off-Platform contact information intended to circumvent the Platform</li>
            </ul>
        </Section>

        <Section id="nondiscrimination" title="2. Nondiscrimination">
            <p>Goodslister prohibits discrimination on the basis of race, color, religion, national origin, ethnicity, sex, gender identity, sexual orientation, marital status, familial status, disability, age, veteran status, or any other characteristic protected by federal, Florida, or local law.</p>
            <p>Users may decline a Booking for <strong>legitimate, documented safety or eligibility reasons only</strong>.</p>
        </Section>

        <Section id="reporting" title="3. Reporting Violations">
            <p>Report safety concerns, harassment, fraud, or policy violations to <a href="mailto:trust@goodslister.com">trust@goodslister.com</a>.</p>
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
                <p className="font-bold text-rose-900">Report emergencies to 911 first, then to Goodslister.</p>
            </div>
            <p>Report incidents involving injury, theft, or law enforcement within 24 hours to <a href="mailto:incidents@goodslister.com">incidents@goodslister.com</a>.</p>
        </Section>

        <Section id="enforcement" title="4. Enforcement">
            <p>Depending on severity, we may:</p>
            <ul>
                <li>Issue a warning</li>
                <li>Remove content</li>
                <li>Cancel Bookings</li>
                <li>Restrict features</li>
                <li>Withhold payouts pending investigation</li>
                <li>Suspend or permanently ban an account</li>
                <li>Report to law enforcement</li>
            </ul>
            <p>Decisions may be appealed once to <a href="mailto:appeals@goodslister.com">appeals@goodslister.com</a> within 14 days.</p>
        </Section>

        <Section id="dmca" title="5. DMCA Copyright Policy">
            <p>If you believe content on the Platform infringes your copyright, send a written notice to our Designated Agent containing the elements required by 17 U.S.C. § 512(c)(3):</p>
            <ul>
                <li>Your physical or electronic signature</li>
                <li>Identification of the copyrighted work</li>
                <li>Identification of the infringing material and its location on the Platform</li>
                <li>Your contact information</li>
                <li>A statement of good-faith belief that the use is not authorized</li>
                <li>A statement, under penalty of perjury, that the information is accurate and you are authorized to act</li>
            </ul>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4">
                <p className="font-bold text-gray-900">Designated Agent</p>
                <p className="text-gray-700 mt-2">Luciano Reverberi<br/>Goodslister LLC<br/>Pembroke Pines, Florida<br/>Email: <a href="mailto:legal@goodslister.com">legal@goodslister.com</a></p>
                <p className="text-sm text-gray-500 mt-2 italic">Registered with the U.S. Copyright Office. See <a href="https://dmca.copyright.gov/" target="_blank" rel="noopener noreferrer" className="underline">dmca.copyright.gov</a>.</p>
            </div>
            <p>We will respond to valid notices and counter-notices and terminate repeat infringers.</p>
        </Section>

        <Section id="law-enforcement" title="6. Law Enforcement Requests">
            <p>We respond to valid legal process. Requests should be sent to <a href="mailto:legal@goodslister.com">legal@goodslister.com</a>. We may notify affected Users unless legally prohibited.</p>
        </Section>

        <Section id="accessibility" title="7. Accessibility">
            <p>We aim to conform to WCAG 2.1 Level AA. Report accessibility barriers to <a href="mailto:support@goodslister.com">support@goodslister.com</a>.</p>
        </Section>

        <Section id="trust-contact" title="8. Contact">
            <p>Questions? <a href="mailto:trust@goodslister.com">trust@goodslister.com</a></p>
        </Section>
    </LegalPageLayout>
);
