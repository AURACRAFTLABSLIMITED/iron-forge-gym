/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminBlogPage.tsx
 * Purpose: Admin CRUD interface for authoring, publishing, editing, and deleting blog posts.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import {
  createPost,
  deletePost,
  getAllPostsAdmin,
  updatePost,
} from '../../services/blogService';
import { useSite } from '../../context/SiteContext';
import { BlogPost } from '../../types/models';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ImageUpload } from '../../components/common/ImageUpload';
import { slugify } from '../../utils/helpers';

const EMPTY_POST = {
  title: '',
  slug: '',
  category: 'Strength',
  excerpt: '',
  content: '',
  authorName: 'Coaching Staff',
  coverImage: '',
  readTime: '4 min read',
  published: true,
};

export default function AdminBlogPage() {
  const { showToast } = useSite();
  const { data: posts, loading, refetch } = useFirestore(() => getAllPostsAdmin(60), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_POST);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_POST);
    setModalOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt,
      content: post.content,
      authorName: post.authorName,
      coverImage: post.coverImage || '',
      readTime: post.readTime || '4 min read',
      published: post.published,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
    };
    try {
      if (editingId) {
        await updatePost(editingId, payload);
        showToast('Article updated.');
      } else {
        await createPost(payload);
        showToast('Article published.');
      }
      setModalOpen(false);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Delete post "${post.title}"?`)) return;
    try {
      await deletePost(post.id);
      showToast('Post deleted.');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white">Blog Posts</h1>
          <p className="text-sm text-neutral-400">Write and manage club training articles.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          <span>New Article</span>
        </Button>
      </div>

      {loading ? (
        <Loader label="Loading posts..." />
      ) : posts.length === 0 ? (
        <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No blog posts in Firestore yet.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-lg bg-[#14171A] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-xs text-[var(--accent)]">
                  {post.category} &middot; {post.published ? 'Published' : 'Draft'} &middot;{' '}
                  {post.authorName}
                </p>
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  {post.title}
                </h2>
                <p className="text-xs text-neutral-400 line-clamp-1">{post.excerpt}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="secondary" onClick={() => openEdit(post)}>
                  <Edit2 size={14} />
                  <span>Edit</span>
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(post)}>
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
        title={editingId ? 'Edit Article' : 'Write Article'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <ImageUpload
            label="Cover Image"
            value={form.coverImage}
            onChange={(url) => setForm((p) => ({ ...p, coverImage: url }))}
            folder="posts"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    title: e.target.value,
                    slug: slugify(e.target.value),
                  }))
                }
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Author</label>
              <input
                type="text"
                required
                value={form.authorName}
                onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Read Time</label>
              <input
                type="text"
                value={form.readTime}
                onChange={(e) => setForm((p) => ({ ...p, readTime: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-200 pt-5">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
              />
              <span>Published</span>
            </label>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Excerpt</label>
            <textarea
              required
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
              className="w-full p-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Full Article Content</label>
            <textarea
              required
              rows={7}
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              className="w-full p-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Post
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
