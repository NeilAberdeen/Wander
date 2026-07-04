"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ChatRefinementPanel from "@/components/ChatRefinementPanel";
import { useTravelStore } from "@/lib/store";

const SUGGESTED_CHIPS = [
  "Less city",
  "More sea",
  "Quieter",
  "Cheaper",
  "Shorter flight",
  "More food",
  "Less resorty",
  "Adults only",
  "Boutique stays",
  "Warmer",
];

export default function RefinePage() {
  const router = useRouter();
  const messages = useTravelStore((s) => s.chatMessages);
  const intent = useTravelStore((s) => s.intent);
  const sendChatMessage = useTravelStore((s) => s.sendChatMessage);
  const refreshRecommendations = useTravelStore((s) => s.refreshRecommendations);

  function goToTrips() {
    refreshRecommendations();
    router.push("/trips");
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://picsum.photos/seed/refine-bg/900/1600"
          alt=""
          className="h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-bg/80" />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-5 pt-4">
          <button onClick={() => router.push("/")} className="text-sm text-secondary">
            Back
          </button>
          <span className="text-sm font-semibold">Refine</span>
          <span className="w-10" />
        </div>

        <div className="min-h-0 flex-1">
          <ChatRefinementPanel
            messages={messages}
            understoodIntent={intent}
            suggestedReplies={SUGGESTED_CHIPS}
            onSendMessage={sendChatMessage}
            onSelectSuggestion={sendChatMessage}
          />
        </div>

        <div className="px-5 pb-3">
          <button
            onClick={goToTrips}
            className="w-full rounded-full bg-accent py-3 text-sm font-semibold"
          >
            Show me real trips
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
