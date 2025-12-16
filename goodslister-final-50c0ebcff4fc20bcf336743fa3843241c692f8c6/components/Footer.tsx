
import React from 'react';
import { FacebookIcon, InstagramIcon, TwitterXIcon } from './icons';
import { Page } from '../types';

interface FooterProps {
    logoUrl: string;
    onNavigate: (page: Page) => void;
}

const Footer: React.FC<FooterProps> = ({ logoUrl, onNavigate }) => {
    
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, page: Page) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        onNavigate(page);
    };

    return (
        <footer className="bg-white border-t border-gray-200">
            <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                         <img src={logoUrl} alt="Goodslister logo" className="h-10 w-auto" />
                        <p className="mt-2 text-sm text-gray-600">
                            The future of rentals, powered by AI. Find elite gear for your getaways with our intelligent search.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:col-span-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Company</h3>
                            <ul className="mt-4 space-y-4">
                                <li><a href="/about" onClick={(e) => handleLinkClick(e, 'aboutUs')} className="text-base text-gray-600 hover:text-gray-900">About Us</a></li>
                                <li><a href="/careers" onClick={(e) => handleLinkClick(e, 'careers')} className="text-base text-gray-600 hover:text-gray-900">Careers</a></li>
                                <li><a href="/press" onClick={(e) => handleLinkClick(e, 'press')} className="text-base text-gray-600 hover:text-gray-900">Press</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Support</h3>
                            <ul className="mt-4 space-y-4">
                                <li><a href="/help" onClick={(e) => handleLinkClick(e, 'helpCenter')} className="text-base text-gray-600 hover:text-gray-900">Help Center</a></li>
                                <li><a href="/contact" onClick={(e) => handleLinkClick(e, 'contactUs')} className="text-base text-gray-600 hover:text-gray-900">Contact Us</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Legal & Compliance</h3>
                            <ul className="mt-4 space-y-4">
                                <li><a href="/terms" onClick={(e) => handleLinkClick(e, 'terms')} className="text-base text-gray-600 hover:text-gray-900">Terms &amp; Conditions</a></li>
                                <li><a href="/privacy" onClick={(e) => handleLinkClick(e, 'privacyPolicy')} className="text-base text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
                                <li><a href="/florida-compliance" onClick={(e) => handleLinkClick(e, 'floridaCompliance')} className="text-base text-cyan-600 hover:text-cyan-800 font-semibold">Florida Boating Guide</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-12 border-t border-gray-200 pt-8 flex flex-col sm:flex-row items-center justify-between">
                    <p className="text-base text-gray-500 order-2 sm:order-1 mt-4 sm:mt-0">&copy; 2025 Goodslister Inc. All rights reserved.</p>
                    <div className="flex space-x-6 order-1 sm:order-2">
                        <a href="#" className="text-gray-400 hover:text-gray-500">
                            <span className="sr-only">X</span>
                            <TwitterXIcon className="h-6 w-6" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-gray-500">
                            <span className="sr-only">Facebook</span>
                            <FacebookIcon className="h-6 w-6" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-gray-500">
                            <span className="sr-only">Instagram</span>
                            <InstagramIcon className="h-6 w-6" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;