/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/GalleryPage.tsx
 * Purpose: Masonry facility photo gallery with category filtering and fullscreen lightbox viewer.
 */

import React, { useMemo, useState } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import { getGalleryItems } from '../../services/galleryService';
import { sampleGallery } from '../../utils/seedData.js';
import { gymConfig } from '../../config/gymConfig.js';
import { GalleryItem } from '../../types/models';
import { MediaFrame } from '../../components/common/MediaFrame';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';

export default function GalleryPage() {
  const { data: items, loading } = useFirestore(() => getGalleryItems(60), sampleGallery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>(['All', ...gymConfig.galleryCategories]);
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  return (
    <div className="container-club py-16 space-y-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Inside The Club
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase text-white leading-none">
          Facility Gallery
        </h1>
        <p className="text-neutral-400">
          Tour our strength floor, conditioning bays, and recovery spaces.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`min-h-[40px] px-4 rounded text-xs font-semibold uppercase tracking-wider border transition-colors ${
              selectedCategory === cat
                ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
                : 'bg-[#14171A] text-neutral-300 border-white/10 hover:border-white/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader label="Loading gallery..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No photos in this category yet.
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxItem(item)}
              className="group w-full break-inside-avoid rounded-lg overflow-hidden bg-[#14171A] border border-white/10 hover:border-[var(--accent)] transition-colors text-left block"
            >
              <div className="overflow-hidden">
                <MediaFrame
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-[var(--accent)]">{item.category}</p>
                <p className="font-display text-xl font-bold uppercase text-white mt-0.5">
                  {item.title}
                </p>
                {item.caption ? (
                  <p className="text-xs text-neutral-400 mt-1">{item.caption}</p>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(lightboxItem)}
        onClose={() => setLightboxItem(null)}
        title={lightboxItem?.title}
        maxWidth="max-w-4xl"
      >
        {lightboxItem ? (
          <div className="space-y-4">
            <div className="rounded overflow-hidden border border-white/10 bg-black">
              <MediaFrame
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                className="w-full max-h-[70vh] object-contain"
              />
            </div>
            <p className="text-xs text-[var(--accent)]">{lightboxItem.category}</p>
            {lightboxItem.caption ? (
              <p className="text-sm text-neutral-300">{lightboxItem.caption}</p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
