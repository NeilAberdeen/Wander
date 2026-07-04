"use client";

import { Heart } from "lucide-react";

export type TripRecommendationCardProps = {
  packageId: string;
  destination: string;
  country: string;
  imageUrl: string;
  description: string;
  pricePp: number;
  currency: string;
  nights: number;
  departureDate: string;
  returnDate: string;
  departureAirport: string;
  flightDurationMinutes: number;
  matchReasons: string[];
  tradeOffs: string[];
  availabilityStatus: "available" | "limited" | "sold_out";
  roomsRemaining?: number;
  rank?: number;
  priceUpdatedNote?: string | null;
  onViewTrip: () => void;
  onSave: () => void;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatFlight(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function AvailabilityBadge({ status, roomsRemaining }: { status: string; roomsRemaining?: number }) {
  if (status === "sold_out") {
    return <span className="text-xs font-medium text-secondary">Sold out</span>;
  }
  if (status === "limited") {
    return (
      <span className="text-xs font-medium text-warning">
        {roomsRemaining ? `Only ${roomsRemaining} rooms left` : "Limited availability"}
      </span>
    );
  }
  return <span className="text-xs font-medium text-positive">Available</span>;
}

export default function TripRecommendationCard(props: TripRecommendationCardProps) {
  const {
    rank,
    destination,
    country,
    imageUrl,
    description,
    pricePp,
    nights,
    departureDate,
    returnDate,
    departureAirport,
    flightDurationMinutes,
    matchReasons,
    tradeOffs,
    availabilityStatus,
    roomsRemaining,
    priceUpdatedNote,
    onViewTrip,
    onSave,
  } = props;

  return (
    <div className="overflow-hidden rounded-xl2 border border-white/10 bg-white/[0.03]">
      <div className="relative h-44 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={destination} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {rank === 1 && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold">
            Top match
          </span>
        )}
        <button
          onClick={onSave}
          aria-label="Save trip"
          className="absolute right-3 top-3 rounded-full bg-black/40 p-2 backdrop-blur-md"
        >
          <Heart size={16} />
        </button>
        <div className="absolute inset-x-3 bottom-3">
          <p className="text-lg font-bold leading-tight">
            {destination}, {country}
          </p>
          <p className="text-sm text-secondary">{description}</p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
          <span>
            {nights} nights · {formatDate(departureDate)}–{formatDate(returnDate)}
          </span>
          <span>·</span>
          <span>
            {departureAirport} · {formatFlight(flightDurationMinutes)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-extrabold">£{pricePp}</span>
            <span className="text-sm text-secondary">pp</span>
          </div>
          <AvailabilityBadge status={availabilityStatus} roomsRemaining={roomsRemaining} />
        </div>

        {priceUpdatedNote && (
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">{priceUpdatedNote}</p>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Why it fits</p>
          <p className="mt-1 text-sm text-white">{matchReasons.join(", ")}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Trade-off</p>
          <p className="mt-1 text-sm text-secondary">{tradeOffs.join(" ")}</p>
        </div>

        <button
          onClick={onViewTrip}
          disabled={availabilityStatus === "sold_out"}
          className="mt-1 w-full rounded-full bg-accent py-3 text-sm font-semibold disabled:bg-white/10 disabled:text-secondary"
        >
          {availabilityStatus === "sold_out" ? "Sold out" : "View trip"}
        </button>
      </div>
    </div>
  );
}
