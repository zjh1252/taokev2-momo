# Task 3 Report: 顶栏产品矩阵外链（#9）

**Status:** DONE

**Commit:** `a978eb76` — fix(frontend): 配置顶栏集团产品外链并移除淘课网入口

## Changes

### TopNavBar — `frontend/src/components/layout/top-nav-bar.tsx`

- `GROUP_LINKS` 更新为 6 项真实外链（淘课集团、培训宝、目标通、AI 导师、智能创导、AI 陪练），与 brief 指定 URL 完全一致
- 移除「淘课网」入口（7 项 → 6 项）
- 锚点增加 `target="_blank"` 与 `rel="noopener noreferrer"`，新标签安全打开
- 数组声明为 `as const`

## Verification

| Check | Result |
|-------|--------|
| `pnpm lint -- src/components/layout/top-nav-bar.tsx` | Pass |
| 浏览器手工验收 | 未执行（无本地 dev server） |

## Self-Review

- 六项 label 与 href 与 brief 逐字对齐，无占位 `#` 残留。
- 「淘课网」已从 `GROUP_LINKS` 删除，顶栏仅展示 6 个集团产品入口。
- 外链均带 `noopener noreferrer`，符合安全最佳实践。

## Concerns

- 无功能性顾虑。AI 类产品链接含租户 ID `604996`，若环境变更需同步更新。
- 浏览器点击验收需人工确认六项均可新标签打开且目标页可达。
