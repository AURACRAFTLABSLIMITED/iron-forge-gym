/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminPackagesPage.tsx
 * Purpose: Admin CRUD interface for membership pricing packages.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import {
  createPackage,
  deletePackage,
  getPackages,
  updatePackage,
} from '../../services/packagesService';
import { useSite } from '../../context/SiteContext';
import { GymPackage } from '../../types/models';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { formatCurrency } from '../../utils/helpers';

const EMPTY_PKG = {
  name: '',
  audience: '',
  price: 99,
  billingCycle: 'Monthly' as GymPackage['billingCycle'],
  durationDays: 30,
  badgeText: '',
  featured: false,
  description: '',
  featuresText: 'Full access to strength floor\nLocker room & showers',
};

export default function AdminPackagesPage() {
  const { settings, showToast } = useSite();
  const { data: packages, loading, refetch } = useFirestore(() => getPackages(30), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PKG);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_PKG);
    setModalOpen(true);
  };

  const openEdit = (pkg: GymPackage) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      audience: pkg.audience || '',
      price: pkg.price,
      billingCycle: pkg.billingCycle,
      durationDays: pkg.durationDays,
      badgeText: pkg.badgeText || '',
      featured: Boolean(pkg.featured),
      description: pkg.description || '',
      featuresText: (pkg.features || []).join('\n'),
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      audience: form.audience,
      price: Number(form.price) || 0,
      billingCycle: form.billingCycle,
      durationDays: Number(form.durationDays) || 30,
      badgeText: form.badgeText,
      featured: form.featured,
      description: form.description,
      features: form.featuresText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editingId) {
        await updatePackage(editingId, payload);
        showToast('Package updated.');
      } else {
        await createPackage(payload);
        showToast('Package created.');
      }
      setModalOpen(false);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkg: GymPackage) => {
    if (!window.confirm(`Delete package "${pkg.name}"?`)) return;
    try {
      await deletePackage(pkg.id);
      showToast('Package deleted.');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white">Packages</h1>
          <p className="text-sm text-neutral-400">Create and edit membership pricing tiers.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          <span>Add Package</span>
        </Button>
      </div>

      {loading ? (
        <Loader label="Loading packages..." />
      ) : packages.length === 0 ? (
        <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No packages in Firestore yet. Click &ldquo;Add Package&rdquo; or seed sample catalog from
          the Dashboard.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-5 rounded-lg bg-[#14171A] border border-white/10 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">{pkg.billingCycle}</span>
                  {pkg.badgeText ? (
                    <span className="text-[var(--accent)] font-semibold">{pkg.badgeText}</span>
                  ) : null}
                </div>
                <h2 className="font-display text-2xl font-bold uppercase text-white mt-1">
                  {pkg.name}
                </h2>
                <p className="font-mono text-2xl font-bold text-[var(--accent)] tabular-nums mt-1">
                  {formatCurrency(pkg.price, settings.currencySymbol)}
                </p>
                <p className="text-xs text-neutral-400 mt-1">{pkg.durationDays} days duration</p>
              </div>
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <Button size="sm" variant="secondary" onClick={() => openEdit(pkg)}>
                  <Edit2 size={14} />
                  <span>Edit</span>
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(pkg)}>
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
        title={editingId ? 'Edit Package' : 'New Package'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Package Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Target Audience</label>
              <input
                type="text"
                value={form.audience}
                onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}
                placeholder="e.g. For athletes training with coaches"
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Price</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Billing Cycle</label>
              <select
                value={form.billingCycle}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    billingCycle: e.target.value as GymPackage['billingCycle'],
                  }))
                }
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
                <option value="Day Pass">Day Pass</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Duration (Days)</label>
              <input
                type="number"
                required
                min={1}
                value={form.durationDays}
                onChange={(e) => setForm((p) => ({ ...p, durationDays: Number(e.target.value) }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Offer Label (optional)</label>
              <input
                type="text"
                value={form.badgeText}
                onChange={(e) => setForm((p) => ({ ...p, badgeText: e.target.value }))}
                placeholder="e.g. Offer · Save 15%"
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-200 pt-5">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
              />
              <span>Highlight as Featured Plan</span>
            </label>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full p-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              Included Features (one per line)
            </label>
            <textarea
              rows={4}
              value={form.featuresText}
              onChange={(e) => setForm((p) => ({ ...p, featuresText: e.target.value }))}
              className="w-full p-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Package
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
