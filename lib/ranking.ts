import { INVENTORY } from "./mockInventory";
import { InventoryPackage, Mood, RecommendationResult, StructuredTravelIntent } from "./types";
import { explainMatch } from "./mockLLM";

// Ranking logic, per spec section 11:
// 1. hard constraints  2. mood fit  3. availability confidence  4. price fit
// 5. flight convenience 6. hotel quality 7. review quality 8. commercial priority
// 9. diversity. Commercial priority never overrides hard constraints.

function passesHardConstraints(pkg: InventoryPackage, intent: StructuredTravelIntent): boolean {
  const sp = intent.search_parameters;

  if (pkg.availability_status === "sold_out") return false;

  if (sp.max_budget_pp && pkg.price_pp > sp.max_budget_pp * 1.15) {
    // allow a little headroom so "closest options" can still be surfaced upstream;
    // exact budget enforcement happens in scoring, hard cutoff is generous here.
    return false;
  }
  if (sp.max_flight_duration_minutes && pkg.flight_duration_minutes > sp.max_flight_duration_minutes + 90) {
    return false;
  }
  if (sp.departure_airports.length && !sp.departure_airports.includes(pkg.departure_airport)) {
    return false;
  }
  if (sp.party_type === "adult" && pkg.hotel_type === "family") {
    return false;
  }
  if (intent.avoid.some((a) => matchesAvoid(pkg, a))) {
    return false;
  }
  return true;
}

function matchesAvoid(pkg: InventoryPackage, avoidTerm: string): boolean {
  const term = avoidTerm.toLowerCase();
  const haystack = [
    pkg.destination_name,
    pkg.country,
    pkg.hotel_type,
    pkg.description,
    ...pkg.vibe_tags,
  ]
    .join(" ")
    .toLowerCase();

  if (term === "family resorts" && pkg.hotel_type === "family") return true;
  if (term === "too crowded" && pkg.hotel_type === "resort") return true;
  if (term === "generic beach package" && pkg.hotel_type === "resort") return true;
  return haystack.includes(term);
}

function moodFitScore(pkg: InventoryPackage, intent: StructuredTravelIntent): number {
  // crude cosine-ish overlap between package moods and the phrases in must_have/nice_to_have
  const phraseToMood: Record<string, Mood> = {
    "good food": "food",
    "relaxed pace": "relaxation",
    "culturally interesting": "culture",
    "some adventure": "adventure",
    "lively evenings": "nightlife",
    romantic: "romance",
    restorative: "wellness",
  };
  let score = 0;
  let weight = 0;
  intent.must_have.forEach((phrase) => {
    const mood = phraseToMood[phrase];
    if (mood) {
      score += pkg.moods[mood] * 2;
      weight += 2;
    }
  });
  intent.nice_to_have.forEach((phrase) => {
    const mood = phraseToMood[phrase];
    if (mood) {
      score += pkg.moods[mood];
      weight += 1;
    }
  });
  if (weight === 0) return 0.5;
  return score / weight;
}

function availabilityScore(pkg: InventoryPackage): number {
  if (pkg.availability_status === "available") return 1;
  if (pkg.availability_status === "limited") return 0.6;
  return 0;
}

function priceFitScore(pkg: InventoryPackage, intent: StructuredTravelIntent): number {
  const max = intent.search_parameters.max_budget_pp;
  if (!max) return 0.5;
  if (pkg.price_pp <= max) return 1 - pkg.price_pp / (max * 2);
  const overshoot = (pkg.price_pp - max) / max;
  return Math.max(0, 0.5 - overshoot);
}

function flightScore(pkg: InventoryPackage, intent: StructuredTravelIntent): number {
  const max = intent.search_parameters.max_flight_duration_minutes ?? 300;
  return Math.max(0, 1 - pkg.flight_duration_minutes / (max + 120));
}

function hotelQualityScore(pkg: InventoryPackage): number {
  if (pkg.hotel_type === "boutique" || pkg.hotel_type === "adult-only") return 0.9;
  if (pkg.hotel_type === "city") return 0.6;
  if (pkg.hotel_type === "resort") return 0.5;
  return 0.4;
}

export interface ScoredPackage {
  pkg: InventoryPackage;
  score: number;
}

export function searchInventory(intent: StructuredTravelIntent): InventoryPackage[] {
  return INVENTORY.filter((pkg) => passesHardConstraints(pkg, intent));
}

export function scorePackages(intent: StructuredTravelIntent, packages: InventoryPackage[]): ScoredPackage[] {
  return packages
    .map((pkg) => {
      const score =
        moodFitScore(pkg, intent) * 0.35 +
        availabilityScore(pkg) * 0.2 +
        priceFitScore(pkg, intent) * 0.2 +
        flightScore(pkg, intent) * 0.15 +
        hotelQualityScore(pkg) * 0.1;
      return { pkg, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function rankRecommendations(
  intent: StructuredTravelIntent,
  limit = 3
): RecommendationResult[] {
  const candidates = searchInventory(intent);
  const scored = scorePackages(intent, candidates);

  // simple diversity pass: don't let one destination dominate the top slots
  const seenDestinations = new Set<string>();
  const diversified: ScoredPackage[] = [];
  const leftovers: ScoredPackage[] = [];
  scored.forEach((s) => {
    if (!seenDestinations.has(s.pkg.destination_id)) {
      seenDestinations.add(s.pkg.destination_id);
      diversified.push(s);
    } else {
      leftovers.push(s);
    }
  });
  const finalList = [...diversified, ...leftovers].slice(0, Math.min(limit, 5));

  return finalList.map((s, i) => {
    const { matchReasons, tradeOffs } = explainMatch(s.pkg, intent);
    return {
      package_id: s.pkg.package_id,
      rank: i + 1,
      match_score: Number(s.score.toFixed(2)),
      destination_name: s.pkg.destination_name,
      country: s.pkg.country,
      price_pp: s.pkg.price_pp,
      match_reasons: matchReasons,
      trade_offs: tradeOffs,
      availability_status: s.pkg.availability_status,
    };
  });
}

// Used by rule 5 (no exact match) to surface the closest real options anyway.
export function closestAvailable(intent: StructuredTravelIntent, limit = 3): RecommendationResult[] {
  const scored = scorePackages(
    { ...intent, avoid: [] },
    INVENTORY.filter((p) => p.availability_status !== "sold_out")
  );
  return scored.slice(0, limit).map((s, i) => {
    const { matchReasons, tradeOffs } = explainMatch(s.pkg, intent);
    return {
      package_id: s.pkg.package_id,
      rank: i + 1,
      match_score: Number(s.score.toFixed(2)),
      destination_name: s.pkg.destination_name,
      country: s.pkg.country,
      price_pp: s.pkg.price_pp,
      match_reasons: matchReasons,
      trade_offs: tradeOffs,
      availability_status: s.pkg.availability_status,
    };
  });
}
