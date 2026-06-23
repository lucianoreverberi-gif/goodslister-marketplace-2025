import React, { useState } from 'react';
import { XIcon, CreditCardIcon, LandmarkIcon, CheckCircleIcon, RocketIcon, InfoIcon, RefreshCwIcon } from './icons';
import { Session, User } from '../types';

interface ConnectStripeModalProps {
    user: User | Session;
    onClose: () => void;
    onSuccessUpdate?: () => void;
}

const ConnectStripeModal: React.FC<ConnectStripeModalProps> = ({ user, onClose, onSuccessUpdate }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/stripe/connect/create-onboarding-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || data.error || 'Failed to create onboarding link');
            }

            if (data.url) {
                // Redirect user to Stripe onboarding
                window.location.href = data.url;
            } else {
                throw new Error('No redirection URL returned from server.');
            }
        } catch (err: any) {
            console.error('Stripe connect error:', err);
            setError(err.message || 'Hubo un error al iniciar la conexión con Stripe. Por favor intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-in zoom-in duration-200">
                {/* Header background decoration */}
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 h-2 w-full"></div>
                
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-1.5 rounded-full">
                    <XIcon className="h-5 w-5" />
                </button>

                <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-cyan-100 p-2.5 rounded-2xl text-cyan-600">
                            <RocketIcon className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-extrabold text-cyan-600 uppercase tracking-widest bg-cyan-50 px-2.5 py-1 rounded-full">
                            Rental Success Coach
                        </span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
                        ¡Prepara tu cuenta para ganar dinero seguro!
                    </h3>
                    
                    <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                        ¡Gran iniciativa! Para comenzar a recibir tus ingresos por alquileres directamente en tu banco, utilizamos <strong>Stripe Connect Express</strong>, la plataforma de procesamiento de cobros líder en el mundo.
                    </p>

                    {/* Insider Advice box */}
                    <div className="bg-slate-50 rounded-2xl p-4 mt-5 border border-slate-100 flex gap-3 text-left">
                        <div className="text-amber-500 mt-1 shrink-0">
                            <InfoIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Smart Pro-Tip</h4>
                            <p className="text-xs text-slate-650 mt-1 leading-relaxed">
                                ¡Olvídate de la incertidumbre! Al conectar tu cuenta de Stripe, activas inmediatamente la capacidad de configurar <strong>Depósitos de Garantía</strong> para proteger tus equipos y habilitas nuestro <strong>Smart Legal Shield</strong>. Tú pones las reglas, Stripe asegura los fondos.
                            </p>
                        </div>
                    </div>

                    {/* Features checklist */}
                    <div className="mt-6 space-y-3.5">
                        <div className="flex items-start gap-3">
                            <div className="bg-emerald-100 text-emerald-600 p-0.5 rounded-full mt-0.5 shrink-0">
                                <CheckCircleIcon className="h-4 w-4" />
                            </div>
                            <p className="text-xs text-slate-600 leading-normal">
                                <strong className="text-slate-950">Garantía sin riesgo:</strong> Retención automática del depósito antes de cada entrega de equipo.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-emerald-100 text-emerald-600 p-0.5 rounded-full mt-0.5 shrink-0">
                                <CheckCircleIcon className="h-4 w-4" />
                            </div>
                            <p className="text-xs text-slate-600 leading-normal">
                                <strong className="text-slate-950">Pagos ultra-rápidos:</strong> Fondos directo a tu cuenta bancaria o de débito sin esperas intermedias.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-emerald-100 text-emerald-600 p-0.5 rounded-full mt-0.5 shrink-0">
                                <CheckCircleIcon className="h-4 w-4" />
                            </div>
                            <p className="text-xs text-slate-600 leading-normal">
                                <strong className="text-slate-950">Control absoluto:</strong> Panel de control Express personal donde puedes revisar transferencias y requisitos legales.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onClose}
                            className="w-full sm:w-1/3 py-3.5 bg-slate-50 text-slate-700 text-sm font-bold rounded-2xl hover:bg-slate-100 transition-colors"
                        >
                            En otro momento
                        </button>
                        <button
                            onClick={handleConnect}
                            disabled={isLoading}
                            className="w-full sm:w-2/3 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-cyan-100 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                                    <span>Iniciando conexión...</span>
                                </>
                            ) : (
                                <>
                                    <LandmarkIcon className="h-4 w-4" />
                                    <span>Conectar mi cuenta</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectStripeModal;
