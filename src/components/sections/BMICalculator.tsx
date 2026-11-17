/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/sections/BMICalculator.tsx
 * Purpose: Interactive Body Mass Index calculator supporting Metric (cm/kg) and Imperial (ft/in/lbs)
 *          with clear category reference table.
 */

import React, { useState } from 'react';
import { Button } from '../common/Button';

interface BMIResult {
  score: number;
  category: string;
}

export function BMICalculator() {
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [heightCm, setHeightCm] = useState('178');
  const [weightKg, setWeightKg] = useState('78');
  const [heightFeet, setHeightFeet] = useState('5');
  const [heightInches, setHeightInches] = useState('10');
  const [weightLbs, setWeightLbs] = useState('172');
  const [result, setResult] = useState<BMIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let bmi = 0;
    if (unit === 'metric') {
      const h = Number(heightCm) / 100;
      const w = Number(weightKg);
      if (!h || h <= 0.5 || !w || w <= 20) {
        setError('Enter valid height (cm) and weight (kg).');
        return;
      }
      bmi = w / (h * h);
    } else {
      const totalInches = Number(heightFeet) * 12 + Number(heightInches);
      const w = Number(weightLbs);
      if (!totalInches || totalInches <= 24 || !w || w <= 45) {
        setError('Enter valid height (ft/in) and weight (lbs).');
        return;
      }
      bmi = (w / (totalInches * totalInches)) * 703;
    }

    const rounded = Math.round(bmi * 10) / 10;
    let category = 'Healthy Weight';
    if (rounded < 18.5) category = 'Underweight';
    else if (rounded >= 25 && rounded < 30) category = 'Overweight';
    else if (rounded >= 30) category = 'Obese';

    setResult({ score: rounded, category });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-[#14171A] border border-white/10 rounded-lg p-6 sm:p-10">
      <div className="lg:col-span-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Baseline Assessment
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white mt-1">
              Calculate Your BMI
            </h2>
          </div>

          <div className="inline-flex rounded bg-[#0B0D0E] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setUnit('metric')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                unit === 'metric'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Metric
            </button>
            <button
              type="button"
              onClick={() => setUnit('imperial')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                unit === 'imperial'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Imperial
            </button>
          </div>
        </div>

        <form onSubmit={calculate} className="space-y-4">
          {unit === 'metric' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-white font-mono tabular-nums focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-white font-mono tabular-nums focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Height (ft)</label>
                <input
                  type="number"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-white font-mono tabular-nums focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Inches</label>
                <input
                  type="number"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-white font-mono tabular-nums focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Weight (lbs)</label>
                <input
                  type="number"
                  value={weightLbs}
                  onChange={(e) => setWeightLbs(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-white font-mono tabular-nums focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>
          )}

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Button type="submit">Calculate BMI</Button>
            {result ? (
              <div className="text-sm text-white">
                Result:{' '}
                <span className="font-mono font-bold text-lg tabular-nums text-[var(--accent)]">
                  {result.score}
                </span>{' '}
                <span className="text-neutral-300">&middot; {result.category}</span>
              </div>
            ) : null}
          </div>
        </form>
      </div>

      {/* Reference Table */}
      <div className="lg:col-span-5 bg-[#0B0D0E] border border-white/10 rounded-md p-5 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white mb-3">
            BMI Reference Chart
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-neutral-500">
                <th className="py-2">Range</th>
                <th className="py-2 text-right">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-300">
              <tr>
                <td className="py-2.5 font-mono tabular-nums">Below 18.5</td>
                <td className="py-2.5 text-right">Underweight</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono tabular-nums text-[var(--accent)]">18.5 – 24.9</td>
                <td className="py-2.5 text-right text-white font-medium">Healthy Weight</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono tabular-nums">25.0 – 29.9</td>
                <td className="py-2.5 text-right">Overweight</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono tabular-nums">30.0 &amp; Above</td>
                <td className="py-2.5 text-right">Obese</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-neutral-500 mt-4">
          Note: Muscular athletes may register higher BMI despite low body-fat percentages.
        </p>
      </div>
    </div>
  );
}
