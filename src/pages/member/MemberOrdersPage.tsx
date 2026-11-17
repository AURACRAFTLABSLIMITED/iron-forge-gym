/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/member/MemberOrdersPage.tsx
 * Purpose: Displays the signed-in member's shop and membership subscription orders.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFirestore } from '../../hooks/useFirestore';
import { getMemberOrders } from '../../services/shopService';
import { useSite } from '../../context/SiteContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Loader } from '../../components/common/Loader';

export default function MemberOrdersPage() {
  const { user } = useAuth();
  const { settings } = useSite();

  const { data: orders, loading } = useFirestore(
    () => (user ? getMemberOrders(user.uid) : Promise.resolve([])),
    [],
    Boolean(user)
  );

  if (loading) return <Loader label="Loading your orders..." />;

  if (orders.length === 0) {
    return (
      <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 space-y-4">
        <p className="text-neutral-400">You have no shop or membership orders yet.</p>
        <Link
          to="/shop"
          className="inline-flex items-center min-h-[44px] px-5 rounded font-semibold text-sm"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          Visit Pro Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="p-6 rounded-lg bg-[#14171A] border border-white/10 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="text-xs text-neutral-400">
              <span className="font-mono text-white">Order #{order.id.slice(0, 8)}</span>
              <span> &middot; {order.orderType.toUpperCase()}</span>
              <span> &middot; {formatDate(order.createdAt)}</span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Status: {order.status}
            </span>
          </div>

          <ul className="space-y-1.5 text-sm text-neutral-200">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between gap-4">
                <span>
                  {item.name} &times; <span className="font-mono">{item.quantity}</span>
                </span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(item.price * item.quantity, settings.currencySymbol)}
                </span>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-xs text-neutral-400">
              Payment: {order.paymentMethod} &middot;{' '}
              <span
                className={
                  order.paymentStatus === 'paid'
                    ? 'text-[var(--accent)] font-semibold uppercase'
                    : 'text-amber-400 font-semibold uppercase'
                }
              >
                {order.paymentStatus || 'unpaid'}
              </span>
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              Total: {formatCurrency(order.total, settings.currencySymbol)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
