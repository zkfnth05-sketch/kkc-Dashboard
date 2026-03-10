import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log("%c🚀 KKC Admin Dashboard Starting...", "color: #3b82f6; font-size: 16px; font-weight: bold;");

const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("%c✅ React Application Mounted Successfully", "color: #10b981; font-weight: bold;");
  } catch (error: any) {
    console.error("Critical Startup Error:", error);
    const fallback = document.getElementById('error-fallback');
    const msg = document.getElementById('error-message');
    if (fallback && msg) {
      fallback.style.display = 'block';
      msg.textContent = error.stack || error.message || String(error);
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}