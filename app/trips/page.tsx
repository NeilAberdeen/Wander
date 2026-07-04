"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TripRecommendationCard from "@/components/TripRecommendationCard";
import { getPackageById } from "@/lib/mockInventory";
import { noInventoryMatchMessage } from "@/lib/mockLLM";
import { closestAvailable } from "@/lib/ranking";
import { useTravelStore } from "@/lib/store";

export default function TripsPage() {
  const router = useRouter();
  const intent = useTravelStore((s) => s.intent);
  const recommendations = useTravelStore((s) => s.recommendations);
  const generatedAt = useTravelStore((s) => s.recommendationsGeneratedAt);
  const refreshRecommendations = useTravelStore((s) => s.refreshRecommendations);

  useEffect(() => {
    if (!generatedAt) refreshRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fallback = useMemo(() => {
    if (recommendations.length > 0) return null;
    return closestAvailable(intent, 3);
  }, [recommendations, intent]);

  const list = recommendations.length > 0 ? recommendations : fallback ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-5">
        <p className="text-xs uppercase tracking-wide text-secondary">For you</p>
        <h1 className="text-2xl font-extrabold">Real trips. Live prices.</h1>
        {generatedAt && (
          <p className="mt-1 text-xs text-secondary">
            Checked {new Date(generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {recommendations.length === 0 && fallback && fallback.length > 0 && (
          <p className="mb-4 whitespace-pre-line rounded-xl2 border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            {noInventoryMatchMessage(fallback)}
          </p>
        )}

        {list.length === 0 && (
          <p className="text-sm text-secondary">
            Nothing available right now. Loosen the budget, dates or flight time in Refine.
          </p>
        )}

        <div className="space-y-4 pb-4">
          {list.map((rec) => {
            const pkg = getPackageById(rec.package_id);
            if (!pkg) return null;
            return (
              <TripRecommendationCard
                key={rec.package_id}
                packageId={pkg.package_id}
                rank={rec.rank}
                destination={pkg.destination_name}
                country={pkg.country}
                imageUrl={pkg.image_url}
                description={pkg.description}
                pricePp={pkg.price_pp}
                currency={pkg.currency}
                nights={pkg.nights}
                departureDate={pkg.departure_date}
                returnDate={pkg.return_date}
                departureAirport={pkg.departure_airport}
                flightDurationMinutes={pkg.flight_duration_minutes}
                matchReasons={rec.match_reasons}
                tradeOffs={rec.trade_offs}
                availabilityStatus={rec.availability_status}
                roomsRemaining={pkg.rooms_remaining}
                onViewTrip={() => router.push(`/trips/${pkg.package_id}`)}
                onSave={() => {}}
              />
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
