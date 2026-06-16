import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import { AuthProvider } from './features/auth/context/AuthProvider';
import { applyThemeImmediate } from './utils/themeUtils';

// Áp dụng theme từ cache ngay lập tức trước React render để tránh flash
applyThemeImmediate();

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
);
