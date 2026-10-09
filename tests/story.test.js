import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createStory, currentLetter, pickup, deliver, ending, isHappy, variantFor, stats, DAYS, TIMINGS,
} from '../src/story.js';

const OUTCOMES = TIMINGS.flatMap((timing) => [false, true].map((peeked) => ({ timing, peeked })));

// Play one full run; returns everything a test might want to look at.
function play(outcomes, { crumbs = 0 } = {}) {
  let s = createStory();
  const cards = [];
  const letters = [];
  for (const o of outcomes) {
    const p = pickup(s);
    letters.push(p.letter);
    cards.push(p.card);
    s = p.state;
    const d = deliver(s, o);
    cards.push(d.card);
    s = d.state;
  }
  return { state: s, cards, letters, end: ending(s, { crumbs }) };
}

// All 6^6 = 46,656 runs (on time / late / lost × peeked or not, every day) —
// a superset of the four verbs' 4^6 combinations.
function* allRuns() {
  const idx = new Array(DAYS).fill(0);
  while (true) {
    yield idx.map((i) => OUTCOMES[i]);
    let k = 0;
    while (k < DAYS && ++idx[k] === OUTCOMES.length) idx[k++] = 0;
    if (k === DAYS) return;
  }
}

test('every outcome combination reaches an ending with complete text', () => {
  const seen = { happy: 0, unhappy: 0 };
  let runs = 0;
  for (const outcomes of allRuns()) {
    const { state, cards, letters, end } = play(outcomes);
    runs++;
    assert.equal(state.done, true);
    assert.equal(state.history.length, DAYS);
    assert.equal(letters.length, DAYS);
    for (const c of cards) {
      if (c.kind === 'pickup') assert.ok(c.line && c.line.length > 5);
      else for (const line of c.lines) assert.ok(typeof line === 'string' && line.length > 3, `empty line in ${c.kind}`);
    }
    for (const l of letters) {
      assert.ok(l.body.length > 0 && l.salutation && l.signature && l.lost && l.arrive);
    }
    assert.ok(['happy', 'unhappy'].includes(end.id));
    assert.ok(end.lines.length >= 3 && end.title && end.hint);
    seen[end.id]++;
  }
  assert.equal(runs, 6 ** 6);
  assert.ok(seen.happy > 0 && seen.unhappy > 0, JSON.stringify(seen));
});

test('ending rule matches docs/DESIGN.md exactly', () => {
  for (const outcomes of allRuns()) {
    const { state, end } = play(outcomes);
    const t4 = outcomes[3].timing, t5 = outcomes[4].timing;
    const expected = (t4 === 'ontime' && t5 !== 'lost') || (t4 === 'late' && t5 === 'ontime');
    assert.equal(end.id === 'happy', expected, JSON.stringify(outcomes.map((o) => o.timing)));
    assert.equal(isHappy(state.history), expected);
  }
});

test('the key letter (day 5) depends only on how her question travelled', () => {
  const h = (t4) => [{ timing: 'ontime' }, { timing: 'ontime' }, { timing: 'ontime' }, { timing: t4 }];
  assert.equal(variantFor(5, h('ontime')), 'true');
  assert.equal(variantFor(5, h('late')), 'candlelight');
  assert.equal(variantFor(5, h('lost')), 'cantos');
});

test('silence variants follow a lost letter', () => {
  const lost = { timing: 'lost' };
  assert.equal(variantFor(2, [lost]), 'silence');
  assert.equal(variantFor(3, [{}, lost]), 'elaborate');
  assert.equal(variantFor(4, [{}, {}, lost]), 'silence');
  assert.equal(variantFor(6, [{}, {}, {}, {}, { ...lost, variant: 'true' }]), 'nothing-again');
});

test('happy path, all on time: just Maren, and the names collapse to "Pigeon"', () => {
  const run = play(new Array(DAYS).fill({ timing: 'ontime', peeked: false }));
  assert.deepEqual(run.letters.map((l) => l.id), ['L1-proposal', 'L2-received', 'L3-ode', 'L4-ask', 'L5-true', 'L6-just-maren']);
  assert.equal(run.end.id, 'happy');
  assert.deepEqual(run.state.names, [
    'Zephyrine the Swift', 'Gallant Cumulus, Herald of the West Wind', 'Aethon the Unwearied',
    'Nimbus the Inevitable', 'Pigeon', 'Pigeon',
  ]);
  assert.ok(run.end.extras.some((e) => e.includes('punctual')));
});

test('losing her question gives the cantos and an unhappy marriage', () => {
  const o = new Array(DAYS).fill({ timing: 'ontime', peeked: false });
  o[3] = { timing: 'lost', peeked: false };
  const run = play(o);
  assert.equal(run.letters[4].id, 'L5-cantos');
  assert.equal(run.letters[4].weight, 'heaviest');
  assert.equal(run.letters[5].id, 'L6-twelve-cantos');
  assert.equal(run.end.id, 'unhappy');
  assert.equal(run.end.title, 'Ever After');
});

test('delivery cards: timing line, seal line only when peeked', () => {
  let s = pickup(createStory()).state;
  const ontime = deliver(s, { timing: 'ontime', peeked: false }).card;
  assert.equal(ontime.kind, 'delivery');
  assert.equal(ontime.lines[0], 'Pigeon.');
  assert.ok(!ontime.lines.some((l) => l.includes('Seal')));
  const peeked = deliver(s, { timing: 'late', peeked: true }).card;
  assert.ok(peeked.lines.some((l) => l.startsWith('Late.')));
  assert.ok(peeked.lines.some((l) => l.includes('Seal’s broken')));
  const lost = deliver(s, { timing: 'lost', peeked: true }).card;
  assert.equal(lost.kind, 'lost');
  assert.match(lost.lines[0], /shepherd/);
});

test('feeding: she feeds you on day 4, he does once he means it', () => {
  const run = play(new Array(DAYS).fill({ timing: 'ontime', peeked: false }));
  const pickups = run.cards.filter((c) => c.kind === 'pickup');
  assert.deepEqual(pickups[3].feed, { stamina: 1, crumbs: 10 });
  assert.deepEqual(pickups[4].feed, { stamina: 1, crumbs: 5 });
  assert.equal(pickups[0].feed, null);
});

test('epilogue extras react to stats', () => {
  const peekAll = play(new Array(DAYS).fill({ timing: 'ontime', peeked: true }), { crumbs: 55 });
  assert.ok(peekAll.end.extras.some((e) => e.includes('knew everything')));
  assert.ok(peekAll.end.extras.some((e) => e.includes('55 crumbs')));
  assert.equal(peekAll.end.stats.peeked, 6);
  const o = new Array(DAYS).fill({ timing: 'ontime', peeked: false });
  o[0] = o[1] = { timing: 'lost', peeked: false };
  o[5] = { timing: 'lost', peeked: false };
  const lossy = play(o);
  assert.ok(lossy.end.extras.some((e) => e.includes('shepherd')));
  assert.ok(lossy.end.extras.some((e) => e.includes('to his face')));
  assert.deepEqual(stats(lossy.state.history), { ontime: 3, late: 0, lost: 3, peeked: 0 });
});

test('engine guards', () => {
  const done = play(new Array(DAYS).fill({ timing: 'late', peeked: false })).state;
  assert.equal(currentLetter(done), null);
  assert.throws(() => deliver(done, { timing: 'ontime' }));
  assert.throws(() => deliver(createStory(), { timing: 'early' }));
  assert.throws(() => ending(createStory()));
});
