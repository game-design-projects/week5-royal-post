// Content integrity: the prince/princess contrast is measurable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allVariants, wordCount, letterSize, dayTitle } from '../src/story.js';
import { CHARACTERS, REACTIONS } from '../src/letters.js';
import { WEIGHT } from '../src/config.js';

const letters = allVariants();
const prince = letters.filter((l) => l.from === 'prince');
const princess = letters.filter((l) => l.from === 'princess');

test('letters alternate: prince on odd days, princess on even days', () => {
  for (const l of letters) assert.equal(l.from, l.day % 2 ? 'prince' : 'princess', l.id);
  for (const l of letters) assert.equal(l.to, l.from === 'prince' ? 'princess' : 'prince');
});

test('every letter has a known weight and the fields the game renders', () => {
  for (const l of letters) {
    assert.ok(WEIGHT[l.weight], `${l.id} weight ${l.weight}`);
    for (const k of ['title', 'salutation', 'signature', 'arrive', 'lost']) assert.ok(l[k], `${l.id} missing ${k}`);
    assert.ok(l.pickup?.line, `${l.id} missing pickup line`);
    assert.ok(l.pages >= 1);
  }
});

test('princess letters are all light, one card', () => {
  for (const l of princess) {
    assert.equal(l.weight, 'light', l.id);
    assert.equal(letterSize(l), '1 card');
  }
});

test('prince letters (except The True Thing) are far longer than any of hers', () => {
  const herMax = Math.max(...princess.map(wordCount));
  for (const l of prince) {
    if (l.id === 'L5-true') continue;
    assert.ok(wordCount(l) >= 3 * herMax, `${l.id}: ${wordCount(l)} words vs her max ${herMax}`);
    assert.notEqual(l.weight, 'light', l.id);
  }
});

test('The True Thing is the one short, light letter he ever writes', () => {
  const t = letters.find((l) => l.id === 'L5-true');
  assert.equal(t.weight, 'light');
  assert.ok(wordCount(t) < 100);
  assert.equal(letterSize(t), '1 page');
});

test('crossed-out lines exist on both sides', () => {
  const hasDel = (l) => [...l.body, ...(l.postscript ?? [])].some((i) => typeof i === 'object' && i.del);
  assert.ok(prince.filter(hasDel).length >= 3);
  assert.ok(princess.filter(hasDel).length >= 2);
});

test('labels', () => {
  const p = letters.find((l) => l.id === 'L3-ode');
  assert.equal(dayTitle(p), 'Day 3 — The Ode');
  assert.equal(letterSize(p), '9 pages');
});

test('reaction tables cover every delivery day for each recipient', () => {
  for (const d of [2, 4, 6]) assert.ok(REACTIONS.prince.ontime[d] && REACTIONS.prince.late[d]);
  for (const d of [1, 3, 5]) assert.ok(REACTIONS.princess.ontime[d] && REACTIONS.princess.late[d]);
  for (const d of [2, 4]) assert.ok(REACTIONS.prince.names[d]);
  assert.equal(Object.keys(CHARACTERS).length, 2);
});
