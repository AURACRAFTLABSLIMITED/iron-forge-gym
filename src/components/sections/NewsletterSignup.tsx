/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/sections/NewsletterSignup.tsx
 * Purpose: Email newsletter signup bar that validates email and persists subscribers to Firestore.
 */

import React, { useState } from 'react';
import { subscribeNewsletter } from '../../services/contactService';
import { isValidEmail } from '../../utils/validators';
import { useSite } from '../../context/SiteContext';
import { Button } from '../common/Button';

export function NewsletterSignup() {
  const { showToast } = useSite();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setLoading(true);
    try {
      await subscribeNewsletter(email);
      setEmail('');
      showToast('You are subscribed to club training updates and event alerts.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Subscription failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#14171A] border-y border-white/10 py-12">
      <div className="container-club flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Training Dispatch
          </p>
          <h2 className="font-display text-3xl font-extrabold uppercase text-white mt-1">
            Weekly Programming &amp; Club Events
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Receive strength cycle updates, seminar dates, and seasonal gear drops straight to your inbox.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 min-w-0 lg:min-w-[420px]"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address for newsletter"
            className="flex-1 min-h-[46px] px-4 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white placeholder-neutral-500 focus:border-[var(--accent)] focus:outline-none"
          />
          <Button type="submit" loading={loading} size="lg">
            Subscribe
          </Button>
        </form>
      </div>
    </section>
  );
}
