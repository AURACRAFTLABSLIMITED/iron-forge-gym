/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/NotFoundPage.tsx
 * Purpose: 404 Not Found fallback page with clean return navigation.
 */

import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container-club py-28 text-center space-y-5">
      <p className="font-mono text-sm text-[var(--accent)]">404</p>
      <h1 className="font-display text-5xl sm:text-6xl font-extrabold uppercase text-white">
        Page Not Found
      </h1>
      <p className="text-neutral-400 max-w-md mx-auto">
        The page you requested does not exist or has moved. Return to the main club floor.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center min-h-[46px] px-7 rounded font-semibold text-sm uppercase tracking-wider"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          Back To Home
        </Link>
      </div>
    </div>
  );
}
