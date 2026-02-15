
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill process for browser environment
// This ensures that access to process.env doesn't crash the app
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Critical rendering error:", error);
  rootElement.innerHTML = `
    <div style="padding: 40px; font-family: -apple-system, sans-serif; text-align: center; color: #333;">
      <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
      <h2 style="font-weight: 900; letter-spacing: -0.05em;">Initialization Failed</h2>
      <p style="color: #666; max-width: 300px; margin: 0 auto 20px; line-height: 1.5;">
        The app couldn't start. This is usually due to a JavaScript error or missing environment variables.
      </p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 12px; text-align: left; font-size: 11px; font-family: monospace; overflow: auto; max-height: 200px; border: 1px solid #eee;">
        ${String(error)}
      </div>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 12px 24px; background: #000; color: #fff; border: none; border-radius: 100px; font-weight: 800; cursor: pointer;">
        Try Refreshing
      </button>
    </div>
  `;
}
