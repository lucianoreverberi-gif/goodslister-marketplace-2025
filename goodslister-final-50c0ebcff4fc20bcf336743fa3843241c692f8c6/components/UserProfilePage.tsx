
import React, { useState } from 'react';
import { User, Listing } from '../types';
import { StarIcon, ShieldCheckIcon, CheckCircleIcon, MapPinIcon, MessageSquareIcon, PackageIcon, BrainCircuitIcon } from './icons';
import ListingCard from './ListingCard';
import ImageUploader from './ImageUploader';

interface UserProfilePageProps {
    profileUser: User;
    currentUser: User | null;
    listings: Listing[];
    onListingClick: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    favoriteIds: string[];
    onEditProfile?: (bio: string, avatarUrl: string) => Promise<void>;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ 
    profileUser, currentUser, listings, onListingClick, onToggleFavorite, favoriteIds, onEditProfile 
}) => {
    const isOwnProfile = currentUser?.id === profileUser.id;
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(profileUser.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(profileUser.avatarUrl);

    const getTrustScore = () => {
        let score = 30;
        if (profileUser.isEmailVerified) score += 20;
        if (profileUser.isPhoneVerified) score += 20;
        if (profileUser.isIdVerified) score += 30;
        return score;
    };

    const trustScore = getTrustScore();

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Identity & Badges */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="p-8 flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <img src={avatarUrl} className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-2xl" />
                                    {profileUser.isIdVerified && (
                                        <div className="absolute -bottom-2 right-0 bg-indigo-600 text-white p-2 rounded-full border-4 border-white shadow-lg animate-bounce" title="AI Identity Guard Verified">
                                            <BrainCircuitIcon className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                                <h1 className="text-2xl font-black text-gray-900">{profileUser.name}</h1>
                                <p className="text-gray-500 text-sm font-medium">Member since {new Date(profileUser.registeredDate).getFullYear()}</p>
                                
                                {profileUser.isIdVerified && (
                                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                                        <ShieldCheckIcon className="h-3 w-3" /> AI Identity Guard Verified
                                    </div>
                                )}

                                {isOwnProfile && (
                                    <button onClick={() => setIsEditing(!isEditing)} className="mt-6 text-cyan-600 font-bold hover:underline text-sm uppercase tracking-widest">
                                        {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                                    </button>
                                )}
                            </div>

                            <div className="bg-gray-50 p-6 border-t border-gray-100 space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs font-black text-gray-400 uppercase mb-2">
                                        <span>Trust level</span>
                                        <span className="text-indigo-600">{trustScore}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-600 transition-all duration-1000" style={{ width: `${trustScore}%` }}></div>
                                    </div>
                                </div>
                                <ul className="space-y-3">
                                    <li className={`flex items-center justify-between text-sm font-bold ${profileUser.isIdVerified ? 'text-gray-900' : 'text-gray-400'}`}>
                                        <span className="flex items-center gap-2"><CheckCircleIcon className="h-4 w-4" /> Identity Verified</span>
                                        {profileUser.isIdVerified ? <span className="text-green-500">✓</span> : <span className="text-gray-300">○</span>}
                                    </li>
                                    <li className={`flex items-center justify-between text-sm font-bold ${profileUser.isPhoneVerified ? 'text-gray-900' : 'text-gray-400'}`}>
                                        <span className="flex items-center gap-2"><CheckCircleIcon className="h-4 w-4" /> Phone Linked</span>
                                        {profileUser.isPhoneVerified ? <span className="text-green-500">✓</span> : <span className="text-gray-300">○</span>}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right: Bio & Listings */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">About</h2>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full border-gray-200 rounded-2xl p-4 min-h-[150px]" placeholder="Tell your story..." />
                                    <button onClick={() => onEditProfile?.(bio, avatarUrl).then(() => setIsEditing(false))} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all">Save Changes</button>
                                </div>
                            ) : (
                                <p className="text-gray-600 leading-relaxed text-lg italic">"{profileUser.bio || 'Sin biografía aún.'}"</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {listings.map(l => (
                                <ListingCard key={l.id} listing={l} onClick={onListingClick} isFavorite={favoriteIds.includes(l.id)} onToggleFavorite={onToggleFavorite} />
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
