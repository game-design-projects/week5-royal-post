import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skyAt, isLate, sunsetIn, formatClock, sunArcPoint, lerpHex } from '../src/daylight.js';

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

test('noon is the original Pigeon Planet sky', () => {
  assert.equal(skyAt(0.5).sky, '#9fd3f2');
});

test('night is dark, starry and the windows glow', () => {
  const n = skyAt(1.4);
  assert.ok(lum(n.sky) < 50);
  assert.equal(n.stars, 1);
  assert.equal(n.windows, 1);
  const d = skyAt(0.4);
  assert.equal(d.stars, 0);
  assert.equal(d.windows, 0);
});

test('light fades monotonically from golden hour into night', () => {
  let prev = Infinity;
  for (let p = 0.5; p <= 1.3; p += 0.02) {
    const s = skyAt(p).sun;
    assert.ok(s <= prev + 1e-9, `sun rose again at ${p}`);
    prev = s;
  }
});

test('hex outputs are always valid', () => {
  for (let p = -0.2; p < 2; p += 0.01) {
    const s = skyAt(p);
    for (const k of ['sky', 'fog', 'sunColor']) assert.match(s[k], /^#[0-9a-f]{6}$/);
  }
  assert.equal(lerpHex('#000000', '#ffffff', 0.5), '#808080');
});

test('lateness and countdown', () => {
  assert.equal(isLate(54.9, 55), false);
  assert.equal(isLate(55.1, 55), true);
  assert.equal(sunsetIn(50, 55), 5);
  assert.equal(sunsetIn(70, 55), 0);
  assert.equal(formatClock(23.2), '0:24');
  assert.equal(formatClock(65), '1:05');
});

test('sun arc runs left horizon → zenith → right horizon', () => {
  const a = sunArcPoint(0), b = sunArcPoint(0.5), c = sunArcPoint(1);
  assert.ok(Math.abs(a.x + 1) < 1e-9 && Math.abs(a.y) < 1e-9);
  assert.ok(Math.abs(b.x) < 1e-9 && Math.abs(b.y - 1) < 1e-9);
  assert.ok(Math.abs(c.x - 1) < 1e-9);
});
