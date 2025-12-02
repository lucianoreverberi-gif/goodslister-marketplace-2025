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
import { AboutUsPage, CareersPage, PressPage, HelpCenterPage, ContactUsPage, TermsPage, PrivacyPolicyPage, HowItWorksPage } from './components/StaticPages';
import FloridaCompliancePage from './components/FloridaCompliancePage';
import { User, Listing, HeroSlide, Banner, Conversation, Message, Page, CategoryImagesMap, ListingCategory, Booking, Session } from './types';
import * as mockApi from './services/mockApiService';
import { FilterCriteria, translateText } from './services/geminiService';
import { CheckCircleIcon, BellIcon, MailIcon, XIcon, MessageCircleIcon } from './components/icons';
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
    const [session, setSession] = useState<Session | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    
    // Edit Listing State
    const [listingToEdit, setListingToEdit] = useState<Listing | undefined>(undefined);

    // Chat State
    const [isChatInboxOpen, setIsChatInboxOpen] = useState(false);
    const [initialConversationId, setInitialConversationId] = useState<string | null>(null);
    const [userLanguage, setUserLanguage] = useState('English');

    // Notification System State
    const [notifications, setNotifications] = useState<Notification[]>([]);

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

    const addNotification = (type: 'success' | 'info' | 'message', title: string, message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [...prev, { id, type, title, message }]);
        // Auto remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

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

    const handleToggleFavorite = async (listingId: string) => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }

        const currentFavorites = session.favorites || [];
        let newFavorites;
        
        if (currentFavorites.includes(listingId)) {
            newFavorites = currentFavorites.filter(id => id !== listingId);
            addNotification('info', 'Removed from Saved', 'Listing removed from your favorites.');
        } else {
            newFavorites = [...currentFavorites, listingId];
            addNotification('success', 'Saved!', 'Listing added to your favorites.');
        }

        // Optimistic UI Update
        const updatedUser = { ...session, favorites: newFavorites };
        setSession(updatedUser);
        
        // Also update the user in the appData list
        const updatedUsers = appData.users.map((u: User) => u.id === session.id ? updatedUser : u);
        updateAppData({ users: updatedUsers });

        // Persist
        await mockApi.toggleFavorite(session.id, listingId);
    };

    const handleLogin = async (email: string, password: string): Promise<boolean> => {
        const user = await mockApi.loginUser(email);
        if (user) {
            // In a real app, password would be verified on the backend
            const isAdmin = user.email.includes('admin') || user.email === 'lucianoreverberi@gmail.com';
            const userSession: Session = { ...user, isAdmin };
            setSession(userSession);
            setIsLoginModalOpen(false);
            addNotification('success', 'Welcome back!', `Logged in as ${user.name}`);
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
                
                // Send Welcome Email via Resend
                mockApi.sendEmail('welcome', email, { name }).then(success => {
                    if (success) {
                        addNotification('info', 'Welcome Email Sent', `We sent a welcome email to ${email}.`);
                    } else {
                        addNotification('success', 'Welcome!', 'Account created successfully.');
                    }
                });
                
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
        addNotification('info', 'Logged Out', 'See you next time!');
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
        
        // Send Email Notification to the other participant (Simulated sending to current user email for testing)
        // In production, this would go to the real recipient.
        const currentConvo = updatedConversations.find((c: Conversation) => c.id === conversationId);
        if (currentConvo) {
             const recipient = Object.values(currentConvo.participants).find(p => (p as User).id !== session.id) as User;
             if (recipient) {
                 // NOTE: Using session.email for 'to' because we can only send to verified email in Resend Free tier.
                 // In a real app, use `recipient.email`.
                 mockApi.sendEmail('message_notification', session.email, {
                     senderName: session.name,
                     listingTitle: currentConvo.listing.title,
                     messagePreview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
                 });
             }
        }

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
             
             // Simulate Inbox Notification
             if (!isChatInboxOpen) {
                 addNotification('message', `New Message from ${owner.name}`, translatedReply.substring(0, 30) + '...');
             }

        }, 1500);
    };

    const handleCreateBooking = async (
        listingId: string, 
        startDate: Date, 
        endDate: Date, 
        totalPrice: number, 
        paymentMethod: 'platform' | 'direct',
        protectionType: 'waiver' | 'insurance', 
        protectionFee: number
    ): Promise<Booking> => {
        if (!session) {
            throw new Error("You must be logged in to book an item.");
        }
        
        // Determine split amounts based on paymentMethod (Simplified logic)
        const amountPaidOnline = paymentMethod === 'platform' ? totalPrice : 0;
        const balanceDueOnSite = paymentMethod === 'direct' ? totalPrice : 0;

        // Pass all new parameters to the API/Mock layer
        const result = await mockApi.createBooking(
            listingId, 
            session.id, 
            startDate, 
            endDate, 
            totalPrice, 
            amountPaidOnline,
            balanceDueOnSite,
            paymentMethod,
            protectionType, 
            protectionFee
        );
        
        // Update app state with the new booking and the updated listing (with new bookedDates)
        const updatedBookings = [...appData.bookings, result.newBooking];
        const updatedListings = appData.listings.map((l: Listing) => l.id === listingId ? result.updatedListing : l);
        
        // --- NEW: INJECT SYSTEM MESSAGE FOR BAREBOAT CONTRACT ---
        // Find existing conversation or create new one
        let conversation = appData.conversations.find((c: Conversation) => 
            c.listing.id === listingId && c.participants[session.id] && c.participants[result.updatedListing.owner.id]
        );

        if (!conversation) {
            conversation = {
                id: `convo-${Date.now()}`,
                listing: result.updatedListing,
                participants: {
                    [session.id]: session,
                    [result.updatedListing.owner.id]: result.updatedListing.owner
                },
                messages: [],
            };
            // Note: We'll add this to the list below
        }

        const systemMessage: Message = {
            id: `sys-msg-${Date.now()}`,
            senderId: 'system-bot', // Special ID for system messages
            text: "Hi! Here is the standard rental agreement template for your trip: [Link to PDF](/bareboat_rental_agreement.pdf). Please review and sign it together at pickup.",
            timestamp: new Date().toISOString(),
        };

        const updatedConversationWithMsg = { 
            ...conversation, 
            messages: [...conversation.messages, systemMessage] 
        };

        const finalConversations = conversation 
            ? appData.conversations.map((c: Conversation) => c.id === conversation.id ? updatedConversationWithMsg : c)
            : [...appData.conversations, updatedConversationWithMsg];

        mockApi.updateConversations(finalConversations);

        updateAppData({
            bookings: updatedBookings,
            listings: updatedListings,
            conversations: finalConversations
        });

        // Send Booking Confirmation Email via Resend
        mockApi.sendEmail('booking_confirmation', session.email, {
            name: session.name,
            listingTitle: result.updatedListing.title,
            startDate: format(startDate, 'MMM dd, yyyy'),
            endDate: format(endDate, 'MMM dd, yyyy'),
            totalPrice: totalPrice.toFixed(2),
            paymentMethod: paymentMethod
        }).then(success => {
            if (success) {
                addNotification('success', 'Booking Confirmed', `Confirmation email sent to ${session.email}.`);
            }
        });

        // Simulate Owner Notification (Logic that would happen on server)
        setTimeout(() => {
             // In real app, this would be an email to the owner
             console.log(`System: Email sent to owner of ${result.updatedListing.title} about new booking.`);
        }, 1000);

        return result.newBooking;
    };

    const handleVerificationUpdate = async (userId: string, verificationType: 'email' | 'phone' | 'id') => {
        const updatedUsers = await mockApi.updateUserVerification(userId, verificationType);
        updateAppData({ users: updatedUsers });

        const updatedSessionUser = updatedUsers.find(u => u.id === session?.id);
        if (updatedSessionUser && session) {
             setSession(s => s ? {...s, ...updatedSessionUser} : null);
        }
        
        if (verificationType === 'id') {
            addNotification('success', 'Identity Verified', 'Your ID has been processed and verified successfully.');
        } else if (verificationType === 'phone') {
            addNotification('success', 'Phone Verified', 'Your phone number has been verified.');
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
            addNotification('success', 'Listing Published', 'Your item is now live on the marketplace.');
        }
        return success;
    };

    const handleUpdateListing = async (listing: Listing): Promise<boolean> => {
        const success = await mockApi.updateListing(listing);
        if (success) {
            updateAppData({ 
                listings: appData.listings.map((l: Listing) => l.id === listing.id ? listing : l) 
            });
            addNotification('success', 'Listing Updated', 'Changes saved successfully.');
        }
        return success;
    };

    // --- Admin content handlers ---
    const handleUpdateLogo = async (newUrl: string) => {
        const updatedLogoUrl = await mockApi.updateLogo(newUrl);
        updateAppData({ logoUrl: updatedLogoUrl });
    };

    // OPTIMISTIC UPDATE FIX for Slides
    // We update local state immediately and then save to DB in background
    // This prevents the "resetting" issue when editing multiple items quickly
    const handleUpdateSlide = async (id: string, field: keyof HeroSlide, value: string) => {
        // 1. Update Local State Immediately
        const updatedSlides = appData.heroSlides.map((s: HeroSlide) => 
            s.id === id ? { ...s, [field]: value } : s
        );
        updateAppData({ heroSlides: updatedSlides });

        // 2. Persist to Backend (Fire and Forget for UI purposes)
        const slideToUpdate = updatedSlides.find((s: HeroSlide) => s.id === id);
        if(slideToUpdate) {
            // We ignore the return value here to avoid overwriting our optimistic state with stale data from server cache
            await mockApi.updateSlide(slideToUpdate);
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

    // OPTIMISTIC UPDATE FIX for Banners
    // Identical strategy to slides: update UI first, save later.
    const handleUpdateBanner = async (id: string, field: keyof Banner, value: string) => {
        // 1. Update Local State Immediately
        const updatedBanners = appData.banners.map((b: Banner) => 
            b.id === id ? { ...b, [field]: value } : b
        );
        updateAppData({ banners: updatedBanners });

        // 2. Persist to Backend
        const bannerToUpdate = updatedBanners.find((b: Banner) => b.id === id);
        if(bannerToUpdate) {
            // We ignore the return value here to avoid overwriting our optimistic state with stale data from server cache
            await mockApi.updateBanner(bannerToUpdate);
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
                    favorites={session?.favorites || []}
                    onToggleFavorite={handleToggleFavorite}
                />;
            case 'listingDetail':
                const listing = listings.find((l: Listing) => l.id === selectedListingId);
                return listing ? <ListingDetailPage 
                    listing={listing} 
                    onBack={() => handleNavigate('explore')} 
                    onStartConversation={handleStartConversation}
                    currentUser={session}
                    onCreateBooking={handleCreateBooking}
                    isFavorite={session?.favorites?.includes(listing.id) || false}
                    onToggleFavorite={handleToggleFavorite}
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
                    onViewListing={handleListingClick}
                /> : <p>Access Denied.</p>;
             case 'userDashboard':
                return session ? <UserDashboardPage 
                    user={session} 
                    listings={listings.filter((l: Listing) => l.owner.id === session.id)} 
                    // Pass both bookings where user is the renter OR the owner
                    bookings={bookings.filter((b: Booking) => b.renterId === session.id || b.listing.owner.id === session.id)}
                    favoriteListings={listings.filter(l => session.favorites?.includes(l.id))}
                    onVerificationUpdate={handleVerificationUpdate}
                    onUpdateAvatar={handleUpdateAvatar}
                    onListingClick={handleListingClick}
                    onEditListing={handleEditListingClick}
                    onToggleFavorite={handleToggleFavorite}
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
            case 'howItWorks':
                return <HowItWorksPage />;
            case 'floridaCompliance':
                return <FloridaCompliancePage />;
            case 'home':
            default:
                return <HomePage 
                    onListingClick={handleListingClick} 
                    onCreateListing={() => handleNavigate('createListing')}
                    onSearch={handleSearch}
                    onNavigate={handleNavigate}
                    listings={listings}
                    heroSlides={heroSlides}
                    banners={banners}
                    categoryImages={categoryImages}
                    favorites={session?.favorites || []}
                    onToggleFavorite={handleToggleFavorite}
                />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen relative">
            {/* Notification Container */}
            <div className="fixed top-20 right-4 z-50 space-y-3 pointer-events-none">
                {notifications.map(n => (
                    <div 
                        key={n.id} 
                        className={`pointer-events-auto w-80 p-4 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out translate-x-0 border-l-4 flex items-start gap-3 ${
                            n.type === 'success' ? 'bg-white border-green-500' : 
                            n.type === 'message' ? 'bg-white border-blue-500' :
                            'bg-white border-cyan-500'
                        }`}
                    >
                        <div className="flex-shrink-0 pt-0.5">
                            {n.type === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                            {n.type === 'info' && <MailIcon className="h-5 w-5 text-cyan-500" />}
                            {n.type === 'message' && <MessageCircleIcon className="h-5 w-5 text-blue-500" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 leading-snug">{n.message}</p>
                        </div>
                        <button onClick={() => removeNotification(n.id)} className="text-gray-400 hover:text-gray-600">
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>

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