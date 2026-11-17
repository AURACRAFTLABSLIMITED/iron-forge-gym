/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/TrainersPage.tsx
 * Purpose: Displays full coaching team profiles from Firestore.
 */

import React from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import { getTrainers } from '../../services/trainersService';
import { sampleTrainers } from '../../utils/seedData.js';
import { MediaFrame } from '../../components/common/MediaFrame';
import { Loader } from '../../components/common/Loader';

export default function TrainersPage() {
  const { data: trainers, loading } = useFirestore(() => getTrainers(40), sampleTrainers);

  return (
    <div className="container-club py-16 space-y-12">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Performance Coaches
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase text-white leading-none">
          Meet The Coaching Team
        </h1>
        <p className="text-neutral-400">
          Certified specialists across barbell strength, boxing conditioning, and athletic recovery.
        </p>
      </div>

      {loading ? (
        <Loader label="Loading coaches..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer) => (
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
              <div className="p-6 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--accent)]">
                    {trainer.specialty}
                    {trainer.experienceYears ? ` · ${trainer.experienceYears} years` : ''}
                  </p>
                  <h2 className="font-display text-3xl font-bold uppercase text-white">
                    {trainer.name}
                  </h2>
                  <p className="text-xs text-neutral-400">{trainer.role}</p>
                  <p className="text-sm text-neutral-300 leading-relaxed pt-1">{trainer.bio}</p>
                </div>
                {trainer.certifications ? (
                  <p className="text-xs text-neutral-400 pt-4 border-t border-white/10">
                    {trainer.certifications}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
