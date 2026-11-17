/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/App.tsx
 * Purpose: Root application component wiring SiteProvider, AuthProvider, CartProvider,
 *          BrowserRouter, AppRoutes, and ToastContainer.
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AppRoutes } from './routes/AppRoutes';
import { ToastContainer } from './components/common/Toast';

export default function App() {
  return (
    <SiteProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppRoutes />
            <ToastContainer />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </SiteProvider>
  );
}
