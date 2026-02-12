setShowForgotPassword(true))}    setShowForgotPassword(true)}
import React, { useState } from 'react';
import ForgotPasswordModal from './ForgotPasswordModal';
import { XIcon, EyeIcon, EyeOffIcon, UserCheckIcon } from './icons';

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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
      const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        let success = false;
        if (isRegistering) {
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setIsLoading(false);
                return;
            }
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

    const handleDemoLogin = async () => {
        setError('');
        setIsLoading(true);
        // Using a mock user credential
        const success = await onLogin('carlos.gomez@example.com', 'password');
        if (!success) {
             setError('Demo login failed.');
        }
        setIsLoading(false);
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
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
                            <div className="relative mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 pr-10"
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

                        {isRegistering && (
                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        id="confirm-password"
                                        name="confirm-password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 pr-10"
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

                                      
              {!isRegistering && (
                <div className="text-right mt-2">
                  <button
                    type="button"
                onClick={() => setShowForgotPassword(true)}                    className="text-sm text-cyan-600 hover:text-cyan-800 font-medium"
                                      className="text-sm text-cyan-600 hover:text-cyan-800 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
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
                    
                    {!isRegistering && (
                        <div className="mt-4">
                            <button 
                                type="button" 
                                onClick={handleDemoLogin}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 border-2 border-cyan-500 rounded-lg shadow-md text-sm font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 focus:outline-none disabled:opacity-50 transition-colors"
                            >
                                <UserCheckIcon className="h-5 w-5 text-cyan-700" />
                                Demo Login (Carlos - Owner)
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <button onClick={toggleMode} className="text-sm text-cyan-600 hover:text-cyan-800 font-medium">
                            {isRegistering ? 'Already have an account? Log in' : 'Don\'t have an account? Sign up'}
                        </button>
                    </div>
                </div>
            </div>
        </div>

              {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    );
};

export default LoginModal;
