/**
 * C + SSR 快速验证：筛选+分页 URL，以及详情返回
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';

const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9353;
const OUT_DIR = path.resolve('scripts/.trainer-back-test-out');
const BASE = 'http://localhost:3000';

async function cdp(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1e9);
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const text = typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString('utf8');
      const parsed = JSON.parse(text);
      if (parsed.id !== id) return;
      ws.removeEventListener('message', onMessage);
      if (parsed.error) reject(new Error(JSON.stringify(parsed.error)));
      else resolve(parsed.result);
    };
    ws.addEventListener('message', onMessage);
  });
}

async function evalJson(ws, expression) {
  const { result, exceptionDetails } = await cdp(ws, 'Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.text || 'eval exception');
  return result?.value;
}

async function clickCenter(ws, x, y) {
  await cdp(ws, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp(ws, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp(ws, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // SSR 探针
  const ssrPage2 = await fetch(`${BASE}/trainer/page=2.htm`).then(async (r) => ({
    status: r.status,
    finalUrl: r.url,
    hasActiveHint: /bg-primary/.test(await r.text()),
  }));
  const ssrField = await fetch(`${BASE}/trainer/field=${encodeURIComponent('经营战略')}&page=2.htm`).then(async (r) => ({
    status: r.status,
    len: (await r.text()).length,
  }));

  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${path.join(OUT_DIR, 'chrome-c')}`,
    '--headless=new', '--no-first-run', '--window-size=1440,900', 'about:blank',
  ], { stdio: 'ignore' });

  const report = { ssrPage2, ssrField, ok: false };
  try {
    await sleep(1200);
    await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' }).catch(() => null);
    await sleep(300);
    const pages = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
    const page = pages.find((p) => p.type === 'page' && p.webSocketDebuggerUrl);
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    await cdp(ws, 'Page.enable');
    await cdp(ws, 'Runtime.enable');

    const url = `${BASE}/trainer/field=${encodeURIComponent('经营战略')}&page=2.htm`;
    await cdp(ws, 'Page.navigate', { url });
    await sleep(5000);

    let snap = await evalJson(ws, `(() => ({
      href: location.href,
      pathname: location.pathname,
      activePage: Array.from(document.querySelectorAll('button')).filter(b=>/^\\d+$/.test((b.textContent||'').trim())).find(b=>b.className.includes('bg-primary'))?.textContent?.trim(),
      cardCount: document.querySelectorAll('div.grid a[href*="/trainer/"]').length,
    }))()`);
    report.open = snap;
    if (!/page=2/.test(snap.pathname) || !/field=/.test(snap.pathname) || snap.activePage !== '2') {
      throw new Error(`open failed: ${JSON.stringify(snap)}`);
    }

    const card = await evalJson(ws, `(() => {
      const a = document.querySelector('div.grid a[href*="/trainer/"]');
      if (!a) return null;
      a.scrollIntoView({ block: 'center' });
      const r = a.getBoundingClientRect();
      return { href: a.href, x: r.x + 40, y: r.y + 20 };
    })()`);
    if (!card) throw new Error('no card');
    await clickCenter(ws, card.x, card.y);
    await sleep(4000);
    const onDetail = await evalJson(ws, `({ href: location.href })`);
    report.onDetail = onDetail;
    if (!/trainer\/\d+/.test(onDetail.href)) throw new Error(`not detail: ${onDetail.href}`);

    await evalJson(ws, 'history.back()');
    await sleep(4000);
    snap = await evalJson(ws, `(() => ({
      href: location.href,
      pathname: location.pathname,
      activePage: Array.from(document.querySelectorAll('button')).filter(b=>/^\\d+$/.test((b.textContent||'').trim())).find(b=>b.className.includes('bg-primary'))?.textContent?.trim(),
      cardCount: document.querySelectorAll('div.grid a[href*="/trainer/"]').length,
    }))()`);
    report.afterBack = snap;
    report.ok = /page=2/.test(snap.pathname)
      && /field=/.test(snap.pathname)
      && snap.activePage === '2'
      && snap.cardCount > 0;
    if (!report.ok) throw new Error(`back failed: ${JSON.stringify(snap)}`);
  } catch (e) {
    report.error = e instanceof Error ? e.message : String(e);
  } finally {
    chrome.kill();
  }

  await writeFile(path.join(OUT_DIR, 'report-c.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
