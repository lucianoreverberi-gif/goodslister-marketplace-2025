import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ListingDetailPage from './components/ListingDetailPage';
import CreateListingPage from './components/CreateListingPage';
import AIAssistantPage from './components/AIAssistantPage';
import AdminPage from './components/AdminPage';
import UserDashboardPage from './components/UserDashboardPage';
import LoginModal from './components/LoginModal';
import ChatInboxModal from './components/ChatModal';
import ExplorePage from './components/ExplorePage';
import { AboutUsPage, CareersPage, PressPage, HelpCenterPage, ContactUsPage, TermsPage, PrivacyPolicyPage, HowItWorksPage } from './components/StaticPages';
import FloridaCompliancePage from './components/FloridaCompliancePage';
import UserProfilePage from './components/UserProfilePage'; 
import SEOHead from './components/SEOHead'; 
import { User, Listing, HeroSlide, Banner, Page, ListingCategory, Booking, Session } from './types';
import * as mockApi from './services/mockApiService';
import { FilterCriteria } from './services/geminiService';
import { CheckCircleIcon, MailIcon, XIcon, MessageCircleIcon } from './components/icons';
import { format } from 'date-fns';

interface Notification {
    id: string;
    type: 'success' | 'info' | 'message';
    title: string;
    message: string;
}

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('home');
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [selectedUserProfileId, setSelectedUserProfileId] = useState<string | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [listingToEdit, setListingToEdit] = useState<Listing | undefined>(undefined);
    const [isChatInboxOpen, setIsChatInboxOpen] = useState(false);
    const [chatContext, setChatContext] = useState<{ listing?: Listing, recipient?: User, conversationId?: string } | null>(null);
    const [userLanguage, setUserLanguage] = useState('English');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [appData, setAppData] = useState<any | null>(null);
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [initialExploreFilters, setInitialExploreFilters] = useState<FilterCriteria | null>(null);
    
    useEffect(() => {
        const loadData = async () => {
            const allData = await mockApi.fetchAllData();
            setAppData(allData);
            setTimeout(() => setIsAppLoading(false), 500);
        };
        loadData();
    }, []);

    const updateAppData = (updates: Partial<any>) => {
        setAppData((prevData: any) => ({ ...prevData, ...updates }));
    };

    const handleNavigate = useCallback((newPage: Page) => {
        setPage(newPage);
        window.scrollTo(0, 0);
    }, []);

    const addNotification = (type: 'success' | 'info' | 'message', title: string, message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    };

    const handleLogin = async (email: string, password: string): Promise<boolean> => {
        const user = await mockApi.loginUser(email, password);
        if (user) {
            const isAdmin = user.email.includes('admin') || user.email === 'lucianoreverberi@gmail.com';
            setSession({ ...user, isAdmin });
            setIsLoginModalOpen(false);
            addNotification('success', 'Bienvenido', `Hola de nuevo, ${user.name}`);
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setSession(null);
        handleNavigate('home');
        addNotification('info', 'Sesión cerrada', '¡Hasta pronto!');
    };

    const renderPage = () => {
        switch (page) {
            case 'explore': return <ExplorePage listings={appData.listings} onListingClick={(id) => { setSelectedListingId(id); handleNavigate('listingDetail'); }} initialFilters={initialExploreFilters} onClearInitialFilters={() => setInitialExploreFilters(null)} favorites={session?.favorites || []} onToggleFavorite={() => {}} />;
            case 'listingDetail': 
                const l = appData.listings.find((x: any) => x.id === selectedListingId);
                return l ? <ListingDetailPage listing={l} onBack={() => handleNavigate('explore')} onStartConversation={(list) => { setChatContext({ listing: list, recipient: list.owner }); setIsChatInboxOpen(true); }} currentUser={session} onCreateBooking={async () => ({} as any)} isFavorite={false} onToggleFavorite={() => {}} /> : null;
            case 'userDashboard':
                return session ? <UserDashboardPage user={session} listings={appData.listings.filter((l: any) => l.owner.id === session.id)} bookings={appData.bookings.filter((b: any) => b.renterId === session.id || b.listing.owner.id === session.id)} favoriteListings={appData.listings.filter((l: any) => session.favorites?.includes(l.id))} onVerificationUpdate={() => {}} onUpdateAvatar={async () => {}} onUpdateProfile={async () => {}} onListingClick={(id) => { setSelectedListingId(id); handleNavigate('listingDetail'); }} onEditListing={(id) => { setListingToEdit(appData.listings.find((x: any) => x.id === id)); handleNavigate('editListing'); }} onToggleFavorite={() => {}} onViewPublicProfile={() => {}} onDeleteListing={async () => {}} onBookingStatusUpdate={async () => {}} onNavigate={handleNavigate} /> : <p>Inicia sesión</p>;
            case 'home':
            default:
                return <HomePage onListingClick={(id) => { setSelectedListingId(id); handleNavigate('listingDetail'); }} onCreateListing={() => handleNavigate('createListing')} onSearch={(c) => { setInitialExploreFilters(c); handleNavigate('explore'); }} onNavigate={handleNavigate} listings={appData.listings} heroSlides={appData.heroSlides} banners={appData.banners} categoryImages={appData.categoryImages} favorites={session?.favorites || []} onToggleFavorite={() => {}} />;
        }
    };

    if (isAppLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><img src="https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png" className="h-12 animate-pulse" /></div>;

    return (
        <div className="flex flex-col min-h-screen">
            <Header onNavigate={handleNavigate} onLoginClick={() => setIsLoginModalOpen(true)} onLogoutClick={handleLogout} onOpenChat={() => setIsChatInboxOpen(true)} session={session} logoUrl={appData.logoUrl} />
            <main className="flex-grow">{renderPage()}</main>
            <Footer logoUrl={appData.logoUrl} onNavigate={handleNavigate} />
            {isLoginModalOpen && <LoginModal onLogin={handleLogin} onRegister={async () => true} onClose={() => setIsLoginModalOpen(false)} />}
            {isChatInboxOpen && session && <ChatInboxModal isOpen={isChatInboxOpen} onClose={() => setIsChatInboxOpen(false)} currentUser={session} initialContext={chatContext} userLanguage={userLanguage} onLanguageChange={setUserLanguage} />}
        </div>
    );
};

export default App;