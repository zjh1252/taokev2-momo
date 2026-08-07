/**
 * #70 E2E：公开课「立即报名」弹窗提交 → 后台列表可见
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';

const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9368;
const OUT_DIR = path.resolve('scripts/.oce-enroll-test-out');
const FE = 'http://127.0.0.1:3000';
const API = 'http://127.0.0.1:8080';
const PHONE = '18675796459';
const PASSWORD = '123456';
const COURSE_SEO_ID = 437415;

async function cdp(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1e9);
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const text =
        typeof event.data === 'string'
          ? event.data
          : Buffer.from(event.data).toString('utf8');
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
  if (exceptionDetails) {
    throw new Error(exceptionDetails.text || 'eval exception');
  }
  return result?.value;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const unique = `E2E${Date.now().toString().slice(-8)}`;
  const report = { unique, ok: false };

  // 1) API login + baseline count
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: PHONE, password: PASSWORD }),
  }).then((r) => r.json());
  if (!loginRes?.data?.accessToken) {
    throw new Error(`login failed: ${JSON.stringify(loginRes)}`);
  }
  const token = loginRes.data.accessToken;
  report.login = true;

  const before = await fetch(
    `${API}/admin/open-course-enrollments?page=1&size=1&keyword=${unique}`,
    { headers: { Authorization: `Bearer ${token}` } },
  ).then((r) => r.json());
  report.beforeTotal = before?.data?.total ?? 0;

  // 2) Chrome headless
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${path.join(OUT_DIR, 'chrome')}`,
      '--headless=new',
      '--no-first-run',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  try {
    await sleep(1500);
    await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {
      method: 'PUT',
    }).catch(() => null);
    await sleep(400);
    const pages = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) =>
      r.json(),
    );
    const page = pages.find((p) => p.type === 'page' && p.webSocketDebuggerUrl);
    if (!page) throw new Error('no chrome page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    await cdp(ws, 'Page.enable');
    await cdp(ws, 'Runtime.enable');

    // inject token then open course
    await cdp(ws, 'Page.navigate', { url: `${FE}/` });
    await sleep(2000);
    await evalJson(
      ws,
      `(() => {
        localStorage.setItem('taoke_token', JSON.stringify({
          accessToken: ${JSON.stringify(token)},
          tokenType: 'Bearer',
          expiresIn: 7200
        }));
        return true;
      })()`,
    );

    await cdp(ws, 'Page.navigate', {
      url: `${FE}/opencourse/${COURSE_SEO_ID}.htm`,
    });
    await sleep(6000);

    // hydration / react root probe
    report.hydrate = await evalJson(
      ws,
      `(() => {
        const btn = document.querySelector('[data-testid="open-course-enroll-btn"]');
        const roots = Array.from(document.querySelectorAll('[data-reactroot], nextjs-portal, body > div'));
        const fiber =
          btn &&
          Object.getOwnPropertyNames(btn).find(
            (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'),
          );
        return {
          hasTestBtn: !!btn,
          fiber: fiber || null,
          allBtnProps: btn ? Object.getOwnPropertyNames(btn).filter((k) => k.includes('react') || k.startsWith('__')) : [],
          nextError: !!document.querySelector('#__next_error__, [id*="error"]'),
          scripts: Array.from(document.scripts).length,
        };
      })()`,
    );

    // probe react onClick wiring
    const probe = await evalJson(
      ws,
      `(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find((el) => (el.textContent || '').trim() === '立即报名');
        if (!btn) return { found: false };
        window.__oceClicked = false;
        const reactKeys = Object.keys(btn).filter((k) => k.startsWith('__react'));
        btn.addEventListener('click', () => { window.__oceNative = true; }, true);
        btn.click();
        return {
          found: true,
          reactKeys,
          oceClicked: window.__oceClicked,
          oceNative: window.__oceNative || false,
          propsKey: reactKeys[0] || null,
        };
      })()`,
    );
    report.probe = probe;

    const pageSnap = await evalJson(
      ws,
      `(() => {
        const els = Array.from(document.querySelectorAll('button,a'))
          .filter((el) => (el.textContent || '').includes('立即报名'));
        return {
          href: location.href,
          title: document.title,
          bodyHasEnroll: (document.body.innerText || '').includes('立即报名'),
          enrollBtns: els.map((el) => {
            const r = el.getBoundingClientRect();
            return {
              tag: el.tagName,
              text: (el.textContent || '').trim(),
              disabled: !!el.disabled,
              x: Math.round(r.x + r.width / 2),
              y: Math.round(r.y + r.height / 2),
              w: Math.round(r.width),
              h: Math.round(r.height),
            };
          }),
        };
      })()`,
    );
    report.page = pageSnap;
    if (!pageSnap.enrollBtns?.length) {
      throw new Error(`no enroll button: ${JSON.stringify(pageSnap)}`);
    }

    // Prefer in-viewport button; fallback first
    const target =
      pageSnap.enrollBtns.find((b) => b.y > 0 && b.y < 900 && b.w > 0) ||
      pageSnap.enrollBtns[0];

    await cdp(ws, 'Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: target.x,
      y: target.y,
    });
    await cdp(ws, 'Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: target.x,
      y: target.y,
      button: 'left',
      clickCount: 1,
    });
    await cdp(ws, 'Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: target.x,
      y: target.y,
      button: 'left',
      clickCount: 1,
    });
    report.clickTarget = target;
    await sleep(2000);

    const dialogOpen = await evalJson(
      ws,
      `(() => {
        const dlg =
          document.querySelector('[role="dialog"]') ||
          document.querySelector('[data-slot="dialog-content"]') ||
          document.querySelector('[data-slot="dialog"]');
        return {
          open: !!dlg,
          oceClicked: !!window.__oceClicked,
          text: dlg ? (dlg.textContent || '').slice(0, 200) : '',
          hasQuickConsult: (document.body.innerText || '').includes('快速咨询'),
        };
      })()`,
    );
    report.dialog = dialogOpen;
    if (!dialogOpen.open) {
      // also try JS click as fallback
      const jsClick = await evalJson(
        ws,
        `(() => {
          const btn = Array.from(document.querySelectorAll('button'))
            .find((el) => (el.textContent || '').trim() === '立即报名' || el.getAttribute('data-testid') === 'open-course-enroll-btn');
          if (!btn) return { ok: false, reason: 'no button' };
          window.__oceClicked = false;
          btn.scrollIntoView({ block: 'center' });
          btn.click();
          return { ok: true, tag: btn.tagName, oceClicked: !!window.__oceClicked, testid: btn.getAttribute('data-testid') };
        })()`,
      );
      report.jsClick = jsClick;
      await sleep(1500);
      const dialog2 = await evalJson(
        ws,
        `(() => {
          const dlg =
            document.querySelector('[role="dialog"]') ||
            document.querySelector('[data-slot="dialog-content"]');
          return {
            open: !!dlg,
            text: dlg ? (dlg.textContent || '').slice(0, 240) : '',
            openCount: document.querySelectorAll('[data-state="open"],[data-slot="dialog-content"]').length,
            bodySnippet: (document.body.innerText || '').includes('快速咨询'),
            hasRealNameLabel: (document.body.innerText || '').includes('真实姓名'),
            htmlHasDialog: document.documentElement.innerHTML.includes('快速咨询'),
            oceClicked: !!window.__oceClicked,
          };
        })()`,
      );
      report.dialog2 = dialog2;
      if (!dialog2.open) {
        throw new Error(`dialog not open: ${JSON.stringify(report)}`);
      }
      Object.assign(dialogOpen, dialog2);
    }

    // fill + submit
    const filled = await evalJson(
      ws,
      `(() => {
        const dlg = document.querySelector('[role="dialog"]');
        if (!dlg) return { ok: false, reason: 'no dialog' };
        const byLabel = (label) => {
          const lab = Array.from(dlg.querySelectorAll('label'))
            .find((l) => (l.textContent || '').includes(label));
          if (!lab) return null;
          const id = lab.getAttribute('for');
          if (id) return dlg.querySelector('#' + CSS.escape(id));
          return lab.parentElement?.querySelector('input');
        };
        const set = (el, v) => {
          if (!el) return false;
          const proto = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          );
          proto.set.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        };
        const name = byLabel('真实姓名');
        const company = byLabel('公司名称');
        const email = byLabel('电子邮件');
        const phone = byLabel('公司电话');
        const mobile = byLabel('手机号码');
        set(name, '浏览器测试' + ${JSON.stringify(unique)});
        set(company, '测试公司' + ${JSON.stringify(unique)});
        set(email, ${JSON.stringify(`browser${unique}@taoke.test`)});
        set(phone, '021-66668888');
        set(mobile, ${JSON.stringify(PHONE)});
        const submit = Array.from(dlg.querySelectorAll('button'))
          .find((b) => (b.textContent || '').includes('提交'));
        if (!submit) return { ok: false, reason: 'no submit' };
        submit.click();
        return {
          ok: true,
          fields: {
            name: !!name, company: !!company, email: !!email,
            phone: !!phone, mobile: !!mobile,
          },
        };
      })()`,
    );
    report.fill = filled;
    if (!filled?.ok) throw new Error(`fill failed: ${JSON.stringify(filled)}`);

    await sleep(4000);

    const afterUi = await evalJson(
      ws,
      `(() => ({
        dialogOpen: !!document.querySelector('[role="dialog"]'),
        toastText: Array.from(document.querySelectorAll('[data-sonner-toast],li[data-sonner-toast],div'))
          .map((el) => (el.textContent || '').trim())
          .find((t) => t.includes('成功') || t.includes('报名')) || '',
        errText: Array.from(document.querySelectorAll('[role="dialog"] p'))
          .map((p) => (p.textContent || '').trim())
          .filter(Boolean)
          .slice(0, 3),
      }))()`,
    );
    report.afterUi = afterUi;

    // 3) admin list verify
    const after = await fetch(
      `${API}/admin/open-course-enrollments?page=1&size=10&keyword=${encodeURIComponent(unique)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    ).then((r) => r.json());
    const list = after?.data?.list || [];
    report.afterTotal = after?.data?.total ?? 0;
    report.hit = list.map((x) => ({
      id: x.id,
      email: x.email,
      status: x.status,
      courseId: x.courseId,
      userId: x.userId,
    }));

    const found = list.find((x) => String(x.email || '').includes(unique));
    if (!found) {
      throw new Error(`admin list missing record: ${JSON.stringify(report)}`);
    }
    report.ok = true;
    report.createdId = found.id;
    console.log(JSON.stringify(report, null, 2));
  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err?.message || err) }, null, 2));
  process.exit(1);
});
