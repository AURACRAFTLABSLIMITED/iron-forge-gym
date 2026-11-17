/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/BlogPage.tsx
 * Purpose: Public blog article listing with category filter.
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFirestore } from '../../hooks/useFirestore';
import { getPublishedPosts } from '../../services/blogService';
import { samplePosts } from '../../utils/seedData.js';
import { MediaFrame } from '../../components/common/MediaFrame';
import { Loader } from '../../components/common/Loader';
import { formatDate } from '../../utils/helpers';

export default function BlogPage() {
  const { data: posts, loading } = useFirestore(() => getPublishedPosts(30), samplePosts);
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [posts]);

  const filtered = useMemo(() => {
    if (category === 'All') return posts;
    return posts.filter((p) => p.category === category);
  }, [posts, category]);

  return (
    <div className="container-club py-16 space-y-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Training Journal
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase text-white leading-none">
          Strength &amp; Conditioning Blog
        </h1>
        <p className="text-neutral-400">
          Programming guides, nutrition strategies, and recovery insights written by our coaching staff.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`min-h-[40px] px-4 rounded text-xs font-semibold uppercase tracking-wider border transition-colors ${
              category === cat
                ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
                : 'bg-[#14171A] text-neutral-300 border-white/10 hover:border-white/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader label="Loading articles..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No published posts found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug || post.id}`}
              className="group rounded-lg overflow-hidden bg-[#14171A] border border-white/10 hover:border-[var(--accent)] transition-colors flex flex-col"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[#0B0D0E]">
                <MediaFrame
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                />
              </div>
              <div className="p-6 space-y-2.5 flex-1">
                <p className="text-xs text-neutral-400">
                  {post.category} &middot; {post.readTime || '4 min read'}
                  {post.createdAt ? ` · ${formatDate(post.createdAt)}` : ''}
                </p>
                <h2 className="font-display text-2xl font-bold uppercase text-white group-hover:text-[var(--accent)] leading-tight">
                  {post.title}
                </h2>
                <p className="text-sm text-neutral-400 line-clamp-3">{post.excerpt}</p>
                <p className="text-xs text-neutral-500 pt-2">By {post.authorName}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
