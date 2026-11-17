/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/BlogPostPage.tsx
 * Purpose: Single blog article reader page fetching by Firestore ID or URL slug.
 */

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getPostByIdOrSlug } from '../../services/blogService';
import { samplePosts } from '../../utils/seedData.js';
import { BlogPost } from '../../types/models';
import { MediaFrame } from '../../components/common/MediaFrame';
import { Loader } from '../../components/common/Loader';
import { formatDate } from '../../utils/helpers';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        const found = await getPostByIdOrSlug(slug);
        if (active) {
          if (found) {
            setPost(found);
          } else {
            const fallback = samplePosts.find((p) => p.slug === slug || p.id === slug) || null;
            setPost(fallback as BlogPost | null);
          }
        }
      } catch {
        const fallback = samplePosts.find((p) => p.slug === slug || p.id === slug) || null;
        if (active) setPost(fallback as BlogPost | null);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <Loader fullScreen label="Loading article..." />;

  if (!post) {
    return (
      <div className="container-club py-24 text-center space-y-4">
        <h1 className="font-display text-4xl font-bold uppercase text-white">Article Not Found</h1>
        <Link to="/blog" className="text-[var(--accent)] hover:underline text-sm">
          Return to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="container-club py-14 max-w-4xl space-y-8">
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-[var(--accent)]"
      >
        <ArrowLeft size={16} />
        <span>Back to Blog</span>
      </Link>

      <header className="space-y-4">
        <p className="text-xs font-medium text-[var(--accent)]">
          {post.category} &middot; {post.readTime || '4 min read'}
          {post.createdAt ? ` · ${formatDate(post.createdAt)}` : ''}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold uppercase text-white leading-tight">
          {post.title}
        </h1>
        <p className="text-sm text-neutral-400">Written by {post.authorName}</p>
      </header>

      {post.coverImage ? (
        <div className="aspect-[16/9] rounded-lg overflow-hidden border border-white/10">
          <MediaFrame
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

      <div className="space-y-5 text-neutral-200 leading-relaxed text-base sm:text-lg">
        {post.content.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  );
}
