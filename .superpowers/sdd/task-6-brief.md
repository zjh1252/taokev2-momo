### Task 6: Video.js 中文控件（#12）

**Files:**
- Modify: `frontend/src/features/video/components/player/VideoJsPlayer.tsx`
- Modify: `frontend/src/features/video/components/player/video-player.css`（仅当语言包未覆盖时兜底）

**Interfaces:**
- Produces: player `language: 'zh-CN'`

- [ ] **Step 1: 注册中文语言包**

在 `VideoJsPlayer.tsx`：

```tsx
import zhCN from 'video.js/dist/lang/zh-CN.json';

// 模块级注册一次即可
videojs.addLanguage('zh-CN', zhCN);
```

初始化选项增加：

```tsx
const player = videojs(videoEl, {
  controls: true,
  fill: true,
  language: 'zh-CN',
  // ...其余不变
});
```

- [ ] **Step 2: 确认全屏按钮位置**

Video.js 默认全屏在 controlBar 右侧。若被自定义 skin 打乱，在 `video-player.css` 用 flex order 保证 `.vjs-fullscreen-control` 靠右，**不要**大改皮肤。

- [ ] **Step 3: 手工验收**

打开 `/videos/{id}/play`：控制条可见「全屏」等中文；全屏在右下可用。

- [ ] **Step 4: Commit（仅当用户授权）**

```bash
git add frontend/src/features/video/components/player/VideoJsPlayer.tsx frontend/src/features/video/components/player/video-player.css
git commit -m "$(cat <<'EOF'
fix(frontend): Video.js 播放器控件切换为中文

EOF
)"
```

---

