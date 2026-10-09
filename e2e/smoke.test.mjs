// End-to-end: drives the real game in the system Google Chrome (playwright-core,
// no browser download; headless Chrome renders WebGL on the GPU). Story beats
// are driven through window.__rp debug hooks — flying 6 × 100 units by keyboard
// would make this suite take minutes — but every card, letter and ending is the
// real DOM. `pnpm shots` (SHOTS=1) also refreshes docs/*.png for the README and
// the itch.io page; other screenshots land in e2e/artifacts/ (gitignored).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createStaticServer } from '../tools/serve.mjs';

const ART = new URL('./artifacts/', import.meta.url).pathname;
const DOCS = new URL('../docs/', import.meta.url).pathname;
const SHOTS = !!process.env.SHOTS;
let server;
let base;
let browser;

before(async () => {
  await mkdir(ART, { recursive: true });
  server = createStaticServer(new URL('..', import.meta.url).pathname);
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
});

after(async () => {
  await browser?.close();
  await new Promise((r) => server.close(r));
});

async function open(viewport = { width: 1280, height: 720 }, { touch = false } = {}) {
  const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  await page.goto(base);
  await page.waitForFunction(() => window.__rp?.ready);
  return { context, page, errors };
}

const state = (page) => page.evaluate(() => window.__rp.state());
const hook = (page, name, ...args) => page.evaluate(([n, a]) => window.__rp.debug[n](...a), [name, args]);
const waitState = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 15000 });
const cardText = (page) => page.locator('[data-testid="story-card"]').innerText();
async function shot(page, name, { docs = false } = {}) {
  await page.screenshot({ path: `${ART}${name}.png` });
  if (docs && SHOTS) await page.screenshot({ path: `${DOCS}${name}.png` });
}

// Pickup card → take off (clicks the real button).
async function takeOff(page) {
  await waitState(page, () => window.__rp.state().card);
  await page.click('[data-testid="card-continue"]');
  await waitState(page, () => window.__rp.state().phase === 'flying');
}
// Fly (teleport) to the recipient, wait for the delivery card.
async function deliver(page) {
  await hook(page, 'deliverNow');
  await waitState(page, () => window.__rp.state().phase === 'card' && window.__rp.state().card);
}
async function next(page) {
  await page.click('[data-testid="card-continue"]');
}

test('all six letters on time, sealed → Happily Ever After', async () => {
  const { context, page, errors } = await open();
  await page.waitForTimeout(600);
  await shot(page, 'title');
  await page.click('[data-testid="start"]');
  for (let day = 1; day <= 6; day++) {
    await takeOff(page);
    const s = await state(page);
    assert.equal(s.day, day);
    if (day === 2) {
      // The money shot: golden hour, gliding in to Highroost, the prince calling out.
      await hook(page, 'setClock', 44);
      await hook(page, 'approach', 14, 1.2, -4.5);
      await page.waitForTimeout(900);
      assert.equal(await page.locator('#bubble').isVisible(), true);
      assert.match(await page.locator('#bubble').innerText(), /winged herald/);
      await shot(page, 'screenshot', { docs: true });
      await hook(page, 'cover', true);
      await hook(page, 'approach', 12.5, 0.9, -3.4);
      await page.setViewportSize({ width: 630, height: 500 });
      await page.waitForTimeout(500);
      await shot(page, 'cover', { docs: true });
      await hook(page, 'cover', false);
      await page.setViewportSize({ width: 1280, height: 720 });
    }
    await deliver(page);
    const text = await cardText(page);
    assert.match(text, /Delivered before sunset/);
    assert.doesNotMatch(text, /seal was broken/);
    if (day === 5) assert.match(text, /All right, Florian/);
    if (day < 6) await next(page);
  }
  const s = await state(page);
  assert.deepEqual(s.history.map((h) => h.id), ['L1-proposal', 'L2-received', 'L3-ode', 'L4-ask', 'L5-true', 'L6-just-maren']);
  await next(page);
  await waitState(page, () => window.__rp.state().ending);
  await page.waitForTimeout(700);
  const end = page.locator('[data-testid="ending"]');
  assert.match(await end.innerText(), /Happily Ever After/);
  assert.match(await end.innerText(), /Zephyrine the Swift/);
  assert.match(await end.innerText(), /never been so punctual/);
  await shot(page, 'shot-3-ending', { docs: true });
  // Archive: nothing was peeked, so every crossed-out line is blotted.
  await page.click('[data-testid="archive"]');
  assert.equal(await page.locator('#archiveList del.struck').count(), 0);
  assert.ok((await page.locator('#archiveList del.blot').count()) >= 3);
  assert.deepEqual(errors, []);
  await context.close();
});

test('losing her question (day 4) → the cantos → Ever After', async () => {
  const { context, page, errors } = await open();
  await page.click('[data-testid="start"]');
  for (let day = 1; day <= 6; day++) {
    await takeOff(page);
    if (day === 4) {
      await page.keyboard.down('KeyQ');
      await waitState(page, () => window.__rp.state().dropping);
      await page.keyboard.up('KeyQ');
      await waitState(page, () => window.__rp.state().card);
      assert.match(await cardText(page), /The letter never arrived/);
      await shot(page, 'lost');
    } else {
      await deliver(page);
    }
    if (day === 5) assert.equal((await state(page)).history[4].id, 'L5-cantos');
    if (day < 6) await next(page);
  }
  await next(page);
  await waitState(page, () => window.__rp.state().ending);
  const s = await state(page);
  assert.equal(s.ending.id, 'unhappy');
  assert.equal(s.ending.stats.lost, 1);
  assert.match(await page.locator('[data-testid="ending"]').innerText(), /Ever After/);
  assert.match(await page.locator('[data-testid="ending"]').innerText(), /another ending/);
  assert.deepEqual(errors, []);
  await context.close();
});

test('peeking: the letter opens mid-flight, the seal breaks, the royal notices', async () => {
  const { context, page, errors } = await open();
  await page.click('[data-testid="start"]');
  await takeOff(page);
  await hook(page, 'setClock', 14);
  await hook(page, 'approach', 24, 4, -7);
  await page.waitForTimeout(300);
  await page.keyboard.press('KeyE');
  await waitState(page, () => window.__rp.state().reading);
  const letter = page.locator('[data-testid="letter"]');
  assert.match(await letter.innerText(), /Junior Joust/);
  assert.match(await page.locator('[data-testid="letter"] del.struck').innerText(), /terrified/);
  const c0 = (await state(page)).clock;
  await page.waitForTimeout(600);
  assert.ok((await state(page)).clock > c0, 'the sun keeps moving while you read');
  await page.waitForTimeout(1100); // let the "Seal broken" toast fade
  await shot(page, 'shot-2-letter', { docs: true });
  await page.keyboard.press('Escape');
  await waitState(page, () => !window.__rp.state().reading);
  assert.equal((await state(page)).peeked, true);
  await deliver(page);
  assert.match(await cardText(page), /seal was broken/);
  assert.match(await cardText(page), /Seal’s broken/);
  // Day 2: her card is short and typewritten.
  await next(page);
  await takeOff(page);
  await page.keyboard.press('KeyE');
  await waitState(page, () => window.__rp.state().reading);
  assert.match(await letter.innerText(), /The ode is not required/);
  assert.equal(await page.locator('[data-testid="letter"] .index-card').count(), 1);
  assert.deepEqual(errors, []);
  await context.close();
});

test('arriving after sunset: night sky, the late line, history says late', async () => {
  const { context, page, errors } = await open();
  await page.click('[data-testid="start"]');
  await takeOff(page);
  await hook(page, 'setClock', 50);
  await hook(page, 'approach', 15, 1.4, -5);
  await page.waitForTimeout(800);
  await shot(page, 'shot-1-flight', { docs: true });
  await hook(page, 'setClock', 61);
  await page.waitForTimeout(300);
  assert.match(await page.locator('#sunset').innerText(), /late/i);
  await deliver(page);
  assert.match(await cardText(page), /after dark/);
  assert.match(await cardText(page), /Late\. It’s dark/);
  await page.waitForTimeout(500);
  await shot(page, 'late-delivery');
  assert.equal((await state(page)).history[0].timing, 'late');
  assert.deepEqual(errors, []);
  await context.close();
});

test('phone 390×844: touch controls, cards fit, no sideways scroll', async () => {
  const { context, page, errors } = await open({ width: 390, height: 844 }, { touch: true });
  await page.tap('[data-testid="start"]');
  await waitState(page, () => window.__rp.state().card);
  const box = await page.locator('[data-testid="story-card"]').boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390, JSON.stringify(box));
  await page.waitForTimeout(400);
  await shot(page, 'mobile-pickup');
  await page.tap('[data-testid="card-continue"]');
  await waitState(page, () => window.__rp.state().phase === 'flying');
  for (const id of ['#boost', '#btnRead', '#btnDrop']) assert.equal(await page.locator(id).isVisible(), true, id);
  await page.tap('#btnRead');
  await waitState(page, () => window.__rp.state().reading);
  await page.waitForTimeout(400);
  await shot(page, 'mobile-letter');
  await page.tap('#closeLetter');
  await waitState(page, () => !window.__rp.state().reading);
  await page.waitForTimeout(400);
  await shot(page, 'mobile-flight');
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  assert.ok(scroll);
  assert.deepEqual(errors, []);
  await context.close();
});
