/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/PaymentCancelPage.tsx
 * Purpose: Checkout cancellation page that displays current Firestore order status and
 *          allows returning to Packages or Pro Shop cleanly.
 */

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { getOrderById } from '../../services/paymentsService';
import { Order } from '../../types/models';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';

export default function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) return;
    getOrderById(orderId)
      .then((res) => setOrder(res))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="container-club py-20 max-w-2xl">
      <div className="p-8 rounded-lg bg-[#14171A] border border-white/10 space-y-6">
        {loading ? (
          <Loader label="Checking order status..." />
        ) : (
          <>
            <div className="flex items-start gap-4">
              <XCircle size={36} className="text-red-400 shrink-0 mt-1" />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
                  Checkout Cancelled
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white">
                  No Charge Was Completed
                </h1>
                <p className="text-sm text-neutral-400">
                  You exited online checkout before completing payment. You can retry anytime or pay
                  at the gym front desk.
                </p>
              </div>
            </div>

            {order ? (
              <div className="p-4 rounded bg-[#0B0D0E] border border-white/10 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Order Reference</span>
                  <span className="font-mono text-white">#{order.id.slice(0, 10)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Payment Status</span>
                  <span className="uppercase text-amber-400">
                    {order.paymentStatus || 'unpaid'}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Link to="/packages">
                <Button>Return To Packages</Button>
              </Link>
              <Link to="/shop">
                <Button variant="secondary">Return To Shop</Button>
              </Link>
              <Link to="/member/orders">
                <Button variant="ghost">My Orders</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
