/**
 * CDP 验证后台需求详情「培训地区」渲染
 * 先走 /auth/login 拿 token，写入 access_token cookie，再打开详情页断言文案。
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9334;
const OUT_DIR = path.resolve(__dirname, '.demand-region-test-out');
const ADMIN_URL = 'http://localhost:3001/dashboard/demands/2300';

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
  await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' }).catch(() => null);
  await sleep(400);
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

async function loginToken() {
  const res = await fetch('http://localhost:8080/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '18675796459', password: '123456' }),
  });
  const json = await res.json();
  if (json.code !== 0 || !json.data?.accessToken) {
    throw new Error(`login failed: ${JSON.stringify(json)}`);
  }
  return json.data.accessToken;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const token = await loginToken();
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${path.join(OUT_DIR, 'chrome-profile')}`,
    ],
    { stdio: 'ignore' },
  );

  try {
    await sleep(1500);
    const ws = await connectPage();
    await cdp(ws, 'Page.enable');
    await cdp(ws, 'Runtime.enable');
    await cdp(ws, 'Network.enable');
    await cdp(ws, 'Network.setCookie', {
      name: 'access_token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
    });

    await cdp(ws, 'Page.navigate', { url: ADMIN_URL });
    await sleep(5000);

    const { result } = await cdp(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const text = document.body?.innerText || '';
        const hasLabel = text.includes('培训地区');
        const hasRegion = text.includes('山东省') && text.includes('临沂');
        const hasFormat = text.includes('培训形式') && text.includes('混合');
        const snippet = text.split('\\n').map(s => s.trim()).filter(l => /培训(形式|地区)|山东|临沂|混合/.test(l)).slice(0, 12);
        return { href: location.href, hasLabel, hasRegion, hasFormat, snippet, textLen: text.length };
      })()`,
      returnByValue: true,
    });

    const data = result?.value || result;
    await writeFile(path.join(OUT_DIR, 'result.json'), JSON.stringify(data, null, 2), 'utf8');
    const shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png' });
    await writeFile(path.join(OUT_DIR, 'demand-2300.png'), Buffer.from(shot.data, 'base64'));
    ws.close();

    const pass = Boolean(data?.hasLabel && data?.hasRegion && data?.hasFormat);
    console.log(JSON.stringify({ pass, ...data }, null, 2));
    if (!pass) process.exitCode = 1;
  } finally {
    chrome.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
