import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ShortcutProvider } from './contexts/ShortcutProvider';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ShortcutProvider>
        <App />
      </ShortcutProvider>
    </ThemeProvider>
  </React.StrictMode>
);
