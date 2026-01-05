
import React, { useState, useEffect } from 'react';
import { Session, Page } from '../types';
import { MessageSquareIcon, MenuIcon, XIcon } from './icons';

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

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, page: Page) => {
        // Allow default browser behavior for modifier keys (Ctrl/Cmd+Click -> New Tab)
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        
        e.preventDefault();
        onNavigate(page);
        setIsMenuOpen(false);
    };

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMenuOpen]);

    const NavLink = ({ href, page, label, mobile }: { href: string, page: Page, label: string, mobile?: boolean }) => {
        const commonClass = "font-medium transition-colors block";
        const desktopClass = "text-sm text-gray-500 hover:text-gray-900";
        const mobileClass = "py-3 px-4 text-lg text-gray-700 hover:bg-gray-100 rounded-lg";
        const className = mobile ? `${commonClass} ${mobileClass}` : `${commonClass} ${desktopClass}`;

        return (
            <a 
                href={href} 
                onClick={(e) => handleNavigation(e, page)} 
                className={className}
            >
                {label}
            </a>
        );
    };

    return (
        <>
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <a 
                            href="/" 
                            onClick={(e) => handleNavigation(e, 'home')} 
                            className="flex-shrink-0"
                        >
                            <img src={logoUrl} alt="Goodslister logo" className="h-8 w-auto" />
                        </a>

                        {/* Desktop Nav & Auth */}
                        <div className="hidden md:flex items-center space-x-4">
                            <nav className="flex space-x-8 items-center">
                                <NavLink href="/explore" page="explore" label="Explore" />
                                <NavLink href="/create-listing" page="createListing" label="List Your Item" />
                                <NavLink href="/how-it-works" page="howItWorks" label="How It Works" />
                                <NavLink href="/ai-assistant" page="aiAssistant" label="AI Assistant" />
                                {session?.isAdmin && (
                                    <a href="/admin" onClick={(e) => handleNavigation(e, 'admin')} className="text-sm font-medium text-cyan-600 hover:text-cyan-800 transition-colors">Admin</a>
                                )}
                                {session && !session.isAdmin && (
                                    <a href="/dashboard" onClick={(e) => handleNavigation(e, 'userDashboard')} className="text-sm font-medium text-cyan-600 hover:text-cyan-800 transition-colors">My Dashboard</a>
                                )}
                            </nav>
                            <div className="w-px h-6 bg-gray-200"></div>
                            {session ? (
                                <div className="flex items-center space-x-4">
                                    <button onClick={onOpenChat} className="text-gray-500 hover:text-gray-900 p-1 rounded-full">
                                        <MessageSquareIcon className="h-6 w-6" />
                                    </button>
                                    <img src={session.avatarUrl} alt={session.name} className="w-8 h-8 rounded-full object-cover" />
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
                        <NavLink href="/explore" page="explore" label="Explore" mobile />
                        <NavLink href="/create-listing" page="createListing" label="List Your Item" mobile />
                        <NavLink href="/how-it-works" page="howItWorks" label="How It Works" mobile />
                        <NavLink href="/ai-assistant" page="aiAssistant" label="AI Assistant" mobile />
                        {session?.isAdmin && (
                            <NavLink href="/admin" page="admin" label="Admin Panel" mobile />
                        )}
                        {session && !session.isAdmin && (
                            <NavLink href="/dashboard" page="userDashboard" label="My Dashboard" mobile />
                        )}
                    </nav>

                    {/* Auth & Actions */}
                    <div className="mt-auto pt-6 border-t">
                        {session ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-4 py-2">
                                    <img src={session.avatarUrl} alt={session.name} className="w-10 h-10 rounded-full object-cover" />
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
