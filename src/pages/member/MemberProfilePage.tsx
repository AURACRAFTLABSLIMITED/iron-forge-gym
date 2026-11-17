/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/member/MemberProfilePage.tsx
 * Purpose: Member profile editor allowing name, phone, emergency contact, and photo upload.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateOwnProfile } from '../../services/authService';
import { useSite } from '../../context/SiteContext';
import { ImageUpload } from '../../components/common/ImageUpload';
import { Button } from '../../components/common/Button';

export default function MemberProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useSite();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    photoURL: '',
    emergencyContact: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || '',
        phone: profile.phone || '',
        photoURL: profile.photoURL || '',
        emergencyContact: profile.emergencyContact || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateOwnProfile(user.uid, form);
      await refreshProfile();
      showToast('Profile updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl p-6 sm:p-8 rounded-lg bg-[#14171A] border border-white/10 space-y-5"
    >
      <h2 className="font-display text-2xl font-bold uppercase text-white">
        Personal Information
      </h2>

      {user ? (
        <ImageUpload
          label="Profile Photo"
          value={form.photoURL}
          onChange={(url) => setForm((p) => ({ ...p, photoURL: url }))}
          folder={`avatars/${user.uid}`}
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Full Name</label>
          <input
            type="text"
            required
            value={form.displayName}
            onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
            className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Phone Number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1.5">
          Emergency Contact (Name &amp; Phone)
        </label>
        <input
          type="text"
          value={form.emergencyContact}
          onChange={(e) => setForm((p) => ({ ...p, emergencyContact: e.target.value }))}
          placeholder="e.g. Ali Khan · 03XX XXXXXXX"
          className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
        />
      </div>

      <Button type="submit" loading={saving}>
        Save Changes
      </Button>
    </form>
  );
}
