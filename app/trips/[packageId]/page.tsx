"use client";

import { useRouter } from "next/navigation";
import { getPackageById } from "@/lib/mockInventory";
import { useTravelStore } from "@/lib/store";
import { explainMatch } from "@/lib/mockLLM";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function formatFlight(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function TripDetailPage({ params }: { params: { packageId: string } }) {
  const router = useRouter();
  const intent = useTravelStore((s) => s.intent);
  const pkg = getPackageById(params.packageId);

  if (!pkg) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-lg font-semibold">Trip not found</p>
        <button onClick={() => router.push("/trips")} className="text-sm text-accent">
          Back to trips
        </button>
      </div>
    );
  }

  const { matchReasons, tradeOffs } = explainMatch(pkg, intent);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-8">
      <div className="relative h-72 w-full shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pkg.image_url} alt={pkg.destination_name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/40" />
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1.5 text-sm backdrop-blur-md"
        >
          Back
        </button>
        <div className="absolute inset-x-4 bottom-4">
          <p className="text-2xl font-extrabold">
            {pkg.destination_name}, {pkg.country}
          </p>
          <p className="text-sm text-secondary">{pkg.hotel_name}</p>
        </div>
      </div>

      <div className="space-y-5 px-5 pt-5">
        <div className="flex items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-4">
          <div>
            <p className="text-3xl font-extrabold">£{pkg.price_pp}</p>
            <p className="text-xs text-secondary">per person · {pkg.board_basis}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              pkg.availability_status === "available"
                ? "bg-positive/20 text-positive"
                : pkg.availability_status === "limited"
                ? "bg-warning/20 text-warning"
                : "bg-white/10 text-secondary"
            }`}
          >
            {pkg.availability_status === "available"
              ? "Available"
              : pkg.availability_status === "limited"
              ? `Only ${pkg.rooms_remaining} left`
              : "Sold out"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs text-secondary">Dates</p>
            <p className="mt-1 font-medium">
              {formatDate(pkg.departure_date)} – {formatDate(pkg.return_date)}
            </p>
          </div>
          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs text-secondary">Nights</p>
            <p className="mt-1 font-medium">{pkg.nights}</p>
          </div>
          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs text-secondary">Flight</p>
            <p className="mt-1 font-medium">
              {pkg.departure_airport} · {formatFlight(pkg.flight_duration_minutes)}
            </p>
          </div>
          <div className="rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs text-secondary">Typical weather</p>
            <p className="mt-1 font-medium">~{pkg.avg_temp_c}°C</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-secondary">{pkg.description}</p>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Why it fits</p>
          <ul className="mt-2 space-y-1 text-sm">
            {matchReasons.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Trade-off</p>
          <p className="mt-1 text-sm text-secondary">{tradeOffs.join(" ")}</p>
        </div>

        <p className="text-[11px] text-secondary">
          Last checked {new Date(pkg.last_checked).toLocaleString("en-GB")}. Package {pkg.package_id}.
        </p>

        <a
          href={pkg.booking_url}
          target="_blank"
          rel="noreferrer"
          className={`block w-full rounded-full py-3 text-center text-sm font-semibold ${
            pkg.availability_status === "sold_out"
              ? "pointer-events-none bg-white/10 text-secondary"
              : "bg-accent"
          }`}
        >
          {pkg.availability_status === "sold_out" ? "Sold out" : "Continue to book"}
        </a>
      </div>
    </div>
  );
}
