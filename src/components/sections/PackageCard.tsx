/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/sections/PackageCard.tsx
 * Purpose: Pricing tier card reading currency symbol from SiteContext and supporting
 *          optional featured/offer callouts, Join at Gym, and Pay Online actions.
 */

import React from 'react';
import { Check, CreditCard } from 'lucide-react';
import { GymPackage } from '../../types/models';
import { useSite } from '../../context/SiteContext';
import { Button } from '../common/Button';
import { formatAmount } from '../../utils/helpers';

interface PackageCardProps {
  pkg: GymPackage;
  onSelect: (pkg: GymPackage) => void;
  onPayOnline?: (pkg: GymPackage) => void;
  loading?: boolean;
  onlineLoading?: boolean;
}

export function PackageCard({
  pkg,
  onSelect,
  onPayOnline,
  loading = false,
  onlineLoading = false,
}: PackageCardProps) {
  const { settings } = useSite();
  const isFeatured = Boolean(pkg.featured || pkg.badgeText);

  return (
    <article
      className={`flex flex-col justify-between p-7 rounded-lg border transition-colors ${
        isFeatured
          ? 'bg-[#181C20] border-[var(--accent)]'
          : 'bg-[#14171A] border-white/10 hover:border-white/25'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-3 min-h-[24px]">
          <p className="text-xs font-medium text-neutral-400">
            {pkg.audience || 'Club Membership'}
          </p>
          {pkg.badgeText ? (
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] whitespace-nowrap">
              {pkg.badgeText}
            </span>
          ) : null}
        </div>

        <h3 className="font-display text-2xl font-extrabold uppercase text-white mt-2">
          {pkg.name}
        </h3>

        <div className="mt-4 pb-5 border-b border-white/10 flex items-baseline gap-2">
          <span className="font-display text-5xl font-extrabold tabular-nums text-white">
            <span className="text-2xl font-bold text-neutral-300 mr-1.5">
              {settings.currencySymbol}
            </span>
            {formatAmount(pkg.price)}
          </span>
          <span className="text-xs uppercase tracking-wider text-neutral-400">
            / {pkg.billingCycle} &middot; {pkg.durationDays} days
          </span>
        </div>

        {pkg.description ? (
          <p className="text-sm text-neutral-400 mt-4 leading-relaxed">{pkg.description}</p>
        ) : null}

        <ul className="mt-5 space-y-2.5 text-sm text-neutral-200">
          {pkg.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <Check size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-7 space-y-2.5">
        {onPayOnline ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Button
              variant={isFeatured ? 'primary' : 'secondary'}
              fullWidth
              loading={onlineLoading}
              disabled={loading}
              onClick={() => onPayOnline(pkg)}
            >
              <CreditCard size={15} />
              <span>Pay Online</span>
            </Button>
            <Button
              variant="secondary"
              fullWidth
              loading={loading}
              disabled={onlineLoading}
              onClick={() => onSelect(pkg)}
            >
              Join at Gym
            </Button>
          </div>
        ) : (
          <Button
            variant={isFeatured ? 'primary' : 'secondary'}
            fullWidth
            loading={loading}
            onClick={() => onSelect(pkg)}
          >
            Join at Gym
          </Button>
        )}
      </div>
    </article>
  );
}
