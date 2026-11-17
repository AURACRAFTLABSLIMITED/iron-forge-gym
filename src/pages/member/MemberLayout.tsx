/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/member/MemberLayout.tsx
 * Purpose: Shared navigation shell for authenticated member portal routes.
 */

import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSite } from '../../context/SiteContext';
import { Button } from '../../components/common/Button';

const MEMBER_TABS = [
  { label: 'Dashboard', to: '/member', end: true },
  { label: 'My Bookings', to: '/member/bookings' },
  { label: 'My Orders', to: '/member/orders' },
  { label: 'Edit Profile', to: '/member/profile' },
];

export default function MemberLayout() {
  const { profile, user, isAdmin, logout } = useAuth();
  const { showToast } = useSite();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast('Signed out.');
    navigate('/');
  };

  return (
    <div className="container-club py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Member Portal
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white mt-0.5">
            {profile?.displayName || user?.displayName || 'Club Member'}
          </h1>
          <p className="text-xs text-neutral-400">{user?.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin ? (
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin')}>
              <ShieldCheck size={16} />
              <span>Admin Console</span>
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Member portal sections">
        {MEMBER_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `min-h-[42px] px-4 inline-flex items-center rounded text-xs font-semibold uppercase tracking-wider border transition-colors ${
                isActive
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
                  : 'bg-[#14171A] text-neutral-300 border-white/10 hover:border-white/25'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
