"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import FullScreenInspirationCard from "@/components/FullScreenInspirationCard";
import InfoSheet from "@/components/InfoSheet";
import { getInspirationCards, useTravelStore } from "@/lib/store";

export default function DiscoverPage() {
  const router = useRouter();
  const cards = useMemo(() => getInspirationCards(), []);
  const cardIndex = useTravelStore((s) => s.cardIndex);
  const swipeCount = useTravelStore((s) => s.swipeCount);
  const reactToCard = useTravelStore((s) => s.reactToCard);
  const nextCard = useTravelStore((s) => s.nextCard);
  const [infoCardId, setInfoCardId] = useState<string | null>(null);

  const pointerStartY = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const card = cards[cardIndex];

  // Pointer events (not touch events) so the swipe-up gesture works with
  // touch on phones AND mouse/trackpad drags in a desktop browser.
  function handlePointerDown(e: React.PointerEvent) {
    pointerStartY.current = e.clientY;
    pointerStartX.current = e.clientX;
  }
  function handlePointerUp(e: React.PointerEvent) {
    if (pointerStartY.current == null || pointerStartX.current == null) return;
    const deltaY = pointerStartY.current - e.clientY;
    const deltaX = Math.abs(pointerStartX.current - e.clientX);
    // require a mostly-vertical drag so it doesn't fire on button taps/clicks
    if (deltaY > 60 && deltaX < 60) nextCard();
    pointerStartY.current = null;
    pointerStartX.current = null;
  }

  function respond(type: "card_liked" | "card_disliked" | "card_saved") {
    if (!card) return;
    reactToCard(card.card_id, type);
    if (type !== "card_saved") {
      setTimeout(() => nextCard(), 120);
    }
  }

  const infoCard = cards.find((c) => c.card_id === infoCardId) ?? null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className="relative min-h-0 flex-1 overflow-hidden touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {card ? (
          <FullScreenInspirationCard
            key={card.card_id}
            cardId={card.card_id}
            headline={card.headline}
            destination={card.destination_name}
            country={card.country}
            imageUrl={card.media_url}
            vibeTags={card.vibe_tags}
            priceFrom={card.lowest_price_pp}
            currency={card.currency}
            inventoryStatus={card.inventory_status}
            onYes={() => respond("card_liked")}
            onNo={() => respond("card_disliked")}
            onSave={() => respond("card_saved")}
            onInfo={() => setInfoCardId(card.card_id)}
            onRefine={() => router.push("/refine")}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-2xl font-extrabold">That's today's ideas.</p>
            <p className="text-sm text-secondary">
              I've picked up on a few things. Let's turn that into real trips.
            </p>
            <button
              onClick={() => router.push("/refine")}
              className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold"
            >
              Refine what I want
            </button>
          </div>
        )}

        {infoCard && <InfoSheet card={infoCard} onClose={() => setInfoCardId(null)} />}
      </div>
      <BottomNav />
    </div>
  );
}
