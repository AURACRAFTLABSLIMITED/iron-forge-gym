/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/PaymentSuccessPage.tsx
 * Purpose: Post-checkout confirmation page that reads live order and payment status
 *          from Firestore (never trusting URL parameters alone).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { getOrderById } from '../../services/paymentsService';
import { useSite } from '../../context/SiteContext';
import { Order } from '../../types/models';
import { formatCurrency } from '../../utils/helpers';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const { settings } = useSite();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load order status.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const isPaid = order?.paymentStatus === 'paid';

  return (
    <div className="container-club py-20 max-w-2xl">
      <div className="p-8 rounded-lg bg-[#14171A] border border-white/10 space-y-6">
        {loading ? (
          <Loader label="Verifying payment status with Firestore..." />
        ) : !orderId || !order ? (
          <div className="space-y-4">
            <h1 className="font-display text-3xl font-extrabold uppercase text-white">
              Order Status Unavailable
            </h1>
            <p className="text-sm text-neutral-400">
              {error ||
                'No matching order ID was found, or you are signed out. Check your Member Orders portal for full history.'}
            </p>
            <Link to="/member/orders">
              <Button>View My Orders</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              {isPaid ? (
                <CheckCircle2 size={36} className="text-[var(--accent)] shrink-0 mt-1" />
              ) : (
                <Clock size={36} className="text-amber-400 shrink-0 mt-1" />
              )}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  {isPaid ? 'Payment Confirmed' : 'Awaiting Webhook Confirmation'}
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white">
                  {isPaid ? 'Thank You For Your Order' : 'Payment Processing'}
                </h1>
                <p className="text-sm text-neutral-400">
                  {isPaid
                    ? order.orderType === 'membership'
                      ? 'Your membership plan is now active and reflected on your Member Dashboard.'
                      : 'Your order is confirmed and queued for fulfillment.'
                    : 'Your card provider is finalizing the webhook callback. Refresh in a few seconds if it is still updating.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded bg-[#0B0D0E] border border-white/10 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Order ID</span>
                <span className="font-mono text-white">#{order.id.slice(0, 10)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Payment Status</span>
                <span
                  className={`font-semibold uppercase ${
                    isPaid ? 'text-[var(--accent)]' : 'text-amber-400'
                  }`}
                >
                  {order.paymentStatus || 'unpaid'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Fulfillment Status</span>
                <span className="uppercase text-white">{order.status}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-neutral-400">Verified Total</span>
                <span className="font-mono font-bold tabular-nums text-[var(--accent)]">
                  {formatCurrency(order.total, settings.currencySymbol)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isPaid ? (
                <Button variant="secondary" onClick={fetchOrder}>
                  <RefreshCw size={15} />
                  <span>Refresh Status</span>
                </Button>
              ) : null}
              <Link to="/member/orders">
                <Button>Go To My Orders</Button>
              </Link>
              <Link to={order.orderType === 'membership' ? '/member' : '/shop'}>
                <Button variant="ghost">
                  {order.orderType === 'membership' ? 'Member Dashboard' : 'Back To Shop'}
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
