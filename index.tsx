import React from 'react';
import ReactDOM from 'react-dom/client';

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <div style={{ padding: '50px', fontSize: '24px' }}>
            React is working!
        </div>
    );
}