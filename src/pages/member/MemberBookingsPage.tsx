/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/member/MemberBookingsPage.tsx
 * Purpose: Lists the signed-in member's class reservations with cancellation support.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFirestore } from '../../hooks/useFirestore';
import { cancelBooking, getMemberBookings } from '../../services/classesService';
import { useSite } from '../../context/SiteContext';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';

export default function MemberBookingsPage() {
  const { user } = useAuth();
  const { showToast } = useSite();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const {
    data: bookings,
    loading,
    refetch,
  } = useFirestore(
    () => (user ? getMemberBookings(user.uid) : Promise.resolve([])),
    [],
    Boolean(user)
  );

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      showToast('Class booking cancelled.');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to cancel booking.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <Loader label="Loading your bookings..." />;

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 space-y-4">
          <p className="text-neutral-400">You have not booked any classes yet.</p>
          <Link
            to="/schedule"
            className="inline-flex items-center min-h-[44px] px-5 rounded font-semibold text-sm"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
          >
            Browse Weekly Schedule
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-lg bg-[#14171A] border border-white/10 flex flex-col justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-[var(--accent)] tabular-nums">
                    {b.dayOfWeek} &middot; {b.startTime}
                  </span>
                  <span
                    className={`uppercase font-semibold ${
                      b.status === 'confirmed' ? 'text-emerald-400' : 'text-neutral-500'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  {b.classTitle}
                </h2>
                <p className="text-xs text-neutral-400">Coach: {b.trainerName || 'Club Staff'}</p>
              </div>

              {b.status === 'confirmed' ? (
                <Button
                  variant="danger"
                  size="sm"
                  loading={cancellingId === b.id}
                  onClick={() => handleCancel(b.id)}
                >
                  Cancel Reservation
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
