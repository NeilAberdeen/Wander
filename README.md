# Wander — TikTok-style travel inspiration prototype

Swipe for the feeling. Chat to refine it. Book a real trip.

A working Next.js prototype of the product spec: a full-screen swipeable
inspiration feed, a chat refinement screen, and a real-trips screen backed
entirely by mock inventory. The "LLM" is simulated with rule-based logic in
`lib/mockLLM.ts` so the prototype runs with no API key — swap that file for
a real Claude/OpenAI-compatible call later without touching anything else.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Best viewed at a mobile width (it's capped at
480px and centred on desktop).

## What's real vs. what's mocked

- `lib/mockInventory.ts` — 24 packages across the 10 spec destinations
  (Puglia, Lisbon, Menorca, Palermo, Chania, Madeira, Valencia, Dubrovnik,
  Ibiza, Mallorca). This is the **only** source of price, dates, flight
  times, and availability.
- `lib/inspirationCards.ts` — the Discover feed cards. All but one are
  linked to real `source_package_ids`; one (Kyoto) is deliberately marked
  `idea_only` to demonstrate the "idea only" vs "available holiday" UI rule.
- `lib/mockLLM.ts` — stands in for the LLM: turns swipes into a
  `UserPreferenceProfile`, derives a `StructuredTravelIntent`, decides
  whether to ask a clarifying question, parses free-text chat refinements,
  and explains matches. It never touches price/date/availability fields.
- `lib/ranking.ts` — hard-constraint filtering + scoring, per the ranking
  order in the spec (constraints → mood fit → availability → price → flight
  → hotel quality → diversity).

## Structure

```
app/
  page.tsx              For You / Discover feed
  refine/page.tsx        Chat refinement
  trips/page.tsx          Real trips (bookable matches)
  trips/[packageId]/       Trip detail page (mock booking_url)
  saved/page.tsx          Saved ideas
  profile/page.tsx        Learned taste profile
  api/                    intent/update, inventory/search,
                          recommendations/rank, chat — mirrors spec section 16
components/               FullScreenInspirationCard, ChatRefinementPanel,
                          TripRecommendationCard, InfoSheet, BottomNav
lib/                      types, mock inventory, inspiration cards,
                          mock LLM, ranking, Zustand store
```

## Wiring in a real LLM later

Replace the functions in `lib/mockLLM.ts` (`interpretChatMessage`,
`deriveStructuredIntent`, `explainMatch`, `nextClarifyingQuestion`) with
calls to a Claude/OpenAI-compatible chat endpoint using the system prompt
in the spec (section 17). Keep the function signatures the same and nothing
else in the app needs to change — `lib/ranking.ts` and `lib/mockInventory.ts`
stay the ground truth for price/availability either way.

## Not included (by design)

Accounts, payment, real supplier integration, and a full booking funnel are
out of scope for this prototype (see spec section 21). "View trip" opens a
detail page and links to a placeholder `booking_url`.
