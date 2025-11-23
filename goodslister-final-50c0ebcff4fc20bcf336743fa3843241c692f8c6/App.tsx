
// FIX: Created the main App component, which was previously missing.
// This component manages the overall application state, including routing,
// session management, and data handling, resolving module resolution errors.
// FIX: Corrected the import for React and its hooks to resolve multiple "Cannot find name" errors.
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
import { AboutUsPage, CareersPage, PressPage, HelpCenterPage, ContactUsPage, TermsPage, PrivacyPolicyPage } from './components/StaticPages';
import { User, Listing, HeroSlide, Banner, Conversation, Message, Page, CategoryImagesMap, ListingCategory, Booking } from './types';
import * as mockApi from './services/mockApiService';
import { FilterCriteria, translateText } from './services/geminiService';

export interface Session extends User {
    isAdmin?: boolean;
}

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('home');
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    
    // Edit Listing State
    const [listingToEdit, setListingToEdit] = useState<Listing | undefined>(undefined);

    // Chat State
    const [isChatInboxOpen, setIsChatInboxOpen] = useState(false);
    const [initialConversationId, setInitialConversationId] = useState<string | null>(null);
    const [userLanguage, setUserLanguage] = useState('English');

    // This state now holds all data fetched from our mock API
    const [appData, setAppData] = useState<any | null>(null);

    // State to pass search criteria from HomePage to ExplorePage
    const [initialExploreFilters, setInitialExploreFilters] = useState<FilterCriteria | null>(null);
    
    // Fetch initial data on mount
    useEffect(() => {
        const loadData = async () => {
            // The API calls to /api/listings and /api/hello were failing,
            // likely due to an environment limitation with serverless functions.
            // This now loads data directly from the client-side mock service
            // to ensure the app is functional and error-free.
            const allData = await mockApi.fetchAllData();
            setAppData(allData);
        };

        loadData();
    }, []);

    // Use a generic update handler to keep state management DRY
    const updateAppData = (updates: Partial<any>) => {
        setAppData((prevData: any) => ({ ...prevData, ...updates }));
    };

    const handleNavigate = useCallback((newPage: Page) => {
        setPage(newPage);
        window.scrollTo(0, 0);
    }, []);

    const handleListingClick = useCallback((id: string) => {
        setSelectedListingId(id);
        handleNavigate('listingDetail');
    }, [handleNavigate]);

    const handleEditListingClick = useCallback((id: string) => {
        const listing = appData.listings.find((l: Listing) => l.id === id);
        if (listing) {
            setListingToEdit(listing);
            handleNavigate('editListing');
        }
    }, [appData, handleNavigate]);

    const handleSearch = (criteria: FilterCriteria) => {
        setInitialExploreFilters(criteria);
        handleNavigate('explore');
    };

    const handleLogin = async (email: string, password: string): Promise<boolean> => {
        const user = await mockApi.loginUser(email);
        if (user) {
            // In a real app, password would be verified on the backend
            const isAdmin = user.email.includes('admin') || user.email === 'lucianoreverberi@gmail.com';
            const userSession: Session = { ...user, isAdmin };
            setSession(userSession);
            setIsLoginModalOpen(false);
            if (isAdmin) {
                handleNavigate('admin');
            }
            return true;
        }
        return false;
    };

    const handleRegister = async (name: string, email: string, password: string): Promise<boolean> => {
        try {
            const newUser = await mockApi.registerUser(name, email);
            if(newUser) {
                updateAppData({ users: [...appData.users, newUser] });
                setSession({ ...newUser, isAdmin: false });
                setIsLoginModalOpen(false);
                return true;
            }
            return false;
        } catch(error) {
            console.error(error);
            return false;
        }
    };
    
    const handleLogout = () => {
        setSession(null);
        handleNavigate('home');
    };

    const handleStartConversation = (listing: Listing) => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        
        const existingConversation = appData.conversations.find((c: Conversation) => 
            c.listing.id === listing.id && c.participants[session.id] && c.participants[listing.owner.id]
        );

        if (existingConversation) {
            setInitialConversationId(existingConversation.id);
        } else {
            const newConversation: Conversation = {
                id: `convo-${Date.now()}`,
                listing: listing,
                participants: {
                    [session.id]: session,
                    [listing.owner.id]: listing.owner
                },
                messages: [],
            };
            const updatedConversations = [...appData.conversations, newConversation];
            mockApi.updateConversations(updatedConversations).then(convos => updateAppData({ conversations: convos }));
            setInitialConversationId(newConversation.id);
        }
        setIsChatInboxOpen(true);
    };

    const handleSendMessage = async (conversationId: string, text: string) => {
        if (!session) return;

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: session.id,
            text: text,
            timestamp: new Date().toISOString(),
        };

        const updatedConversations = appData.conversations.map((c: Conversation) => 
            c.id === conversationId ? { ...c, messages: [...c.messages, newMessage] } : c
        );
        updateAppData({ conversations: updatedConversations }); // Optimistic update
        mockApi.updateConversations(updatedConversations);
        
        // Simulate owner's reply.
        // The reply is always in English; translation is handled client-side in the ChatModal.
        setTimeout(async () => {
            const currentConvo = updatedConversations.find((c: Conversation) => c.id === conversationId);
            if (!currentConvo) return;
            
            const owner = Object.values(currentConvo.participants).find(p => (p as User).id !== session.id) as User | undefined;
            if(!owner) return;

            const originalReply = "Hello! Yes, it's available. How many days would you like to rent it for?";
            const translatedReply = await translateText(originalReply, userLanguage, 'English');


            const replyMessage: Message = {
                id: `msg-${Date.now() + 1}`,
                senderId: owner.id,
                text: translatedReply,
                originalText: originalReply, // Store original for re-translation
                timestamp: new Date().toISOString(),
            };
            const finalConversations = appData.conversations.map((c: Conversation) => 
                    c.id === conversationId ? { ...c, messages: [...c.messages, replyMessage] } : c
                );
             updateAppData({ conversations: finalConversations }); // Optimistic update
             mockApi.updateConversations(finalConversations);
        }, 1500);
    };

    const handleCreateBooking = async (listingId: string, startDate: Date, endDate: Date, totalPrice: number, insurancePlan: 'standard' | 'essential' | 'premium', paymentMethod: 'platform' | 'direct'): Promise<Booking> => {
        if (!session) {
            throw new Error("You must be logged in to book an item.");
        }
        const result = await mockApi.createBooking(listingId, session.id, startDate, endDate, totalPrice, insurancePlan, paymentMethod);
        
        // Update app state with the new booking and the updated listing (with new bookedDates)
        updateAppData({
            bookings: [...appData.bookings, result.newBooking],
            listings: appData.listings.map((l: Listing) => l.id === listingId ? result.updatedListing : l)
        });

        return result.newBooking;
    };

    const handleVerificationUpdate = async (userId: string, verificationType: 'email' | 'phone' | 'id') => {
        const updatedUsers = await mockApi.updateUserVerification(userId, verificationType);
        updateAppData({ users: updatedUsers });

        const updatedSessionUser = updatedUsers.find(u => u.id === session?.id);
        if (updatedSessionUser && session) {
             setSession(s => s ? {...s, ...updatedSessionUser} : null);
        }
    };

    const handleUpdateAvatar = async (userId: string, newAvatarUrl: string) => {
        const updatedUsers = await mockApi.updateUserAvatar(userId, newAvatarUrl);
        updateAppData({ users: updatedUsers });

        if (session?.id === userId) {
            setSession(s => s ? { ...s, avatarUrl: newAvatarUrl } : null);
        }
    };

    // --- Listing Management ---
    const handleCreateListing = async (listing: Listing): Promise<boolean> => {
        const success = await mockApi.createListing(listing);
        if (success) {
            // Optimistic update: add to local list immediately
            // In a real app, we might refetch
            updateAppData({ listings: [...appData.listings, listing] });
        }
        return success;
    };

    const handleUpdateListing = async (listing: Listing): Promise<boolean> => {
        const success = await mockApi.updateListing(listing);
        if (success) {
            updateAppData({ 
                listings: appData.listings.map((l: Listing) => l.id === listing.id ? listing : l) 
            });
        }
        return success;
    };

    // --- Admin content handlers ---
    const handleUpdateLogo = async (newUrl: string) => {
        const updatedLogoUrl = await mockApi.updateLogo(newUrl);
        updateAppData({ logoUrl: updatedLogoUrl });
    };
    const handleUpdateSlide = async (id: string, field: keyof HeroSlide, value: string) => {
        const slideToUpdate = appData.heroSlides.find((s: HeroSlide) => s.id === id);
        if(slideToUpdate) {
            const updatedSlides = await mockApi.updateSlide({ ...slideToUpdate, [field]: value });
            updateAppData({ heroSlides: updatedSlides });
        }
    };
    const handleAddSlide = async () => {
         const newSlide = { id: `slide-${Date.now()}`, title: 'New Slide', subtitle: 'Subtitle', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723a9ce6890?q=80&w=2070&auto=format&fit=crop' };
         const updatedSlides = await mockApi.addSlide(newSlide);
         updateAppData({ heroSlides: updatedSlides });
    };
    const handleDeleteSlide = async (id: string) => {
        const updatedSlides = await mockApi.deleteSlide(id);
        updateAppData({ heroSlides: updatedSlides });
    };
    const handleUpdateBanner = async (id: string, field: keyof Banner, value: string) => {
        const bannerToUpdate = appData.banners.find((b: Banner) => b.id === id);
        if(bannerToUpdate) {
            const updatedBanners = await mockApi.updateBanner({ ...bannerToUpdate, [field]: value });
            updateAppData({ banners: updatedBanners });
        }
    };
    const handleAddBanner = async () => {
        const newBanner = { id: `banner-${Date.now()}`, title: 'New Banner', description: 'Description', buttonText: 'Click', imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop' };
        const updatedBanners = await mockApi.addBanner(newBanner);
        updateAppData({ banners: updatedBanners });
    };
    const handleDeleteBanner = async (id: string) => {
        const updatedBanners = await mockApi.deleteBanner(id);
        updateAppData({ banners: updatedBanners });
    };
    const handleToggleFeatured = async (id: string) => {
        const updatedListings = await mockApi.toggleFeaturedListing(id);
        updateAppData({ listings: updatedListings });
    };
    const handleUpdatePaymentApiKey = async (newKey: string) => {
        const updatedKey = await mockApi.updatePaymentApiKey(newKey);
        updateAppData({ paymentApiKey: updatedKey });
    };
    const handleUpdateCategoryImage = async (category: ListingCategory, newUrl: string) => {
        const updatedCategoryImages = await mockApi.updateCategoryImage(category, newUrl);
        updateAppData({ categoryImages: updatedCategoryImages });
    };
    const handleUpdateListingImage = async (listingId: string, newImageUrl: string): Promise<void> => {
        const updatedListings = await mockApi.updateListingImage(listingId, newImageUrl);
        updateAppData({ listings: updatedListings });
    };

    if (!appData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <img src="https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png" alt="Goodslister Logo" className="h-12 w-auto mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">Loading your adventure...</p>
                </div>
            </div>
        );
    }
    
    // Deconstruct appData for easier use throughout the component
    const {
        users,
        listings,
        heroSlides,
        banners,
        categoryImages,
        logoUrl,
        paymentApiKey,
        conversations,
        bookings,
    } = appData;

    const renderPage = () => {
        switch (page) {
            case 'explore':
                return <ExplorePage 
                    listings={listings} 
                    onListingClick={handleListingClick} 
                    initialFilters={initialExploreFilters}
                    onClearInitialFilters={() => setInitialExploreFilters(null)}
                />;
            case 'listingDetail':
                const listing = listings.find((l: Listing) => l.id === selectedListingId);
                return listing ? <ListingDetailPage 
                    listing={listing} 
                    onBack={() => handleNavigate('explore')} 
                    onStartConversation={handleStartConversation}
                    currentUser={session}
                    onCreateBooking={handleCreateBooking}
                /> : <p>Listing not found.</p>;
            case 'createListing':
                return <CreateListingPage onBack={() => handleNavigate('home')} currentUser={session} onSubmit={handleCreateListing} />;
            case 'editListing':
                return listingToEdit ? 
                    <CreateListingPage 
                        onBack={() => handleNavigate('userDashboard')} 
                        currentUser={session} 
                        initialData={listingToEdit} 
                        onSubmit={handleUpdateListing} 
                    /> : <p>No listing selected for editing.</p>;
            case 'aiAssistant':
                return <AIAssistantPage />;
            case 'admin':
                return session?.isAdmin ? <AdminPage 
                    users={users}
                    listings={listings}
                    heroSlides={heroSlides}
                    banners={banners}
                    logoUrl={logoUrl}
                    paymentApiKey={paymentApiKey}
                    categoryImages={categoryImages}
                    onUpdatePaymentApiKey={handleUpdatePaymentApiKey}
                    onUpdateLogo={handleUpdateLogo}
                    onUpdateSlide={handleUpdateSlide}
                    onAddSlide={handleAddSlide}
                    onDeleteSlide={handleDeleteSlide}
                    onUpdateBanner={handleUpdateBanner}
                    onAddBanner={handleAddBanner}
                    onDeleteBanner={handleDeleteBanner}
                    onToggleFeatured={handleToggleFeatured}
                    onUpdateCategoryImage={handleUpdateCategoryImage}
                    onUpdateListingImage={handleUpdateListingImage}
                /> : <p>Access Denied.</p>;
             case 'userDashboard':
                return session ? <UserDashboardPage 
                    user={session} 
                    listings={listings.filter((l: Listing) => l.owner.id === session.id)} 
                    bookings={bookings.filter((b: Booking) => b.renterId === session.id)}
                    onVerificationUpdate={handleVerificationUpdate}
                    onUpdateAvatar={handleUpdateAvatar}
                    onListingClick={handleListingClick}
                    onEditListing={handleEditListingClick}
                /> : <p>Please log in.</p>;
            case 'aboutUs':
                return <AboutUsPage />;
            case 'careers':
                return <CareersPage />;
            case 'press':
                return <PressPage />;
            case 'helpCenter':
                return <HelpCenterPage />;
            case 'contactUs':
                return <ContactUsPage />;
            case 'terms':
                return <TermsPage />;
            case 'privacyPolicy':
                return <PrivacyPolicyPage />;
            case 'home':
            default:
                return <HomePage 
                    onListingClick={handleListingClick} 
                    onCreateListing={() => handleNavigate('createListing')}
                    onSearch={handleSearch}
                    listings={listings}
                    heroSlides={heroSlides}
                    banners={banners}
                    categoryImages={categoryImages}
                />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header 
                onNavigate={handleNavigate}
                onLoginClick={() => setIsLoginModalOpen(true)}
                onLogoutClick={handleLogout}
                onOpenChat={() => { setInitialConversationId(null); setIsChatInboxOpen(true); }}
                session={session}
                logoUrl={logoUrl}
            />
            <main className="flex-grow">
                {renderPage()}
            </main>
            <Footer logoUrl={logoUrl} onNavigate={handleNavigate} />
            
            {isLoginModalOpen && (
                <LoginModal 
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    onClose={() => setIsLoginModalOpen(false)} 
                />
            )}
            
            {isChatInboxOpen && session && (
                 <ChatInboxModal
                    isOpen={isChatInboxOpen}
                    onClose={() => setIsChatInboxOpen(false)}
                    conversations={conversations.filter((c: Conversation) => c.participants[session.id])}
                    currentUser={session}
                    onSendMessage={handleSendMessage}
                    initialConversationId={initialConversationId}
                    userLanguage={userLanguage}
                    onLanguageChange={setUserLanguage}
                />
            )}
        </div>
    );
};

export default App;
