import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, mulberry32 } from '../src/rng.js';

test('same seed → same sequence', () => {
  const a = mulberry32(42), b = mulberry32(42);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});

test('different seeds diverge', () => {
  const a = mulberry32(1), b = mulberry32(2);
  const sa = Array.from({ length: 5 }, a), sb = Array.from({ length: 5 }, b);
  assert.notDeepEqual(sa, sb);
});

test('values are in [0, 1) and roughly uniform', () => {
  const r = createRng(7);
  let sum = 0;
  for (let i = 0; i < 20000; i++) {
    const v = r.next();
    assert.ok(v >= 0 && v < 1);
    sum += v;
  }
  assert.ok(Math.abs(sum / 20000 - 0.5) < 0.01);
});

test('helpers: int bounds, dir is a unit vector', () => {
  const r = createRng(9);
  for (let i = 0; i < 500; i++) {
    const n = r.int(3, 5);
    assert.ok(n >= 3 && n <= 5 && Number.isInteger(n));
    const d = r.dir();
    assert.ok(Math.abs(Math.hypot(d.x, d.y, d.z) - 1) < 1e-9);
  }
});
