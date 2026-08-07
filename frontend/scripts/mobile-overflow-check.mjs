/**
 * 用系统 Chrome headless + CDP 实测移动端是否横向溢出，并截图
 * Usage: node scripts/mobile-overflow-check.mjs
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';

const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const VIEWPORT = { width: 390, height: 844 };
const OUT_DIR = path.resolve('scripts/.mobile-test-out');
const URLS = [
  'http://localhost:3000/',
  'http://localhost:3000/trainers',
  'http://localhost:3000/company',
  'http://localhost:3000/opencourses',
  'http://localhost:3000/dashboard',
];

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

async function connectPage() {
  // 先开一个空白页，再连 page 级 websocket（version 端点是 browser 级，没有 Page.*）
  await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' }).catch(() => null);
  await sleep(300);
  const pages = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
  const page = pages.find((p) => p.type === 'page' && p.webSocketDebuggerUrl);
  if (!page) throw new Error('No page target found');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve(), { once: true });
    ws.addEventListener('error', (e) => reject(e), { once: true });
  });
  return ws;
}

async function measure(ws, url, shotName) {
  await cdp(ws, 'Page.enable');
  await cdp(ws, 'Runtime.enable');
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', {
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await cdp(ws, 'Page.navigate', { url });
  await sleep(3500);

  const { result } = await cdp(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
      const clientWidth = docEl.clientWidth;
      const overflow = scrollWidth - clientWidth;
      const offenders = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.right > clientWidth + 2) {
          const cls = (typeof el.className === 'string' ? el.className : '').slice(0, 100);
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls,
            right: Math.round(r.right),
            width: Math.round(r.width),
            text: (el.innerText || '').replace(/\\s+/g, ' ').slice(0, 48),
          });
          if (offenders.length >= 15) break;
        }
      }
      return {
        url: location.href,
        clientWidth,
        scrollWidth,
        overflow,
        hasHorizontalScroll: overflow > 1,
        bodyTextHints: {
          filterTrainer: document.body.innerText.includes('筛选讲师'),
          filterCourse: document.body.innerText.includes('筛选课程'),
          filterOrg: document.body.innerText.includes('筛选机构'),
          categoryBtn: /课程分类|全部分类/.test(document.body.innerText),
          desktopFilterAside: document.body.innerText.includes('讲师筛选条件'),
          hamburger: !!document.querySelector('button[aria-label="打开导航菜单"]'),
          ucMenuBtn: document.body.innerText.includes('用户中心菜单'),
          ucSidebarAlways: document.body.innerText.includes('我的淘课网') && document.body.innerText.includes('消息中心') && !document.body.innerText.includes('用户中心菜单'),
        },
        offenders,
      };
    })()`,
    returnByValue: true,
  });

  const shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(path.join(OUT_DIR, shotName), Buffer.from(shot.data, 'base64'));

  return result.value;
}

const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + process.env.TEMP + '\\tk-chrome-overflow-check2',
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
  const rows = [];
  const names = ['home', 'trainers', 'company', 'opencourses', 'dashboard'];
  for (let i = 0; i < URLS.length; i++) {
    const m = await measure(ws, URLS[i], `${names[i]}.png`);
    rows.push(m);
    console.log(JSON.stringify(m, null, 2));
    console.log('---');
  }
  ws.close();

  const bad = rows.filter((r) => r.hasHorizontalScroll);
  const desktopAsideLeak = rows.filter((r) => r.bodyTextHints?.desktopFilterAside);
  if (bad.length) {
    console.error(`\\n❌ ${bad.length}/${rows.length} pages still have horizontal overflow`);
    process.exitCode = 1;
  } else {
    console.log(`\\n✅ All ${rows.length} pages: scrollWidth == clientWidth at ${VIEWPORT.width}px`);
  }
  if (desktopAsideLeak.length) {
    console.error(`❌ Desktop filter aside still visible on mobile: ${desktopAsideLeak.map((r) => r.url).join(', ')}`);
    process.exitCode = 1;
  }
  console.log(`Screenshots: ${OUT_DIR}`);
} finally {
  chrome.kill();
}
