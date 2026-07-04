import {
  ChatMessage,
  InspirationCard,
  InventoryPackage,
  Mood,
  RecommendationResult,
  StructuredTravelIntent,
  SwipeEvent,
  UserPreferenceProfile,
} from "./types";

// ---------------------------------------------------------------------------
// This file stands in for the LLM in the prototype (see spec section 20:
// "Mock LLM intent extraction if no live LLM is available").
//
// HARD RULE: everything in here only ever touches UserPreferenceProfile,
// StructuredTravelIntent and chat copy. It never invents a price, date,
// flight time, hotel, or availability_status — those always come from
// mockInventory.ts, untouched.
// ---------------------------------------------------------------------------

export function defaultProfile(userId: string): UserPreferenceProfile {
  return {
    user_id: userId,
    moods: {
      adventure: 0.3,
      relaxation: 0.5,
      culture: 0.4,
      food: 0.4,
      nightlife: 0.2,
      romance: 0.3,
      wellness: 0.3,
    },
    constraints: {
      budget_per_person_max: null,
      departure_airports: ["LGW", "LHR", "STN"],
      travel_months: ["September"],
      max_flight_hours: null,
      party_type: "any",
      children: false,
    },
    positive_signals: [],
    negative_signals: [],
  };
}

const LEARNING_RATE = 0.18;

function nudge(current: number, target: number, rate = LEARNING_RATE) {
  const next = current + (target - current) * rate;
  return Math.max(0, Math.min(1, Number(next.toFixed(3))));
}

// Job 1: interpret a single swipe/save/reject signal into the profile.
export function applySwipeEvent(
  profile: UserPreferenceProfile,
  event: SwipeEvent,
  card: InspirationCard
): UserPreferenceProfile {
  const next: UserPreferenceProfile = JSON.parse(JSON.stringify(profile));
  const liking = event.type === "card_liked" || event.type === "card_saved";
  const disliking = event.type === "card_disliked";

  if (liking) {
    (Object.keys(card.moods) as Mood[]).forEach((mood) => {
      const weight = card.moods[mood] ?? 0;
      next.moods[mood] = nudge(next.moods[mood], weight);
    });
    card.vibe_tags.forEach((tag) => {
      if (!next.positive_signals.includes(tag)) next.positive_signals.push(tag);
    });
    next.negative_signals = next.negative_signals.filter((s) => !card.vibe_tags.includes(s));
  }

  if (disliking) {
    (Object.keys(card.moods) as Mood[]).forEach((mood) => {
      const weight = card.moods[mood] ?? 0;
      // pull away from strongly-associated moods on this card
      if (weight > 0.5) next.moods[mood] = nudge(next.moods[mood], 0, 0.12);
    });
    card.vibe_tags.forEach((tag) => {
      if (!next.negative_signals.includes(tag)) next.negative_signals.push(tag);
    });
  }

  return next;
}

function topSignals(profile: UserPreferenceProfile, n: number): Mood[] {
  return (Object.entries(profile.moods) as [Mood, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([mood]) => mood);
}

const MOOD_PHRASES: Record<Mood, string> = {
  food: "good food",
  relaxation: "relaxed pace",
  culture: "culturally interesting",
  adventure: "some adventure",
  nightlife: "lively evenings",
  romance: "romantic",
  wellness: "restorative",
};

// Job 1 (continued): fold the profile into a StructuredTravelIntent that the
// inventory search / ranking layer can actually use.
export function deriveStructuredIntent(profile: UserPreferenceProfile): StructuredTravelIntent {
  const top = topSignals(profile, 3);
  const mustHave = new Set<string>();
  const niceToHave = new Set<string>();

  top.forEach((mood) => {
    if (profile.moods[mood] >= 0.6) mustHave.add(MOOD_PHRASES[mood]);
    else niceToHave.add(MOOD_PHRASES[mood]);
  });

  profile.positive_signals.forEach((s) => niceToHave.add(s));

  if (profile.constraints.budget_per_person_max) {
    mustHave.add(`under £${profile.constraints.budget_per_person_max}pp`);
  }
  if (profile.constraints.max_flight_hours) {
    mustHave.add(`flight under ${profile.constraints.max_flight_hours} hours`);
  }
  if (profile.constraints.party_type === "adult") {
    mustHave.add("adult-oriented");
  }

  const avoid = new Set(profile.negative_signals);

  const summaryParts: string[] = [];
  if (mustHave.size) summaryParts.push(Array.from(mustHave).join(", "));
  if (avoid.size) summaryParts.push(`avoiding ${Array.from(avoid).join(", ")}`);

  return {
    summary: summaryParts.length
      ? `${summaryParts.join(". ")}.`
      : "Still learning what you like — keep swiping.",
    must_have: Array.from(mustHave),
    nice_to_have: Array.from(niceToHave),
    avoid: Array.from(avoid),
    search_parameters: {
      departure_airports: profile.constraints.departure_airports,
      date_range: {
        start: "2026-09-01",
        end: "2026-09-30",
      },
      max_budget_pp: profile.constraints.budget_per_person_max,
      max_flight_duration_minutes: profile.constraints.max_flight_hours
        ? profile.constraints.max_flight_hours * 60
        : null,
      temperature_min_c: profile.moods.relaxation > 0.6 ? 24 : null,
      party_type: profile.constraints.party_type,
    },
  };
}

// Job 2: ask at most one clarifying question, only if it materially changes results.
export function nextClarifyingQuestion(profile: UserPreferenceProfile, swipeCount: number): string | null {
  if (swipeCount < 3) return null;
  if (profile.constraints.budget_per_person_max === null) {
    return "Should I keep this under £1,200 per person, including flights?";
  }
  if (profile.constraints.max_flight_hours === null) {
    return "Roughly how long a flight are you happy with — up to 5 hours?";
  }
  if (profile.constraints.party_type === "any" && profile.moods.nightlife < 0.4) {
    return "Adults only, or fine with families around?";
  }
  return null;
}

export function summariseIntentForUser(intent: StructuredTravelIntent): string {
  const lines = ["I think you want:"];
  intent.must_have.forEach((m) => lines.push(m[0].toUpperCase() + m.slice(1)));
  return lines.join("\n");
}

// Job 4: turn a free-text refinement message into profile/intent deltas.
// This is a small rule-based stand-in for an LLM chat turn.
export function interpretChatMessage(
  message: string,
  profile: UserPreferenceProfile
): { assistantMessage: string; updatedProfile: UserPreferenceProfile; requiresInventoryRefresh: boolean } {
  const text = message.toLowerCase();
  const next: UserPreferenceProfile = JSON.parse(JSON.stringify(profile));
  const applied: string[] = [];
  let refresh = false;

  const rules: { test: RegExp; apply: () => string }[] = [
    {
      test: /no kids|adults? only|no children/,
      apply: () => {
        next.constraints.children = false;
        next.constraints.party_type = "adult";
        return "keep this adult-only";
      },
    },
    {
      test: /boutique/,
      apply: () => {
        if (!next.positive_signals.includes("boutique hotel")) next.positive_signals.push("boutique hotel");
        return "favour boutique stays";
      },
    },
    {
      test: /more cultur|less beach|not (just|only) beach/,
      apply: () => {
        next.moods.culture = nudge(next.moods.culture, 0.9);
        next.moods.relaxation = nudge(next.moods.relaxation, 0.4, 0.1);
        return "lean more cultural, less pure-beach";
      },
    },
    {
      test: /more sea|less city/,
      apply: () => {
        next.moods.relaxation = nudge(next.moods.relaxation, 0.8);
        next.moods.culture = nudge(next.moods.culture, 0.3, 0.1);
        return "shift towards the coast, away from cities";
      },
    },
    {
      test: /quieter|less crowd|no crowds/,
      apply: () => {
        if (!next.positive_signals.includes("no crowds")) next.positive_signals.push("no crowds");
        if (!next.negative_signals.includes("too crowded")) next.negative_signals.push("too crowded");
        return "avoid crowded spots";
      },
    },
    {
      test: /cheaper|less expensive|lower budget/,
      apply: () => {
        const current = next.constraints.budget_per_person_max ?? 1200;
        next.constraints.budget_per_person_max = Math.round(current * 0.85);
        refresh = true;
        return `bring the budget down to about £${next.constraints.budget_per_person_max}pp`;
      },
    },
    {
      test: /shorter flight/,
      apply: () => {
        const current = next.constraints.max_flight_hours ?? 5;
        next.constraints.max_flight_hours = Math.max(2, current - 1);
        refresh = true;
        return `look for flights under ${next.constraints.max_flight_hours}h`;
      },
    },
    {
      test: /warmer/,
      apply: () => {
        refresh = true;
        return "prioritise warmer destinations";
      },
    },
    {
      test: /less resorty|not resorty|less polished/,
      apply: () => {
        if (!next.negative_signals.includes("generic beach package")) next.negative_signals.push("generic beach package");
        if (!next.positive_signals.includes("not too polished")) next.positive_signals.push("not too polished");
        return "move away from big resorts, towards smaller towns";
      },
    },
    {
      test: /more food/,
      apply: () => {
        next.moods.food = nudge(next.moods.food, 0.95);
        return "put more weight on food";
      },
    },
    {
      test: /dubai/,
      apply: () => {
        if (!next.negative_signals.includes("Dubai")) next.negative_signals.push("Dubai");
        return "rule out Dubai";
      },
    },
    {
      test: /instagram|clich[ée]/,
      apply: () => {
        if (!next.negative_signals.includes("Instagram cliché")) next.negative_signals.push("Instagram cliché");
        return "avoid the over-photographed spots";
      },
    },
    {
      test: /family resort/,
      apply: () => {
        if (!next.negative_signals.includes("family resorts")) next.negative_signals.push("family resorts");
        return "rule out family resorts";
      },
    },
  ];

  rules.forEach((rule) => {
    if (rule.test.test(text)) applied.push(rule.apply());
  });

  if (applied.length === 0) {
    return {
      assistantMessage:
        "Got it — noted. Tell me anything you want more or less of, and I'll adjust the search.",
      updatedProfile: next,
      requiresInventoryRefresh: false,
    };
  }

  const assistantMessage = `Got it. I'll ${applied.join(" and ")}.`;
  return { assistantMessage, updatedProfile: next, requiresInventoryRefresh: refresh || true };
}

// Job 3: explain a real inventory match — reasons + one honest trade-off.
export function explainMatch(
  pkg: InventoryPackage,
  intent: StructuredTravelIntent
): { matchReasons: string[]; tradeOffs: string[] } {
  const reasons: string[] = [];

  if (pkg.avg_temp_c >= (intent.search_parameters.temperature_min_c ?? 0)) {
    reasons.push(`Warm — around ${pkg.avg_temp_c}°C`);
  }
  if (pkg.moods.food >= 0.6) reasons.push("Strong food culture");
  if (pkg.adult_only || pkg.hotel_type === "adult-only") reasons.push("Adult-oriented stay");
  if (pkg.hotel_type === "boutique") reasons.push("Small, boutique hotel");
  if (
    intent.search_parameters.max_budget_pp &&
    pkg.price_pp <= intent.search_parameters.max_budget_pp
  ) {
    reasons.push(`Under £${intent.search_parameters.max_budget_pp}pp`);
  }
  if (
    intent.search_parameters.max_flight_duration_minutes &&
    pkg.flight_duration_minutes <= intent.search_parameters.max_flight_duration_minutes
  ) {
    reasons.push(`Flight under ${Math.round(intent.search_parameters.max_flight_duration_minutes / 60)}h`);
  }
  if (pkg.moods.culture >= 0.6) reasons.push("Culturally rich without being a museum-crawl");
  if (pkg.moods.relaxation >= 0.7) reasons.push("Genuinely low-key pace");

  const tradeOffs: string[] = [];
  if (pkg.hotel_type === "boutique" || pkg.hotel_type === "adult-only") {
    tradeOffs.push("You may want a car to reach the best spots.");
  }
  if (pkg.rooms_remaining <= 3) {
    tradeOffs.push(`Only ${pkg.rooms_remaining} rooms left at this price.`);
  }
  if (pkg.board_basis === "Room only") {
    tradeOffs.push("Self-catering — meals aren't included.");
  }
  if (
    intent.search_parameters.max_budget_pp &&
    pkg.price_pp > intent.search_parameters.max_budget_pp * 0.9
  ) {
    tradeOffs.push("Close to the top of your budget.");
  }
  if (tradeOffs.length === 0) tradeOffs.push("Nothing major — this is a clean fit.");

  return {
    matchReasons: reasons.slice(0, 4),
    tradeOffs: tradeOffs.slice(0, 2),
  };
}

// Rule 5: plain, honest message when inventory can't meet every constraint.
export function noInventoryMatchMessage(closest: RecommendationResult[]): string {
  if (closest.length === 0) {
    return "I can't find anything close to this right now. Try loosening the budget or dates.";
  }
  const lines = [
    "I can match the mood, but not every constraint with current availability. The closest real options are:",
  ];
  closest.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.destination_name} — £${r.price_pp}pp`);
  });
  return lines.join("\n");
}

export function makeChatMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return {
    id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    timestamp: new Date().toISOString(),
  };
}
