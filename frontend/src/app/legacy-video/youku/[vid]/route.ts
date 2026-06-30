import { NextRequest, NextResponse } from 'next/server';

const YOUKU_CLIENT_ID = '0edbfd2e4fc91b72';
const YOUKU_VID_RE = /^X[A-Za-z0-9=_-]+$/;

type RouteContext = { params: Promise<{ vid: string }> };

function renderYoukuPlayerHtml(vid: string, request: NextRequest): string {
  const autoplay = request.nextUrl.searchParams.get('autoplay') === '1';
  const safeVid = JSON.stringify(vid);
  const safeAutoplay = autoplay ? 'true' : 'false';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="origin">
  <title>视频播放</title>
  <style>
    html, body, #youku-player {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #000;
    }
    .fallback {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: rgba(255, 255, 255, 0.82);
      font: 14px/1.8 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="youku-player"></div>
  <div id="fallback" class="fallback" hidden>播放器加载失败，请稍后刷新重试</div>
  <script src="https://player.youku.com/iframeapi"></script>
  <script>
    (function () {
      var fallback = document.getElementById('fallback');

      function showFallback() {
        if (fallback) fallback.hidden = false;
      }

      function boot() {
        if (!window.YKU || !window.YKU.Player) {
          showFallback();
          return;
        }
        try {
          new window.YKU.Player('youku-player', {
            styleid: '0',
            client_id: '${YOUKU_CLIENT_ID}',
            vid: ${safeVid},
            autoplay: ${safeAutoplay},
            isAutoplayMute: false
          });
        } catch (error) {
          showFallback();
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
      } else {
        boot();
      }
    })();
  </script>
</body>
</html>`;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { vid } = await context.params;
  if (!YOUKU_VID_RE.test(vid)) {
    return new NextResponse('Invalid Youku video id', { status: 400 });
  }

  return new NextResponse(renderYoukuPlayerHtml(vid, request), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
