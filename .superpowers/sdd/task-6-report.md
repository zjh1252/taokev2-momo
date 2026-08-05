# Task 6 Report: Video.js 中文控件（#12）

## 状态

✅ 完成

## Commit

```
fix(frontend): Video.js 播放器控件切换为中文
```

变更文件：
- `frontend/src/features/video/components/player/VideoJsPlayer.tsx`（注册 `zh-CN` 语言包，`language: 'zh-CN'`）
- `video-player.css` 未改动（默认 controlBar 布局未破坏全屏按钮位置）

## 实现摘要

- 模块级 `videojs.addLanguage('zh-CN', zhCN)`，自 `video.js/dist/lang/zh-CN.json` 导入
- 播放器初始化增加 `language: 'zh-CN'`，控制条 tooltip/菜单文案为中文（如「全屏」「播放」「暂停」）

## 验证

| 项 | 结果 |
|---|---|
| `pnpm exec tsc --noEmit` | ✅ 通过 |
| ESLint（VideoJsPlayer.tsx） | ✅ 无新增问题 |
| 手工 `/videos/{id}/play` 中文控件 + 全屏右下 | ⏳ 需本地打开播放页确认 |

## 备注

全屏按钮仍由 Video.js 默认 controlBar 顺序控制，未额外 CSS 兜底。
