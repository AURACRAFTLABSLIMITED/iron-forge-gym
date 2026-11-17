/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/sections/HeroSlider.tsx
 * Purpose: Auto-playing, swipe-enabled, arrow-controlled hero carousel reading slides from
 *          SiteSettings / gymConfig.js. Respects prefers-reduced-motion.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { MediaFrame } from '../common/MediaFrame';
import styles from './HeroSlider.module.css';

export function HeroSlider() {
  const { settings } = useSite();
  const slides = settings.heroSlides?.length ? settings.heroSlides : [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;
  const activeSlide = slides[index % Math.max(1, count)];

  const goNext = useCallback(() => {
    if (count <= 1) return;
    setIndex((prev) => (prev + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    setIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [count, paused, goNext]);

  if (!activeSlide) return null;

  return (
    <section
      className={styles.slider}
      aria-label="Featured programs"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (delta > 45) goPrev();
        else if (delta < -45) goNext();
        touchStartX.current = null;
      }}
    >
      <MediaFrame
        src={activeSlide.imageUrl}
        alt={activeSlide.title}
        loading="eager"
        className={styles.slideImage}
      />
      <div className={styles.scrim} />

      <div className={`container-club ${styles.content}`}>
        <div className="max-w-2xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {activeSlide.eyebrow}
          </p>
          <h1 className={styles.headline}>{activeSlide.title}</h1>
          <p className="text-base sm:text-lg text-neutral-300 max-w-xl leading-relaxed">
            {activeSlide.subtitle}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              to={activeSlide.ctaLink || '/packages'}
              className="inline-flex items-center gap-2 min-h-[48px] px-7 rounded font-semibold text-sm uppercase tracking-wider transition-all hover:brightness-110"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
            >
              <span>{activeSlide.ctaLabel || 'Join Now'}</span>
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/schedule"
              className="inline-flex items-center min-h-[48px] px-6 rounded border border-white/25 text-sm font-semibold uppercase tracking-wider text-white hover:border-[var(--accent)] transition-colors"
            >
              Class Timetable
            </Link>
          </div>
        </div>
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-black/50 border border-white/15 text-white hover:border-[var(--accent)] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-black/50 border border-white/15 text-white hover:border-[var(--accent)] transition-colors"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5">
            {slides.map((s, i) => (
              <button
                key={s.id || i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index % count ? 'w-8 bg-[var(--accent)]' : 'w-3 bg-white/35 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
