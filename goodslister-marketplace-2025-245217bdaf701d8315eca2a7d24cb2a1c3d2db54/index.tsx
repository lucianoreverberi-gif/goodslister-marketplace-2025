
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './goodslister-final-50c0ebcff4fc20bcf336743fa3843241c692f8c6/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
