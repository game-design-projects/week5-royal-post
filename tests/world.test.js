// Terrain + landmark placement (pure). The browser builds the planet from the
// same createTerrain/findLandmarks, so these hold for the real map.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTerrain } from '../src/terrain.js';
import { findLandmarks, angleBetween, deg, fibonacciSphere, ringAround, travelTime } from '../src/sphere.js';
import { SEED, R, LANDMARK_BAND_DEG } from '../src/config.js';

const terrain = createTerrain(SEED, R);
const L = findLandmarks(terrain, { minDeg: LANDMARK_BAND_DEG[0], maxDeg: LANDMARK_BAND_DEG[1] });

test('terrain is deterministic for a seed', () => {
  const t2 = createTerrain(SEED, R);
  for (const p of fibonacciSphere(50)) assert.equal(terrain.elev(p), t2.elev(p));
});

test('planet has both land and sea', () => {
  const pts = fibonacciSphere(2000);
  const land = pts.filter((p) => terrain.elev(p) > 0).length / pts.length;
  assert.ok(land > 0.4 && land < 0.8, `land fraction ${land}`);
});

test('both landmarks stand on dry land, away from the coast', () => {
  for (const d of [L.castle, L.tower]) {
    assert.ok(terrain.elev(d) > 0.02, `elev ${terrain.elev(d)}`);
    for (const p of ringAround(d, 0.06, 12)) assert.ok(terrain.elev(p) > 0, 'coast within the landmark ring');
    assert.ok(terrain.groundAt(d) > R);
  }
});

test('landmarks are 150–160° apart', () => {
  const a = deg(angleBetween(L.castle, L.tower));
  assert.ok(a >= LANDMARK_BAND_DEG[0] && a <= LANDMARK_BAND_DEG[1], `angle ${a}`);
  assert.ok(Math.abs(a - L.angleDeg) < 1e-9);
});

test('landmark search is deterministic', () => {
  const again = findLandmarks(createTerrain(SEED, R), { minDeg: LANDMARK_BAND_DEG[0], maxDeg: LANDMARK_BAND_DEG[1] });
  assert.deepEqual(again, L);
});

test('travelTime: linear in angle and altitude, inverse in speed', () => {
  const base = travelTime({ angle: 1, alt: 30, speed: 6 });
  assert.equal(base, 5);
  assert.equal(travelTime({ angle: 2, alt: 30, speed: 6 }), 10);
  assert.equal(travelTime({ angle: 1, alt: 30, speed: 12 }), 2.5);
  assert.equal(travelTime({ angle: 1, alt: 30, speed: 6, maneuver: 1.5 }), 7.5);
});
