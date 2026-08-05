# Home City Channel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the C-end homepage city channel module to match the provided “城市公开课频道” reference.

**Architecture:** Keep the existing homepage data flow and replace only `CityChannelCard` rendering. The component will merge backend `ActiveCityItem` data with local display metadata and read all PNG assets from `/statics/images/city/`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS, `next/image`, `lucide-react`, project i18n `Link`.

---

### Task 1: Replace CityChannelCard Layout

**Files:**
- Modify: `frontend/src/features/city/components/CityChannelCard.tsx`

- [x] **Step 1: Preserve the public component contract**

Keep this prop shape unchanged so `frontend/src/app/[locale]/(public)/page.tsx` needs no change:

```tsx
interface CityChannelCardProps {
  cities: ActiveCityItem[];
}
```

- [x] **Step 2: Add local city display metadata**

Inside `CityChannelCard.tsx`, define arrays for the three feature cities and the small city grid. Each item must include `enName`, `cityName`, image path, fallback course count, and optional monthly count.

- [x] **Step 3: Add a helper to merge backend and fallback city data**

Create a helper that finds a matching backend city by `enName` or `cityName`, then returns stable display data:

```tsx
function resolveCity(cities: ActiveCityItem[], item: CityDisplayItem): ResolvedCity {
  const match = cities.find(
    (city) => city.enName === item.enName || city.cityName === item.cityName
  );

  return {
    ...item,
    courseCount: match?.courseCount ?? item.fallbackCourseCount,
    href: cityChannelPath(match?.enName ?? item.enName)
  };
}
```

- [x] **Step 4: Implement the new visual structure**

Render:
- title and right-side action pills
- static segmented filter bar
- three large city cards using `/statics/images/city/城市名片，*.png`
- small city grid using `/statics/images/city/*.png`
- bottom demand CTA linking to `/publish-demand`

- [x] **Step 5: Keep responsive constraints stable**

Use fixed card heights and responsive grids:
- feature cards: `grid-cols-1 lg:grid-cols-3`
- small cards: `grid-cols-2 md:grid-cols-3 xl:grid-cols-6`
- filter bar: horizontal scroll on mobile

### Task 2: Verify Frontend

**Files:**
- Verify: `frontend/src/features/city/components/CityChannelCard.tsx`

- [x] **Step 1: Run lint**

Run:

```bash
cd frontend
pnpm lint
```

Expected: command exits 0 or only reports pre-existing unrelated issues.

- [x] **Step 2: Visual check**

Run the frontend dev server and open the homepage. Check desktop and mobile widths for:
- city images load from `/statics/images/city/`
- no text overlaps
- feature cards and small cards match the reference structure
- links point to city pages, `/opencourses`, and `/publish-demand`
