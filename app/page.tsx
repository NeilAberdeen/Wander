"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import FullScreenInspirationCard from "@/components/FullScreenInspirationCard";
import InfoSheet from "@/components/InfoSheet";
import { getInspirationCards, useTravelStore } from "@/lib/store";

const H_DISMISS_THRESHOLD = 90; // px of horizontal drag = Yes/No
const V_DISMISS_THRESHOLD = 70; // px of upward drag = skip
const EXIT_DURATION = 240; // ms
const STUCK_WATCHDOG_MS = EXIT_DURATION + 1500; // failsafe if anything ever hangs

type ExitDirection = "up" | "left" | "right";

export default function DiscoverPage() {
  const router = useRouter();
  const cards = useMemo(() => getInspirationCards(), []);
  const cardIndex = useTravelStore((s) => s.cardIndex);
  const reactToCard = useTravelStore((s) => s.reactToCard);
  const nextCard = useTravelStore((s) => s.nextCard);
  const [infoCardId, setInfoCardId] = useState<string | null>(null);

  const card = cards[cardIndex];
  const upNextCard = cards[cardIndex + 1];

  // Live drag offset applied to the current card while it's being dragged,
  // so it follows the pointer 1:1, then either flies off (left/right = a
  // choice, up = skip) or snaps back — instead of an instant, abrupt swap.
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [suppressTransition, setSuppressTransition] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const watchdogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearWatchdog() {
    if (watchdogTimer.current) {
      clearTimeout(watchdogTimer.current);
      watchdogTimer.current = null;
    }
  }

  function hardReset() {
    // Failsafe: whatever state got us stuck, unstick everything.
    clearWatchdog();
    pointerStartX.current = null;
    pointerStartY.current = null;
    detachWindowListeners();
    setIsDragging(false);
    setIsExiting(false);
    setSuppressTransition(true);
    setDragX(0);
    setDragY(0);
    requestAnimationFrame(() => requestAnimationFrame(() => setSuppressTransition(false)));
  }

  function triggerExit(direction: ExitDirection) {
    setIsDragging(false);
    setIsExiting(true);
    const w = typeof window !== "undefined" ? window.innerWidth + 200 : 800;
    const h = typeof window !== "undefined" ? window.innerHeight + 200 : 1200;
    if (direction === "left") setDragX(-w);
    else if (direction === "right") setDragX(w);
    else setDragY(-h);

    clearWatchdog();
    watchdogTimer.current = setTimeout(hardReset, STUCK_WATCHDOG_MS);

    setTimeout(() => {
      nextCard();
      setSuppressTransition(true);
      setDragX(0);
      setDragY(0);
      setIsExiting(false);
      clearWatchdog();
      requestAnimationFrame(() => requestAnimationFrame(() => setSuppressTransition(false)));
    }, EXIT_DURATION);
  }

  function commit(direction: ExitDirection) {
    if (!card || isExiting) return;
    if (direction === "left") reactToCard(card.card_id, "card_disliked");
    if (direction === "right") reactToCard(card.card_id, "card_liked");
    triggerExit(direction);
  }

  // --- Drag tracking via window-level listeners -----------------------
  // Attaching move/up listeners to the element itself (even with pointer
  // capture) can leave a drag "orphaned" if capture isn't honoured by the
  // browser. Listening on window instead guarantees we always hear the
  // release, no matter where the cursor ends up. The logic refs + stable
  // trampoline functions below mean the window listener always runs the
  // latest closure (fresh state) while keeping add/removeEventListener
  // working correctly (same function identity every time).
  const onMoveLogic = useRef<(e: PointerEvent) => void>(() => {});
  const onUpLogic = useRef<(e: PointerEvent) => void>(() => {});
  const onCancelLogic = useRef<() => void>(() => {});
  const stableMove = useRef((e: PointerEvent) => onMoveLogic.current(e)).current;
  const stableUp = useRef((e: PointerEvent) => onUpLogic.current(e)).current;
  const stableCancel = useRef(() => onCancelLogic.current()).current;

  function attachWindowListeners() {
    detachWindowListeners();
    window.addEventListener("pointermove", stableMove);
    window.addEventListener("pointerup", stableUp);
    window.addEventListener("pointercancel", stableCancel);
  }

  function detachWindowListeners() {
    window.removeEventListener("pointermove", stableMove);
    window.removeEventListener("pointerup", stableUp);
    window.removeEventListener("pointercancel", stableCancel);
  }

  useEffect(() => detachWindowListeners, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePointerDown(e: React.PointerEvent) {
    if (isExiting || !card) return;
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    setIsDragging(true);
    attachWindowListeners();
  }

  onMoveLogic.current = (e: PointerEvent) => {
    if (pointerStartX.current == null || pointerStartY.current == null || isExiting) return;
    const dx = e.clientX - pointerStartX.current;
    const dyUp = pointerStartY.current - e.clientY; // positive = dragged up
    setDragX(dx);
    setDragY(dyUp >= 0 ? -dyUp : -dyUp * 0.25); // resistance when dragging down
  };

  onUpLogic.current = () => {
    detachWindowListeners();
    if (pointerStartX.current == null || pointerStartY.current == null) return;
    const dx = dragX;
    const dyUp = -dragY >= 0 ? -dragY : 0;
    pointerStartX.current = null;
    pointerStartY.current = null;

    if (Math.abs(dx) > H_DISMISS_THRESHOLD && Math.abs(dx) > dyUp) {
      commit(dx > 0 ? "right" : "left");
    } else if (dyUp > V_DISMISS_THRESHOLD) {
      triggerExit("up");
    } else {
      setIsDragging(false);
      setDragX(0);
      setDragY(0);
    }
  };

  onCancelLogic.current = () => {
    detachWindowListeners();
    pointerStartX.current = null;
    pointerStartY.current = null;
    setIsDragging(false);
    setDragX(0);
    setDragY(0);
  };

  function handleSave() {
    if (!card) return;
    reactToCard(card.card_id, "card_saved");
  }

  const infoCard = cards.find((c) => c.card_id === infoCardId) ?? null;
  const rotation = Math.max(-15, Math.min(15, dragX / 12));
  const likeOpacity = Math.min(Math.max(dragX / H_DISMISS_THRESHOLD, 0), 1);
  const nopeOpacity = Math.min(Math.max(-dragX / H_DISMISS_THRESHOLD, 0), 1);

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
              transform: `translate(${dragX}px, ${dragY}px) rotate(${rotation}deg)`,
              transition:
                isDragging || suppressTransition
                  ? "none"
                  : `transform ${EXIT_DURATION}ms ease-out`,
            }}
            onPointerDown={handlePointerDown}
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
              onYes={() => commit("right")}
              onNo={() => commit("left")}
              onSave={handleSave}
              onInfo={() => setInfoCardId(card.card_id)}
              onRefine={() => router.push("/refine")}
            />

            {/* drag feedback stamps */}
            <div
              className="pointer-events-none absolute left-6 top-24 -rotate-12 rounded-lg border-4 border-positive px-3 py-1 text-2xl font-extrabold text-positive"
              style={{ opacity: likeOpacity }}
            >
              YES
            </div>
            <div
              className="pointer-events-none absolute right-6 top-24 rotate-12 rounded-lg border-4 border-white/70 px-3 py-1 text-2xl font-extrabold text-white/70"
              style={{ opacity: nopeOpacity }}
            >
              NO
            </div>
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
