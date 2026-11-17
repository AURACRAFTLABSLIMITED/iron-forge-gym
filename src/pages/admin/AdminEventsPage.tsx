/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminEventsPage.tsx
 * Purpose: Admin CRUD interface for upcoming gym events, competitions, and clinics.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import {
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
} from '../../services/eventsService';
import { useSite } from '../../context/SiteContext';
import { GymEvent } from '../../types/models';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ImageUpload } from '../../components/common/ImageUpload';

const EMPTY_EVENT = {
  title: '',
  date: '',
  time: '09:00 AM',
  location: 'Main Strength Floor',
  category: 'Competition',
  description: '',
  imageUrl: '',
  price: 0,
  capacity: 40,
};

export default function AdminEventsPage() {
  const { showToast } = useSite();
  const { data: events, loading, refetch } = useFirestore(() => getEvents(40), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_EVENT);
    setModalOpen(true);
  };

  const openEdit = (evt: GymEvent) => {
    setEditingId(evt.id);
    setForm({
      title: evt.title,
      date: evt.date,
      time: evt.time,
      location: evt.location,
      category: evt.category,
      description: evt.description,
      imageUrl: evt.imageUrl || '',
      price: evt.price || 0,
      capacity: evt.capacity || 40,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateEvent(editingId, form);
        showToast('Event updated.');
      } else {
        await createEvent(form);
        showToast('Event created.');
      }
      setModalOpen(false);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (evt: GymEvent) => {
    if (!window.confirm(`Delete event "${evt.title}"?`)) return;
    try {
      await deleteEvent(evt.id);
      showToast('Event deleted.');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white">Events</h1>
          <p className="text-sm text-neutral-400">Manage workshops, meets, and club clinics.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          <span>Add Event</span>
        </Button>
      </div>

      {loading ? (
        <Loader label="Loading events..." />
      ) : events.length === 0 ? (
        <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No events in Firestore yet.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-5 rounded-lg bg-[#14171A] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-xs font-mono text-[var(--accent)] tabular-nums">
                  {evt.date} &middot; {evt.time} &middot; {evt.location}
                </p>
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  {evt.title}
                </h2>
                <p className="text-xs text-neutral-400 line-clamp-1">{evt.description}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="secondary" onClick={() => openEdit(evt)}>
                  <Edit2 size={14} />
                  <span>Edit</span>
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(evt)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Event' : 'New Event'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <ImageUpload
            label="Event Banner Image"
            value={form.imageUrl}
            onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
            folder="events"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Event Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Category</label>
              <input
                type="text"
                required
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Time</label>
              <input
                type="text"
                required
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Location</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Entry Price (0 for free)</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full p-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
