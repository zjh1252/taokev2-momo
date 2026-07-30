# Task 1 Report — D1 PublicCourseListCache 城市可缓存

**Status:** DONE  
**Date:** 2026-07-29  
**Commit:** `0c3b146d` — perf(course): 允许单城公开课列表走 Redis 缓存

## 目标

扩展 `PublicCourseListCache`，使城市综合页（沪/京）SSR 使用的单城 + `size=10` + `ENROLLING` + `sortBy=time` 公开课列表查询可命中 Redis，且不改变前端 `CityUpcomingOpenBlock` 查询参数。

## TDD 过程

| 阶段 | 结果 |
|------|------|
| RED — 新增 3 个单测后跑测 | 2 failures（`isCacheable` 拒绝单城 ENROLLING；`listKey` 沪京相同） |
| GREEN — 实现后跑测 | 3/3 PASS |

```bash
cd backend
mvn -pl taoke-course -Dtest=PublicCourseListCacheTest test
# Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

## 改动摘要

### `PublicCourseListCache.java`

1. **`CACHEABLE_SIZES`** 增加 `10`（`Set.of(10, 15, 30, 36)`）。
2. **`isCacheableDefault`**：
   - 新增 `isCacheableCityIds`：`null`/空 **或** 恰好 1 个城市 → 可缓存；多城 → false。
   - 新增 `isCacheableEnrollStatus`：`null`/blank **或** `ENROLLING`（忽略大小写 trim）→ 可缓存；其它 → false。
   - 移除原先对 `cityIds` / `enrollStatus` 的一刀切拒绝逻辑。
3. **`listKey`** 格式扩展为含城市与报名维度：
   - 无城 → `c0`；单城 → `c{id}`
   - 无 enroll → `e_`；否则 → `e{UPPERCASE}`
   - 示例：`taoke:course:public:list:open:time:p1:s10:c2:eENROLLING`
4. **`evictPublicListCaches`** 保持只清无城默认组合（`c0:e_` 后缀），不扫城市维 key；城市 key 依赖 ~60min TTL + jitter。

### `PublicCourseListCacheTest.java`（新建）

- `isCacheable_singleCityEnrollingSize10`
- `isCacheable_rejectsMultiCity`
- `listKey_differsByCity`（反射调用 private `listKey`，断言沪/京 key 不同且含 `:c2:`/`:c1:`/`:eENROLLING`）

## 自审

| 检查项 | 结论 |
|--------|------|
| 与设计 §2.2 一致 | ✅ |
| 多城不缓存、非 ENROLLING 不缓存 | ✅ 单测 + 逻辑 |
| 不同 cityId 不串缓存 | ✅ key 含 `c{id}` |
| evict 不扫城市 key | ✅ 未改 evict 范围，仅对齐 `c0:e_` |
| 前端查询参数未改 | ✅ 无 frontend 改动 |
| 旧无后缀 Redis key | ⚠️ 无城默认 key 格式变更（加 `:c0:e_`）；evict 已对齐新格式；旧 key 靠 TTL 自然过期，保留 legacy `internal:p1:s15` 清理 |

## 验收建议（部署后）

1. 访问 `/city/shanghai` 或 `/city/beijing`，二次 SSR 观察 Redis hit（key 含 `c2`/`c1` + `eENROLLING`）。
2. 确认列表口径与改前一致。
3. 切换城市确认不串数据。

## 文件清单

- Modified: `backend/taoke-course/src/main/java/com/taoke/course/support/PublicCourseListCache.java`
- Created: `backend/taoke-course/src/test/java/com/taoke/course/support/PublicCourseListCacheTest.java`
