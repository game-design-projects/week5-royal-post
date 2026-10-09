// Re-derives the day length (see the comment block in src/config.js) from the
// real landmark angle: a straight run always makes sunset with slack, reading
// one of his long letters on the way never does, peeking at hers is cheap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTerrain } from '../src/terrain.js';
import { findLandmarks, angleBetween, travelTime } from '../src/sphere.js';
import { allVariants, readSeconds } from '../src/story.js';
import { SEED, R, LANDMARK_BAND_DEG, SPEED, ALT, WEIGHT, DAY, MANEUVER, READ_WPS, APP_VERSION } from '../src/config.js';
import { readFileSync } from 'node:fs';

const L = findLandmarks(createTerrain(SEED, R), { minDeg: LANDMARK_BAND_DEG[0], maxDeg: LANDMARK_BAND_DEG[1] });
const angle = angleBetween(L.castle, L.tower);
const direct = (weight, alt = R + ALT.cruise) =>
  travelTime({ angle, alt, speed: SPEED.cruise * WEIGHT[weight].cruise, maneuver: MANEUVER });

test('every weight makes sunset on a straight run, with ≥ 20 s to spare', () => {
  for (const w of Object.keys(WEIGHT)) {
    const t = direct(w);
    assert.ok(t <= DAY.length - 20, `${w}: ${t.toFixed(1)} s vs day ${DAY.length} s`);
  }
});

test('even at the altitude ceiling the heaviest letter makes it', () => {
  assert.ok(direct('heaviest', R + ALT.max) < DAY.length, direct('heaviest', R + ALT.max).toFixed(1));
});

test('reading any of his long letters in full, then flying, is always late', () => {
  for (const l of allVariants().filter((l) => l.from === 'prince' && l.weight !== 'light')) {
    const t = readSeconds(l, READ_WPS) + direct(l.weight);
    assert.ok(t > DAY.length, `${l.id}: ${t.toFixed(1)} s`);
  }
});

test('reading any of her cards in full still makes it on time', () => {
  for (const l of allVariants().filter((l) => l.from === 'princess')) {
    const t = readSeconds(l, READ_WPS) + direct(l.weight);
    assert.ok(t < DAY.length, `${l.id}: ${t.toFixed(1)} s`);
  }
});

test('the documented numbers in config.js are current', () => {
  assert.ok(Math.abs(angle - 2.716) < 0.005, `angle ${angle}`);
  assert.ok(Math.abs(direct('heavy') - 29.8) < 0.2, direct('heavy'));
  assert.ok(Math.abs(direct('heaviest') - 34.4) < 0.2, direct('heaviest'));
});

test('cruise/boost are the user-tuned 6 and 12', () => {
  assert.equal(SPEED.cruise, 6);
  assert.equal(SPEED.boost, 12);
});

test('APP_VERSION matches package.json', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  assert.equal(APP_VERSION, pkg.version);
});
