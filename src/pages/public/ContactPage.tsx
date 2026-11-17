/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/ContactPage.tsx
 * Purpose: Public contact form saving inquiries to Firestore plus club details and map embed.
 */

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { submitContactMessage } from '../../services/contactService';
import { validateContactForm } from '../../utils/validators';
import { Button } from '../../components/common/Button';

export default function ContactPage() {
  const { settings, showToast } = useSite();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateContactForm(form);
    if (error) {
      showToast(error, 'error');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage(form);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setSent(true);
      showToast('Message received. Our club team will respond shortly.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to send message.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-club py-16 space-y-12">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Get In Touch
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase text-white leading-none">
          Contact The Club
        </h1>
        <p className="text-neutral-400">
          Book a facility walkthrough, ask about corporate memberships, or connect with a coach.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 p-6 sm:p-8 rounded-lg bg-[#14171A] border border-white/10 space-y-4"
        >
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            Send A Message
          </h2>

          {sent ? (
            <div className="p-4 rounded bg-[var(--accent)]/10 border border-[var(--accent)]/40 text-sm text-white">
              Thank you for reaching out. Your inquiry has been logged for our team.
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Subject</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Message</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              className="w-full p-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <Button type="submit" loading={submitting} size="lg">
            Send Inquiry
          </Button>
        </form>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-lg bg-[#14171A] border border-white/10 space-y-4 text-sm">
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Club Information
            </h2>
            <div className="flex items-start gap-3 text-neutral-300">
              <MapPin size={18} className="text-[var(--accent)] mt-0.5 shrink-0" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
              <Phone size={18} className="text-[var(--accent)] shrink-0" />
              <span className="font-mono tabular-nums">{settings.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
              <Mail size={18} className="text-[var(--accent)] shrink-0" />
              <span>{settings.email}</span>
            </div>
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Clock size={16} className="text-[var(--accent)]" />
                <span>Operating Hours</span>
              </div>
              {settings.workingHours?.map((row, idx) => (
                <div key={idx} className="flex justify-between text-xs text-neutral-400">
                  <span>{row.day}</span>
                  <span className="font-mono tabular-nums">{row.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {settings.mapEmbedUrl ? (
            <div className="rounded-lg overflow-hidden border border-white/10 h-64 bg-[#14171A]">
              <iframe
                title={`${settings.gymName} Location Map`}
                src={settings.mapEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
