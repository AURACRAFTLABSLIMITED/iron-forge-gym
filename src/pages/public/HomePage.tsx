/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/HomePage.tsx
 * Purpose: Primary landing page featuring HeroSlider, opening hours strip, featured packages,
 *          class highlights, coaching team, testimonials, BMI calculator, blog posts, and newsletter.
 */

import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Phone } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { useAuth } from '../../hooks/useAuth';
import { useFirestore } from '../../hooks/useFirestore';
import { getPackages } from '../../services/packagesService';
import { getClasses } from '../../services/classesService';
import { getTrainers } from '../../services/trainersService';
import { getPublishedPosts } from '../../services/blogService';
import { createOrder } from '../../services/shopService';
import {
  sampleClasses,
  samplePackages,
  samplePosts,
  sampleTrainers,
} from '../../utils/seedData.js';
import { HeroSlider } from '../../components/sections/HeroSlider';
import { PackageCard } from '../../components/sections/PackageCard';
import { BMICalculator } from '../../components/sections/BMICalculator';
import { NewsletterSignup } from '../../components/sections/NewsletterSignup';
import { MediaFrame } from '../../components/common/MediaFrame';
import { GymPackage } from '../../types/models';
import { formatDate } from '../../utils/helpers';

const TESTIMONIALS = [
  {
    name: 'Hannah Lindqvist',
    role: 'Member · 14 Months',
    outcome: 'Added 45 kg to her deadlift and dropped 11% body fat',
    quote:
      'Before joining I spun my wheels on random gym routines. The structured 12-week barbell blocks and coach feedback made every session measurable.',
  },
  {
    name: 'Devon Alverez',
    role: 'Unlimited Classes Member',
    outcome: 'Completed first half-marathon while maintaining squat PRs',
    quote:
      'Combining Tuesday hypertrophy work with Thursday conditioning sessions built an aerobic engine without sacrificing strength.',
  },
  {
    name: 'Priya Nair',
    role: 'Morning Club Athlete',
    outcome: 'Eliminated chronic lower-back stiffness within 8 weeks',
    quote:
      'The Sunday mobility classes and clean 6 AM floor setup turned training into the most reliable hour of my workday.',
  },
];

export default function HomePage() {
  const { settings, showToast } = useSite();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  const { data: packages } = useFirestore(() => getPackages(6), samplePackages);
  const { data: classes } = useFirestore(() => getClasses(20), sampleClasses);
  const { data: trainers } = useFirestore(() => getTrainers(6), sampleTrainers);
  const { data: posts } = useFirestore(() => getPublishedPosts(6), samplePosts);

  const featuredPackages = useMemo(() => packages.slice(0, 3), [packages]);
  const classHighlights = useMemo(() => classes.slice(0, 4), [classes]);
  const featuredTrainers = useMemo(() => trainers.slice(0, 3), [trainers]);
  const latestPosts = useMemo(() => posts.slice(0, 3), [posts]);

  const handleSelectPackage = async (pkg: GymPackage) => {
    if (!user) {
      showToast('Sign in or create an account to subscribe to a membership.', 'info');
      navigate('/login');
      return;
    }
    setSubscribingId(pkg.id);
    try {
      await createOrder({
        userId: user.uid,
        customerName: profile?.displayName || user.displayName || 'Member',
        customerEmail: user.email || '',
        customerPhone: profile?.phone || 'On file',
        items: [{ id: pkg.id, name: `${pkg.name} (${pkg.billingCycle})`, price: pkg.price, quantity: 1 }],
        total: pkg.price,
        paymentMethod: 'Pay at gym / Front desk activation',
        orderType: 'membership',
        notes: `Membership subscription request for ${pkg.durationDays} days`,
      });
      showToast(`Subscription request submitted for ${pkg.name}. View status in your Member Portal.`);
      navigate('/member/orders');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to submit subscription.', 'error');
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <div>
      <HeroSlider />

      {/* Working Hours & Club Strip */}
      <section className="bg-[#14171A] border-b border-white/10">
        <div className="container-club py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <Clock size={20} className="text-[var(--accent)] mt-0.5 shrink-0" />
            <div>
              <h2 className="font-display text-lg font-bold uppercase text-white">
                Club Hours
              </h2>
              <p className="text-sm text-neutral-400 font-mono tabular-nums">
                {settings.workingHours?.[0]?.day}: {settings.workingHours?.[0]?.hours}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <MapPin size={20} className="text-[var(--accent)] mt-0.5 shrink-0" />
            <div>
              <h2 className="font-display text-lg font-bold uppercase text-white">
                Location
              </h2>
              <p className="text-sm text-neutral-400">{settings.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <Phone size={20} className="text-[var(--accent)] mt-0.5 shrink-0" />
            <div>
              <h2 className="font-display text-lg font-bold uppercase text-white">
                Front Desk
              </h2>
              <p className="text-sm text-neutral-400 font-mono tabular-nums">
                {settings.phone} &middot; {settings.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Membership Packages */}
      <section className="container-club py-20 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Memberships
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold uppercase text-white mt-1">
              Transparent Training Plans
            </h2>
          </div>
          <Link
            to="/packages"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline whitespace-nowrap"
          >
            <span>Compare All Packages</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              loading={subscribingId === pkg.id}
              onSelect={handleSelectPackage}
            />
          ))}
        </div>
      </section>

      {/* Class Highlights */}
      <section className="bg-[#101214] border-y border-white/10 py-20">
        <div className="container-club space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Coached Sessions
              </p>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold uppercase text-white mt-1">
                Weekly Class Highlights
              </h2>
            </div>
            <Link
              to="/schedule"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline whitespace-nowrap"
            >
              <span>Full Weekly Timetable</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {classHighlights.map((cls) => (
              <div
                key={cls.id}
                className="p-6 rounded-lg bg-[#14171A] border border-white/10 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-mono text-[var(--accent)] tabular-nums">
                      {cls.dayOfWeek} &middot; {cls.startTime}
                    </span>
                    <span>{cls.level}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold uppercase text-white leading-tight">
                    {cls.title}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {cls.category} &middot; {cls.trainerName}
                  </p>
                  <p className="text-sm text-neutral-300 line-clamp-3 pt-1">
                    {cls.description}
                  </p>
                </div>
                <Link
                  to="/schedule"
                  className="text-xs font-semibold uppercase tracking-wider text-white hover:text-[var(--accent)] inline-flex items-center gap-1"
                >
                  <span>Reserve Spot</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching Team */}
      <section className="container-club py-20 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Coaching Staff
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold uppercase text-white mt-1">
              Led By Career Specialists
            </h2>
          </div>
          <Link
            to="/trainers"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline whitespace-nowrap"
          >
            <span>Meet All Trainers</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredTrainers.map((trainer) => (
            <article
              key={trainer.id}
              className="rounded-lg overflow-hidden bg-[#14171A] border border-white/10 flex flex-col"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#0B0D0E]">
                <MediaFrame
                  src={trainer.photoUrl}
                  alt={trainer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-2 flex-1">
                <p className="text-xs text-[var(--accent)] font-medium">
                  {trainer.specialty}
                  {trainer.experienceYears ? ` · ${trainer.experienceYears} yrs exp` : ''}
                </p>
                <h3 className="font-display text-2xl font-bold uppercase text-white">
                  {trainer.name}
                </h3>
                <p className="text-xs text-neutral-400">{trainer.role}</p>
                <p className="text-sm text-neutral-300 pt-2 line-clamp-3">{trainer.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#101214] border-y border-white/10 py-20">
        <div className="container-club space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Member Proof
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold uppercase text-white mt-1">
              Measured Results On The Floor
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((item) => (
              <blockquote
                key={item.name}
                className="p-6 rounded-lg bg-[#14171A] border border-white/10 flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[var(--accent)]">
                    {item.outcome}
                  </p>
                  <p className="text-sm text-neutral-200 leading-relaxed">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>
                <footer className="pt-4 border-t border-white/10">
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-neutral-400">{item.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* BMI Calculator */}
      <section className="container-club py-20">
        <BMICalculator />
      </section>

      {/* Latest Blog Posts */}
      <section className="container-club pb-20 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Training Journal
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold uppercase text-white mt-1">
              Latest Articles
            </h2>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline whitespace-nowrap"
          >
            <span>Read All Posts</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latestPosts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug || post.id}`}
              className="group rounded-lg overflow-hidden bg-[#14171A] border border-white/10 hover:border-[var(--accent)] transition-colors flex flex-col"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[#0B0D0E]">
                <MediaFrame
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <div className="p-6 space-y-2.5 flex-1">
                <p className="text-xs text-neutral-400">
                  {post.category} &middot; {post.readTime || '4 min read'}
                  {post.createdAt ? ` · ${formatDate(post.createdAt)}` : ''}
                </p>
                <h3 className="font-display text-2xl font-bold uppercase text-white group-hover:text-[var(--accent)] transition-colors leading-tight">
                  {post.title}
                </h3>
                <p className="text-sm text-neutral-400 line-clamp-2">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <NewsletterSignup />
    </div>
  );
}
