import React, { useState } from 'react';
import { StarIcon, XIcon, MessageSquareIcon, ShieldCheckIcon } from './icons';
import { Booking, Review } from '../types';

interface ReviewModalProps {
    booking: Booking;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ booking, onClose, onSubmit }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        
        setIsSubmitting(true);
        try {
            await onSubmit(rating, comment);
            onClose();
        } catch (error) {
            console.error("Failed to submit review:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                            <StarIcon className="h-6 w-6 fill-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Leave a Review</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Share your experience with the community</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <XIcon className="h-6 w-6 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <img src={booking.listing.images[0]} className="w-16 h-16 rounded-2xl object-cover" alt="item" />
                        <div>
                            <h4 className="font-black text-slate-900">{booking.listing.title}</h4>
                            <p className="text-xs text-slate-500 font-medium">Trip from {new Date(booking.startDate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Your Rating</label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(s)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(s)}
                                    className="p-1 transition-transform active:scale-90"
                                >
                                    <StarIcon 
                                        className={`h-10 w-10 transition-colors ${
                                            (hoverRating || rating) >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                        }`} 
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm font-black text-slate-900">
                            {rating === 1 && "Terrible"}
                            {rating === 2 && "Poor"}
                            {rating === 3 && "Average"}
                            {rating === 4 && "Great"}
                            {rating === 5 && "Amazing!"}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Your Review</label>
                        <div className="relative">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Describe your experience..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium text-slate-800 min-h-[140px] focus:ring-2 focus:ring-cyan-500/20 outline-none resize-none"
                                required
                            />
                            <MessageSquareIcon className="absolute bottom-4 right-4 h-5 w-5 text-slate-300" />
                        </div>
                    </div>

                    <div className="pt-4 space-y-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-2xl shadow-xl shadow-cyan-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? "PUBLISHING..." : "PUBLISH REVIEW"}
                        </button>
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <ShieldCheckIcon className="h-4 w-4" /> Community Guidelines protected
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
