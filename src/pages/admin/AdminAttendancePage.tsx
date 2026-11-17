/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminAttendancePage.tsx
 * Purpose: Front-desk member check-in lookup by name/phone and full check-in history.
 */

import React, { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { getAllMembersAdmin } from '../../services/membersService';
import { checkInMember, getAllAttendanceAdmin } from '../../services/attendanceService';
import { useAuth } from '../../hooks/useAuth';
import { useSite } from '../../context/SiteContext';
import { MemberProfile } from '../../types/models';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { formatDate } from '../../utils/helpers';

export default function AdminAttendancePage() {
  const { user } = useAuth();
  const { showToast } = useSite();
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const { data: members } = useFirestore(() => getAllMembersAdmin(200), []);
  const {
    data: history,
    loading,
    refetch,
  } = useFirestore(() => getAllAttendanceAdmin(100), []);

  const matchedMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members.slice(0, 6);
    return members
      .filter(
        (m) =>
          m.displayName?.toLowerCase().includes(q) ||
          m.phone?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [members, search]);

  const handleCheckIn = async (member: MemberProfile) => {
    if (!user) return;
    const id = member.id || member.uid;
    setCheckingInId(id);
    try {
      await checkInMember({
        memberId: id,
        memberName: member.displayName,
        memberPhone: member.phone || '',
        checkedInBy: user.uid,
        notes,
      });
      setNotes('');
      showToast(`Checked in ${member.displayName}.`);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Check-in failed.', 'error');
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-extrabold uppercase text-white">Attendance</h1>
        <p className="text-sm text-neutral-400">
          Search a member by name or phone number to log front-desk check-ins.
        </p>
      </div>

      {/* Quick Check-In Desk */}
      <div className="p-6 rounded-lg bg-[#14171A] border border-white/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Find Member (Name / Phone)</label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type name or phone..."
              className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Optional Check-In Note</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Towel issued, Guest pass"
              className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>
        </div>

        <div className="divide-y divide-white/5 border border-white/10 rounded bg-[#0B0D0E]">
          {matchedMembers.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">No members match that search.</p>
          ) : (
            matchedMembers.map((m) => (
              <div
                key={m.id || m.uid}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{m.displayName}</p>
                  <p className="text-xs text-neutral-400">
                    {m.phone || m.email} &middot; Plan: {m.planName || 'None'} ({m.membershipStatus})
                  </p>
                </div>
                <Button
                  size="sm"
                  loading={checkingInId === (m.id || m.uid)}
                  onClick={() => handleCheckIn(m)}
                >
                  <CheckCircle2 size={15} />
                  <span>Check In</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* History */}
      <div className="rounded-lg bg-[#14171A] border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            Check-In History
          </h2>
        </div>

        {loading ? (
          <Loader label="Loading check-in history..." />
        ) : history.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-400">No check-ins recorded yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {history.map((rec) => (
              <div
                key={rec.id}
                className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{rec.memberName}</p>
                  <p className="text-xs text-neutral-400">
                    {rec.memberPhone || 'No phone'}
                    {rec.notes ? ` · ${rec.notes}` : ''}
                  </p>
                </div>
                <span className="font-mono text-xs tabular-nums text-[var(--accent)]">
                  {formatDate(rec.checkInTime)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
