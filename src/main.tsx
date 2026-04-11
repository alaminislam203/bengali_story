import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

// Fix for "Uncaught TypeError: Cannot set property fetch of #<Window> which has only a getter"
// This error often occurs when third-party scripts (like ad networks) try to wrap window.fetch
// in environments where it's defined as a read-only getter.
try {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
  if (descriptor && !descriptor.writable && descriptor.configurable) {
    const originalFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      value: originalFetch,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
} catch (e) {
  console.warn('Failed to patch window.fetch:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
