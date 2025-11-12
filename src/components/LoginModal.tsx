import React, { useState } from 'react';
import { XIcon } from './icons';

interface LoginModalProps {
    onLogin: (email: string, password: string) => Promise<boolean>;
    onRegister: (name: string, email: string, password: string) => Promise<boolean>;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onRegister, onClose }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        let success = false;
        if (isRegistering) {
            success = await onRegister(name, email, password);
            if (!success) {
                setError('Email is already in use or the data is invalid.');
            }
        } else {
            success = await onLogin(email, password);
            if (!success) {
                setError('Incorrect email or password.');
            }
        }
        setIsLoading(false);
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setName('');
        setEmail('');
        setPassword('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XIcon className="h-6 w-6" />
                </button>
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-900">
                        {isRegistering ? 'Create Account' : 'Log In'}
                    </h2>
                    <p className="text-center text-gray-600 mt-2">
                        {isRegistering ? 'Join the Goodslister community.' : 'Access your Goodslister account.'}
                    </p>
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {isRegistering && (
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        </div>
                        
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-cyan-400"
                            >
                                {isLoading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Log In')}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <button onClick={toggleMode} className="text-sm text-cyan-600 hover:text-cyan-800 font-medium">
                            {isRegistering ? 'Already have an account? Log in' : 'Don\'t have an account? Sign up'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;