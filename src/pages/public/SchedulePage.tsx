/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/SchedulePage.tsx
 * Purpose: Full Sun–Sat weekly class schedule with category filters and member booking.
 */

import React, { useMemo } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import { getClasses, getMemberBookings } from '../../services/classesService';
import { sampleClasses } from '../../utils/seedData.js';
import { useAuth } from '../../hooks/useAuth';
import { ScheduleCalendar } from '../../components/sections/ScheduleCalendar';
import { Loader } from '../../components/common/Loader';

export default function SchedulePage() {
  const { user } = useAuth();
  const {
    data: classes,
    loading,
    usingFallback,
  } = useFirestore(() => getClasses(100), sampleClasses);

  const { data: myBookings, refetch: refetchBookings } = useFirestore(
    () => (user ? getMemberBookings(user.uid) : Promise.resolve([])),
    [],
    Boolean(user)
  );

  const bookedClassIds = useMemo(() => {
    const ids = new Set<string>();
    myBookings.forEach((b) => {
      if (b.status === 'confirmed') ids.add(b.classId);
    });
    return ids;
  }, [myBookings]);

  return (
    <div className="container-club py-16 space-y-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Weekly Timetable
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase text-white leading-none">
          Class Schedule
        </h1>
        <p className="text-neutral-400">
          Filter by discipline to plan your training week. Signed-in members can reserve a spot
          with one click and manage reservations in their Member Portal.
        </p>
      </div>

      {loading ? (
        <Loader label="Loading class schedule..." />
      ) : (
        <ScheduleCalendar
          classes={classes}
          bookedClassIds={bookedClassIds}
          usingFallback={usingFallback}
          onBooked={() => refetchBookings()}
        />
      )}
    </div>
  );
}
