/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/layout/AdminSidebar.tsx
 * Purpose: Sidebar navigation for the /admin management workspace with responsive mobile drawer.
 */

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarDays,
  Award,
  FileText,
  Image,
  CalendarClock,
  ShoppingBag,
  ClipboardCheck,
  MessageSquare,
  Mail,
  Settings,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';

const ADMIN_LINKS = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Members', to: '/admin/members', icon: Users },
  { label: 'Attendance', to: '/admin/attendance', icon: ClipboardCheck },
  { label: 'Packages', to: '/admin/packages', icon: CreditCard },
  { label: 'Classes', to: '/admin/classes', icon: CalendarDays },
  { label: 'Trainers', to: '/admin/trainers', icon: Award },
  { label: 'Shop & Orders', to: '/admin/shop', icon: ShoppingBag },
  { label: 'Blog Posts', to: '/admin/blog', icon: FileText },
  { label: 'Gallery', to: '/admin/gallery', icon: Image },
  { label: 'Events', to: '/admin/events', icon: CalendarClock },
  { label: 'Messages', to: '/admin/messages', icon: MessageSquare },
  { label: 'Newsletter', to: '/admin/newsletter', icon: Mail },
  { label: 'Site Settings', to: '/admin/settings', icon: Settings },
];

export function AdminSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { settings } = useSite();

  const content = (
    <div className="flex flex-col h-full bg-[#0E1012] border-r border-white/10 w-64">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <p className="font-display text-xl font-extrabold uppercase tracking-wider text-white">
            {settings.shortName || settings.gymName}
          </p>
          <p className="text-xs text-neutral-400">Club Management</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close admin menu"
          className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center text-neutral-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Admin navigation">
        {ADMIN_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium min-h-[42px] transition-colors ${
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={17} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          to="/member"
          className="flex items-center gap-2 px-3 py-2.5 rounded text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/5"
        >
          Member View
        </Link>
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft size={14} />
          <span>Back to Public Site</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{content}</aside>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-black/75 backdrop-blur-xs"
          onClick={onClose}
        >
          <div onClick={(e) => e.stopPropagation()} className="h-full">
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}
