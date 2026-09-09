import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon, RefreshIcon } from './icons';

// Global React Error Boundary - catches unhandled errors in the tree
// and shows a friendly fallback instead of a white screen.

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        this.setState({ errorInfo });
        // TODO: Send to error tracking service (Sentry, LogRocket, etc)
        // Example: window.Sentry?.captureException(error, { extra: errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.hash = '';
        this.handleReset();
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        if (this.props.fallback) {
            return this.props.fallback;
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
                <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg p-8 border border-slate-100 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 rounded-3xl mb-4">
                        <AlertTriangleIcon className="h-8 w-8 text-rose-500" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h1>
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        We hit an unexpected error. Our team has been notified. Try refreshing the page or going back home.
                    </p>
                    {process.env.NODE_ENV !== 'production' && this.state.error && (
                        <details className="text-left bg-slate-50 p-3 rounded-xl mb-6 text-xs">
                            <summary className="font-bold text-slate-700 cursor-pointer">Error details (dev only)</summary>
                            <pre className="mt-2 text-rose-600 whitespace-pre-wrap break-all">
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={this.handleReload}
                            className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-all shadow-sm inline-flex items-center justify-center gap-2"
                        >
                            <RefreshIcon className="h-4 w-4" />
                            Refresh page
                        </button>
                        <button
                            onClick={this.handleGoHome}
                            className="px-6 py-3 bg-white text-slate-700 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
                        >
                            Go to home
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
