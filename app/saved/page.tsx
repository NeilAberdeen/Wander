"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { getInspirationCards, useTravelStore } from "@/lib/store";

export default function SavedPage() {
  const router = useRouter();
  const cards = useMemo(() => getInspirationCards(), []);
  const savedCardIds = useTravelStore((s) => s.savedCardIds);
  const saved = cards.filter((c) => savedCardIds.includes(c.card_id));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-5">
        <h1 className="text-2xl font-extrabold">Saved</h1>
        <p className="mt-1 text-sm text-secondary">Ideas you've hearted along the way.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {saved.length === 0 && (
          <p className="text-sm text-secondary">
            Nothing saved yet — tap the heart on a card in For You to keep it here.
          </p>
        )}

        <div className="space-y-3 pb-4">
          {saved.map((card) => (
            <div
              key={card.card_id}
              className="flex items-center gap-3 overflow-hidden rounded-xl2 border border-white/10 bg-white/[0.03]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.media_url} alt={card.destination_name} className="h-20 w-20 object-cover" />
              <div className="flex-1 py-2 pr-3">
                <p className="whitespace-pre-line text-sm font-semibold leading-tight">{card.headline}</p>
                <p className="mt-1 text-xs text-secondary">
                  {card.destination_name}, {card.country}
                </p>
                <p className="mt-1 text-xs">
                  {card.inventory_status === "idea_only" ? (
                    <span className="text-secondary">Idea only</span>
                  ) : (
                    <span className="text-positive">From £{card.lowest_price_pp}pp</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {saved.length > 0 && (
          <button
            onClick={() => router.push("/refine")}
            className="w-full rounded-full bg-accent py-3 text-sm font-semibold"
          >
            Turn these into real trips
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
