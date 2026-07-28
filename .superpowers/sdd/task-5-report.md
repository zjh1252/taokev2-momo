# Task 5 Report: 视频分类只保留一级 + 单测（#14）

## 状态

✅ 完成

## Commit

```
a984671f fix(frontend): 视频播放页分类标签仅保留一级
```

变更文件：
- `frontend/src/features/video/utils/category-tags.ts`（新建）
- `frontend/src/features/video/utils/category-tags.test.ts`（新建）
- `frontend/src/features/video/components/play/VideoPlayPageContent.tsx`（改用 `buildVideoCategoryTags`）

## TDD 证据

### RED

命令：
```bash
cd frontend && pnpm exec vitest run src/features/video/utils/category-tags.test.ts
```

输出：
```
 FAIL  src/features/video/utils/category-tags.test.ts
Error: Cannot find module './category-tags' imported from .../category-tags.test.ts

 Test Files  1 failed (1)
      Tests  no tests
```

### GREEN

命令：
```bash
cd frontend && pnpm exec vitest run src/features/video/utils/category-tags.test.ts
```

输出：
```
 Test Files  1 passed (1)
      Tests  2 passed (2)
   Duration  216ms
```

## 实现摘要

- `buildVideoCategoryTags` 仅返回一级 `categoryName`（最多 1 项），忽略 `subCategory*` 与 `keywords`
- `VideoPlayPageContent` 删除内联拼接逻辑，改为 `useMemo(() => buildVideoCategoryTags(video), [video])`

## 关注点

- 无。单测覆盖「有二级/关键词时只出一级」与「无 categoryName 时为空」两种场景。
