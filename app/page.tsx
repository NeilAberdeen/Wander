"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import FullScreenInspirationCard from "@/components/FullScreenInspirationCard";
import InfoSheet from "@/components/InfoSheet";
import { getInspirationCards, useTravelStore } from "@/lib/store";

const DISMISS_THRESHOLD = 70; // px of upward drag before it counts as a swipe
const EXIT_DURATION = 240; // ms

export default function DiscoverPage() {
  const router = useRouter();
  const cards = useMemo(() => getInspirationCards(), []);
  const cardIndex = useTravelStore((s) => s.cardIndex);
  const reactToCard = useTravelStore((s) => s.reactToCard);
  const nextCard = useTravelStore((s) => s.nextCard);
  const [infoCardId, setInfoCardId] = useState<string | null>(null);

  const card = cards[cardIndex];
  const upNextCard = cards[cardIndex + 1];

  // Live drag offset (px) applied to the current card while it's being dragged,
  // plus whether it's mid fly-off animation. Together these make the card
  // follow the pointer 1:1, then either fly away or snap back on release —
  // the "flicking a choice away" feel — instead of an instant, abrupt swap.
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [suppressTransition, setSuppressTransition] = useState(false);
  const pointerStartY = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);

  function triggerExit() {
    setIsDragging(false);
    setIsExiting(true);
    const distance =
      typeof window !== "undefined" ? window.innerHeight + 200 : 1200;
    setDragY(-distance);
    setTimeout(() => {
      nextCard();
      setSuppressTransition(true);
      setDragY(0);
      setIsExiting(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setSuppressTransition(false)));
    }, EXIT_DURATION);
  }

  // Pointer events (not touch events) so this works with touch on phones
  // AND mouse/trackpad drags in a desktop browser.
  function handlePointerDown(e: React.PointerEvent) {
    if (isExiting || !card) return;
    pointerStartY.current = e.clientY;
    pointerStartX.current = e.clientX;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (pointerStartY.current == null || isExiting) return;
    const delta = pointerStartY.current - e.clientY; // positive = dragged up
    setDragY(delta >= 0 ? -delta : -delta * 0.25); // resistance when dragging down
  }

  function endDrag(committed: boolean) {
    pointerStartY.current = null;
    pointerStartX.current = null;
    if (committed) {
      triggerExit();
    } else {
      setIsDragging(false);
      setDragY(0);
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (pointerStartY.current == null) return;
    const deltaY = pointerStartY.current - e.clientY;
    const deltaX = Math.abs((pointerStartX.current ?? e.clientX) - e.clientX);
    endDrag(deltaY > DISMISS_THRESHOLD && deltaX < 80);
  }

  function handlePointerCancel() {
    if (pointerStartY.current == null) return;
    endDrag(false);
  }

  function respond(type: "card_liked" | "card_disliked" | "card_saved") {
    if (!card || isExiting) return;
    reactToCard(card.card_id, type);
    if (type !== "card_saved") {
      triggerExit();
    }
  }

  const infoCard = cards.find((c) => c.card_id === infoCardId) ?? null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* next card sits underneath, at rest, so the reveal is instant */}
        {upNextCard && (
          <div className="absolute inset-0">
            <FullScreenInspirationCard
              key={upNextCard.card_id}
              cardId={upNextCard.card_id}
              headline={upNextCard.headline}
              destination={upNextCard.destination_name}
              country={upNextCard.country}
              imageUrl={upNextCard.media_url}
              vibeTags={upNextCard.vibe_tags}
              priceFrom={upNextCard.lowest_price_pp}
              currency={upNextCard.currency}
              inventoryStatus={upNextCard.inventory_status}
              onYes={() => {}}
              onNo={() => {}}
              onSave={() => {}}
              onInfo={() => {}}
              onRefine={() => {}}
            />
          </div>
        )}

        {/* current card, draggable */}
        {card && (
          <div
            className="absolute inset-0 touch-none select-none"
            style={{
              transform: `translateY(${dragY}px)`,
              transition:
                isDragging || suppressTransition
                  ? "none"
                  : `transform ${EXIT_DURATION}ms ease-out`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
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
          </div>
        )}

        {!card && (
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
