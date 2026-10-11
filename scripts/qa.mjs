// Run with `node scripts/qa.mjs`. Product files remain dependency-free.
// Optional: QA_BASE_URL, PLAYWRIGHT_MODULE, AXE_MODULE, QA_SKIP_EXTERNAL=1.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, copyFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.qa-output');
await mkdir(output, { recursive: true });
const pages = ['index.html', 'about.html', 'projects.html', 'experience.html', 'skills.html', 'contact.html'];
const viewports = [{ width: 1280, height: 900 }, { width: 768, height: 1024 }, { width: 375, height: 812 }, { width: 320, height: 740 }];
const report = { startedAt: new Date().toISOString(), pages: [], interactions: [], endpoints: [], external: [], errors: [], warnings: [] };

async function findModule(name, explicit) {
  if (explicit) return require(explicit);
  try { return require(name); } catch {}
  const cache = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  for (const entry of await readdir(cache).catch(() => [])) {
    try { return require(path.join(cache, entry, 'node_modules', name)); } catch {}
  }
  throw new Error(`Cannot find ${name}. Set ${name === 'playwright' ? 'PLAYWRIGHT_MODULE' : 'AXE_MODULE'} to its installed module directory.`);
}
const { chromium } = await findModule('playwright', process.env.PLAYWRIGHT_MODULE);
let axeSource;
try {
  axeSource = await readFile(process.env.AXE_MODULE
    ? require.resolve(path.join(process.env.AXE_MODULE, 'axe.min.js'))
    : path.join(output, 'tools', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
} catch { report.warnings.push('axe-core unavailable; semantic checks run but automated accessibility audit is incomplete.'); }

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.txt': 'text/plain' };
let server;
let baseUrl = process.env.QA_BASE_URL;
if (!baseUrl) {
  server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!target.startsWith(root + path.sep) || pathname.startsWith('/.git')) { res.writeHead(403); res.end(); return; }
      const body = await readFile(target);
      res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}
report.baseUrl = baseUrl;
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
report.browser = browser.version();
const internalUrls = new Set(pages.map(page => new URL(page, baseUrl).href));
const externalUrls = new Set();

function check(condition, message, bucket = report.errors) { if (!condition) bucket.push(message); }
function relative(url) { return url.replace(baseUrl, ''); }
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    for (const filename of pages) {
      const page = await context.newPage();
      const key = `${filename}@${viewport.width}`;
      const run = { page: filename, width: viewport.width, errors: [], console: [], requests: [] };
      page.on('pageerror', error => run.errors.push(`JS: ${error.message}`));
      page.on('console', message => { if (message.type() === 'error') run.console.push(message.text()); });
      page.on('requestfailed', request => run.requests.push({ url: request.url(), error: request.failure()?.errorText }));
      page.on('response', response => {
        if (response.url().startsWith(baseUrl) && response.status() >= 400) run.errors.push(`HTTP ${response.status()} ${relative(response.url())}`);
      });
      const response = await page.goto(new URL(filename, baseUrl).href, { waitUntil: 'networkidle' });
      check(response?.status() === 200, `${key}: document did not return 200`, run.errors);
      await settle(page);
      const details = await page.evaluate(() => {
        const seen = new Set(); const duplicates = [];
        document.querySelectorAll('[id]').forEach(el => { if (seen.has(el.id)) duplicates.push(el.id); seen.add(el.id); });
        const outliers = [...document.body.querySelectorAll('*')].filter(el => {
          const rect = el.getBoundingClientRect(); const style = getComputedStyle(el);
          return rect.width && rect.height && style.visibility !== 'hidden' && style.display !== 'none' && (rect.left < -1 || rect.right > innerWidth + 1);
        }).map(el => ({ tag: el.tagName, class: String(el.className).slice(0, 100), right: Math.round(el.getBoundingClientRect().right), left: Math.round(el.getBoundingClientRect().left) }));
        return {
          title: document.title, lang: document.documentElement.lang,
          h1: [...document.querySelectorAll('h1')].map(el => el.innerText),
          main: document.querySelectorAll('main').length,
          duplicateIds: duplicates,
          overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > innerWidth + 1,
          outliers,
          links: [...document.querySelectorAll('a[href]')].map(el => ({ href: el.href, text: el.textContent.trim(), download: el.hasAttribute('download') })),
          assets: [...document.querySelectorAll('link[rel="stylesheet"],script[src],img[src]')].map(el => el.href || el.src),
          currentNav: [...document.querySelectorAll('nav a[aria-current="page"]')].map(el => el.getAttribute('href')),
          emptyControls: [...document.querySelectorAll('a,button,summary')].filter(el => !el.textContent.trim() && !el.getAttribute('aria-label') && !el.querySelector('img[alt]')).map(el => el.outerHTML),
          hiddenMainContent: [...document.querySelectorAll('main h1,main h2,main p')].filter(el => getComputedStyle(el).opacity === '0').map(el => el.textContent.trim().slice(0, 60))
        };
      });
      Object.assign(run, details);
      check(details.lang === 'en', `${key}: missing English language`, run.errors);
      check(details.h1.length === 1, `${key}: expected one h1`, run.errors);
      check(details.main === 1, `${key}: expected one main landmark`, run.errors);
      check(!details.duplicateIds.length, `${key}: duplicate IDs ${details.duplicateIds.join(', ')}`, run.errors);
      check(!details.overflow, `${key}: horizontal document overflow`, run.errors);
      check(!details.emptyControls.length, `${key}: unnamed controls`, run.errors);
      check(!details.hiddenMainContent.length, `${key}: invisible main text`, run.errors);
      check(details.currentNav.includes(filename), `${key}: no aria-current navigation entry for current page`, run.errors);
      for (const link of [...details.links, ...details.assets.map(href => ({ href }))]) {
        if (link.href.startsWith(baseUrl)) {
          const url = new URL(link.href); url.hash = ''; internalUrls.add(url.href);
        } else if (/^https?:/.test(link.href)) externalUrls.add(link.href);
      }
      const summary = page.locator('.mobile-nav summary');
      if (await summary.isVisible()) {
        await summary.click();
        check(await page.locator('.mobile-nav').getAttribute('open') !== null, `${key}: mobile menu did not open`, run.errors);
        check(await page.locator('.mobile-nav a[href="projects.html"]').isVisible(), `${key}: mobile menu links unavailable`, run.errors);
        await page.keyboard.press('Escape');
        check(await page.locator('.mobile-nav').getAttribute('open') === null, `${key}: Escape did not dismiss menu`, run.errors);
        await summary.click();
        await page.locator('h1').click({ position: { x: 5, y: 5 } });
        check(await page.locator('.mobile-nav').getAttribute('open') === null, `${key}: outside click did not dismiss menu`, run.errors);
      }
      if (axeSource && (viewport.width === 1280 || viewport.width === 375)) {
        await page.evaluate(axeSource);
        run.accessibility = await page.evaluate(async () => {
          const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
          return { violations: result.violations.map(item => ({ id: item.id, impact: item.impact, help: item.help, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })), incomplete: result.incomplete.map(item => ({ id: item.id, nodes: item.nodes.length })), passes: result.passes.length };
        });
        check(!run.accessibility.violations.length, `${key}: ${run.accessibility.violations.length} accessibility violations`, run.errors);
      }
      const screenshot = path.join(output, `${filename.replace('.html', '')}-${viewport.width}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      run.screenshot = path.relative(root, screenshot);
      if (filename === 'index.html' && viewport.width === 1280) await copyFile(screenshot, path.join(root, 'PREVIEW_desktop.png'));
      if (filename === 'index.html' && viewport.width === 375) await copyFile(screenshot, path.join(root, 'PREVIEW_mobile.png'));
      check(!run.console.length, `${key}: browser console errors`, run.errors);
      check(!run.requests.length, `${key}: failed requests`, run.errors);
      report.pages.push(run);
      report.errors.push(...run.errors);
      console.log(`${key}: ${run.errors.length ? `${run.errors.length} FAILURES` : 'PASS'}`);
      await page.close();
    }
    // Follow each primary navigation destination through the visible interface.
    const page = await context.newPage();
    await page.goto(new URL('index.html', baseUrl).href);
    for (const destination of pages) {
      const mobile = page.locator('.mobile-nav summary');
      const useMobile = await mobile.isVisible();
      if (useMobile && await page.locator('.mobile-nav').getAttribute('open') === null) await mobile.click();
      const selector = `${useMobile ? '.mobile-nav' : '.desktop-nav'} a[href="${destination}"]`;
      await page.locator(selector).click();
      await page.waitForURL(new URL(destination, baseUrl).href);
      report.interactions.push({ width: viewport.width, destination, navigation: 'pass' });
    }
    // A keyboard user can bypass the repeated navigation.
    await page.goto(new URL('index.html', baseUrl).href);
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => ({ href: document.activeElement?.getAttribute('href'), text: document.activeElement?.textContent.trim() }));
    check(firstFocus.href === '#main', `${viewport.width}: first keyboard focus is not the skip link`);
    await page.keyboard.press('Enter');
    check(new URL(page.url()).hash === '#main', `${viewport.width}: skip link did not reach main`);
    await context.close();
  }

  for (const url of internalUrls) {
    const response = await fetch(url);
    const body = Buffer.from(await response.arrayBuffer());
    const item = { url: relative(url), status: response.status, bytes: body.length, contentType: response.headers.get('content-type') };
    if (new URL(url).pathname.endsWith('.pdf')) item.validPdf = body.subarray(0, 5).toString() === '%PDF-';
    report.endpoints.push(item);
    check(response.ok && body.length > 0 && item.validPdf !== false, `Endpoint failed: ${item.url} (${item.status})`);
  }
  if (process.env.QA_SKIP_EXTERNAL !== '1') {
    for (const url of externalUrls) {
      try {
        const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 Portfolio-Link-Check' } });
        report.external.push({ url, status: response.status, finalUrl: response.url, ok: response.ok });
        await response.body?.cancel();
        if ([404, 410].includes(response.status)) report.errors.push(`External link missing: ${url} (${response.status})`);
        else if (!response.ok) report.warnings.push(`External link could not be verified automatically: ${url} (${response.status})`);
      } catch (error) {
        report.external.push({ url, error: error.message });
        report.warnings.push(`External link check incomplete: ${url} (${error.message})`);
      }
    }
  }
} catch (error) {
  report.errors.push(error.stack || String(error));
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  report.completedAt = new Date().toISOString();
  report.summary = { pageViewportChecks: report.pages.length, navigationChecks: report.interactions.length, endpoints: report.endpoints.length, externalLinks: report.external.length, errors: report.errors.length, warnings: report.warnings.length };
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report.summary, null, 2));
  for (const error of report.errors) console.error(error);
  for (const warning of report.warnings) console.warn(warning);
  process.exitCode = report.errors.length ? 1 : 0;
}
