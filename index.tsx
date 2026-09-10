import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { initAnalytics } from './services/analytics';

// Initialize PostHog before React renders (fire-and-forget - never blocks)
initAnalytics();

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <ToastProvider>
                    <App />
                </ToastProvider>
            </ErrorBoundary>
        </React.StrictMode>
    );
}
