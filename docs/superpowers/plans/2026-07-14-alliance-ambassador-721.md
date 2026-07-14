# 推广大使与 721 讲师合作 Implementation Plan

> **For agentic workers:** 已按本计划实施完成。Spec：`docs/superpowers/specs/2026-07-14-alliance-ambassador-721-design.md`

**Goal:** 同构扩展培训合伙人闭环，落地推广大使与 721 讲师合作申请→pending→Admin 审核→站内信。

**Architecture:** 独立表 `alliance_ambassador_applications` / `alliance_lecturer721_applications`；逻辑在 `taoke-user`；Admin 薄编排；C 端与 Admin 列表复制合伙人模式。

**Tech Stack:** Java 21 / Spring Boot 3.5 / JPA / Flyway；Next.js 16（pnpm / bun）

## Global Constraints

- 状态 `1/2/3`；驳回重提新建记录；已通过不可再申
- 大使编号 `AMB_`；721 编号 `L721_` + 时间戳 + 6 位 userId
- 721 仅 ACTIVE TRAINER；签字 canvas → `/uploads/images`
- 通知失败不回滚审核

## Tasks（已完成）

1. Flyway V144 + 权限种子
2. 大使 Service/API + 单测
3. 721 Service/API + 单测（含专家校验）
4. Admin 薄编排 Controllers
5. C 端大使申请 + pending
6. C 端 721 协议/表单/签字/pending
7. Admin 两列表替换占位
8. install 本地 JAR；单测 14 通过
