"use client";

import { X } from "lucide-react";
import { InspirationCard } from "@/lib/types";

export default function InfoSheet({
  card,
  onClose,
}: {
  card: InspirationCard;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl bg-[#0B0E17] px-5 pb-8 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-secondary">Why this might fit</p>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="text-lg font-bold">
          {card.destination_name}, {card.country}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {card.vibe_tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-secondary">
          {card.inventory_status === "idea_only"
            ? "This is an inspirational idea — it isn't currently available to book from this provider."
            : "This matches the mood you've been leaning towards in your swipes."}
        </p>

        {card.inventory_status !== "idea_only" && card.lowest_price_pp != null && (
          <p className="mt-2 text-sm text-white">
            From <span className="font-semibold">£{card.lowest_price_pp}pp</span> — best matches we can
            currently offer.
          </p>
        )}
      </div>
    </div>
  );
}
