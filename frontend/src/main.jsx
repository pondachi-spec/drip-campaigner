import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(15,15,30,0.95)',
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
        },
      }}
    />
  </React.StrictMode>
);
