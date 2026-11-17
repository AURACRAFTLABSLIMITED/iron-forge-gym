/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminLayout.tsx
 * Purpose: Responsive shell for all /admin management routes with mobile sidebar toggle.
 */

import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { useAuth } from '../../hooks/useAuth';
import { useSite } from '../../context/SiteContext';
import { Button } from '../../components/common/Button';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { showToast } = useSite();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast('Signed out.');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-[#0B0D0E] text-[#F4F5F6]">
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-8 bg-[#0E1012]/95 backdrop-blur border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-neutral-300 hover:bg-white/10"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-medium text-neutral-300 truncate">
              Admin Workspace &middot; {user?.email}
            </span>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
