# Home Banner Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin page for managing the three homepage carousel banners.

**Architecture:** Reuse the existing recommendation slot table and APIs. Treat `HOME_BANNER` as a `BANNER` slot so public homepage banners are not filtered by course publish state. The admin page is a focused client component that lists exactly three banner records, uploads replacement images through the existing OSS image upload helper, and saves title/description overrides through the recommendation API.

**Tech Stack:** Spring Boot/JPA/Flyway, Next.js 16 admin frontend, React Query, shadcn-ui, existing OSS upload proxy.

---

### Task 1: Banner Recommendation Type

**Files:**
- Modify: `backend/taoke-course/src/main/java/com/taoke/course/enums/RecommendationSlot.java`
- Modify: `backend/taoke-course/src/main/java/com/taoke/course/service/cms/PublicRecommendationServiceImpl.java`
- Modify: `admin-frontend/src/features/recommendations/api/types.ts`
- Create: `backend/taoke-app/src/main/resources/db/migration/V134__seed_home_banner_recommendations.sql`

- [ ] Change `HOME_BANNER` resource type from `COURSE` to `BANNER`.
- [ ] Allow public recommendation rows with `resourceType = BANNER` to pass publish filtering.
- [ ] Extend admin frontend recommendation slot type union with `BANNER`.
- [ ] Seed three `HOME_BANNER` rows with the current homepage image and 2026 titles.
- [ ] Run Flyway migration validator for version 134.

### Task 2: Admin API Reuse

**Files:**
- Use existing: `admin-frontend/src/features/recommendations/api/service.ts`
- Use existing: `admin-frontend/src/features/materials/api/service.ts`

- [ ] Use `getRecommendations('HOME_BANNER')` to load configured banners.
- [ ] Use `addRecommendation()` only for missing fixed banner records.
- [ ] Use `updateRecommendation()` to persist title, description, and cover URL.
- [ ] Use `uploadImageFile()` for OSS-backed image uploads.

### Task 3: Admin Page

**Files:**
- Create: `admin-frontend/src/app/dashboard/banners/page.tsx`
- Create: `admin-frontend/src/features/banners/components/banner-manager.tsx`
- Modify: `admin-frontend/src/config/nav-config.ts`

- [ ] Add a `轮播图管理` menu item under `平台运营管理`.
- [ ] Add a `PageContainer` page at `/dashboard/banners`.
- [ ] Build a three-slot banner manager matching existing admin card/form styling.
- [ ] Show image preview, upload button, title input, description textarea, and save button per slot.
- [ ] Initialize missing rows with `/statics/images/hero-banner.jpg` and `淘课网2026年度专题`.

### Task 4: Verification

**Files:**
- Verify changed backend/frontend files only.

- [ ] Search repository for remaining visible `2024专题` strings outside generated/build output.
- [ ] Run `python data-trans/scripts/_validate_flyway_migration.py --version 134`.
- [ ] Run `bun lint` in `admin-frontend`.
- [ ] Do not run Maven.
