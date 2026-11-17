/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminClassesPage.tsx
 * Purpose: Admin CRUD interface for weekly scheduled classes (Sun–Sat).
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import {
  createClass,
  deleteClass,
  getClasses,
  updateClass,
} from '../../services/classesService';
import { useSite } from '../../context/SiteContext';
import { ClassLevel, DayOfWeek, GymClass } from '../../types/models';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';

const DAYS: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMPTY_CLASS = {
  title: '',
  category: 'Fitness',
  trainerName: '',
  dayOfWeek: 'Mon' as DayOfWeek,
  startTime: '08:00',
  endTime: '09:00',
  level: 'Beginner' as ClassLevel,
  capacity: 20,
  room: 'Main Studio',
  description: '',
};

export default function AdminClassesPage() {
  const { settings, showToast } = useSite();
  const { data: classes, loading, refetch } = useFirestore(() => getClasses(100), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_CLASS);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_CLASS,
      category: settings.classCategories?.[0] || 'Fitness',
    });
    setModalOpen(true);
  };

  const openEdit = (cls: GymClass) => {
    setEditingId(cls.id);
    setForm({
      title: cls.title,
      category: cls.category,
      trainerName: cls.trainerName,
      dayOfWeek: cls.dayOfWeek,
      startTime: cls.startTime,
      endTime: cls.endTime,
      level: cls.level,
      capacity: cls.capacity,
      room: cls.room || 'Main Studio',
      description: cls.description || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateClass(editingId, form);
        showToast('Class updated.');
      } else {
        await createClass(form);
        showToast('Class created.');
      }
      setModalOpen(false);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cls: GymClass) => {
    if (!window.confirm(`Delete class "${cls.title}"?`)) return;
    try {
      await deleteClass(cls.id);
      showToast('Class deleted.');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white">Classes</h1>
          <p className="text-sm text-neutral-400">
            Manage weekly schedule sessions across Sun–Sat.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          <span>Add Class</span>
        </Button>
      </div>

      {loading ? (
        <Loader label="Loading classes..." />
      ) : classes.length === 0 ? (
        <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No classes scheduled in Firestore yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="p-5 rounded-lg bg-[#14171A] border border-white/10 flex flex-col justify-between gap-3"
            >
              <div>
                <p className="text-xs font-mono text-[var(--accent)] tabular-nums">
                  {cls.dayOfWeek} &middot; {cls.startTime} – {cls.endTime} &middot; {cls.level}
                </p>
                <h2 className="font-display text-2xl font-bold uppercase text-white mt-1">
                  {cls.title}
                </h2>
                <p className="text-xs text-neutral-400">
                  {cls.category} &middot; Coach {cls.trainerName} &middot; Cap {cls.capacity}
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <Button size="sm" variant="secondary" onClick={() => openEdit(cls)}>
                  <Edit2 size={14} />
                  <span>Edit</span>
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(cls)}>
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
        title={editingId ? 'Edit Class' : 'Add Scheduled Class'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Class Title</label>
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
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              >
                {(settings.classCategories || []).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Day</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dayOfWeek: e.target.value as DayOfWeek }))
                }
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">End Time</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Trainer Name</label>
              <input
                type="text"
                required
                value={form.trainerName}
                onChange={(e) => setForm((p) => ({ ...p, trainerName: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Level</label>
              <select
                value={form.level}
                onChange={(e) =>
                  setForm((p) => ({ ...p, level: e.target.value as ClassLevel }))
                }
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Capacity</label>
              <input
                type="number"
                required
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
              Save Class
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
