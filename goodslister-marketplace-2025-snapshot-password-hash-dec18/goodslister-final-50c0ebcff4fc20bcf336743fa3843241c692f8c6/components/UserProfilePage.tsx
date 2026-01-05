
import React, { useState } from 'react';
import { User, Listing, Booking } from '../types';
import { StarIcon, ShieldCheckIcon, CheckCircleIcon, MapPinIcon, CalendarIcon, MessageSquareIcon, PackageIcon } from './icons';
import ListingCard from './ListingCard';
import ImageUploader from './ImageUploader';

interface UserProfilePageProps {
    profileUser: User;
    currentUser: User | null;
    listings: Listing[]; // Listings owned by this user
    onListingClick: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    favoriteIds: string[];
    onEditProfile?: (bio: string, avatarUrl: string) => Promise<void>; // Simple edit handler
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ 
    profileUser, 
    currentUser, 
    listings, 
    onListingClick, 
    onToggleFavorite, 
    favoriteIds,
    onEditProfile 
}) => {
    const isOwnProfile = currentUser?.id === profileUser.id;
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(profileUser.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(profileUser.avatarUrl);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!onEditProfile) return;
        setIsSaving(true);
        await onEditProfile(bio, avatarUrl);
        setIsSaving(false);
        setIsEditing(false);
    };

    const getTrustScore = () => {
        let score = 25; // Base
        if (profileUser.isEmailVerified) score += 25;
        if (profileUser.isPhoneVerified) score += 25;
        if (profileUser.isIdVerified) score += 25;
        return score;
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Identity Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            {/* Header / Avatar */}
                            <div className="p-8 flex flex-col items-center text-center border-b border-gray-100">
                                <div className="relative">
                                    {isEditing ? (
                                        <div className="w-32 h-32 mb-4">
                                            <ImageUploader 
                                                currentImageUrl={avatarUrl} 
                                                onImageChange={setAvatarUrl} 
                                                label="" 
                                            />
                                        </div>
                                    ) : (
                                        <img 
                                            src={avatarUrl} 
                                            alt={profileUser.name} 
                                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md mb-4" 
                                        />
                                    )}
                                    {profileUser.isIdVerified && (
                                        <div className="absolute bottom-4 right-2 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Identity Verified">
                                            <ShieldCheckIcon className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                                
                                <h1 className="text-2xl font-bold text-gray-900">{profileUser.name}</h1>
                                <p className="text-sm text-gray-500 mt-1">Joined {new Date(profileUser.registeredDate).getFullYear()}</p>
                                
                                {isOwnProfile && !isEditing && (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="mt-4 text-sm text-cyan-600 hover:underline font-medium"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {/* Trust & Verification */}
                            <div className="p-6 bg-gray-50/50">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Verification Status</h3>
                                <ul className="space-y-3">
                                    <li className={`flex items-center justify-between text-sm ${profileUser.isIdVerified ? 'text-gray-900' : 'text-gray-400'}`}>
                                        <span className="flex items-center gap-3">
                                            <ShieldCheckIcon className={`h-5 w-5 ${profileUser.isIdVerified ? 'text-green-500' : 'text-gray-300'}`} />
                                            Identity Checked
                                        </span>
                                        {profileUser.isIdVerified && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                                    </li>
                                    <li className={`flex items-center justify-between text-sm ${profileUser.isEmailVerified ? 'text-gray-900' : 'text-gray-400'}`}>
                                        <span className="flex items-center gap-3">
                                            <div className="w-5 flex justify-center text-xs font-bold">@</div>
                                            Email Address
                                        </span>
                                        {profileUser.isEmailVerified && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                                    </li>
                                    <li className={`flex items-center justify-between text-sm ${profileUser.isPhoneVerified ? 'text-gray-900' : 'text-gray-400'}`}>
                                        <span className="flex items-center gap-3">
                                            <div className="w-5 flex justify-center text-xs font-bold">#</div>
                                            Phone Number
                                        </span>
                                        {profileUser.isPhoneVerified && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                                    </li>
                                </ul>
                                
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-gray-700">Trust Score</span>
                                        <span className="text-sm font-bold text-green-600">{getTrustScore()}/100</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${getTrustScore()}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Bio, Reviews, Listings */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Bio Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">About {profileUser.name.split(' ')[0]}</h2>
                            
                            {isEditing ? (
                                <div className="space-y-4">
                                    <textarea 
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-h-[150px]"
                                        placeholder="Tell the community about yourself, your hobbies, and what you love about renting gear..."
                                    />
                                    <div className="flex gap-3 justify-end">
                                        <button 
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700"
                                        >
                                            {isSaving ? 'Saving...' : 'Save Profile'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {profileUser.bio || "This user hasn't written a bio yet."}
                                </p>
                            )}

                            <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <StarIcon className="h-5 w-5 text-yellow-400" />
                                    <span><strong>{profileUser.totalReviews || 0}</strong> Reviews</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <PackageIcon className="h-5 w-5 text-gray-400" />
                                    <span><strong>{listings.length}</strong> Listings</span>
                                </div>
                            </div>
                        </div>

                        {/* Listings Section */}
                        {listings.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Listings by {profileUser.name.split(' ')[0]}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {listings.map(listing => (
                                        <ListingCard 
                                            key={listing.id}
                                            listing={listing}
                                            onClick={onListingClick}
                                            isFavorite={favoriteIds.includes(listing.id)}
                                            onToggleFavorite={onToggleFavorite}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews Preview (Mocked for now as we don't fetch specific reviews yet) */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">What people are saying</h2>
                            {profileUser.totalReviews && profileUser.totalReviews > 0 ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                                    {/* Mock Review 1 */}
                                    <div className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold">JD</div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">John Doe</p>
                                                    <p className="text-xs text-gray-400">August 2024</p>
                                                </div>
                                            </div>
                                            <div className="flex text-yellow-400">
                                                {[1,2,3,4,5].map(i => <StarIcon key={i} className="h-4 w-4" />)}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm">Great experience renting from {profileUser.name}. Equipment was in perfect condition and communication was super easy.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-8 rounded-xl text-center text-gray-500 italic">
                                    No reviews yet. Be the first to rent from {profileUser.name}!
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
