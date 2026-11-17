/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/layout/PublicLayout.tsx
 * Purpose: Shared page shell combining TopBar, sticky Navbar, main route outlet, and Footer.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D0E] text-[#F4F5F6]">
      <TopBar />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
