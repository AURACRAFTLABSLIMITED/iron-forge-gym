/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminTrainersPage.tsx
 * Purpose: Admin CRUD interface for trainer and coaching staff profiles with photo upload.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import {
  createTrainer,
  deleteTrainer,
  getTrainers,
  updateTrainer,
} from '../../services/trainersService';
import { useSite } from '../../context/SiteContext';
import { Trainer } from '../../types/models';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ImageUpload } from '../../components/common/ImageUpload';
import { MediaFrame } from '../../components/common/MediaFrame';

const EMPTY_TRAINER = {
  name: '',
  role: '',
  specialty: '',
  experienceYears: 5,
  bio: '',
  photoUrl: '',
  certifications: '',
  instagram: '',
};

export default function AdminTrainersPage() {
  const { showToast } = useSite();
  const { data: trainers, loading, refetch } = useFirestore(() => getTrainers(40), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_TRAINER);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_TRAINER);
    setModalOpen(true);
  };

  const openEdit = (t: Trainer) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      role: t.role,
      specialty: t.specialty,
      experienceYears: t.experienceYears || 5,
      bio: t.bio,
      photoUrl: t.photoUrl || '',
      certifications: t.certifications || '',
      instagram: t.instagram || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateTrainer(editingId, form);
        showToast('Trainer updated.');
      } else {
        await createTrainer(form);
        showToast('Trainer added.');
      }
      setModalOpen(false);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: Trainer) => {
    if (!window.confirm(`Remove trainer "${t.name}"?`)) return;
    try {
      await deleteTrainer(t.id);
      showToast('Trainer deleted.');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white">Trainers</h1>
          <p className="text-sm text-neutral-400">Manage coach profiles and certifications.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          <span>Add Trainer</span>
        </Button>
      </div>

      {loading ? (
        <Loader label="Loading trainers..." />
      ) : trainers.length === 0 ? (
        <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No trainers in Firestore yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {trainers.map((t) => (
            <div
              key={t.id}
              className="rounded-lg overflow-hidden bg-[#14171A] border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] bg-[#0B0D0E]">
                  <MediaFrame src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-xs text-[var(--accent)]">{t.specialty}</p>
                  <h2 className="font-display text-2xl font-bold uppercase text-white">{t.name}</h2>
                  <p className="text-xs text-neutral-400">{t.role}</p>
                </div>
              </div>
              <div className="p-4 pt-0 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>
                  <Edit2 size={14} />
                  <span>Edit</span>
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(t)}>
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
        title={editingId ? 'Edit Trainer' : 'Add Trainer'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <ImageUpload
            label="Trainer Photo"
            value={form.photoUrl}
            onChange={(url) => setForm((p) => ({ ...p, photoUrl: url }))}
            folder="trainers"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Role / Title</label>
              <input
                type="text"
                required
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Specialty</label>
              <input
                type="text"
                required
                value={form.specialty}
                onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Years Experience</label>
              <input
                type="number"
                min={0}
                value={form.experienceYears}
                onChange={(e) =>
                  setForm((p) => ({ ...p, experienceYears: Number(e.target.value) }))
                }
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Certifications</label>
            <input
              type="text"
              value={form.certifications}
              onChange={(e) => setForm((p) => ({ ...p, certifications: e.target.value }))}
              placeholder="e.g. CSCS · USAW Level 2"
              className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Bio</label>
            <textarea
              required
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              className="w-full p-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Trainer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
