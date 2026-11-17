/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/member/MemberDashboard.tsx
 * Purpose: Member overview showing active membership plan, expiry date, days remaining,
 *          and recent front-desk check-in attendance logs.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFirestore } from '../../hooks/useFirestore';
import { getMemberAttendance } from '../../services/attendanceService';
import { getMemberBookings } from '../../services/classesService';
import { formatDate, getDaysRemaining } from '../../utils/helpers';
import { Loader } from '../../components/common/Loader';

export default function MemberDashboard() {
  const { user, profile } = useAuth();
  const daysLeft = getDaysRemaining(profile?.planExpiryDate);

  const { data: attendance, loading: attLoading } = useFirestore(
    () => (user ? getMemberAttendance(user.uid) : Promise.resolve([])),
    [],
    Boolean(user)
  );

  const { data: bookings } = useFirestore(
    () => (user ? getMemberBookings(user.uid) : Promise.resolve([])),
    [],
    Boolean(user)
  );

  const activeBookingsCount = bookings.filter((b) => b.status === 'confirmed').length;

  return (
    <div className="space-y-8">
      {/* Membership KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg bg-[#14171A] border border-white/10 space-y-1">
          <p className="text-xs text-neutral-400">Active Plan</p>
          <p className="font-display text-2xl font-bold uppercase text-white">
            {profile?.planName || 'No Active Plan'}
          </p>
          <p className="text-xs text-[var(--accent)] capitalize">
            Status: {profile?.membershipStatus || 'none'}
          </p>
        </div>

        <div className="p-5 rounded-lg bg-[#14171A] border border-white/10 space-y-1">
          <p className="text-xs text-neutral-400">Expiry Date</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-white">
            {profile?.planExpiryDate || '—'}
          </p>
          <p className="text-xs text-neutral-500">
            {profile?.planStartDate ? `Started ${profile.planStartDate}` : 'Subscribe to activate'}
          </p>
        </div>

        <div className="p-5 rounded-lg bg-[#14171A] border border-white/10 space-y-1">
          <p className="text-xs text-neutral-400">Days Remaining</p>
          <p className="font-mono text-3xl font-bold tabular-nums text-[var(--accent)]">
            {daysLeft}
          </p>
          <Link to="/packages" className="text-xs text-neutral-300 hover:underline inline-block">
            Browse Plans &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-lg bg-[#14171A] border border-white/10 space-y-1">
          <p className="text-xs text-neutral-400">Confirmed Classes</p>
          <p className="font-mono text-3xl font-bold tabular-nums text-white">
            {activeBookingsCount}
          </p>
          <Link to="/schedule" className="text-xs text-neutral-300 hover:underline inline-block">
            Book Next Class &rarr;
          </Link>
        </div>
      </div>

      {/* Recent Attendance History */}
      <section className="rounded-lg bg-[#14171A] border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            Recent Club Check-Ins
          </h2>
          <span className="text-xs font-mono tabular-nums text-neutral-400">
            {attendance.length} visits logged
          </span>
        </div>

        {attLoading ? (
          <Loader label="Loading attendance history..." />
        ) : attendance.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400">
            No club check-ins recorded yet. Check in at the front desk on your next visit.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {attendance.slice(0, 10).map((rec) => (
              <div
                key={rec.id}
                className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
              >
                <div>
                  <p className="font-medium text-white">Club Floor Check-In</p>
                  {rec.notes ? <p className="text-xs text-neutral-400">{rec.notes}</p> : null}
                </div>
                <span className="font-mono text-xs tabular-nums text-[var(--accent)]">
                  {formatDate(rec.checkInTime)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
