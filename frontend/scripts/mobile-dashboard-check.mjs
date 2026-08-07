/**
 * 登录后实测用户中心移动端布局
 * Usage: node scripts/mobile-dashboard-check.mjs
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';

const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9334;
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
    '--user-data-dir=' + process.env.TEMP + '\\tk-chrome-dashboard-check',
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

  const token = await login();
  console.log('login: ok');

  const ws = await connectPage();
  await cdp(ws, 'Page.enable');
  await cdp(ws, 'Runtime.enable');
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', {
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // 先打开同源页再写 localStorage
  await cdp(ws, 'Page.navigate', { url: 'http://localhost:3000/login' });
  await sleep(1500);
  await cdp(ws, 'Runtime.evaluate', {
    expression: `localStorage.setItem('taoke_token', ${JSON.stringify(JSON.stringify(token))})`,
  });

  await cdp(ws, 'Page.navigate', { url: 'http://localhost:3000/dashboard' });
  await sleep(4500);

  const { result } = await cdp(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
      const clientWidth = docEl.clientWidth;
      const text = body.innerText || '';
      return {
        url: location.href,
        title: document.title,
        clientWidth,
        scrollWidth,
        overflow: scrollWidth - clientWidth,
        hasHorizontalScroll: scrollWidth - clientWidth > 1,
        hamburger: !!document.querySelector('button[aria-label="打开导航菜单"]'),
        ucMenuBtn: text.includes('用户中心菜单'),
        sidebarVisibleInDom: text.includes('我的淘课网') && text.includes('消息中心'),
        welcome: text.includes('欢迎来到用户中心') || text.includes('用户中心'),
        stillOnLogin: location.pathname.includes('/login'),
      };
    })()`,
    returnByValue: true,
  });

  const shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(path.join(OUT_DIR, 'dashboard-authed.png'), Buffer.from(shot.data, 'base64'));
  ws.close();

  const m = result.value;
  console.log(JSON.stringify(m, null, 2));
  console.log('screenshot:', path.join(OUT_DIR, 'dashboard-authed.png'));

  const ok =
    !m.stillOnLogin &&
    !m.hasHorizontalScroll &&
    m.hamburger &&
    m.ucMenuBtn &&
    m.clientWidth === 390;

  if (!ok) {
    console.error('❌ dashboard mobile check FAILED');
    process.exitCode = 1;
  } else {
    console.log('✅ dashboard mobile check PASSED');
  }
} catch (e) {
  console.error('ERROR', e.message || e);
  process.exitCode = 1;
} finally {
  chrome.kill();
}
