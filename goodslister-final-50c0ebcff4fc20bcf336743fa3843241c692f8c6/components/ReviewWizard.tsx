
import React, { useState } from 'react';
import { StarIcon, CheckCircleIcon, MessageSquareIcon, ShieldCheckIcon, AlertIcon } from './icons';

interface ReviewWizardProps {
    bookingId: string;
    authorId: string; 
    targetId: string; 
    targetName: string;
    role: 'HOST' | 'RENTER';
    onComplete: () => void;
}

const ReviewWizard: React.FC<ReviewWizardProps> = ({ bookingId, authorId, targetId, targetName, role, onComplete }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [privateNote, setPrivateNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Metrics State
    const [metrics, setMetrics] = useState({
        metric1: 0, 
        metric2: 0, 
        metric3: 0,
    });

    const isHost = role === 'HOST';

    const getMetricLabels = () => {
        if (isHost) {
            return {
                m1: "Care of Equipment",
                m2: "Punctuality",
                m3: "Communication"
            };
        } else {
            return {
                m1: "Item Accuracy",
                m2: "Cleanliness/Condition",
                m3: "Host Helpfulness"
            };
        }
    };

    const labels = getMetricLabels();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const payload = {
            bookingId,
            authorId,
            targetId,
            role,
            rating,
            comment,
            privateNote,
            careRating: isHost ? metrics.metric1 : undefined,
            cleanRating: !isHost ? metrics.metric2 : undefined,
            accuracyRating: !isHost ? metrics.metric1 : undefined,
            safetyRating: !isHost ? metrics.metric3 : undefined, 
        };

        try {
            const response = await fetch('/api/reviews/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                onComplete();
            } else {
                alert("Failed to submit review.");
            }
        } catch (e) {
            console.error(e);
            alert("Error submitting review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const StarRatingInput = ({ value, onChange, size = "large" }: { value: number, onChange: (val: number) => void, size?: "medium" | "large" }) => (
        <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onClick={() => onChange(star)}
                    type="button"
                    className={`transition-transform hover:scale-110 focus:outline-none ${size === "large" ? "p-1" : "p-0"}`}
                >
                    <StarIcon 
                        className={`${size === "large" ? "h-12 w-12" : "h-8 w-8"} ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                    />
                </button>
            ))}
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-lg w-full mx-auto my-8">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Review {targetName}</h3>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-2 w-8 rounded-full ${step >= i ? 'bg-cyan-600' : 'bg-gray-200'}`} />
                    ))}
                </div>
            </div>

            <div className="p-8">
                {step === 1 && (
                    <div className="text-center space-y-8 animate-in fade-in">
                        <div>
                            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                                <StarIcon className="h-10 w-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">How was your experience?</h2>
                            <p className="text-gray-500 mt-2">Rate your {isHost ? 'renter' : 'adventure'} overall.</p>
                        </div>
                        <StarRatingInput value={rating} onChange={setRating} />
                        <button 
                            onClick={() => setStep(2)}
                            disabled={rating === 0}
                            className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next Step
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-900">Details Matter</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">{labels.m1}</label>
                                <StarRatingInput value={metrics.metric1} onChange={(v) => setMetrics({...metrics, metric1: v})} size="medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">{labels.m2}</label>
                                <StarRatingInput value={metrics.metric2} onChange={(v) => setMetrics({...metrics, metric2: v})} size="medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">{labels.m3}</label>
                                <StarRatingInput value={metrics.metric3} onChange={(v) => setMetrics({...metrics, metric3: v})} size="medium" />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="px-4 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Back</button>
                            <button 
                                onClick={() => setStep(3)}
                                disabled={!metrics.metric1 || !metrics.metric2 || !metrics.metric3}
                                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Final Thoughts</h2>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <MessageSquareIcon className="h-4 w-4 text-cyan-600" />
                                Public Review
                            </label>
                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={`Write a review for ${targetName}'s profile...`}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-h-[100px]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <ShieldCheckIcon className="h-4 w-4 text-gray-500" />
                                Private Note (Optional)
                            </label>
                            <textarea 
                                value={privateNote}
                                onChange={(e) => setPrivateNote(e.target.value)}
                                placeholder="Anything you want to tell Goodslister support privately?"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50 min-h-[80px]"
                            />
                        </div>
                        <div className="flex gap-4 pt-2">
                            <button onClick={() => setStep(2)} className="px-4 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Back</button>
                            <button 
                                onClick={handleSubmit}
                                disabled={!comment || isSubmitting}
                                className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? 'Posting...' : 'Submit Review'}
                                {!isSubmitting && <CheckCircleIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewWizard;
