/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/PackagesPage.tsx
 * Purpose: Displays all Firestore membership packages with Offer tags, Join at Gym (cash),
 *          and Pay Online (Cloud Function Checkout) actions.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from '../../hooks/useFirestore';
import { getPackages } from '../../services/packagesService';
import { createOrder } from '../../services/shopService';
import { startOnlineCheckout } from '../../services/paymentsService';
import { samplePackages } from '../../utils/seedData.js';
import { useAuth } from '../../hooks/useAuth';
import { useSite } from '../../context/SiteContext';
import { PackageCard } from '../../components/sections/PackageCard';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { ManualPaymentFields } from '../../components/sections/ManualPaymentFields';
import {
  getManualPaymentOptions,
  manualPaymentMethodLabel,
  manualPaymentNote,
  validateManualPayment,
} from '../../utils/paymentOptions';
import { formatCurrency } from '../../utils/helpers';
import { GymPackage } from '../../types/models';

export default function PackagesPage() {
  const { user, profile } = useAuth();
  const { settings, showToast } = useSite();
  const navigate = useNavigate();
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [onlineLoadingId, setOnlineLoadingId] = useState<string | null>(null);

  // Payment chooser (Card / Easypaisa / JazzCash / Bank) shown after clicking "Pay Online".
  const [payPkg, setPayPkg] = useState<GymPackage | null>(null);
  const [payMode, setPayMode] = useState<string>('');
  const [manualTid, setManualTid] = useState('');
  const [manualSender, setManualSender] = useState('');
  const [manualSaving, setManualSaving] = useState(false);
  const manualOptions = useMemo(() => getManualPaymentOptions(), []);
  // Force only Easypaisa + JazzCash (no Visa/Mastercard)
  const cardEnabled = false;

  const { data: packages, loading } = useFirestore(() => getPackages(30), samplePackages);

  const handleJoinAtGym = async (pkg: GymPackage) => {
    if (!user) {
      showToast('Please sign in first to subscribe to a membership plan.', 'info');
      navigate('/login');
      return;
    }

    setSubscribingId(pkg.id);
    try {
      await createOrder({
        userId: user.uid,
        customerName: profile?.displayName || user.displayName || 'Member',
        customerEmail: user.email || '',
        customerPhone: profile?.phone || 'On file',
        items: [
          {
            id: pkg.id,
            name: `${pkg.name} (${pkg.billingCycle})`,
            price: pkg.price,
            quantity: 1,
          },
        ],
        total: pkg.price,
        paymentMethod: 'Pay at gym / Front desk activation',
        orderType: 'membership',
        packageId: pkg.id,
        notes: `Requested package ID ${pkg.id} (${pkg.durationDays} days)`,
      });
      showToast(`Membership order created for ${pkg.name}. Pay at the front desk to activate.`);
      navigate('/member/orders');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Subscription failed.', 'error');
    } finally {
      setSubscribingId(null);
    }
  };

  /** Starts the Visa / Mastercard hosted checkout (Cloud Functions). */
  const startCardPayment = async (pkg: GymPackage) => {
    if (!user) return;
    setPayPkg(null);
    setOnlineLoadingId(pkg.id);
    try {
      // Send ONLY packageId — price is always fetched authoritatively from Firestore on the server.
      const { sessionUrl } = await startOnlineCheckout({
        orderType: 'membership',
        packageId: pkg.id,
        customerName: profile?.displayName || user.displayName || 'Member',
        customerEmail: user.email || '',
        customerPhone: profile?.phone || 'On file',
        notes: `Online membership checkout: ${pkg.name}`,
      });
      window.location.href = sessionUrl;
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Online checkout could not start. Verify Cloud Functions deployment or use Join at Gym.',
        'error'
      );
    } finally {
      setOnlineLoadingId(null);
    }
  };

  /** "Pay Online" button: opens the payment-method chooser. */
  const handlePayOnline = (pkg: GymPackage) => {
    if (!user) {
      showToast('Please sign in first to pay online for a membership plan.', 'info');
      navigate('/login');
      return;
    }
    if (!cardEnabled && manualOptions.length === 0) {
      showToast(
        'Online payment is not available yet. Please choose Join at Gym to pay in person.',
        'info'
      );
      return;
    }
    setManualTid('');
    setManualSender('');
    setPayMode(cardEnabled ? 'card' : manualOptions[0].id);
    setPayPkg(pkg);
  };

  const selectedManual = manualOptions.find((o) => o.id === payMode);

  /** Records a membership order paid via Easypaisa / JazzCash / bank; staff verify the TID. */
  const submitManualPayment = async () => {
    if (!user || !payPkg || !selectedManual) return;
    const manualError = validateManualPayment(manualTid, manualSender);
    if (manualError) {
      showToast(manualError, 'error');
      return;
    }
    setManualSaving(true);
    try {
      await createOrder({
        userId: user.uid,
        customerName: profile?.displayName || user.displayName || 'Member',
        customerEmail: user.email || '',
        customerPhone: profile?.phone || 'On file',
        items: [
          {
            id: payPkg.id,
            name: `${payPkg.name} (${payPkg.billingCycle})`,
            price: payPkg.price,
            quantity: 1,
          },
        ],
        total: payPkg.price,
        paymentMethod: manualPaymentMethodLabel(selectedManual, manualTid, manualSender),
        orderType: 'membership',
        packageId: payPkg.id,
        notes: manualPaymentNote(selectedManual, manualTid, manualSender),
      });
      showToast(
        `Payment details received for ${payPkg.name}. We will verify your ${selectedManual.label} payment and activate your plan.`
      );
      setPayPkg(null);
      navigate('/member/orders');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to submit payment details.', 'error');
    } finally {
      setManualSaving(false);
    }
  };

  const chooserOptions = [
    ...(cardEnabled ? [{ id: 'card', label: 'Visa / Mastercard' }] : []),
    ...manualOptions.map((o) => ({ id: o.id, label: o.label })),
  ];

  return (
    <div className="container-club py-16 space-y-12">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Membership Tiers
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase text-white leading-none">
          Choose Your Training Plan
        </h1>
        <p className="text-neutral-400">
          Every membership includes locker room access, movement screening, and digital class
          reservations. Pay online for instant activation or choose Join at Gym to pay in person.
        </p>
      </div>

      {loading ? (
        <Loader label="Loading membership packages..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              loading={subscribingId === pkg.id}
              onlineLoading={onlineLoadingId === pkg.id}
              onSelect={handleJoinAtGym}
              onPayOnline={handlePayOnline}
            />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(payPkg)}
        onClose={() => setPayPkg(null)}
        title={payPkg ? `Pay for ${payPkg.name}` : 'Pay Online'}
        maxWidth="max-w-lg"
      >
        {payPkg ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-300">
              Total:{' '}
              <span className="font-mono font-bold text-white">
                {formatCurrency(payPkg.price, settings.currencySymbol)}
              </span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              {chooserOptions.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => setPayMode(choice.id)}
                  className={`min-h-[42px] px-3 rounded text-xs font-semibold border transition-colors ${
                    payMode === choice.id
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
                      : 'bg-[#0B0D0E] text-neutral-300 border-white/15'
                  }`}
                >
                  {choice.label}
                </button>
              ))}
            </div>

            {payMode === 'card' ? (
              <div className="space-y-3">
                <p className="text-sm text-neutral-400">
                  You will be redirected to a secure payment page to pay with your Visa or
                  Mastercard. Your plan activates automatically once payment is confirmed.
                </p>
                <Button fullWidth onClick={() => startCardPayment(payPkg)}>
                  Continue To Card Payment
                </Button>
              </div>
            ) : selectedManual ? (
              <div className="space-y-3">
                <ManualPaymentFields
                  option={selectedManual}
                  amount={payPkg.price}
                  tid={manualTid}
                  sender={manualSender}
                  onTidChange={setManualTid}
                  onSenderChange={setManualSender}
                />
                <Button fullWidth loading={manualSaving} onClick={submitManualPayment}>
                  Submit Payment Details
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
