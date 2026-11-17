/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/AboutPage.tsx
 * Purpose: Public club story, mission pillars, and live stats counters from gymConfig.js.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { gymConfig } from '../../config/gymConfig.js';
import { useSite } from '../../context/SiteContext';
import { MediaFrame } from '../../components/common/MediaFrame';
import { NewsletterSignup } from '../../components/sections/NewsletterSignup';

export default function AboutPage() {
  const { settings } = useSite();

  return (
    <div>
      <section className="container-club py-16 sm:py-20 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 space-y-5 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Our Story &amp; Standard
            </p>
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase text-white leading-none">
              Engineered For Serious Progress
            </h1>
            <p className="text-neutral-300 leading-relaxed">
              {settings.gymName} was founded on a straightforward premise: give everyday lifters
              and competitive athletes commercial-grade equipment, evidence-backed programming,
              and coaches who care about movement quality.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              No overcrowded gimmicks or confusing lock-in contracts. Every square foot of our
              strength floor, boxing studio, and recovery suite is organized to help you train
              consistently week after week.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/packages"
                className="inline-flex items-center min-h-[46px] px-6 rounded font-semibold text-sm uppercase tracking-wider"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
              >
                View Memberships
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center min-h-[46px] px-6 rounded border border-white/20 text-sm font-semibold uppercase tracking-wider text-white hover:border-[var(--accent)]"
              >
                Book A Club Tour
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-lg overflow-hidden border border-white/10 min-h-[340px]">
            <MediaFrame
              src={gymConfig.defaultMedia.heroStrength}
              alt={`${settings.gymName} training floor`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {gymConfig.stats.map((stat) => (
            <div
              key={stat.label}
              className="p-6 rounded-lg bg-[#14171A] border border-white/10 space-y-1"
            >
              <p className="font-display text-4xl sm:text-5xl font-extrabold tabular-nums text-[var(--accent)]">
                {stat.value}
              </p>
              <p className="text-sm text-neutral-300">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mission Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[
            {
              index: '01. Equipment Precision',
              body: 'Calibrated steel plates, competition racks, turf sled lanes, and heavy-bag conditioning stations maintained daily.',
            },
            {
              index: '02. Coached Accountability',
              body: 'Small-group coaching ratios ensure every member receives real-time biomechanical cues and load progressions.',
            },
            {
              index: '03. Sustainable Recovery',
              body: 'Dedicated mobility and yoga suites integrate restorative work directly alongside heavy strength cycles.',
            },
          ].map((pillar) => (
            <div
              key={pillar.index}
              className="p-6 rounded-lg bg-[#14171A] border border-white/10 space-y-2.5"
            >
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                {pillar.index}
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      <NewsletterSignup />
    </div>
  );
}
