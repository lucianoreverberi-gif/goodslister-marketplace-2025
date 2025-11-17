import React, { useState, useEffect } from 'react';
import { Session } from '../App';
import { MessageSquareIcon, MenuIcon, XIcon } from './icons';
import { Page } from '../types';

interface HeaderProps {
    onNavigate: (page: Page) => void;
    onLoginClick: () => void;
    onLogoutClick: () => void;
    onOpenChat: () => void;
    session: Session | null;
    logoUrl: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, onLoginClick, onLogoutClick, onOpenChat, session, logoUrl }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavigation = (page: Page) => {
        onNavigate(page);
        setIsMenuOpen(false);
    };

    const handleHowItWorksClick = () => {
        handleNavigation('home');
        setTimeout(() => {
            document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMenuOpen]);

    const NavLinks: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
        const commonClass = "font-medium transition-colors";
        const desktopClass = "text-sm text-gray-500 hover:text-gray-900";
        const mobileClass = "block py-3 px-4 text-lg text-gray-700 hover:bg-gray-100 rounded-lg";
        const className = mobile ? `${commonClass} ${mobileClass}` : `${commonClass} ${desktopClass}`;

        return (
            <>
                <button onClick={() => handleNavigation('explore')} className={className}>Explore</button>
                <button onClick={() => handleNavigation('createListing')} className={className}>List Your Item</button>
                <button onClick={handleHowItWorksClick} className={className}>How It Works</button>
                <button onClick={() => handleNavigation('aiAssistant')} className={className}>AI Assistant</button>
                {session?.isAdmin && (
                    <button onClick={() => handleNavigation('admin')} className={`${className} text-cyan-600 hover:text-cyan-800`}>Admin</button>
                )}
                {session && !session.isAdmin && (
                    <button onClick={() => handleNavigation('userDashboard')} className={`${className} text-cyan-600 hover:text-cyan-800`}>My Dashboard</button>
                )}
            </>
        );
    };

    return (
        <>
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <button onClick={() => handleNavigation('home')} className="flex-shrink-0">
                            <img src={logoUrl} alt="Goodslister logo" className="h-8 w-auto" />
                        </button>

                        {/* Desktop Nav & Auth */}
                        <div className="hidden md:flex items-center space-x-4">
                            <nav className="flex space-x-8 items-center">
                                <NavLinks />
                            </nav>
                            <div className="w-px h-6 bg-gray-200"></div>
                            {session ? (
                                <div className="flex items-center space-x-4">
                                    <button onClick={onOpenChat} className="text-gray-500 hover:text-gray-900 p-1 rounded-full">
                                        <MessageSquareIcon className="h-6 w-6" />
                                    </button>
                                    <img src={session.avatarUrl} alt={session.name} className="w-8 h-8 rounded-full" />
                                    <button onClick={onLogoutClick} className="text-sm font-medium text-gray-500 hover:text-gray-900">
                                        Log Out
                                    </button>
                                </div>
                            ) : (
                                <button onClick={onLoginClick} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                    Log In
                                </button>
                            )}
                        </div>
                        
                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(true)} className="p-2 -mr-2">
                                <MenuIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Panel */}
            <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
                
                {/* Panel */}
                <div className={`absolute top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-lg p-6 flex flex-col transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b">
                        <img src={logoUrl} alt="Goodslister logo" className="h-8 w-auto" />
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 -mr-2">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Nav Links */}
                    <nav className="mt-8 flex-1 flex flex-col space-y-2">
                        <NavLinks mobile />
                    </nav>

                    {/* Auth & Actions */}
                    <div className="mt-auto pt-6 border-t">
                        {session ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-4 py-2">
                                    <img src={session.avatarUrl} alt={session.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-gray-800">{session.name}</p>
                                        <p className="text-sm text-gray-500">{session.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => { onOpenChat(); setIsMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                    <MessageSquareIcon className="h-5 w-5" />
                                    My Messages
                                </button>
                                <button onClick={() => { onLogoutClick(); setIsMenuOpen(false); }} className="w-full text-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200">
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => { onLoginClick(); setIsMenuOpen(false); }} className="w-full py-3 px-4 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors">
                                Log In / Sign Up
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Header;
