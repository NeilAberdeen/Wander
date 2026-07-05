"use client";

import { create } from "zustand";
import { INSPIRATION_CARDS } from "./inspirationCards";
import {
  applySwipeEvent,
  defaultProfile,
  deriveStructuredIntent,
  interpretChatMessage,
  makeChatMessage,
  nextClarifyingQuestion,
} from "./mockLLM";
import { rankRecommendations } from "./ranking";
import {
  ChatMessage,
  RecommendationResult,
  StructuredTravelIntent,
  SwipeEventType,
  UserPreferenceProfile,
} from "./types";

interface TravelState {
  profile: UserPreferenceProfile;
  intent: StructuredTravelIntent;
  cardIndex: number;
  swipeCount: number;
  savedCardIds: string[];
  rejectedCardIds: string[];
  chatMessages: ChatMessage[];
  pendingQuestion: string | null;
  recommendations: RecommendationResult[];
  recommendationsGeneratedAt: string | null;

  reactToCard: (cardId: string, type: SwipeEventType) => void;
  nextCard: () => void;
  sendChatMessage: (text: string) => void;
  refreshRecommendations: (limit?: number) => void;
  resetPendingQuestion: () => void;
}

const initialProfile = defaultProfile("USER_NEIL");
const initialIntent = deriveStructuredIntent(initialProfile);

export const useTravelStore = create<TravelState>((set, get) => ({
  profile: initialProfile,
  intent: initialIntent,
  cardIndex: 0,
  swipeCount: 0,
  savedCardIds: [],
  rejectedCardIds: [],
  chatMessages: [
    makeChatMessage(
      "assistant",
      "Swipe through a few ideas first — I'll pick up your taste as you go."
    ),
  ],
  pendingQuestion: null,
  recommendations: [],
  recommendationsGeneratedAt: null,

  reactToCard: (cardId, type) => {
    const card = INSPIRATION_CARDS.find((c) => c.card_id === cardId);
    if (!card) return;
    const { profile, swipeCount } = get();
    const updatedProfile = applySwipeEvent(profile, { type, card_id: cardId }, card);
    const updatedIntent = deriveStructuredIntent(updatedProfile);
    const newSwipeCount = swipeCount + 1;

    set((state) => ({
      profile: updatedProfile,
      intent: updatedIntent,
      swipeCount: newSwipeCount,
      savedCardIds:
        type === "card_saved" && !state.savedCardIds.includes(cardId)
          ? [...state.savedCardIds, cardId]
          : state.savedCardIds,
      rejectedCardIds:
        type === "card_disliked" && !state.rejectedCardIds.includes(cardId)
          ? [...state.rejectedCardIds, cardId]
          : state.rejectedCardIds,
    }));

    const question = nextClarifyingQuestion(updatedProfile, newSwipeCount);
    if (question && !get().chatMessages.some((m) => m.text === question)) {
      set((state) => ({
        pendingQuestion: question,
        chatMessages: [...state.chatMessages, makeChatMessage("assistant", question)],
      }));
    }
  },

  nextCard: () => set((state) => ({ cardIndex: Math.min(state.cardIndex + 1, INSPIRATION_CARDS.length) })),

  sendChatMessage: (text) => {
    const { profile } = get();
    const userMsg = makeChatMessage("user", text);
    set((state) => ({ chatMessages: [...state.chatMessages, userMsg] }));

    const { assistantMessage, updatedProfile, requiresInventoryRefresh } = interpretChatMessage(
      text,
      profile
    );
    const updatedIntent = deriveStructuredIntent(updatedProfile);
    const assistantMsg = makeChatMessage("assistant", assistantMessage);

    set((state) => ({
      profile: updatedProfile,
      intent: updatedIntent,
      pendingQuestion: null,
      chatMessages: [...state.chatMessages, assistantMsg],
    }));

    if (requiresInventoryRefresh) {
      get().refreshRecommendations();
    }
  },

  refreshRecommendations: (limit = 3) => {
    const { intent } = get();
    const recs = rankRecommendations(intent, limit);
    set({ recommendations: recs, recommendationsGeneratedAt: new Date().toISOString() });
  },

  resetPendingQuestion: () => set({ pendingQuestion: null }),
}));

export function getInspirationCards() {
  return INSPIRATION_CARDS;
}
