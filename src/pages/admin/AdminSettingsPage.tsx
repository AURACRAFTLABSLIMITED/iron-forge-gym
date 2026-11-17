/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminSettingsPage.tsx
 * Purpose: Live white-label Site Settings editor (branding, accent color, working hours,
 *          class categories, and hero slider slides) saved directly to Firestore.
 */

import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { saveSiteSettings } from '../../services/settingsService';
import { SiteSettings } from '../../types/models';
import { Button } from '../../components/common/Button';
import { ImageUpload } from '../../components/common/ImageUpload';
import { applyThemeAccent } from '../../config/theme.js';

export default function AdminSettingsPage() {
  const { settings, showToast } = useSite();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [categoriesText, setCategoriesText] = useState(
    (settings.classCategories || []).join(', ')
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
    setCategoriesText((settings.classCategories || []).join(', '));
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const parsedCategories = categoriesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: SiteSettings = {
      ...form,
      classCategories: parsedCategories.length ? parsedCategories : settings.classCategories,
    };

    try {
      await saveSiteSettings(payload);
      applyThemeAccent(payload.accentColor);
      showToast('Site settings saved to Firestore.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateSlide = (idx: number, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  };

  const addSlide = () => {
    setForm((prev) => ({
      ...prev,
      heroSlides: [
        ...prev.heroSlides,
        {
          id: `slide-${Date.now()}`,
          eyebrow: 'Performance Club',
          title: 'Train With Structure',
          subtitle: 'Coached strength and conditioning programs.',
          ctaLabel: 'Join Now',
          ctaLink: '/packages',
          imageUrl: prev.heroSlides[0]?.imageUrl || '',
        },
      ],
    }));
  };

  const removeSlide = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.filter((_, i) => i !== idx),
    }));
  };

  const updateHour = (idx: number, field: 'day' | 'hours', value: string) => {
    setForm((prev) => ({
      ...prev,
      workingHours: prev.workingHours.map((h, i) => (i === idx ? { ...h, [field]: value } : h)),
    }));
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white">
            Site Settings
          </h1>
          <p className="text-sm text-neutral-400">
            Rebrand gym identity, theme accent color, hours, categories, and hero slides live.
          </p>
        </div>
        <Button type="submit" loading={saving}>
          Save All Settings
        </Button>
      </div>

      {/* Brand Identity */}
      <section className="p-6 rounded-lg bg-[#14171A] border border-white/10 space-y-4">
        <h2 className="font-display text-2xl font-bold uppercase text-white">
          Branding &amp; Theme
        </h2>

        <ImageUpload
          label="Logo Image (optional — leave blank for wordmark)"
          value={form.logoUrl || ''}
          onChange={(url) => setForm((p) => ({ ...p, logoUrl: url }))}
          folder="branding"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Gym Name</label>
            <input
              type="text"
              required
              value={form.gymName}
              onChange={(e) => setForm((p) => ({ ...p, gymName: e.target.value }))}
              className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Accent Color (Hex)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((p) => ({ ...p, accentColor: val }));
                  applyThemeAccent(val);
                }}
                className="w-12 h-[42px] p-1 rounded bg-[#0B0D0E] border border-white/15 cursor-pointer"
              />
              <input
                type="text"
                value={form.accentColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((p) => ({ ...p, accentColor: val }));
                  applyThemeAccent(val);
                }}
                className="flex-1 min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm font-mono text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Currency Symbol</label>
            <input
              type="text"
              required
              value={form.currencySymbol}
              onChange={(e) => setForm((p) => ({ ...p, currencySymbol: e.target.value }))}
              className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
              className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              Payment Provider Mode
            </label>
            <select
              value={form.paymentProvider || 'cash'}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  paymentProvider: e.target.value as 'cash' | 'stripe' | 'custom',
                }))
              }
              className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            >
              <option value="cash">Cash / Pay at Gym (No Cloud Functions needed)</option>
              <option value="stripe">Stripe Checkout (not available in Pakistan)</option>
              <option value="custom">Safepay Card Gateway - Visa/Mastercard (Requires Cloud Functions)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1">
            Schedule Class Categories (comma-separated)
          </label>
          <input
            type="text"
            value={categoriesText}
            onChange={(e) => setCategoriesText(e.target.value)}
            className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
          />
        </div>
      </section>

      {/* Contact & Working Hours */}
      <section className="p-6 rounded-lg bg-[#14171A] border border-white/10 space-y-4">
        <h2 className="font-display text-2xl font-bold uppercase text-white">
          Contact &amp; Operating Hours
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Google Maps Embed URL</label>
            <input
              type="text"
              value={form.mapEmbedUrl}
              onChange={(e) => setForm((p) => ({ ...p, mapEmbedUrl: e.target.value }))}
              className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium text-neutral-300">Working Hours Rows</p>
          {form.workingHours.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={row.day}
                onChange={(e) => updateHour(idx, 'day', e.target.value)}
                className="min-h-[40px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
              <input
                type="text"
                value={row.hours}
                onChange={(e) => updateHour(idx, 'hours', e.target.value)}
                className="min-h-[40px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Hero Slides */}
      <section className="p-6 rounded-lg bg-[#14171A] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase text-white">Hero Slides</h2>
          <Button type="button" size="sm" variant="secondary" onClick={addSlide}>
            <Plus size={14} />
            <span>Add Slide</span>
          </Button>
        </div>

        <div className="space-y-6">
          {form.heroSlides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className="p-4 rounded bg-[#0B0D0E] border border-white/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-[var(--accent)]">
                  Slide {idx + 1}
                </span>
                {form.heroSlides.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeSlide(idx)}
                    className="text-red-400 hover:text-red-300 text-xs inline-flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                ) : null}
              </div>

              <ImageUpload
                label="Slide Background Image"
                value={slide.imageUrl}
                onChange={(url) => updateSlide(idx, 'imageUrl', url)}
                folder="branding"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={slide.eyebrow}
                  onChange={(e) => updateSlide(idx, 'eyebrow', e.target.value)}
                  placeholder="Eyebrow"
                  className="min-h-[40px] px-3 rounded bg-[#14171A] border border-white/15 text-sm text-white"
                />
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => updateSlide(idx, 'title', e.target.value)}
                  placeholder="Headline"
                  className="min-h-[40px] px-3 rounded bg-[#14171A] border border-white/15 text-sm text-white"
                />
              </div>
              <input
                type="text"
                value={slide.subtitle}
                onChange={(e) => updateSlide(idx, 'subtitle', e.target.value)}
                placeholder="Subtitle"
                className="w-full min-h-[40px] px-3 rounded bg-[#14171A] border border-white/15 text-sm text-white"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={slide.ctaLabel}
                  onChange={(e) => updateSlide(idx, 'ctaLabel', e.target.value)}
                  placeholder="CTA Label"
                  className="min-h-[40px] px-3 rounded bg-[#14171A] border border-white/15 text-sm text-white"
                />
                <input
                  type="text"
                  value={slide.ctaLink}
                  onChange={(e) => updateSlide(idx, 'ctaLink', e.target.value)}
                  placeholder="CTA Path (e.g. /packages)"
                  className="min-h-[40px] px-3 rounded bg-[#14171A] border border-white/15 text-sm text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
