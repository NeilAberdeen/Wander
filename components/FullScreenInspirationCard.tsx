"use client";

import { Heart, Info, Share2, SlidersHorizontal, X, Check } from "lucide-react";

export type FullScreenInspirationCardProps = {
  cardId: string;
  headline: string;
  destination: string;
  country: string;
  imageUrl: string;
  vibeTags: string[];
  priceFrom?: number | null;
  currency?: string;
  inventoryStatus: "available" | "idea_only" | "limited";
  onYes: () => void;
  onNo: () => void;
  onSave: () => void;
  onInfo: () => void;
  onRefine: () => void;
};

function StatusPill({ status }: { status: FullScreenInspirationCardProps["inventoryStatus"] }) {
  if (status === "idea_only") {
    return (
      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-secondary">
        Idea only
      </span>
    );
  }
  if (status === "limited") {
    return (
      <span className="rounded-full bg-warning/20 px-2.5 py-1 text-[11px] font-medium text-warning">
        Almost gone
      </span>
    );
  }
  return (
    <span className="rounded-full bg-positive/20 px-2.5 py-1 text-[11px] font-medium text-positive">
      Bookable now
    </span>
  );
}

export default function FullScreenInspirationCard(props: FullScreenInspirationCardProps) {
  const {
    headline,
    destination,
    country,
    imageUrl,
    vibeTags,
    priceFrom,
    currency = "GBP",
    inventoryStatus,
    onYes,
    onNo,
    onSave,
    onInfo,
    onRefine,
  } = props;

  return (
    <div className="relative h-full w-full shrink-0 snap-start overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={destination}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className="absolute inset-0 h-full w-full select-none object-cover [-webkit-user-drag:none]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/50" />

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
        <span className="text-lg font-extrabold tracking-tight">Wander</span>
        <button
          onClick={onRefine}
          aria-label="Refine"
          className="rounded-full bg-black/40 p-2 backdrop-blur-md"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* right action rail */}
      <div className="absolute right-3 bottom-40 flex flex-col items-center gap-5">
        <button onClick={onSave} aria-label="Save" className="flex flex-col items-center gap-1">
          <span className="rounded-full bg-black/40 p-3 backdrop-blur-md">
            <Heart size={20} />
          </span>
          <span className="text-[11px] text-secondary">Save</span>
        </button>
        <button onClick={onNo} aria-label="Not for me" className="flex flex-col items-center gap-1">
          <span className="rounded-full bg-black/40 p-3 backdrop-blur-md">
            <X size={20} />
          </span>
          <span className="text-[11px] text-secondary">Not for me</span>
        </button>
        <button onClick={onInfo} aria-label="Why this fits" className="flex flex-col items-center gap-1">
          <span className="rounded-full bg-black/40 p-3 backdrop-blur-md">
            <Info size={20} />
          </span>
          <span className="text-[11px] text-secondary">Why</span>
        </button>
        <button aria-label="Share" className="flex flex-col items-center gap-1">
          <span className="rounded-full bg-black/40 p-3 backdrop-blur-md">
            <Share2 size={20} />
          </span>
          <span className="text-[11px] text-secondary">Share</span>
        </button>
      </div>

      {/* bottom content */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
        <div className="mb-3">
          <StatusPill status={inventoryStatus} />
        </div>
        <h1 className="whitespace-pre-line text-3xl font-extrabold leading-tight">{headline}</h1>
        <p className="mt-2 text-base font-medium text-secondary">
          {destination}, {country}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {vibeTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white"
            >
              {tag}
            </span>
          ))}
        </div>

        {priceFrom != null && (
          <p className="mt-3 text-sm text-secondary">
            From <span className="font-semibold text-white">£{priceFrom}pp</span>
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onNo}
            className="flex-1 rounded-full border border-white/25 bg-white/5 py-3 text-base font-semibold"
          >
            No
          </button>
          <button
            onClick={onYes}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-accent py-3 text-base font-semibold"
          >
            <Check size={18} /> Yes
          </button>
        </div>
      </div>
    </div>
  );
}
