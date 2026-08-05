# 首页轮播图与平台优势区调整 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 首页轮播图改为自动轮播 + 图片按钮，后台分别维护大图与两个按钮图；平台优势区承接原 H1 文案并精简 CTA。

**Architecture:** 在 `recommended_resources` 新增 `consult_button_image_url`、`topic_button_image_url` 两列，贯通管理端/C 端 VO；C 端 `HeroSection` 移除文字遮罩，叠加按钮图并启用自动轮播；`AiMatchBanner` 调整文案与按钮；默认素材指向 `frontend/public/statics/images/banner改`。

**Tech Stack:** Spring Boot/JPA/Flyway, Next.js 16 (frontend pnpm + admin-frontend bun)

---

### Task 1: 后端字段与迁移

**Files:**
- Create: `backend/taoke-app/src/main/resources/db/migration/V139__add_home_banner_button_image_urls.sql`
- Modify: `backend/taoke-course/.../entity/cms/RecommendedResource.java`
- Modify: `RecommendedResourceItemVO.java`, `PublicRecommendedItemVO.java`
- Modify: `AddRecommendedResourceRequest.java`, `UpdateRecommendedResourceRequest.java`
- Modify: `RecommendedResourceEnricher.java`, `RecommendedResourceServiceImpl.java`, `PublicRecommendationServiceImpl.java`

- [x] 新增两列并 seed 三张轮播图默认大图/按钮图 URL
- [x] Entity/DTO/Service 映射新字段
- [x] 运行 `python data-trans/scripts/_validate_flyway_migration.py --version 139`

### Task 2: 后台轮播图管理

**Files:**
- Modify: `admin-frontend/src/features/recommendations/api/types.ts`
- Modify: `admin-frontend/src/features/banners/components/banner-manager.tsx`

- [x] 移除顶部小字/H1/描述字段
- [x] 新增立即咨询、查看专题按钮图上传与地址
- [x] 默认素材改为 `banner改` 目录

### Task 3: C 端首页轮播

**Files:**
- Modify: `frontend/src/features/home/types.ts`
- Modify: `frontend/src/features/home/api/load-home-data.ts`
- Modify: `frontend/src/features/home/components/HeroSection.tsx`
- Modify: `frontend/src/features/recommendation/api/types.ts`

- [x] 自动轮播（保留左右切换与分页点）
- [x] 移除文字遮罩，叠加两个图片按钮
- [x] API/本地 fallback 使用新字段与默认素材

### Task 4: 平台优势红色区域

**Files:**
- Modify: `frontend/src/features/home/components/AiMatchBanner.tsx`
- Modify: `frontend/src/messages/zh-CN/home.json`

- [x] H1 文案放在「平台优势」后
- [x] 删除描述小字与智能客服按钮，保留发布需求

### Task 5: 验证

- [x] `mvn -pl taoke-app -am compile`（backend/）
- [x] `python data-trans/scripts/_validate_flyway_migration.py --version 139`
- [x] `pnpm lint`（frontend/）
- [x] `bun lint`（admin-frontend/）
