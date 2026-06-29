// FIX: Created the main App component, which was previously missing.
// This component manages the overall application state, including routing,
// session management, and data handling, resolving module resolution errors.
// FIX: Corrected the import for React and its hooks to resolve multiple "Cannot find name" errors.
import React, { useState, useCallback, useEffect } from 'react';
import { 
  auth, 
  signInWithGoogle, 
  db, 
  setDoc, 
  doc, 
  serverTimestamp,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail
} from './services/firebase';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ListingDetailPage from './components/ListingDetailPage';
import CreateListingPage from './components/CreateListingPage';
import AIAssistantPage from './components/AIAssistantPage';
import AdminPage from './components/AdminPage';
import AdminBoostsPage from './components/AdminBoostsPage';
import UserDashboardPage from './components/UserDashboardPage';
import LoginModal from './components/LoginModal';
import ChatLayout from './components/chat/ChatLayout';
import ChatInboxModal from './components/ChatModal';
import ExplorePage from './components/ExplorePage';
import { AboutUsPage, CareersPage, PressPage, HelpCenterPage, ContactUsPage, TermsPage, PrivacyPolicyPage, HowItWorksPage, CookiePolicyPage, DoNotSellPage } from './components/StaticPages';
import FloridaCompliancePage from './components/FloridaCompliancePage';
import UserProfilePage from './components/UserProfilePage'; // NEW IMPORT
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useCookieConsent } from './hooks/useCookieConsent';
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
    const [page, setPage] = useState<Page>(() => {
        const hash = window.location.hash.replace('#', '') as Page;
        return hash || 'home';
    });
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [selectedUserProfileId, setSelectedUserProfileId] = useState<string | null>(null);
    const { consent } = useCookieConsent();
    
    // Initialize session state
    const [session, setSession] = useState<Session | null>(null);

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    
    // Sync session to localStorage whenever it changes
    useEffect(() => {
        if (session) {
            localStorage.setItem('goodslister_session', JSON.stringify(session));
        } else {
            localStorage.removeItem('goodslister_session');
        }
    }, [session]);
    
    // ... rest of state ...
    const [listingToEdit, setListingToEdit] = useState<Listing | undefined>(undefined);

    // Chat State
    const [isChatInboxOpen, setIsChatInboxOpen] = useState(false);
    const [chatContext, setChatContext] = useState<{ listing?: Listing, recipient?: User, conversationId?: string } | null>(null);
    const [userLanguage, setUserLanguage] = useState('English');
    const [initialConversationId, setInitialConversationId] = useState<string | null>(null);

    // Notification System State
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const [appData, setAppData] = useState<any | null>(null);
    const [initialExploreFilters, setInitialExploreFilters] = useState<FilterCriteria | null>(null);
    const [userLocation, setUserLocation] = useState<{ city: string, state: string, lat: number, lng: number }>({
        city: 'Miami',
        state: 'FL',
        lat: 25.7617,
        lng: -80.1918
    });
    
    // Detect Location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse geocode to get city/state (Mocked for now but could use an API)
                    // For the sake of the demo, we'll keep Miami as default unless user specifically changes it
                    // or we could use a public ip-api
                    const res = await fetch(`https://ipapi.co/json/`);
                    const data = await res.json();
                    if (data.city && data.region_code) {
                        setUserLocation({
                            city: data.city,
                            state: data.region_code,
                            lat: data.latitude,
                            lng: data.longitude
                        });
                    }
                } catch (e) {
                    console.warn("Location detection failed, using default.");
                }
            });
        }
    }, []);
    
    // Fetch initial data on mount
    useEffect(() => {
        const loadData = async () => {
            const allData = await mockApi.fetchAllData();
            setAppData(allData);
            
            // If we have a session, refresh user data from latest appData
            const savedSession = localStorage.getItem('goodslister_session');
            if (savedSession && allData.users) {
                try {
                    const parsed = JSON.parse(savedSession);
                    const freshUser = allData.users.find((u: User) => u.id === parsed.id);
                    if (freshUser) {
                        // Re-verify admin status
                        const isAdmin = (freshUser.role === 'SUPER_ADMIN' || freshUser.email === 'lucianoreverberi@gmail.com') ? (parsed.isAdmin || true) : (freshUser.email.includes('admin'));
                        const userSession = { ...freshUser, isAdmin };
                        setSession(userSession);
                        syncUserToFirestore(freshUser); // Sync on startup/restore
                    }
                } catch (e) {}
            }
        };

        loadData();
    }, []);

    // Use a generic update handler to keep state management DRY
    const updateAppData = (updates: Partial<any>) => {
        setAppData((prevData: any) => ({ ...prevData, ...updates }));
    };

    const handleNavigate = useCallback((newPage: Page) => {
        setPage(newPage);
        window.location.hash = newPage;
        window.scrollTo(0, 0);
    }, []);

    // Listen to hash changes for direct URL navigation
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '') as Page;
            if (hash) setPage(hash);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // NEW: Handle navigating to user profile
    const handleViewUserProfile = useCallback((userId: string) => {
        setSelectedUserProfileId(userId);
        handleNavigate('userProfile');
    }, [handleNavigate]);

    const addNotification = (type: 'success' | 'info' | 'message', title: string, message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [...prev, { id, type, title, message }]);
        // Auto remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    // UPDATED: Handle updating user profile (name/bio/avatar)
    const handleUpdateUserProfile = async (name: string, bio: string, avatarUrl: string) => {
        if (!session) return;
        
        // Optimistic Update
        const updatedSession = { ...session, name, bio, avatarUrl };
        setSession(updatedSession);
        
        // Update App Data List
        const updatedUsers = appData.users.map((u: User) => u.id === session.id ? { ...u, name, bio, avatarUrl } : u);
        updateAppData({ users: updatedUsers });

        // CALL UPDATED API
        await mockApi.updateUserProfile(session.id, name, bio, avatarUrl); 
        
        addNotification('success', 'Profile Updated', 'Your information has been saved successfully.');
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

    // NEW: Sync user to Firestore for chat UI discoverability
    const syncUserToFirestore = async (user: User) => {
        try {
            await setDoc(doc(db, 'users', user.id), {
                id: user.id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                role: user.role || 'USER',
                lastSeen: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.warn("Firestore user sync failed:", e);
        }
    };

    const handleLogin = async (email: string, password: string): Promise<boolean> => {
        // SECURITY FIX: Require strict password for the admin account
        if (email.toLowerCase() === 'lucianoreverberi@gmail.com' && password !== 'admin123') {
            addNotification('info', 'Auth Denied', 'Invalid password for admin user.');
            return false;
        }

        // HIDE & SECURE DEMO USERS: Block old public emails, enforce custom secure passwords for the new demo emails
        if (email === 'carlos.gomez@example.com' || email === 'ana.rodriguez@example.com') {
            addNotification('info', 'Auth Denied', 'This public demo login is deactivated. Please locate the secure administrator demo credentials.');
            return false;
        }

        if (email === 'carlos.demo@goodslister.com' && password !== 'carlosDemo123!') {
            addNotification('info', 'Auth Denied', 'Invalid password for the administrator demo user.');
            return false;
        }

        if (email === 'ana.demo@goodslister.com' && password !== 'anaDemo123!') {
            addNotification('info', 'Auth Denied', 'Invalid password for the administrator demo user.');
            return false;
        }

        try {
            // Attempt to sign in via Firebase Authentication
            const result = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = result.user;

            // Retrieve or build the app profile
            let existingUser = appData?.users?.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
            let userToSession: User;

            if (existingUser) {
                userToSession = {
                    ...existingUser,
                    id: firebaseUser.uid // align local DB profile with Firebase UID
                };
            } else {
                // Register details in mockApi backend with Firebase UID
                const registeredUser = await mockApi.registerUser(
                    firebaseUser.displayName || email.split('@')[0],
                    firebaseUser.email || email,
                    firebaseUser.uid
                );
                if (registeredUser) {
                    userToSession = registeredUser;
                    updateAppData({ users: [...(appData.users || []), userToSession] });
                } else {
                    userToSession = {
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || email.split('@')[0],
                        email: firebaseUser.email || email,
                        registeredDate: new Date().toISOString(),
                        avatarUrl: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
                        favorites: [],
                        isEmailVerified: firebaseUser.emailVerified,
                        role: 'USER'
                    };
                    updateAppData({ users: [...(appData.users || []), userToSession] });
                }
            }

            const isAdmin = userToSession.role === 'SUPER_ADMIN' || userToSession.email === 'lucianoreverberi@gmail.com';
            setSession({ ...userToSession, isAdmin });
            syncUserToFirestore(userToSession);
            setIsLoginModalOpen(false);
            addNotification('success', 'Welcome back!', `Logged in as ${userToSession.name}`);
            if (isAdmin) {
                handleNavigate('admin');
            }
            return true;

        } catch (error: any) {
            console.log("Firebase Auth Login Error:", error?.code);
            if (
                error.code === 'auth/user-not-found' ||
                error.code === 'auth/invalid-credential' ||
                error.code === 'auth/invalid-login-credentials' ||
                error.code === 'auth/wrong-password'
            ) {
                addNotification('info', 'Login Failed', 'Incorrect email or password. If you had an account before our security upgrade, please use "Forgot Password" to set a new one.');
            } else if (error.code === 'auth/too-many-requests') {
                addNotification('info', 'Login Failed', 'Too many attempts. Please try again later.');
            } else {
                addNotification('info', 'Login Failed', 'Could not sign in. Please try again.');
            }
            return false;
        }
    };

    const handleForgotPassword = async (email: string): Promise<void> => {
        if (!email || !email.includes('@')) {
            addNotification('info', 'Email Required', 'Please enter your email address first, then click "Forgot Password".');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            addNotification('success', 'Check Your Email', `If an account exists for ${email}, a password reset link has been sent.`);
        } catch (error: any) {
            console.log("Password reset error:", error?.code);
            // Do not disclose if user exists for security
            addNotification('success', 'Check Your Email', `If an account exists for ${email}, a password reset link has been sent.`);
        }
    };

    const handleGoogleLogin = async (): Promise<boolean> => {
        if (!appData) {
            addNotification('info', 'System Loading', 'Please wait until the app initializes completely.');
            return false;
        }

        try {
            console.log("Starting Google Auth...");
            const firebaseUser = await signInWithGoogle();
            console.log("Firebase Auth Result:", firebaseUser ? "Success" : "No user returned");
            
            if (firebaseUser) {
                // Check if user exists in our appData
                let existingUser = appData.users?.find((u: User) => u.email === firebaseUser.email);
                
                let userToSession: User;
                if (existingUser) {
                    console.log("Existing user found:", existingUser.email);
                    // Update existing user with latest info from Google
                    userToSession = {
                        ...existingUser,
                        avatarUrl: firebaseUser.photoURL || existingUser.avatarUrl,
                        isEmailVerified: firebaseUser.emailVerified || existingUser.isEmailVerified
                    };
                    // Optional: sync back to DB if needed, but for now we update local state
                } else {
                    console.log("New user detected, registering:", firebaseUser.email);
                    // Create basic user profile from Google data
                    // We call the backend to ensure persistence, passing the Firebase UID
                    const registeredUser = await mockApi.registerUser(
                        firebaseUser.displayName || 'Google User', 
                        firebaseUser.email || '',
                        firebaseUser.uid
                    );

                    if (registeredUser) {
                        userToSession = {
                            ...registeredUser,
                            // Ensure we use the exact registered user details
                        };
                        // Ensure we use the Firebase values for some fields
                        userToSession.avatarUrl = firebaseUser.photoURL || userToSession.avatarUrl;
                        userToSession.isEmailVerified = firebaseUser.emailVerified;
                        
                        // Update local appData
                        updateAppData({ users: [...(appData.users || []), userToSession] });
                    } else {
                        // Fallback but with local persistence only (less ideal)
                        userToSession = {
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || 'Google User',
                            email: firebaseUser.email || '',
                            registeredDate: new Date().toISOString(),
                            avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
                            favorites: [],
                            isEmailVerified: firebaseUser.emailVerified,
                            role: 'USER'
                        };
                        updateAppData({ users: [...(appData.users || []), userToSession] });
                    }
                }

                const isAdmin = userToSession.role === 'SUPER_ADMIN' || userToSession.email === 'lucianoreverberi@gmail.com';
                setSession({ ...userToSession, isAdmin });
                syncUserToFirestore(userToSession); // Sync for chat
                setIsLoginModalOpen(false);
                addNotification('success', 'Authenticated with Google', `Welcome, ${userToSession.name}!`);
                return true;
            }
        } catch (error: any) {
            console.error("Google Login Detailed Error:", error);
            
            let errorMessage = "Could not authenticate with Google.";
            
            if (error.code === 'auth/popup-blocked') {
                errorMessage = "Login popup was blocked by your browser. Please allow popups for this site.";
            } else if (error.code === 'auth/unauthorized-domain') {
                errorMessage = "This domain is not authorized for Google Login. Please check Firebase configuration.";
            } else if (error.message) {
                errorMessage = `${errorMessage} (${error.message})`;
            }
            
            addNotification('info', 'Login Failed', errorMessage);
        }
        return false;
    };

    const handleRegister = async (name: string, email: string, password: string): Promise<boolean> => {
        // SECURITY: Prevent unauthorized registration with the admin email
        if (email.toLowerCase() === 'lucianoreverberi@gmail.com') {
            addNotification('message', 'Error', 'This email address is reserved.');
            return false;
        }

        try {
            // Register user in Firebase Authentication
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = result.user;

            // Set the display name in Firebase Auth
            await updateProfile(firebaseUser, { displayName: name });

            // Create record in application database
            const newUser = await mockApi.registerUser(name, email, firebaseUser.uid);
            if (newUser) {
                updateAppData({ users: [...appData.users, newUser] });
                setSession({ ...newUser, isAdmin: false });
                syncUserToFirestore(newUser); // Sync for chat
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
            } else {
                // Sibling fallback profile
                const fallbackUser: User = {
                    id: firebaseUser.uid,
                    name: name,
                    email: email,
                    registeredDate: new Date().toISOString(),
                    avatarUrl: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
                    favorites: [],
                    isEmailVerified: firebaseUser.emailVerified,
                    role: 'USER'
                };
                updateAppData({ users: [...appData.users, fallbackUser] });
                setSession({ ...fallbackUser, isAdmin: false });
                syncUserToFirestore(fallbackUser);
                setIsLoginModalOpen(false);
                return true;
            }
        } catch (error: any) {
            console.error("Firebase Registration Error:", error);
            let errorMessage = "Registration failed.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already registered.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "The email address is invalid.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "The password is too weak.";
            } else if (error.message) {
                errorMessage = error.message;
            }
            addNotification('info', 'Registration Failed', errorMessage);
            return false;
        }
    };
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.warn("Firebase sign out issue:", error);
        }
        setSession(null);
        handleNavigate('home');
        addNotification('info', 'Logged Out', 'See you next time!');
    };

    const handleStartConversation = (listing: Listing) => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        
        // Setup context for the chat modal.
        // It will decide if it needs to fetch an existing convo or create a new one.
        setChatContext({
            listing: listing,
            recipient: listing.owner
        });
        
        setIsChatInboxOpen(true);
    };

    const handleCreateBooking = async (
        listingId: string, 
        startDate: Date, 
        endDate: Date, 
        totalPrice: number, 
        paymentMethod: 'platform' | 'direct',
        protectionType: 'waiver' | 'insurance', 
        protectionFee: number,
        securityDeposit: number
    ): Promise<Booking> => {
        if (!session) {
            throw new Error("You must be logged in to book an item.");
        }
        
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
            protectionFee,
            securityDeposit
        );
        
        // Update app state with the new booking and the updated listing (with new bookedDates)
        const updatedBookings = [...appData.bookings, result.newBooking];
        const updatedListings = appData.listings.map((l: Listing) => l.id === listingId ? result.updatedListing : l);
        
        updateAppData({
            bookings: updatedBookings,
            listings: updatedListings
        });

        // Send Booking Request Emails
        const listing = result.updatedListing;
        const host = listing.owner;
        const renter = session;

        // 1. Notify Host
        mockApi.sendEmail('booking_request_host', host.email, {
            hostName: host.name,
            renterName: renter.name,
            renterAvatar: renter.avatarUrl,
            listingTitle: listing.title,
            startDate: format(startDate, 'MMM dd, yyyy'),
            endDate: format(endDate, 'MMM dd, yyyy'),
            totalPrice: totalPrice.toFixed(2),
            bookingId: result.newBooking.id,
            paymentMethod: paymentMethod === 'platform' ? 'Paid via Platform' : 'Direct Payment'
        });

        // 2. Notify Renter
        mockApi.sendEmail('booking_request_renter', renter.email, {
            renterName: renter.name,
            listingTitle: listing.title,
            hostName: host.name,
            startDate: format(startDate, 'MMM dd, yyyy'),
            endDate: format(endDate, 'MMM dd, yyyy'),
            totalPrice: totalPrice.toFixed(2),
            bookingId: result.newBooking.id
        }).then(success => {
            if (success) {
                addNotification('success', 'Request Sent', `A notification email has been sent to your inbox.`);
            }
        });

        return result.newBooking;
    };

    // NEW: Handle Booking Status Update (Real-Time Sync)
    const handleBookingStatusUpdate = async (bookingId: string, newStatus: string) => {
        const booking = appData.bookings.find((b: Booking) => b.id === bookingId);
        if (!booking) return;

        // 1. Optimistic Update Local State
        const updatedBookings = appData.bookings.map((b: Booking) => 
            b.id === bookingId ? { ...b, status: newStatus as any } : b
        );
        updatedBookings.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        updateAppData({ bookings: updatedBookings });

        // 2. Persist to API
        await mockApi.updateBookingStatus(bookingId, newStatus);
        
        addNotification('success', 'Status Updated', `Booking marked as ${newStatus}.`);

        // 3. Send Notifications
        const listing = appData.listings.find((l: Listing) => l.id === booking.listingId);
        const host = listing?.owner;
        const renter = appData.users.find((u: User) => u.id === booking.renterId);

        if (!listing || !host || !renter) return;

        const emailData = {
            listingTitle: listing.title,
            startDate: format(new Date(booking.startDate), 'MMM dd, yyyy'),
            endDate: format(new Date(booking.endDate), 'MMM dd, yyyy'),
            totalPrice: booking.totalPrice.toFixed(2),
            bookingId: booking.id,
            hostName: host.name,
            renterName: renter.name,
        };

        if (newStatus === 'confirmed') {
            // To Renter
            mockApi.sendEmail('booking_confirmed', renter.email, {
                ...emailData,
                hostPhone: host.email, // Using email as backup if phone not available
                listingLocation: `${listing.location.city}, ${listing.location.state}`,
                balanceDueOnSite: booking.paymentMethod === 'direct' ? booking.totalPrice.toFixed(2) : '0.00'
            });
            // To Host
            mockApi.sendEmail('booking_confirmed_host', host.email, emailData);
        } else if (newStatus === 'rejected') {
            // To Renter
            mockApi.sendEmail('booking_rejected', renter.email, {
                ...emailData,
                reason: 'Host unavailable for these dates.'
            });
        } else if (newStatus === 'cancelled') {
            // To Both
            const cancellationData = {
                ...emailData,
                cancelledBy: session?.id === host.id ? 'the host' : 'the renter',
                refundAmount: booking.paymentMethod === 'platform' ? booking.totalPrice.toFixed(2) : null
            };
            mockApi.sendEmail('booking_cancelled', renter.email, { ...cancellationData, recipientName: renter.name });
            mockApi.sendEmail('booking_cancelled', host.email, { ...cancellationData, recipientName: host.name });
        }
    };

    // NEW: Handle Security Deposit Status Update
    const handleUpdateDepositStatus = async (bookingId: string, newStatus: 'held' | 'released' | 'disputed' | 'claimed') => {
        // 1. Optimistic Update
        const updatedBookings = appData.bookings.map((b: Booking) => 
            b.id === bookingId ? { ...b, depositStatus: newStatus } : b
        );
        updateAppData({ bookings: updatedBookings });

        // 2. Persist
        await mockApi.updateDepositStatus(bookingId, newStatus);
        
        const statusMessages = {
            held: 'Deposit is being held securely.',
            released: 'Deposit has been released to the renter.',
            disputed: 'Deposit is under review due to a dispute.',
            claimed: 'Deposit has been claimed by the host.'
        };
        
        addNotification('info', 'Deposit Status', statusMessages[newStatus]);
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

    const handleDeleteListing = async (listingId: string): Promise<void> => {
        const success = await mockApi.deleteListing(listingId);
        if (success) {
            // Remove from local state immediately
            updateAppData({
                listings: appData.listings.filter((l: Listing) => l.id !== listingId)
            });
            addNotification('success', 'Listing Deleted', 'The item has been removed.');
        } else {
            addNotification('message', 'Error', 'Could not delete listing. It may have active bookings.');
        }
    };

    // --- Admin content handlers ---
    const handleUpdateLogo = async (newUrl: string) => {
        const updatedLogoUrl = await mockApi.updateLogo(newUrl);
        updateAppData({ logoUrl: updatedLogoUrl });
    };

    const handleUpdateSlide = async (id: string, field: keyof HeroSlide, value: string) => {
        const updatedSlides = appData.heroSlides.map((s: HeroSlide) => 
            s.id === id ? { ...s, [field]: value } : s
        );
        updateAppData({ heroSlides: updatedSlides });

        const slideToUpdate = updatedSlides.find((s: HeroSlide) => s.id === id);
        if(slideToUpdate) {
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

    const handleUpdateBanner = async (id: string, field: keyof Banner, value: string) => {
        const updatedBanners = appData.banners.map((b: Banner) => 
            b.id === id ? { ...b, [field]: value } : b
        );
        updateAppData({ banners: updatedBanners });

        const bannerToUpdate = updatedBanners.find((b: Banner) => b.id === id);
        if(bannerToUpdate) {
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
    // FIX: Added 'const' to updatedCategoryImages to resolve reference error
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
                    userLocation={userLocation}
                    onUpdateLocation={setUserLocation}
                />;
            case 'inbox':
                return <ChatLayout 
                            initialSelectedId={initialConversationId} 
                            currentUser={session} 
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
                    onViewOwnerProfile={() => handleViewUserProfile(listing.owner.id)} // NEW PROP
                /> : <p>Listing not found.</p>;
            case 'userProfile': // NEW PAGE CASE
                const profileUser = users.find((u: User) => u.id === selectedUserProfileId);
                if (!profileUser) return <p className="p-8 text-center text-gray-500">User profile not found.</p>;
                
                // Filter listings owned by this user
                const userListings = listings.filter((l: Listing) => l.owner.id === profileUser.id);

                return <UserProfilePage 
                    profileUser={profileUser}
                    currentUser={session}
                    listings={userListings}
                    onListingClick={handleListingClick}
                    onToggleFavorite={handleToggleFavorite}
                    favoriteIds={session?.favorites || []}
                    onEditProfile={session?.id === profileUser.id ? handleUpdateUserProfile : undefined}
                />;
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
                    bookings={bookings}
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
                    onDeleteListing={handleDeleteListing}
                    onUpdateDepositStatus={handleUpdateDepositStatus}
                /> : <p>Access Denied.</p>;
            case 'adminBoosts':
                return session?.isAdmin ? <AdminBoostsPage user={session} /> : <p>Access Denied.</p>;
             case 'userDashboard':
                return session ? <UserDashboardPage 
                    user={session} 
                    listings={listings.filter((l: Listing) => l.owner.id === session.id)} 
                    // Pass both bookings where user is the renter OR the owner
                    bookings={bookings.filter((b: Booking) => b.renterId === session.id || b.listing.owner.id === session.id)}
                    favoriteListings={listings.filter(l => session.favorites?.includes(l.id))}
                    onVerificationUpdate={handleVerificationUpdate}
                    onUpdateAvatar={handleUpdateAvatar}
                    onUpdateProfile={handleUpdateUserProfile} // Pass the handler
                    onListingClick={handleListingClick}
                    onEditListing={handleEditListingClick}
                    onToggleFavorite={handleToggleFavorite}
                    onViewPublicProfile={() => handleViewUserProfile(session.id)} // Pass navigation handler
                    onDeleteListing={handleDeleteListing} // NEW PROP
                    onBookingStatusUpdate={handleBookingStatusUpdate} // NEW PROP ADDED
                    onUpdateDepositStatus={handleUpdateDepositStatus} // NEW PROP
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
            case 'cookiePolicy':
                return <CookiePolicyPage />;
            case 'doNotSell':
                return <DoNotSellPage />;
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
                    userLocation={userLocation}
                    onUpdateLocation={setUserLocation}
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
                onOpenChat={() => { 
                    setInitialConversationId(null); 
                    setChatContext(null);
                    if (session) {
                        handleNavigate('inbox');
                    } else {
                        setIsLoginModalOpen(true);
                    }
                }}
                session={session}
                logoUrl={logoUrl}
            />
            <main className="flex-grow">
                {renderPage()}
            </main>
            <Footer logoUrl={logoUrl} onNavigate={handleNavigate} />

            <CookieConsentBanner />
            {consent?.analytics && <SpeedInsights />}
            
            {isLoginModalOpen && (
                <LoginModal 
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    onGoogleLogin={handleGoogleLogin}
                    onForgotPassword={handleForgotPassword}
                    onClose={() => setIsLoginModalOpen(false)} 
                />
            )}
            
            {isChatInboxOpen && session && (
                 <ChatInboxModal
                    isOpen={isChatInboxOpen}
                    onClose={() => setIsChatInboxOpen(false)}
                    currentUser={session}
                    initialContext={chatContext}
                    userLanguage={userLanguage}
                    onLanguageChange={setUserLanguage}
                />
            )}
        </div>
    );
};

export default App;
