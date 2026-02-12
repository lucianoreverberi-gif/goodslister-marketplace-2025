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
import ChatLayout from './components/chat/ChatLayout';
import ChatInboxModal from './components/ChatModal';
import ExplorePage from './components/ExplorePage';
import { AboutUsPage, CareersPage, PressPage, HelpCenterPage, ContactUsPage, TermsPage, PrivacyPolicyPage, HowItWorksPage } from './components/StaticPages';
import FloridaCompliancePage from './components/FloridaCompliancePage';
import UserProfilePage from './components/UserProfilePage';
import { User, Listing, HeroSlide, Banner, Conversation, Message, Page, CategoryImagesMap, ListingCategory, Booking, Session } from './types';
import * as mockApi from './services/mockApiService';
import { FilterCriteria } from './services/geminiService';
import { CheckCircleIcon, BellIcon, MailIcon, XIcon, MessageCircleIcon } from './components/icons';
import { format } from 'date-fns';

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('home');
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [selectedUserProfileId, setSelectedUserProfileId] = useState<string | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [appData, setAppData] = useState<any | null>(null);
    const [initialExploreFilters, setInitialExploreFilters] = useState<FilterCriteria | null>(null);
    const [isChatInboxOpen, setIsChatInboxOpen] = useState(false);
    const [chatContext, setChatContext] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            const allData = await mockApi.fetchAllData();
            setAppData(allData);
        };
        loadData();
    }, []);

    const handleNavigate = useCallback((newPage: Page) => {
        setPage(newPage);
        window.scrollTo(0, 0);
    }, []);

    const handleListingClick = useCallback((id: string) => {
        setSelectedListingId(id);
        handleNavigate('listingDetail');
    }, [handleNavigate]);

    const handleToggleFavorite = async (listingId: string) => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        await mockApi.toggleFavorite(session.id, listingId);
        const allData = await mockApi.fetchAllData();
        setAppData(allData);
    };

    if (!appData) return <div className="flex h-screen items-center justify-center">Loading Adventure...</div>;

    const renderPage = () => {
        switch (page) {
            case 'explore': return <ExplorePage listings={appData.listings} onListingClick={handleListingClick} favorites={session?.favorites || []} onToggleFavorite={handleToggleFavorite} onClearInitialFilters={() => {}} />;
            case 'listingDetail': 
                const l = appData.listings.find((x: any) => x.id === selectedListingId);
                return l ? <ListingDetailPage listing={l} onBack={() => handleNavigate('explore')} onStartConversation={() => {}} currentUser={session} onCreateBooking={async () => ({} as any)} isFavorite={false} onToggleFavorite={() => {}} /> : null;
            case 'admin': return <AdminPage {...appData} onUpdateLogo={mockApi.updateLogo} onUpdateSlide={mockApi.updateSlide} onDeleteListing={mockApi.deleteListing} onViewListing={handleListingClick} />;
            case 'userDashboard': return session ? <UserDashboardPage user={session} listings={appData.listings.filter((x:any) => x.owner.id === session.id)} bookings={[]} onToggleFavorite={handleToggleFavorite} onViewPublicProfile={() => {}} onDeleteListing={mockApi.deleteListing} onBookingStatusUpdate={async () => {}} onUpdateAvatar={mockApi.updateUserAvatar} onUpdateProfile={mockApi.updateUserProfile} onVerificationUpdate={() => {}} /> : null;
            case 'home':
            default: return <HomePage onListingClick={handleListingClick} onCreateListing={() => handleNavigate('createListing')} onSearch={() => {}} onNavigate={handleNavigate} listings={appData.listings} heroSlides={appData.heroSlides} banners={appData.banners} categoryImages={appData.categoryImages} favorites={session?.favorites || []} onToggleFavorite={handleToggleFavorite} />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header onNavigate={handleNavigate} onLoginClick={() => setIsLoginModalOpen(true)} onLogoutClick={() => setSession(null)} onOpenChat={() => setIsChatInboxOpen(true)} session={session} logoUrl={appData.logoUrl} />
            <main className="flex-grow">{renderPage()}</main>
            <Footer logoUrl={appData.logoUrl} onNavigate={handleNavigate} />
            {isLoginModalOpen && <LoginModal onLogin={async (e) => { const u = await mockApi.loginUser(e); setSession(u as any); setIsLoginModalOpen(false); return !!u; }} onRegister={async () => true} onClose={() => setIsLoginModalOpen(false)} />}
        </div>
    );
};

export default App;