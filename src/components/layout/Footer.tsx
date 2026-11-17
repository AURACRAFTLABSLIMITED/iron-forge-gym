/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/layout/Footer.tsx
 * Purpose: Site footer displaying gym details, working hours, navigation links,
 *          and mandatory AURA CRAFT LABS LIMITED attribution.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useSite } from '../../context/SiteContext';

export function Footer() {
  const { settings } = useSite();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#08090A] border-t border-white/10 text-neutral-400">
      <div className="container-club py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Club Brand */}
        <div className="space-y-4">
          <Link
            to="/"
            className="font-display text-2xl font-extrabold uppercase tracking-wider text-white inline-block"
          >
            {settings.gymName}
          </Link>
          <p className="text-sm leading-relaxed text-neutral-400">
            {settings.description || settings.tagline}
          </p>
        </div>

        {/* Navigation */}
        <div className="space-y-3">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
            Club Links
          </h3>
          <ul className="space-y-2 text-sm">
            {[
              { label: 'Membership Packages', to: '/packages' },
              { label: 'Weekly Class Schedule', to: '/schedule' },
              { label: 'Coaching Team', to: '/trainers' },
              { label: 'Training Blog', to: '/blog' },
              { label: 'Pro Shop', to: '/shop' },
              { label: 'Events & Seminars', to: '/events' },
            ].map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-[var(--accent)] transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Working Hours */}
        <div className="space-y-3">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
            Opening Hours
          </h3>
          <ul className="space-y-2 text-sm">
            {settings.workingHours?.map((row, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5"
              >
                <span className="text-neutral-300">{row.day}</span>
                <span className="font-mono text-xs tabular-nums text-neutral-400">
                  {row.hours}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
            Visit The Club
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
              <span>{settings.address}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={16} className="text-[var(--accent)] shrink-0" />
              <a href={`tel:${settings.phone}`} className="font-mono tabular-nums hover:text-white">
                {settings.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={16} className="text-[var(--accent)] shrink-0" />
              <a href={`mailto:${settings.email}`} className="hover:text-white break-all">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-club py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <p>
            &copy; {year} {settings.gymName}. All rights reserved.
          </p>
          <p className="text-neutral-400">
            Created by <span className="text-white font-semibold">AURA CRAFT LABS LIMITED</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
