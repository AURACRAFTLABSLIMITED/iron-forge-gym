/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/EventsPage.tsx
 * Purpose: Upcoming club events, seminars, and competitions with detail modal.
 */

import React, { useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { getEvents } from '../../services/eventsService';
import { sampleEvents } from '../../utils/seedData.js';
import { useSite } from '../../context/SiteContext';
import { GymEvent } from '../../types/models';
import { MediaFrame } from '../../components/common/MediaFrame';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';

export default function EventsPage() {
  const { settings } = useSite();
  const { data: events, loading } = useFirestore(() => getEvents(30), sampleEvents);
  const [selectedEvent, setSelectedEvent] = useState<GymEvent | null>(null);

  return (
    <div className="container-club py-16 space-y-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Community &amp; Clinics
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase text-white leading-none">
          Upcoming Events
        </h1>
        <p className="text-neutral-400">
          In-house lifting meets, technical workshops, and community training mornings.
        </p>
      </div>

      {loading ? (
        <Loader label="Loading events..." />
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No upcoming events scheduled right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => (
            <article
              key={evt.id}
              className="rounded-lg overflow-hidden bg-[#14171A] border border-white/10 flex flex-col"
            >
              <div className="aspect-[16/9] overflow-hidden bg-[#0B0D0E]">
                <MediaFrame
                  src={evt.imageUrl}
                  alt={evt.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[var(--accent)] font-medium">
                    <span>{evt.category}</span>
                    <span className="font-mono tabular-nums">
                      {evt.price && evt.price > 0
                        ? `${formatCurrency(evt.price, settings.currencySymbol)} Entry`
                        : 'Free For Members'}
                    </span>
                  </div>

                  <h2 className="font-display text-3xl font-bold uppercase text-white">
                    {evt.title}
                  </h2>

                  <div className="flex flex-wrap gap-4 text-xs text-neutral-400 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} className="text-[var(--accent)]" />
                      {evt.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} className="text-[var(--accent)]" />
                      {evt.time}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-sans">
                      <MapPin size={14} className="text-[var(--accent)]" />
                      {evt.location}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-300 line-clamp-3 pt-1">{evt.description}</p>
                </div>

                <div className="pt-4">
                  <Button variant="secondary" onClick={() => setSelectedEvent(evt)}>
                    View Event Details
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
      >
        {selectedEvent ? (
          <div className="space-y-5">
            {selectedEvent.imageUrl ? (
              <div className="aspect-[16/9] rounded overflow-hidden border border-white/10">
                <MediaFrame
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded bg-[#0B0D0E] border border-white/10 text-xs">
              <div>
                <p className="text-neutral-500">Date</p>
                <p className="text-white font-mono tabular-nums mt-0.5">{selectedEvent.date}</p>
              </div>
              <div>
                <p className="text-neutral-500">Time</p>
                <p className="text-white font-mono tabular-nums mt-0.5">{selectedEvent.time}</p>
              </div>
              <div>
                <p className="text-neutral-500">Location</p>
                <p className="text-white mt-0.5">{selectedEvent.location}</p>
              </div>
              <div>
                <p className="text-neutral-500">Capacity</p>
                <p className="text-white font-mono tabular-nums mt-0.5">
                  {selectedEvent.capacity || 40} spots
                </p>
              </div>
            </div>

            <p className="text-sm text-neutral-200 leading-relaxed">{selectedEvent.description}</p>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
              <Link
                to="/contact"
                className="inline-flex items-center min-h-[44px] px-5 rounded font-semibold text-sm"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
              >
                RSVP At Front Desk
              </Link>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
