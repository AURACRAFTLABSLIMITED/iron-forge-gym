/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/layout/Navbar.tsx
 * Purpose: Sticky 3-zone header navigation with desktop Club dropdown, shopping cart badge,
 *          auth portal CTA, and accessible mobile hamburger drawer.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, ChevronDown, User } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import styles from './Navbar.module.css';

const EXPLORE_LINKS = [
  { label: 'About Us', to: '/about' },
  { label: 'Trainers', to: '/trainers' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Events', to: '/events' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
];

export function Navbar() {
  const { settings } = useSite();
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExploreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  return (
    <header className={styles.header}>
      <div className={`container-club ${styles.inner}`}>
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link to="/" className={styles.brand} onClick={() => setMobileOpen(false)}>
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.gymName}
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <span>{settings.gymName}</span>
        </Link>

        {/* Zone 2: Concise 5-item Single-Line Navigation */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Main navigation">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/schedule" className={linkClass}>
            Schedule
          </NavLink>
          <NavLink to="/packages" className={linkClass}>
            Packages
          </NavLink>
          <NavLink to="/shop" className={linkClass}>
            Shop
          </NavLink>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setExploreOpen((prev) => !prev)}
              aria-expanded={exploreOpen}
              className={`${styles.navLink} inline-flex items-center gap-1`}
            >
              <span>Club</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${exploreOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {exploreOpen ? (
              <div className="absolute left-0 mt-2 w-48 py-1.5 rounded-md bg-[#14171A] border border-white/10 shadow-2xl">
                {EXPLORE_LINKS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setExploreOpen(false)}
                    className="block px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        {/* Zone 3: Cart + Primary Action CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/shop?cart=open"
            aria-label="Shopping cart"
            className="relative min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ShoppingBag size={19} />
            {itemCount > 0 ? (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-mono font-bold flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
              >
                {itemCount}
              </span>
            ) : null}
          </Link>

          {user ? (
            <button
              type="button"
              onClick={() => navigate(isAdmin ? '/admin' : '/member')}
              className="hidden sm:inline-flex items-center gap-2 min-h-[40px] px-4 rounded font-semibold text-xs uppercase tracking-wider whitespace-nowrap shrink-0 transition-all"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
            >
              <User size={15} />
              <span>{isAdmin ? 'Admin Panel' : 'Member Portal'}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-5 rounded font-semibold text-xs uppercase tracking-wider whitespace-nowrap shrink-0 transition-all"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
            >
              Join / Sign In
            </Link>
          )}

          {/* Mobile Hamburger Toggle (min 44px touch target) */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded text-neutral-200 hover:bg-white/10"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen ? (
        <div className="lg:hidden bg-[#0E1012] border-t border-white/10 px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
          {[
            { label: 'Home', to: '/' },
            { label: 'Schedule', to: '/schedule' },
            { label: 'Packages', to: '/packages' },
            { label: 'Shop', to: '/shop' },
            ...EXPLORE_LINKS,
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-3 rounded text-sm font-medium min-h-[44px] ${
                  isActive
                    ? 'bg-white/10 text-[var(--accent)]'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/member"
                  onClick={() => setMobileOpen(false)}
                  className="w-full min-h-[44px] flex items-center justify-center rounded bg-[#1C2024] text-sm font-semibold text-white"
                >
                  Member Dashboard
                </Link>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="w-full min-h-[44px] flex items-center justify-center rounded text-sm font-semibold"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
                  >
                    Admin Panel
                  </Link>
                ) : null}
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full min-h-[44px] flex items-center justify-center rounded text-sm font-semibold"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
              >
                Join / Sign In
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
