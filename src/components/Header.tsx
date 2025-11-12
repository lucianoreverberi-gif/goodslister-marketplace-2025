import React from 'react';
import { Session } from '../App';
import { MessageSquareIcon } from './icons';
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
    
    const handleHowItWorksClick = () => {
        onNavigate('home');
        // Ensure we're on the home page before trying to scroll
        setTimeout(() => {
            const element = document.getElementById('how-it-works');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <button onClick={() => onNavigate('home')} className="flex-shrink-0">
                             <img src={logoUrl} alt="Goodslister logo" className="h-8 w-auto" />
                        </button>
                    </div>

                    <div className="flex items-center space-x-4">
                        <nav className="hidden md:flex space-x-8 items-center">
                            <button onClick={() => onNavigate('explore')} className="text-sm font-medium text-gray-500 hover:text-gray-900">Explore</button>
                            <button onClick={() => onNavigate('createListing')} className="text-sm font-medium text-gray-500 hover:text-gray-900">List Your Item</button>
                            <button onClick={handleHowItWorksClick} className="text-sm font-medium text-gray-500 hover:text-gray-900">How It Works</button>
                             {session?.isAdmin && (
                                <button onClick={() => onNavigate('admin')} className="text-sm font-medium text-cyan-600 hover:text-cyan-800">Admin</button>
                            )}
                            {session && !session.isAdmin && (
                                <button onClick={() => onNavigate('userDashboard')} className="text-sm font-medium text-cyan-600 hover:text-cyan-800">My Dashboard</button>
                            )}
                        </nav>
                        
                        <div className="w-px h-6 bg-gray-200 hidden md:block"></div>

                        {session ? (
                             <div className="flex items-center space-x-4">
                                <button onClick={onOpenChat} className="text-gray-500 hover:text-gray-900">
                                    <MessageSquareIcon className="h-6 w-6" />
                                </button>
                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {session.name.charAt(0).toUpperCase()}
                                 </div>
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
                </div>
            </div>
        </header>
    );
};

export default Header;