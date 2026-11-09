import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './app/App.jsx';
import { StoreBrandProvider } from './contexts/StoreBrandContext.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreBrandProvider><App /></StoreBrandProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
