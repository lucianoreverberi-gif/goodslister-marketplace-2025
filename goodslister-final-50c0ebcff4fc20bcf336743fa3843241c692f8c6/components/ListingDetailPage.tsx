import React, { useState } from 'react';
import { Listing, User } from '../types';
import { MapPinIcon, StarIcon, ChevronLeftIcon, ShareIcon, HeartIcon, MessageSquareIcon } from './icons';
import ListingMap from './ListingMap';
import { DayPicker, DateRange } from 'react-day-picker';
import { differenceInCalendarDays } from 'date-fns';

// A simple component to render Markdown from the AI description
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const createMarkup = (markdownText: string) => {
        if (!markdownText) return { __html: '' };
        
        // Process paragraphs by splitting by double newlines
        const paragraphs = markdownText.split('\n\n').map(p => {
            // Process elements within each paragraph
            let processedParagraph = p
                // Headers (must be at the start of a paragraph)
                .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold my-3">$1</h3>')
                // Bold text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // Process bullet points
            if (processedParagraph.includes('* ')) {
                const listItems = processedParagraph.split('\n')
                    .filter(line => line.trim().startsWith('* '))
                    .map(item => `<li class="ml-5 list-disc">${item.trim().substring(2).trim()}</li>`)
                    .join('');
                // Replace the original list text with the HTML list
                processedParagraph = processedParagraph.replace(/(\* .*\n?)+/, `<ul class="space-y-1 my-3">${listItems}</ul>`);
            }
            
            // For non-header and non-list paragraphs, wrap in <p> tags
            // and replace single newlines with <br /> for line breaks within paragraphs
            if (!processedParagraph.startsWith('<h3') && !processedParagraph.startsWith('<ul')) {
                 processedParagraph = `<p>${processedParagraph.replace(/\n/g, '<br />')}</p>`;
            }
            
            return processedParagraph;
        }).join('');

        return { __html: paragraphs };
    };

    return <div className="prose max-w-none text-gray-600 leading-relaxed" dangerouslySetInnerHTML={createMarkup(text)} />;
};


interface ListingDetailPageProps {
    listing: Listing;
    onBack: () => void;
    onStartConversation: (listing: Listing) => void;
    currentUser: User | null;
}

const ListingDetailPage: React.FC<ListingDetailPageProps> = ({ listing, onBack, onStartConversation, currentUser }) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [range, setRange] = useState<DateRange | undefined>();

    const isOwner = currentUser?.id === listing.owner.id;

    const bookedDays = listing.bookedDates?.map(d => new Date(d)) || [];
    const disabledDays = [{ before: new Date() }, ...bookedDays];

    let numberOfDays = 0;
    if (listing.pricingType === 'daily' && range?.from && range.to) {
        numberOfDays = differenceInCalendarDays(range.to, range.from) + 1;
    }
    const totalPrice = numberOfDays * (listing.pricePerDay || 0);
    
    // Define styles for the calendar modifiers. This is the most robust way to style.
    const modifiersStyles: React.CSSProperties | any = {
      selected: { 
        backgroundColor: '#06B6D4',
        color: 'white',
      },
      range_middle: { 
        backgroundColor: '#06B6D4',
        color: 'white',
        borderRadius: 0,
      },
      range_start: {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      },
      range_end: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      },
       today: {
        fontWeight: 'bold',
        color: '#10B981',
      },
      disabled: {
        textDecoration: 'line-through',
        opacity: 0.5,
      }
    };


    return (
        <div className="bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
                    <ChevronLeftIcon className="h-5 w-5" />
                    Back to results
                </button>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200/80">
                    <div className="grid grid-cols-1 lg:grid-cols-5">
                        {/* Image Gallery */}
                        <div className="lg:col-span-3">
                            <div className="relative">
                                <img src={listing.images[activeImageIndex]} alt={`${listing.title} image ${activeImageIndex + 1}`} className="w-full h-[500px] object-cover" />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button className="p-2 bg-white/80 rounded-full text-gray-700 hover:bg-white hover:text-gray-900 transition">
                                        <ShareIcon className="h-5 w-5"/>
                                    </button>
                                     <button className="p-2 bg-white/80 rounded-full text-gray-700 hover:bg-white hover:text-red-500 transition">
                                        <HeartIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                            </div>
                             {listing.images.length > 1 && (
                                <div className="grid grid-cols-5 gap-2 p-2 bg-gray-100">
                                    {listing.images.map((img, index) => (
                                        <button key={index} onClick={() => setActiveImageIndex(index)} className={`rounded-md overflow-hidden aspect-w-1 aspect-h-1 ${index === activeImageIndex ? 'ring-2 ring-cyan-500' : 'opacity-70 hover:opacity-100'}`}>
                                            <img src={img} alt={`thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details and Booking */}
                        <div className="lg:col-span-2 p-6 sm:p-8 flex flex-col">
                            <div>
                                <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider">{listing.category}{listing.subcategory && ` / ${listing.subcategory}`}</p>
                                <h1 className="text-3xl font-bold text-gray-900 mt-2">{listing.title}</h1>
                                
                                <div className="flex items-center text-sm text-gray-600 mt-4">
                                    <MapPinIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                    <span>{listing.location.city}, {listing.location.state}, {listing.location.country}</span>
                                </div>

                                <div className="flex items-baseline mt-4">
                                     <span className="text-3xl font-bold text-gray-900">
                                        {listing.pricingType === 'hourly' ? `$${listing.pricePerHour}` : `$${listing.pricePerDay}`}
                                    </span>
                                    <span className="text-lg text-gray-500">
                                        {listing.pricingType === 'hourly' ? '/hour' : '/day'}
                                    </span>
                                    <div className="flex items-center ml-auto">
                                        <StarIcon className="h-5 w-5 text-yellow-400 mr-1"/>
                                        <span className="font-bold text-gray-700">{listing.rating}</span>
                                        <span className="text-gray-500 ml-1.5">({listing.reviewsCount} reviews)</span>
                                    </div>
                                </div>
                            </div>

                             <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                     <h2 className="text-lg font-semibold text-gray-800">Owner</h2>
                                      <div className="flex items-center text-right">
                                        <img src={listing.owner.avatarUrl} alt={listing.owner.name} className="w-10 h-10 rounded-full mr-2"/>
                                        <div>
                                            <p className="font-semibold text-gray-800">{listing.owner.name}</p>
                                        </div>
                                    </div>
                                </div>
                                {!isOwner && (
                                    <button
                                        onClick={() => onStartConversation(listing)}
                                        className="mt-4 w-full py-2 px-4 text-cyan-700 font-semibold rounded-lg bg-white border border-cyan-600 hover:bg-cyan-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageSquareIcon className="h-5 w-5" />
                                        Chat with {listing.owner.name.split(' ')[0]}
                                    </button>
                                )}
                                 <h2 className="text-lg font-semibold text-gray-800 mt-4">Description</h2>
                                <SimpleMarkdown text={listing.description} />
                                {listing.ownerRules && (
                                    <>
                                        <h2 className="text-lg font-semibold text-gray-800 mt-4">Owner's Rules</h2>
                                        <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-wrap">{listing.ownerRules}</p>
                                    </>
                                )}
                            </div>
                           
                            {/* Booking Section */}
                            <div className="mt-auto pt-8">
                                {listing.pricingType === 'daily' ? (
                                    <>
                                        <div className="bg-gray-50 rounded-lg p-4 border flex justify-center">
                                            <DayPicker
                                                mode="range"
                                                selected={range}
                                                onSelect={setRange}
                                                disabled={disabledDays}
                                                numberOfMonths={1}
                                                pagedNavigation
                                                showOutsideDays
                                                fixedWeeks
                                                modifiersStyles={modifiersStyles}
                                            />
                                        </div>
                                        
                                        {numberOfDays > 0 && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border space-y-2">
                                                <div className="flex justify-between items-center text-gray-700">
                                                    <span>${(listing.pricePerDay || 0).toFixed(2)} x {numberOfDays} days</span>
                                                    <span className="font-medium">${((listing.pricePerDay || 0) * numberOfDays).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center font-bold text-lg pt-2 border-t">
                                                    <span>Total Price</span>
                                                    <span>${totalPrice.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            disabled={!currentUser || isOwner || numberOfDays === 0}
                                            className="mt-4 w-full py-3 px-4 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isOwner ? "This is your listing" : (currentUser ? (numberOfDays > 0 ? "Book Now" : "Select dates to book") : "Log in to book")}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-gray-50 rounded-lg p-6 border text-center">
                                            <h3 className="font-semibold text-gray-800">Hourly Rental</h3>
                                            <p className="text-sm text-gray-600 mt-2">This item is rented by the hour. Please contact the owner directly to arrange booking times and details.</p>
                                        </div>
                                        <button
                                            onClick={() => onStartConversation(listing)}
                                            disabled={!currentUser || isOwner}
                                            className="mt-4 w-full py-3 px-4 text-white font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isOwner ? "This is your listing" : (currentUser ? "Contact Owner to Book" : "Log in to contact owner")}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-gray-200/80">
                    <h2 className="text-2xl font-bold text-gray-800">Location</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        The exact location will be provided after booking. The map shows the general area for privacy.
                    </p>
                    <div className="mt-4 rounded-lg overflow-hidden">
                        <ListingMap center={{ lat: listing.location.latitude, lng: listing.location.longitude }} />
                    </div>
                </div>

                 {listing.videoUrl && (
                    <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-gray-200/80">
                        <h2 className="text-2xl font-bold text-gray-800">Video</h2>
                        <div className="aspect-w-16 aspect-h-9 mt-4 rounded-lg overflow-hidden">
                            <iframe 
                                src={listing.videoUrl.replace("watch?v=", "embed/")} 
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListingDetailPage;