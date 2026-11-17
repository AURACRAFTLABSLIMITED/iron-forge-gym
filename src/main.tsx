/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/main.tsx
 * Purpose: Vite React DOM entry mounting the application and loading global CSS styles.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
