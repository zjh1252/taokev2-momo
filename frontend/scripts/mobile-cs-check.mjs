/**
 * 登录后打开在线客服，实测移动端抽屉是否在视口内
 * Usage: node scripts/mobile-cs-check.mjs
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';

const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9335;
const VIEWPORT = { width: 390, height: 844 };
const OUT_DIR = path.resolve('scripts/.mobile-test-out');
const API = process.env.API_BASE || 'http://localhost:8080';
const USER = process.env.TEST_USER || '18675796459';
const PASS = process.env.TEST_PASS || '123456';

async function cdp(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1e9);
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const raw = event.data;
      const text = typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8');
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return;
      }
      if (parsed.id !== id) return;
      ws.removeEventListener('message', onMessage);
      if (parsed.error) reject(new Error(JSON.stringify(parsed.error)));
      else resolve(parsed.result);
    };
    ws.addEventListener('message', onMessage);
  });
}

async function login() {
  const res = await fetch(`${API}/auth/login/username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  const json = await res.json();
  if (json.code !== 0 || !json.data?.accessToken) {
    throw new Error(`login failed: ${JSON.stringify(json)}`);
  }
  return {
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken,
    expiresIn: json.data.expiresIn ?? 7200,
    tokenType: json.data.tokenType ?? 'Bearer',
  };
}

async function connectPage() {
  await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' }).catch(() => null);
  await sleep(300);
  const pages = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
  const page = pages.find((p) => p.type === 'page' && p.webSocketDebuggerUrl);
  if (!page) throw new Error('No page target');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve(), { once: true });
    ws.addEventListener('error', (e) => reject(e), { once: true });
  });
  return ws;
}

const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + process.env.TEMP + '\\tk-chrome-cs-check',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

try {
  await mkdir(OUT_DIR, { recursive: true });
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(`http://127.0.0.1:${PORT}/json/version`);
      break;
    } catch {
      await sleep(200);
    }
  }

  const ws = await connectPage();
  await cdp(ws, 'Page.enable');
  await cdp(ws, 'Runtime.enable');
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', {
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // 首页无需登录即可点悬浮客服
  await cdp(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(3500);

  // 点击悬浮「在线客服」
  await cdp(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes('在线客服'));
      if (!btn) throw new Error('在线客服按钮未找到');
      btn.click();
      return true;
    })()`,
  });
  await sleep(2500);

  const { result } = await cdp(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const title = [...document.querySelectorAll('h2,h3,[data-slot="sheet-title"],[data-slot="dialog-title"]')]
        .find((el) => (el.textContent || '').includes('淘课网客服') || (el.textContent || '').includes('客服'));
      const sheet = document.querySelector('[data-slot="sheet-content"]');
      const dialog = document.querySelector('[data-slot="dialog-content"]');
      const panel = sheet || dialog;
      const iframe = panel?.querySelector('iframe');
      const r = panel?.getBoundingClientRect();
      const eps = 2;
      return {
        vw,
        vh,
        url: location.href,
        hasSheet: !!sheet,
        hasDialog: !!dialog,
        hasTitle: !!(title || (panel && (panel.innerText || '').includes('淘课网客服'))),
        hasIframe: !!iframe,
        panel: r
          ? {
              left: Math.round(r.left),
              right: Math.round(r.right),
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
              width: Math.round(r.width),
              height: Math.round(r.height),
            }
          : null,
        withinViewport: r
          ? r.left >= -eps && r.right <= vw + eps && r.top >= -eps && r.bottom <= vh + eps
          : false,
        isBottomDrawer: r ? r.width >= vw - 8 && r.bottom >= vh - 8 && r.height >= vh * 0.6 : false,
        pageScrollWidth: document.documentElement.scrollWidth,
        pageClientWidth: document.documentElement.clientWidth,
      };
    })()`,
    returnByValue: true,
  });

  const shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(path.join(OUT_DIR, 'cs-mobile.png'), Buffer.from(shot.data, 'base64'));
  ws.close();

  const m = result.value;
  console.log(JSON.stringify(m, null, 2));
  console.log('screenshot:', path.join(OUT_DIR, 'cs-mobile.png'));

  const ok =
    m.hasSheet &&
    !m.hasDialog &&
    m.hasTitle &&
    m.hasIframe &&
    m.withinViewport &&
    m.isBottomDrawer &&
    m.pageScrollWidth <= m.pageClientWidth + 1;

  if (!ok) {
    console.error('❌ mobile CS drawer check FAILED');
    process.exitCode = 1;
  } else {
    console.log('✅ mobile CS drawer check PASSED');
  }
} catch (e) {
  console.error('ERROR', e.message || e);
  process.exitCode = 1;
} finally {
  chrome.kill();
}
