"use client";

import { useTravelStore } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import { Mood } from "@/lib/types";

const MOOD_LABELS: Record<Mood, string> = {
  adventure: "Adventure",
  relaxation: "Relaxation",
  culture: "Culture",
  food: "Food",
  nightlife: "Nightlife",
  romance: "Romance",
  wellness: "Wellness",
};

export default function ProfilePage() {
  const profile = useTravelStore((s) => s.profile);
  const intent = useTravelStore((s) => s.intent);
  const swipeCount = useTravelStore((s) => s.swipeCount);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-5">
        <h1 className="text-2xl font-extrabold">Profile</h1>
        <p className="mt-1 text-sm text-secondary">{swipeCount} swipes so far.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Your taste</p>
        <div className="mt-3 space-y-3">
          {(Object.keys(profile.moods) as Mood[]).map((mood) => (
            <div key={mood}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{MOOD_LABELS[mood]}</span>
                <span className="text-secondary">{Math.round(profile.moods[mood] * 100)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${profile.moods[mood] * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {profile.positive_signals.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">You like</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.positive_signals.map((s) => (
                <span key={s} className="rounded-full bg-positive/10 px-3 py-1 text-xs text-positive">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.negative_signals.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Avoiding</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.negative_signals.map((s) => (
                <span key={s} className="rounded-full bg-white/10 px-3 py-1 text-xs text-secondary">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Structured intent</p>
          <p className="mt-2 text-sm leading-relaxed text-secondary">{intent.summary}</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
