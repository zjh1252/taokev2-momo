/**
 * 验证公开课列表：筛选后进详情再浏览器返回，应保留 categoryIds 筛选。
 * Usage: node scripts/verify-opencourse-filter-back.mjs
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { WebSocket } from 'ws';

const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = Number(process.env.CDP_PORT || 9371);
const OUT_DIR = path.resolve('scripts/.opencourse-filter-back-out');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SKIP_UI = process.env.SKIP_UI === '1';

function cdpFactory(ws) {
  let seq = 1;
  const pending = new Map();
  ws.on('message', (raw) => {
    const msg = JSON.parse(String(raw));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  return (method, params = {}, timeoutMs = 20000) =>
    new Promise((resolve, reject) => {
      const id = seq++;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP timeout ${method}`));
      }, timeoutMs);
      pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
}

async function evalJson(cdp, expression) {
  const ret = await cdp('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (ret.exceptionDetails) {
    throw new Error(
      ret.exceptionDetails.text ||
        ret.exceptionDetails.exception?.description ||
        JSON.stringify(ret.exceptionDetails),
    );
  }
  return ret.result?.value;
}

async function main() {
  if (SKIP_UI) {
    console.log('SKIP_UI=1 — only documenting expected API shape');
    process.exit(0);
  }

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const profileDir = path.join(OUT_DIR, 'chrome-profile');

  const listUrl = `${BASE}/opencourse?categoryIds=184&categoryName=${encodeURIComponent('人力资源')}`;
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      '--remote-allow-origins=*',
      `--user-data-dir=${profileDir}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      listUrl,
    ],
    { stdio: 'ignore' },
  );

  try {
    let wsUrl;
    for (let i = 0; i < 40; i++) {
      try {
        const tabs = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
        const page =
          tabs.find(
            (t) => t.type === 'page' && t.webSocketDebuggerUrl && !String(t.url || '').startsWith('chrome'),
          ) || tabs.find((t) => t.webSocketDebuggerUrl);
        if (page) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch {
        /* wait */
      }
      await sleep(500);
    }
    if (!wsUrl) throw new Error('CDP not ready');

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
    const cdp = cdpFactory(ws);
    await cdp('Page.enable');
    await cdp('Runtime.enable');

    // wait list ready
    let ready = false;
    for (let i = 0; i < 30; i++) {
      const info = await evalJson(
        cdp,
        `(() => {
          const text = document.body?.innerText || '';
          const hasChip = text.includes('人力资源');
          const hasCount = /共\\s*\\d+\\s*门课程/.test(text);
          return { hasChip, hasCount, href: location.href, sample: text.slice(0, 200) };
        })()`,
      );
      if (info?.hasChip && info?.hasCount) {
        ready = true;
        console.log('LIST_READY', info.href);
        break;
      }
      await sleep(500);
    }
    if (!ready) throw new Error('list not ready with category filter');

    // click first course card link to detail
    const clicked = await evalJson(
      cdp,
      `(() => {
        const a = document.querySelector('a[href*="/opencourse/"][href$=".htm"]');
        if (!a) return { ok: false, reason: 'no detail link' };
        const href = a.getAttribute('href');
        a.click();
        return { ok: true, href };
      })()`,
    );
    console.log('CLICK_DETAIL', clicked);
    if (!clicked?.ok) throw new Error(clicked?.reason || 'click failed');

    for (let i = 0; i < 30; i++) {
      const href = await evalJson(cdp, 'location.href');
      if (String(href).includes('.htm')) {
        console.log('DETAIL_OK', href);
        break;
      }
      await sleep(400);
    }

    // browser back
    await cdp('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
    await evalJson(cdp, 'history.back()');

    let backOk = false;
    for (let i = 0; i < 40; i++) {
      const info = await evalJson(
        cdp,
        `(() => {
          const href = location.href;
          const text = document.body?.innerText || '';
          const urlHas = href.includes('categoryIds=184') || href.includes('categoryName');
          const chip = text.includes('人力资源') && text.includes('分类');
          const countMatch = text.match(/共\\s*(\\d+)\\s*门课程/);
          const total = countMatch ? Number(countMatch[1]) : null;
          const filtered = total != null && total > 0 && total < 1000;
          return { href, urlHas, chip, total, filtered, textHasHr: text.includes('人力资源') };
        })()`,
      );
      console.log('BACK_POLL', info);
      if (info?.urlHas && (info?.chip || info?.filtered || info?.textHasHr)) {
        // Prefer chip or filtered count; URL alone is insufficient (the bug)
        if (info.chip || info.filtered) {
          backOk = true;
          await writeFile(path.join(OUT_DIR, 'result.json'), JSON.stringify(info, null, 2));
          console.log('PASS opencourse-filter-back', info);
          break;
        }
      }
      await sleep(500);
    }

    if (!backOk) {
      const snap = await evalJson(
        cdp,
        `({ href: location.href, text: (document.body?.innerText||'').slice(0, 800) })`,
      );
      await writeFile(path.join(OUT_DIR, 'fail.json'), JSON.stringify(snap, null, 2));
      throw new Error('FAIL: filter not restored after back');
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
