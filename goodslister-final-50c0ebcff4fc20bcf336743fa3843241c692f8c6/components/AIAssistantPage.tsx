
import React, { useState, useEffect } from 'react';
import { ListingCategory } from '../types';
import { getAIAdvice, AdviceTopic } from '../services/geminiService';
import { FileTextIcon, ShieldCheckIcon, WalletIcon, SparklesIcon, MapPinIcon, PenToolIcon, XIcon, PrinterIcon, FileCheckIcon } from './icons';

interface AdviceCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    buttonText: string;
    topic: AdviceTopic;
}

const DigitalContractModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    aiClauses: string;
    itemDescription: string;
}> = ({ isOpen, onClose, aiClauses, itemDescription }) => {
    const [lessorName, setLessorName] = useState('');
    const [lesseeName, setLesseeName] = useState('');
    const [contractText, setContractText] = useState('');
    const [isSigned, setIsSigned] = useState(false);
    const [signatureId, setSignatureId] = useState('');
    const [signDate, setSignDate] = useState('');

    useEffect(() => {
        // Basic template to wrap the AI clauses
        const template = `RENTAL AGREEMENT

This Agreement is made on [DATE], between:

LESSOR (Owner): [LESSOR_NAME]
LESSEE (Renter): [LESSEE_NAME]

ITEM DESCRIPTION:
${itemDescription}

TERMS AND CONDITIONS:
${aiClauses}

DISCLAIMER:
This is a digitally generated contract for convenience. Goodslister is not a party to this agreement and makes no warranties regarding its legal enforceability. Users should consult with a legal professional.

IN WITNESS WHEREOF, the parties typically sign below.
        `;
        setContractText(template);
    }, [aiClauses, itemDescription]);

    const handleSign = () => {
        if (!lessorName || !lesseeName) {
            alert("Please enter names for both parties.");
            return;
        }
        const id = Math.random().toString(36).substring(2, 10).toUpperCase();
        setSignatureId(`DIG-SIG-${id}`);
        setSignDate(new Date().toLocaleString());
        setIsSigned(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XIcon className="h-6 w-6" />
                </button>
                
                <div className="p-6 border-b bg-gray-50 rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <PenToolIcon className="h-6 w-6 text-cyan-600" />
                        Digital Rental Agreement
                    </h2>
                    <p className="text-gray-600 mt-1">Review and sign your contract online.</p>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {!isSigned ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Lessor Name (Owner)</label>
                                <input 
                                    type="text" 
                                    value={lessorName}
                                    onChange={(e) => setLessorName(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Enter owner's full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Lessee Name (Renter)</label>
                                <input 
                                    type="text" 
                                    value={lesseeName}
                                    onChange={(e) => setLesseeName(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Enter renter's full name"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-green-800 font-bold flex items-center gap-2">
                                    <FileCheckIcon className="h-5 w-5" />
                                    Contract Signed Digitally
                                </h3>
                                <p className="text-sm text-green-700 mt-1">
                                    ID: <span className="font-mono font-bold">{signatureId}</span> &bull; Date: {signDate}
                                </p>
                            </div>
                            <button className="text-green-700 hover:text-green-900 p-2" title="Print" onClick={() => window.print()}>
                                <PrinterIcon className="h-6 w-6" />
                            </button>
                        </div>
                    )}

                    <div className="bg-gray-50 border border-gray-300 p-6 rounded shadow-inner font-serif text-sm whitespace-pre-wrap h-[400px] overflow-y-auto">
                        {contractText
                            .replace('[DATE]', new Date().toLocaleDateString())
                            .replace('[LESSOR_NAME]', lessorName || '_________________')
                            .replace('[LESSEE_NAME]', lesseeName || '_________________')
                        }
                        {isSigned && (
                            <div className="mt-8 pt-8 border-t border-gray-300 grid grid-cols-2 gap-8">
                                <div>
                                    <p className="font-bold mb-2">/s/ {lessorName}</p>
                                    <p className="text-xs text-gray-500">Digitally Signed by Lessor</p>
                                </div>
                                <div>
                                    <p className="font-bold mb-2">/s/ {lesseeName}</p>
                                    <p className="text-xs text-gray-500">Digitally Signed by Lessee</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t bg-white rounded-b-2xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        Close
                    </button>
                    {!isSigned && (
                        <button 
                            onClick={handleSign}
                            className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 flex items-center gap-2"
                        >
                            <PenToolIcon className="h-4 w-4" />
                            Sign Contract
                        </button>
                    )}
                    {isSigned && (
                        <button 
                            onClick={() => alert("Contract downloaded (simulation)")}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <PrinterIcon className="h-4 w-4" />
                            Download PDF
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const AdviceCard: React.FC<AdviceCardProps> = ({ icon: Icon, title, description, buttonText, topic }) => {
    const [itemType, setItemType] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [location, setLocation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [showContractModal, setShowContractModal] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setAiResponse('');
        const response = await getAIAdvice(topic, itemType, itemDescription, location);
        setAiResponse(response);
        setIsLoading(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 p-6 sm:p-8 flex flex-col h-full">
            <div className="flex items-center gap-4">
                <div className="bg-cyan-100 text-cyan-600 p-3 rounded-full">
                    <Icon className="h-7 w-7" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{description}</p>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col flex-grow">
                <div className="space-y-4">
                    <div>
                        <label htmlFor={`${topic}-type`} className="block text-sm font-medium text-gray-700">Item Type</label>
                        <select
                            id={`${topic}-type`}
                            value={itemType}
                            onChange={(e) => setItemType(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            <option value="" disabled>Select an item type</option>
                            {Object.values(ListingCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor={`${topic}-location`} className="block text-sm font-medium text-gray-700">Location (Optional)</label>
                        <div className="relative mt-1">
                             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MapPinIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                id={`${topic}-location`}
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 pl-10"
                                placeholder="City, State or Country"
                            />
                        </div>
                         <p className="mt-1 text-xs text-gray-500">Add a location to get advice tailored to local regulations.</p>
                    </div>

                    <div>
                        <label htmlFor={`${topic}-description`} className="block text-sm font-medium text-gray-700">Describe Your Item</label>
                        <textarea
                            id={`${topic}-description`}
                            rows={4}
                            value={itemDescription}
                            onChange={(e) => setItemDescription(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="E.g., 40-foot sailboat, 2021 model, in excellent condition with modern navigation equipment."
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !itemType || !itemDescription}
                    className="mt-6 w-full flex justify-center items-center gap-2 py-3 px-4 text-white font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition-all transform hover:scale-105"
                >
                    {buttonText}
                    <SparklesIcon className="h-5 w-5" />
                </button>
            </form>
            {isLoading && (
                <div className="mt-6 text-center text-gray-600">
                    <p>Generating response...</p>
                </div>
            )}
            {aiResponse && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">AI Response:</h4>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-4" dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                    
                    {/* Feature: Digital Contract Button */}
                    {topic === 'contract' && (
                        <button 
                            onClick={() => setShowContractModal(true)}
                            className="w-full py-2 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center justify-center gap-2 transition-colors shadow-md"
                        >
                            <PenToolIcon className="h-4 w-4" />
                            Draft & Sign Contract
                        </button>
                    )}
                </div>
            )}

            {showContractModal && (
                <DigitalContractModal 
                    isOpen={showContractModal} 
                    onClose={() => setShowContractModal(false)} 
                    aiClauses={aiResponse}
                    itemDescription={itemDescription}
                />
            )}
        </div>
    );
};

const AIAssistantPage: React.FC = () => {
    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Goodslister AI Assistant</h1>
                    <p className="mt-4 text-lg text-gray-600">
                        Get expert guidance to rent your items safely and efficiently. Our AI provides clear, practical advice tailored to your needs.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <AdviceCard
                        icon={FileTextIcon}
                        title="Contract Advisor"
                        description="Get suggested clauses for your rental agreement for added clarity and security."
                        buttonText="Suggest Clauses"
                        topic="contract"
                    />
                    <AdviceCard
                        icon={ShieldCheckIcon}
                        title="Insurance Advisor"
                        description="Receive educational guidance on relevant insurance types for your item. This is not financial advice."
                        buttonText="Get Insurance Guide"
                        topic="insurance"
                    />
                    <AdviceCard
                        icon={WalletIcon}
                        title="Secure Payment Advisor"
                        description="Learn about the most reliable payment methods and best practices for secure transactions."
                        buttonText="Advise on Payments"
                        topic="payment"
                    />
                </div>
            </div>
        </div>
    );
};

export default AIAssistantPage;
