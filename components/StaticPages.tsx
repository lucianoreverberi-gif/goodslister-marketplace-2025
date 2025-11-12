import React from 'react';
import { MailIcon, PhoneIcon } from './icons';

const StaticPageLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white">
        <div className="relative bg-gray-800 py-24 sm:py-32">
            <div className="absolute inset-0">
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-cyan-900/50"></div>
            </div>
            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">{title}</h1>
            </div>
        </div>
        <div className="py-16 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto prose prose-lg max-w-none text-gray-700">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

export const AboutUsPage: React.FC = () => (
    <StaticPageLayout title="About Us">
        <h2>Our Mission</h2>
        <p>At Goodslister, our mission is to unlock the potential of underused goods and connect people with unforgettable experiences. We believe that everyone should have access to high-quality adventure and recreational gear without the burden of ownership. By facilitating a secure, efficient, and AI-powered rental marketplace, we empower owners to earn passive income and adventurers to explore more, fostering a community built on trust and a shared passion for exploration.</p>
        
        <h2>Our Story</h2>
        <p>Goodslister was born from a simple observation: countless kayaks, mountain bikes, snowboards, and camping sets were collecting dust in garages and storage units. At the same time, countless people were dreaming of weekend getaways but were held back by the high cost and logistics of owning such equipment. We saw an opportunity to bridge this gap using cutting-edge technology. In 2023, we launched Goodslister, a platform that not only connects owners and renters but does so intelligently, using AI to optimize listings, simplify contracts, and power a semantic search that truly understands user intent.</p>
    </StaticPageLayout>
);

export const CareersPage: React.FC = () => (
    <StaticPageLayout title="Careers">
        <p className="lead">Join a passionate team that's revolutionizing how the world accesses adventure. At Goodslister, we're building more than a platform; we're cultivating a community. We're looking for innovative, curious, and driven individuals who aren't afraid to challenge the status quo.</p>
        
        <h3>Why Join Us?</h3>
        <ul>
            <li><strong>Real Impact:</strong> Work on a product that promotes sustainability and makes outdoor experiences more accessible for everyone.</li>
            <li><strong>Innovative Culture:</strong> Be part of an environment where experimentation and the use of cutting-edge AI are the norm, not the exception.</li>
            <li><strong>Adventure Perks:</strong> Enjoy benefits like a gear stipend, team adventure days, and flexible work schedules that let you live the life our platform promotes.</li>
        </ul>

        <h3>Open Positions</h3>
        <h4>Senior Frontend Engineer (React & AI)</h4>
        <p>We're looking for an experienced engineer to lead the development of our AI-driven user interface features. You'll be responsible for building intuitive and seamless user experiences that integrate our AI's capabilities transparently.</p>
        
        <h4>Data Scientist (Natural Language Processing)</h4>
        <p>Passionate about NLP? Join our team to enhance our neural search engine, contract generation models, and multilingual chat features. Your work will directly impact the core intelligence of our platform.</p>
    </StaticPageLayout>
);

export const PressPage: React.FC = () => (
    <StaticPageLayout title="Press">
        <p>Welcome to the Goodslister press room. Here you'll find the latest news, press releases, and information about our company. For all media inquiries, please contact our communications team.</p>
        
        <h3>Recent Press Releases</h3>
        <p><strong>July 15, 2024:</strong> <em>Goodslister Launches AI-Powered Contract Assistant to Simplify and Secure Peer-to-Peer Rentals.</em></p>
        <p>Goodslister, the adventure gear rental marketplace, today announced the launch of its Smart Contracts feature, which leverages generative AI to create clear, customized rental agreements in seconds, enhancing safety and trust within its community.</p>
        
        <p><strong>May 2, 2024:</strong> <em>Goodslister Secures $5M Seed Funding to Expand its AI-Powered Rental Marketplace.</em></p>
        <p>The company plans to use the funding to enhance its neural search technology, expand into new markets, and grow its engineering and data science team.</p>

        <h3>Media Contact</h3>
        <p>For interviews, brand assets, or any other media inquiries, please contact us at:</p>
        <p><strong>Email:</strong> <a href="mailto:press@goodslister.com">press@goodslister.com</a></p>
    </StaticPageLayout>
);

export const HelpCenterPage: React.FC = () => (
    <StaticPageLayout title="Help Center">
        <h3>For Renters</h3>
        <p><strong>How does the rental process work?</strong></p>
        <p>Simply search for the item you need, select your dates, and send a booking request to the owner. Once the owner accepts, your payment will be processed securely through our platform, and you can coordinate the pickup.</p>
        
        <p><strong>What happens if the item gets damaged?</strong></p>
        <p>We highly recommend documenting the item's condition with photos before and after the rental. In case of damage, contact the owner immediately through our messaging system to discuss the next steps. Our support team is also available to mediate if needed.</p>

        <h3>For Owners</h3>
        <p><strong>How do I list an item?</strong></p>
        <p>It's easy! Click on "List Your Item," fill in your item's details, upload some high-quality photos, and set your daily price. You can use our AI description generator to help you create a compelling listing.</p>

        <p><strong>How and when do I get paid?</strong></p>
        <p>Payments are securely processed through our platform. The funds are transferred directly to your linked bank account 24 hours after the renter has successfully picked up the item.</p>
    </StaticPageLayout>
);

export const ContactUsPage: React.FC = () => (
    <StaticPageLayout title="Contact Us">
        <p>Have a question, feedback, or need assistance? Our team is here to help. Fill out the form below, or get in touch with us directly through the channels listed.</p>
        
        <form className="space-y-6 mt-8">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full name</label>
                <input type="text" id="name" name="name" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                <input type="email" id="email" name="email" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea id="message" name="message" rows={5} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"></textarea>
            </div>
            <div>
                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700">
                    Send Message
                </button>
            </div>
        </form>

        <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold">Or contact us directly</h3>
            <div className="flex justify-center items-center gap-8 mt-4">
                <div className="flex items-center gap-2">
                    <MailIcon className="h-5 w-5 text-cyan-600" />
                    <a href="mailto:support@goodslister.com" className="text-cyan-600 hover:text-cyan-800">support@goodslister.com</a>
                </div>
                <div className="flex items-center gap-2">
                    <PhoneIcon className="h-5 w-5 text-cyan-600" />
                    <span>+1 (555) 123-4567</span>
                </div>
            </div>
        </div>
    </StaticPageLayout>
);

export const TermsPage: React.FC = () => (
    <StaticPageLayout title="Terms & Conditions">
        <p><em>Last updated: July 20, 2024</em></p>
        <p>Welcome to Goodslister. These terms and conditions outline the rules and regulations for the use of Goodslister Inc.'s Website. By accessing this website we assume you accept these terms and conditions. Do not continue to use Goodslister if you do not agree to take all of the terms and conditions stated on this page.</p>
        
        <h3>1. Accounts</h3>
        <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>

        <h3>2. User Content</h3>
        <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.</p>
        
        <h3>3. Rentals</h3>
        <p>Goodslister is a marketplace that allows users to offer, search, and book rentals of recreational goods. We act as an intermediary and are not a party to any rental agreement. We are not responsible for the condition of the items rented or the actions of our users.</p>

        <p><strong>Disclaimer:</strong> This is a sample document. Consult with a legal professional to create the Terms and Conditions for your business.</p>
    </StaticPageLayout>
);

export const PrivacyPolicyPage: React.FC = () => (
    <StaticPageLayout title="Privacy Policy">
        <p><em>Last updated: July 20, 2024</em></p>
        <p>Goodslister Inc. ("us", "we", or "our") operates the goodslister.com website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>
        
        <h3>1. Information Collection and Use</h3>
        <p>We collect several different types of information for various purposes to provide and improve our Service to you. Types of Data collected may include, but are not limited to: Email address, First name and last name, Phone number, Address, Usage Data.</p>

        <h3>2. Use of Data</h3>
        <p>Goodslister Inc. uses the collected data for various purposes:</p>
        <ul>
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our Service</li>
        </ul>
        
        <h3>3. Security of Data</h3>
        <p>The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>

        <p><strong>Disclaimer:</strong> This is a sample document. Consult with a legal professional to create a Privacy Policy for your business.</p>
    </StaticPageLayout>
);