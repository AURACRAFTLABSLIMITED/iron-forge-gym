/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/layout/TopBar.tsx
 * Purpose: Non-sticky top contact strip displaying club phone, email, hours, and social links
 *          from SiteSettings / gymConfig.js.
 */

import React from 'react';
import { Phone, Mail, Clock, Instagram, Youtube, Facebook } from 'lucide-react';
import { useSite } from '../../context/SiteContext';

export function TopBar() {
  const { settings } = useSite();
  const primaryHours = settings.workingHours?.[0]?.hours || '05:00 AM – 10:30 PM';

  return (
    <div className="hidden md:block bg-[#08090A] border-b border-white/10 text-xs text-neutral-400">
      <div className="container-club py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <a
            href={`tel:${settings.phone}`}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap"
          >
            <Phone size={13} className="text-[var(--accent)]" />
            <span className="font-mono tabular-nums">{settings.phone}</span>
          </a>
          <a
            href={`mailto:${settings.email}`}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors truncate"
          >
            <Mail size={13} className="text-[var(--accent)]" />
            <span>{settings.email}</span>
          </a>
          <span className="hidden lg:inline-flex items-center gap-1.5 whitespace-nowrap">
            <Clock size={13} className="text-[var(--accent)]" />
            <span>Mon–Fri: {primaryHours}</span>
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {settings.socialLinks?.instagram ? (
            <a
              href={settings.socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="p-1 text-neutral-400 hover:text-[var(--accent)] transition-colors"
            >
              <Instagram size={14} />
            </a>
          ) : null}
          {settings.socialLinks?.youtube ? (
            <a
              href={settings.socialLinks.youtube}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="p-1 text-neutral-400 hover:text-[var(--accent)] transition-colors"
            >
              <Youtube size={14} />
            </a>
          ) : null}
          {settings.socialLinks?.facebook ? (
            <a
              href={settings.socialLinks.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="p-1 text-neutral-400 hover:text-[var(--accent)] transition-colors"
            >
              <Facebook size={14} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
