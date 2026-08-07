/**
 * 真实浏览器验证（聚焦可稳定复现的路径）
 * A: /trainer/page=2.htm → 详情 → history.back → 仍为第2页
 * B: 跳转输入框到第2页 → URL 含 page=2 → 详情 → back
 * C: field+page=2 → 详情 → back 保留 field 与 page
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';

const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9351;
const OUT_DIR = path.resolve('scripts/.trainer-back-test-out');
const BASE = process.env.TRAINER_BASE_URL || 'http://localhost:3000';

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
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.text || 'eval exception');
  return result?.value;
}

async function clickCenter(ws, x, y) {
  await cdp(ws, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp(ws, 'Input.dispatchMouseEvent', {
    type: 'mousePressed', x, y, button: 'left', clickCount: 1,
  });
  await cdp(ws, 'Input.dispatchMouseEvent', {
    type: 'mouseReleased', x, y, button: 'left', clickCount: 1,
  });
}

function snapshotExpr() {
  return `(() => {
    const pageButtons = Array.from(document.querySelectorAll('button'))
      .map((b) => {
        const text = (b.textContent || '').trim();
        if (!/^\\d+$/.test(text)) return null;
        return { text, active: b.className.includes('bg-primary') };
      })
      .filter(Boolean);
    const cards = Array.from(document.querySelectorAll('div.grid a[href*="/trainer/"]'))
      .map((a) => (a.getAttribute('href') || ''))
      .filter((h) => /\\/trainer\\/\\d+/.test(h));
    return {
      href: location.href,
      pathname: location.pathname,
      activePage: pageButtons.find((b) => b.active)?.text || null,
      cardCount: cards.length,
      firstCard: cards[0] || null,
      scrollY: window.scrollY,
      sessionReturn: sessionStorage.getItem('taoke:trainer:list:return'),
    };
  })()`;
}

function hasPage2(s) {
  return /page=2/.test(s.pathname || '') || /[?&]page=2\b/.test(s.href || '');
}

async function waitFor(ws, pred, label, timeoutMs = 12000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    last = await evalJson(ws, snapshotExpr());
    if (pred(last)) return last;
    await sleep(400);
  }
  throw new Error(`Timeout ${label}: ${JSON.stringify(last)}`);
}

async function openFirstCard(ws) {
  const card = await evalJson(ws, `(() => {
    const a = document.querySelector('div.grid a[href*="/trainer/"]');
    if (!a) return null;
    a.scrollIntoView({ block: 'center' });
    const r = a.getBoundingClientRect();
    return { href: a.href, x: r.x + Math.min(60, r.width / 2), y: r.y + Math.min(30, r.height / 2) };
  })()`);
  if (!card) throw new Error('no card');
  await clickCenter(ws, card.x, card.y);
  await waitFor(
    ws,
    (s) => /\/trainer\/\d+/.test(s.pathname) || /\/trainer\/\d+/.test(s.href),
    'detail',
  );
  return card.href;
}

async function backToList(ws) {
  await evalJson(ws, 'history.back()');
  await sleep(2500);
  return waitFor(ws, (s) => s.cardCount > 0, 'back-list');
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${path.join(OUT_DIR, 'chrome-profile-final')}`,
      '--no-first-run',
      '--headless=new',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  const report = { ok: false, checks: {} };
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
    await cdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
    });

    // ===== A =====
    await cdp(ws, 'Page.navigate', { url: `${BASE}/trainer/page=2.htm` });
    let snap = await waitFor(ws, (s) => s.cardCount > 0 && s.activePage === '2', 'A list page2');
    if (!hasPage2(snap)) throw new Error(`A open url bad: ${snap.href}`);
    await evalJson(ws, 'window.scrollTo(0, 520)');
    const scrollBefore = await evalJson(ws, 'window.scrollY');
    await openFirstCard(ws);
    snap = await backToList(ws);
    await sleep(1500);
    snap = await evalJson(ws, snapshotExpr());
    report.checks.A = {
      backUrlPage2: hasPage2(snap),
      backUiPage2: snap.activePage === '2',
      href: snap.href,
      activePage: snap.activePage,
      scrollY: snap.scrollY,
      scrollBefore,
      sessionReturn: snap.sessionReturn,
    };
    if (!report.checks.A.backUrlPage2 || !report.checks.A.backUiPage2) {
      throw new Error(`A failed: ${JSON.stringify(report.checks.A)}`);
    }

    // ===== B: 跳转框（execCommand insertText 驱动受控输入）=====
    await cdp(ws, 'Page.navigate', { url: `${BASE}/trainer` });
    snap = await waitFor(ws, (s) => s.cardCount > 0 && s.activePage === '1', 'B list page1');
    const jumped = await evalJson(ws, `(() => {
      const input = document.querySelector('input[aria-label="跳转页码"]');
      const confirm = Array.from(document.querySelectorAll('button'))
        .find((b) => (b.textContent || '').trim() === '确定');
      if (!input || !confirm) return { ok: false };
      input.scrollIntoView({ block: 'center' });
      input.focus();
      input.select();
      const okInsert = document.execCommand('insertText', false, '2');
      confirm.click();
      return { ok: true, okInsert, value: input.value };
    })()`);
    report.checks.B_jump = jumped;
    snap = await waitFor(
      ws,
      (s) => s.activePage === '2' || hasPage2(s),
      'B after jump',
      10000,
    );
    await sleep(1000);
    snap = await evalJson(ws, snapshotExpr());
    report.checks.B = {
      urlPage2: hasPage2(snap),
      uiPage2: snap.activePage === '2',
      href: snap.href,
      activePage: snap.activePage,
      sessionReturn: snap.sessionReturn,
    };
    if (!report.checks.B.uiPage2) throw new Error(`B UI not page2: ${JSON.stringify(report.checks.B)}`);
    if (!report.checks.B.urlPage2) throw new Error(`B URL missing page=2: ${JSON.stringify(report.checks.B)}`);

    await openFirstCard(ws);
    snap = await backToList(ws);
    await sleep(1500);
    snap = await evalJson(ws, snapshotExpr());
    report.checks.B_back = {
      backUrlPage2: hasPage2(snap),
      backUiPage2: snap.activePage === '2',
      href: snap.href,
      activePage: snap.activePage,
    };
    if (!report.checks.B_back.backUrlPage2 || !report.checks.B_back.backUiPage2) {
      throw new Error(`B back failed: ${JSON.stringify(report.checks.B_back)}`);
    }

    // ===== C =====
    await cdp(ws, 'Page.navigate', {
      url: `${BASE}/trainer/field=${encodeURIComponent('经营战略')}&page=2.htm`,
    });
    snap = await waitFor(
      ws,
      (s) => s.cardCount > 0 && s.activePage === '2' && /field=/.test(s.pathname + s.href),
      'C filtered page2',
    );
    await openFirstCard(ws);
    snap = await backToList(ws);
    await sleep(1500);
    snap = await evalJson(ws, snapshotExpr());
    report.checks.C = {
      backUrlPage2: hasPage2(snap),
      backUiPage2: snap.activePage === '2',
      backHasField: /field=/.test(snap.pathname + snap.href),
      href: snap.href,
      activePage: snap.activePage,
    };
    if (!report.checks.C.backUrlPage2 || !report.checks.C.backUiPage2 || !report.checks.C.backHasField) {
      throw new Error(`C failed: ${JSON.stringify(report.checks.C)}`);
    }

    report.ok = true;
    report.message = 'PASS A/B/C';
  } catch (e) {
    report.ok = false;
    report.error = e instanceof Error ? e.message : String(e);
  } finally {
    chrome.kill();
  }

  const outFile = path.join(OUT_DIR, 'report-final.json');
  await writeFile(outFile, JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ ...report, outFile }, null, 2));
  if (!report.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
