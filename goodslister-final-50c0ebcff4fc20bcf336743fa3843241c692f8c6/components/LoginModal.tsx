
import React, { useState } from 'react';
import { XIcon, EyeIcon, EyeOffIcon, UserCheckIcon, MailIcon, CheckCircleIcon } from './icons';

interface LoginModalProps {
    onLogin: (email: string, password: string) => Promise<boolean>;
    onRegister: (name: string, email: string, password: string) => Promise<boolean>;
    onClose: () => void;
}

type ModalView = 'login' | 'register' | 'forgot_password';

const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onRegister, onClose }) => {
    const [view, setView] = useState<ModalView>('login');
    
    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        let success = false;

        if (view === 'register') {
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setIsLoading(false);
                return;
            }
            success = await onRegister(name, email, password);
            if (!success) {
                setError('Email is already in use or the data is invalid.');
            }
        } else if (view === 'login') {
            success = await onLogin(email, password);
            if (!success) {
                setError('Incorrect email or password.');
            }
        } else if (view === 'forgot_password') {
            // Mock Password Reset Flow
            // In a real app, call an API like /api/auth/reset-password
            await new Promise(resolve => setTimeout(resolve, 1500));
            setResetSent(true);
            setIsLoading(false);
            return;
        }
        setIsLoading(false);
    };

    const handleDemoLogin = async () => {
        setError('');
        setIsLoading(true);
        // Using a mock user credential that triggers auto-recovery on backend if needed
        const success = await onLogin('carlos.gomez@example.com', 'password');
        if (!success) {
             setError('Demo login failed. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XIcon className="h-6 w-6" />
                </button>
                
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-900">
                        {view === 'register' && 'Create Account'}
                        {view === 'login' && 'Log In'}
                        {view === 'forgot_password' && 'Reset Password'}
                    </h2>
                    
                    <p className="text-center text-gray-600 mt-2 text-sm">
                        {view === 'register' && 'Join the Goodslister community.'}
                        {view === 'login' && 'Access your Goodslister account.'}
                        {view === 'forgot_password' && 'Enter your email to receive instructions.'}
                    </p>

                    {view === 'forgot_password' && resetSent ? (
                        <div className="mt-8 text-center animate-in zoom-in-95">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                <CheckCircleIcon className="h-8 w-8" />
                            </div>
                            <h3 className="font-bold text-gray-900">Check your inbox</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                We've sent a password reset link to <strong>{email}</strong>.
                            </p>
                            <button 
                                onClick={() => { setView('login'); setResetSent(false); }}
                                className="mt-6 text-cyan-600 font-bold hover:underline text-sm"
                            >
                                Back to Log In
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                            {view === 'register' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email address</label>
                                <div className="relative mt-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <MailIcon className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            {view !== 'forgot_password' && (
                                <div>
                                    <div className="flex justify-between items-center">
                                        <label className="block text-sm font-medium text-gray-700">Password</label>
                                        {view === 'login' && (
                                            <button 
                                                type="button"
                                                onClick={() => setView('forgot_password')}
                                                className="text-xs font-semibold text-cyan-600 hover:text-cyan-800"
                                            >
                                                Forgot password?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative mt-1">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 pr-10"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {view === 'register' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                    <div className="relative mt-1">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 pr-10"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
                                    <span className="font-bold">Error:</span> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-cyan-400 transition-colors"
                            >
                                {isLoading ? 'Processing...' : (
                                    view === 'register' ? 'Sign Up' : 
                                    view === 'login' ? 'Log In' : 
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>
                    )}
                    
                    {view === 'login' && !resetSent && (
                        <div className="mt-4">
                            <button 
                                type="button" 
                                onClick={handleDemoLogin}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 border-2 border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 focus:outline-none disabled:opacity-50 transition-all"
                            >
                                <UserCheckIcon className="h-5 w-5 text-gray-500" />
                                Demo Login (Owner)
                            </button>
                        </div>
                    )}

                    {!resetSent && (
                        <div className="mt-6 text-center pt-6 border-t border-gray-100">
                            {view === 'login' ? (
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{' '}
                                    <button onClick={() => { setView('register'); setError(''); }} className="text-cyan-600 hover:text-cyan-800 font-bold">
                                        Sign up
                                    </button>
                                </p>
                            ) : (
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <button onClick={() => { setView('login'); setError(''); }} className="text-cyan-600 hover:text-cyan-800 font-bold">
                                        Log in
                                    </button>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
