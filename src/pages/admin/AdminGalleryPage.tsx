/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminGalleryPage.tsx
 * Purpose: Admin gallery manager to upload and remove club photos.
 */

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import {
  createGalleryItem,
  deleteGalleryItem,
  getGalleryItems,
} from '../../services/galleryService';
import { gymConfig } from '../../config/gymConfig.js';
import { useSite } from '../../context/SiteContext';
import { GalleryItem } from '../../types/models';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ImageUpload } from '../../components/common/ImageUpload';
import { MediaFrame } from '../../components/common/MediaFrame';

export default function AdminGalleryPage() {
  const { showToast } = useSite();
  const { data: items, loading, refetch } = useFirestore(() => getGalleryItems(60), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: gymConfig.galleryCategories[0] || 'Strength Floor',
    imageUrl: '',
    caption: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) {
      showToast('Please upload an image or provide an image URL.', 'error');
      return;
    }
    setSaving(true);
    try {
      await createGalleryItem(form);
      showToast('Photo added to gallery.');
      setModalOpen(false);
      setForm({
        title: '',
        category: gymConfig.galleryCategories[0] || 'Strength Floor',
        imageUrl: '',
        caption: '',
      });
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!window.confirm(`Remove "${item.title}" from gallery?`)) return;
    try {
      await deleteGalleryItem(item.id);
      showToast('Photo removed.');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white">Gallery</h1>
          <p className="text-sm text-neutral-400">Upload and organize facility photography.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          <span>Add Photo</span>
        </Button>
      </div>

      {loading ? (
        <Loader label="Loading gallery..." />
      ) : items.length === 0 ? (
        <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No gallery items in Firestore yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg overflow-hidden bg-[#14171A] border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] bg-[#0B0D0E]">
                  <MediaFrame
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs text-[var(--accent)]">{item.category}</p>
                  <p className="font-display text-xl font-bold uppercase text-white">
                    {item.title}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <Button size="sm" variant="danger" onClick={() => handleDelete(item)}>
                  <Trash2 size={14} />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Gallery Photo">
        <form onSubmit={handleCreate} className="space-y-4">
          <ImageUpload
            label="Photo"
            value={form.imageUrl}
            onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
            folder="gallery"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Title</label>
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
                {gymConfig.galleryCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Caption (optional)</label>
            <input
              type="text"
              value={form.caption}
              onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))}
              className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Photo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
