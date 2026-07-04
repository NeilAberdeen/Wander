"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { ChatMessage, StructuredTravelIntent } from "@/lib/types";

export type ChatRefinementPanelProps = {
  messages: ChatMessage[];
  understoodIntent: StructuredTravelIntent;
  suggestedReplies: string[];
  onSendMessage: (message: string) => void;
  onSelectSuggestion: (suggestion: string) => void;
};

export default function ChatRefinementPanel({
  messages,
  understoodIntent,
  suggestedReplies,
  onSendMessage,
  onSelectSuggestion,
}: ChatRefinementPanelProps) {
  const [draft, setDraft] = useState("");

  function submit() {
    const text = draft.trim();
    if (!text) return;
    onSendMessage(text);
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-secondary">I think you want</p>
        <p className="mt-1 text-sm leading-relaxed text-white">{understoodIntent.summary}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "bg-accent text-white" : "bg-white/10 text-white"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {suggestedReplies.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2">
          {suggestedReplies.map((s) => (
            <button
              key={s}
              onClick={() => onSelectSuggestion(s)}
              className="shrink-0 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Tell me what to change…"
          className="flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-secondary focus:outline-none"
        />
        <button
          onClick={submit}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
