# Review Package Task 6

Base: a984671f09402121a93298236b16945a57a64dc1
Head: ff73cd00d19d4ec92b739ac569dde1358a879dd7

## Commits

ff73cd00 fix(frontend): Video.js 播放器控件切换为中文

## Stat

 frontend/src/features/video/components/player/VideoJsPlayer.tsx | 4 ++++
 1 file changed, 4 insertions(+)

## Diff

```diff
diff --git a/frontend/src/features/video/components/player/VideoJsPlayer.tsx b/frontend/src/features/video/components/player/VideoJsPlayer.tsx
index e5a2d803..583199dd 100644
--- a/frontend/src/features/video/components/player/VideoJsPlayer.tsx
+++ b/frontend/src/features/video/components/player/VideoJsPlayer.tsx
@@ -1,15 +1,18 @@
 'use client';
 
 import { useEffect, useRef, useCallback, useMemo } from 'react';
 import videojs from 'video.js';
 import type Player from 'video.js/dist/types/player';
+import zhCN from 'video.js/dist/lang/zh-CN.json';
+
+videojs.addLanguage('zh-CN', zhCN);
 import 'video.js/dist/video-js.css';
 import './video-player.css';
 import { inferVideoMimeType } from '../../lib/playback-sources';
 import { resolveVideoPlaybackSrc } from '@/lib/media';
 import { updateVideoProgress } from '../../api/service';
 
 type VideoJsPlayerProps = {
   src: string;
   poster?: string | null;
   className?: string;
@@ -75,20 +78,21 @@ export function VideoJsPlayer({
 
     const videoEl = document.createElement('video-js');
     videoEl.classList.add('video-js', 'vjs-big-play-centered', 'vjs-fill');
     videoEl.setAttribute('playsinline', '');
     videoEl.setAttribute('referrerpolicy', 'no-referrer');
     container.replaceChildren(videoEl);
 
     const player = videojs(videoEl, {
       controls: true,
       fill: true,
+      language: 'zh-CN',
       autoplay: autoplay ?? false,
       preload: 'metadata',
       poster: poster ?? undefined,
       playbackRates: [0.5, 1, 1.25, 1.5, 2],
       html5: {
         vhs: {
           overrideNative: !useNativeMp4,
         },
       },
       sources: [{ src: playbackUrl, type: mimeType }],

```
