
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from './icons';

interface FAQItem {
    q: string;
    a: string;
}

const renterFAQs: FAQItem[] = [
    {
        q: "Why is the payment split into two parts?",
        a: "To give you the lowest fees and instant booking. You pay the Goodslister Service Fee online to secure the reservation and legal contracts. The actual Rental Rate is paid directly to the Host upon arrival (via Zelle, Cash, or Venmo)."
    },
    {
        q: "How does the Insurance/Protection work?",
        a: "For low-risk items (Surf/Bike), we offer damage waivers. For Boats & Jet Skis, we generate industry-standard legal contracts (Bareboat Charters & Liability Waivers) that you sign digitally at checkout to protect both parties."
    },
    {
        q: "Is my Security Deposit charged immediately?",
        a: "No. It is a 'Hold' on your credit card (like a hotel). It is only charged if damage is reported and proven via our Digital Inspector tool."
    }
];

const hostFAQs: FAQItem[] = [
    {
        q: "When do I get paid?",
        a: "Instantly! You collect 100% of your rental price directly from the renter when you hand over the keys. No waiting for weekly payouts."
    },
    {
        q: "Do I need commercial insurance to list?",
        a: "While recommended, it's not mandatory for all categories. If you don't have it, our platform automatically provides the necessary Legal Contracts (Waivers/Charters) and strict Security Deposits to mitigate your risk."
    },
    {
        q: "What prevents 'Catfishing' or fake listings?",
        a: "Transparency. While you can use our AI tool for cool cover photos, you are required to upload real, dated photos of the actual item. Renters verify this on-site before paying the balance."
    }
];

const FAQSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'renter' | 'host'>('renter');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const currentFAQs = activeTab === 'renter' ? renterFAQs : hostFAQs;

    return (
        <section className="bg-white py-16 sm:py-24 border-t border-gray-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Frequently Asked Questions</h2>
                    <p className="mt-4 text-lg text-gray-600">Everything you need to know about our unique marketplace model.</p>
                </div>

                <div className="flex justify-center mb-10">
                    <div className="bg-gray-100 p-1 rounded-full inline-flex">
                        <button
                            onClick={() => { setActiveTab('renter'); setOpenIndex(null); }}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'renter'
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            For Renters
                        </button>
                        <button
                            onClick={() => { setActiveTab('host'); setOpenIndex(null); }}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'host'
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            For Hosts
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {currentFAQs.map((faq, index) => (
                        <div key={index} className="border-b border-gray-200 last:border-0">
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full flex justify-between items-center py-4 text-left focus:outline-none group"
                            >
                                <span className={`text-lg font-medium transition-colors ${openIndex === index ? 'text-cyan-700' : 'text-gray-900 group-hover:text-cyan-600'}`}>
                                    {faq.q}
                                </span>
                                <span className="ml-6 flex-shrink-0 text-cyan-600">
                                    {openIndex === index ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                                </span>
                            </button>
                            {openIndex === index && (
                                <div className="pb-6 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        {faq.a}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
