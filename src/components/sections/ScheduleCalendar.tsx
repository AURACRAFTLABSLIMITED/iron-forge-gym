/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/sections/ScheduleCalendar.tsx
 * Purpose: Interactive Sun–Sat weekly class timetable with category filters, level metadata,
 *          mobile day-by-day tabs, and member class booking support.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayOfWeek, GymClass } from '../../types/models';
import { useSite } from '../../context/SiteContext';
import { useAuth } from '../../hooks/useAuth';
import { bookClass } from '../../services/classesService';
import { Button } from '../common/Button';
import styles from './ScheduleCalendar.module.css';

const DAYS: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ScheduleCalendarProps {
  classes: GymClass[];
  bookedClassIds?: Set<string>;
  usingFallback?: boolean;
  onBooked?: (classId: string) => void;
}

export function ScheduleCalendar({
  classes,
  bookedClassIds = new Set(),
  usingFallback = false,
  onBooked,
}: ScheduleCalendarProps) {
  const { settings, showToast } = useSite();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [mobileDay, setMobileDay] = useState<DayOfWeek>('Mon');
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Merge configured categories with any custom categories present on Firestore class docs
  const categories = useMemo(() => {
    const base = new Set<string>(settings.classCategories || []);
    classes.forEach((c) => {
      if (c.category) base.add(c.category);
    });
    return ['All', ...Array.from(base)];
  }, [settings.classCategories, classes]);

  const filteredClasses = useMemo(() => {
    if (selectedCategory === 'All') return classes;
    return classes.filter((c) => c.category === selectedCategory);
  }, [classes, selectedCategory]);

  const classesByDay = useMemo(() => {
    const map: Record<DayOfWeek, GymClass[]> = {
      Sun: [],
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
    };
    filteredClasses.forEach((cls) => {
      if (map[cls.dayOfWeek]) {
        map[cls.dayOfWeek].push(cls);
      }
    });
    DAYS.forEach((day) => {
      map[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [filteredClasses]);

  const handleBook = async (gymClass: GymClass) => {
    if (!user) {
      showToast('Please sign in to reserve a spot in this class.', 'info');
      navigate('/login');
      return;
    }
    if (usingFallback) {
      showToast(
        'Demo timetable shown. Ask an admin to seed classes in /admin before booking.',
        'info'
      );
      return;
    }
    setBookingId(gymClass.id);
    try {
      await bookClass({
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Member',
        userEmail: user.email || '',
        gymClass,
      });
      showToast(`Spot reserved for ${gymClass.title} (${gymClass.dayOfWeek} ${gymClass.startTime}).`);
      onBooked?.(gymClass.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to book class.', 'error');
    } finally {
      setBookingId(null);
    }
  };

  const renderClassCard = (cls: GymClass) => {
    const isBooked = bookedClassIds.has(cls.id);
    return (
      <div key={cls.id} className={styles.classCard}>
        <div className="flex items-center justify-between gap-2 text-xs text-neutral-400">
          <span className="font-mono tabular-nums text-[var(--accent)] font-medium">
            {cls.startTime} – {cls.endTime}
          </span>
          <span>{cls.level}</span>
        </div>

        <h4 className="font-display text-lg font-bold uppercase tracking-wide text-white leading-tight">
          {cls.title}
        </h4>

        <p className="text-xs text-neutral-400">
          {cls.category} &middot; {cls.trainerName}
        </p>

        <div className="pt-2 mt-auto">
          <Button
            size="sm"
            variant={isBooked ? 'secondary' : 'primary'}
            fullWidth
            disabled={isBooked}
            loading={bookingId === cls.id}
            onClick={() => handleBook(cls)}
          >
            {isBooked ? 'Booked' : 'Book Class'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Category Filter Bar */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Filter classes by category"
      >
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[40px] px-4 rounded text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors border ${
                active
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
                  : 'bg-[#14171A] text-neutral-300 border-white/10 hover:border-white/30'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Mobile Day Tabs (< 1024px) */}
      <div className="lg:hidden space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {DAYS.map((day) => {
            const active = mobileDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setMobileDay(day)}
                className={`min-h-[44px] px-4 rounded text-xs font-bold uppercase tracking-wider shrink-0 transition-colors border ${
                  active
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
                    : 'bg-[#14171A] text-neutral-300 border-white/10'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {classesByDay[mobileDay].length === 0 ? (
            <div className="p-8 text-center rounded-lg bg-[#14171A] border border-white/10 text-sm text-neutral-400">
              No {selectedCategory !== 'All' ? selectedCategory : ''} classes scheduled on {mobileDay}.
            </div>
          ) : (
            classesByDay[mobileDay].map(renderClassCard)
          )}
        </div>
      </div>

      {/* Desktop 7-Day Sun-Sat Grid (>= 1024px) */}
      <div className={styles.grid}>
        {DAYS.map((day) => (
          <div key={day} className={styles.dayColumn}>
            <div className={styles.dayHeader}>{day}</div>
            <div className="p-2.5 space-y-2.5 flex-1">
              {classesByDay[day].length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-8">Rest / Open Gym</p>
              ) : (
                classesByDay[day].map(renderClassCard)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
