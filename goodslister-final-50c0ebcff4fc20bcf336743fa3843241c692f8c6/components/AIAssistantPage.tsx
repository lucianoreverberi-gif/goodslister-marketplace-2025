import React, { useState } from 'react';
import { ListingCategory } from '../types';
import { getAIAdvice, AdviceTopic } from '../services/geminiService';
import { FileTextIcon, ShieldCheckIcon, WalletIcon, SparklesIcon } from './icons';

interface AdviceCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    buttonText: string;
    topic: AdviceTopic;
}

const AdviceCard: React.FC<AdviceCardProps> = ({ icon: Icon, title, description, buttonText, topic }) => {
    const [itemType, setItemType] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setAiResponse('');
        const response = await getAIAdvice(topic, itemType, itemDescription);
        setAiResponse(response);
        setIsLoading(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 p-6 sm:p-8 flex flex-col">
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
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                </div>
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
                        Get expert guidance to rent your items safely and efficiently. Our AI provides clear, practical advice.
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