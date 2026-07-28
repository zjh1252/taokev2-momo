### Task 7: 播放页 150% 缩放左右留白（#13）

**Files:**
- Modify: `frontend/src/features/video/components/play/VideoPlayPageContent.tsx`
- Modify: `frontend/src/app/[locale]/(public)/videos/[id]/play/page.tsx`（仅当外层宽度需收紧）

**Interfaces:**
- Produces: 播放器 + 评价卡在高缩放下仍两侧有可见留白、不出现「左极宽右无空」

- [ ] **Step 1: 调整播放区网格**

将：

```tsx
<div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-stretch">
```

改为更稳健的比例，并保证侧栏不被挤没：

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] gap-6 items-stretch max-w-6xl mx-auto w-full">
```

同步：

- 侧栏 `hidden xl:block` → `hidden lg:block`（与断点一致）
- 移动端评价卡 `xl:hidden` → `lg:hidden`

外层 page 已有 `max-w-[1280px] mx-auto`；若 150% 仍左偏，将 page 容器改为 `max-w-6xl`（约 1152px）保持居中。

- [ ] **Step 2: 手工验收**

Chrome 缩放到约 150%：播放页左右留白大致对称；评价卡仍可见；播放器不撑出视口。

- [ ] **Step 3: Commit（仅当用户授权）**

```bash
git add frontend/src/features/video/components/play/VideoPlayPageContent.tsx frontend/src/app/[locale]/(public)/videos/[id]/play/page.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 视频播放页高缩放布局左右留白均衡

EOF
)"
```

---

