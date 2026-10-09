// The story engine. Pure and immutable: every function takes a state and
// returns a new one. Six days, one letter a day; each letter's variant is picked
// from how the previous letter travelled (on time / late / lost, peeked or not).
import { CHARACTERS, LETTERS, REACTIONS, ENDINGS, EPILOGUE } from './letters.js';

export const DAYS = 6;
export const TIMINGS = ['ontime', 'late', 'lost'];

export function createStory() {
  return { day: 1, history: [], names: [], done: false };
}

// Which variant of day `day`'s letter gets written, given what happened so far.
export function variantFor(day, history) {
  const prev = history[day - 2];
  switch (day) {
    case 1:
      return 'proposal';
    case 2:
      return prev.timing === 'lost' ? 'silence' : 'received';
    case 3:
      return prev.timing === 'lost' ? 'elaborate' : 'ode';
    case 4:
      return prev.timing === 'lost' ? 'silence' : 'ask';
    case 5:
      // The turning point: did her question reach him, and in daylight?
      if (prev.timing === 'ontime') return 'true';
      if (prev.timing === 'late') return 'candlelight';
      return 'cantos';
    case 6:
      if (prev.timing === 'lost') return 'nothing-again';
      if (prev.variant === 'true') return 'just-maren';
      if (prev.variant === 'candlelight') return prev.timing === 'ontime' ? 'finish-it' : 'after-dark';
      return 'twelve-cantos';
    default:
      throw new Error(`variantFor: no day ${day}`);
  }
}

export function letterFor(day, variant) {
  const base = LETTERS[day]?.[variant];
  if (!base) throw new Error(`letterFor: no letter for day ${day} variant ${variant}`);
  const unit = base.unit ?? CHARACTERS[base.from].unit;
  return { ...base, unit, day, variant, id: `L${day}-${variant}` };
}

export function currentLetter(state) {
  if (state.done) return null;
  return letterFor(state.day, variantFor(state.day, state.history));
}

// "11 pages · heavy", "1 card · light"
export function letterSize(letter) {
  const n = letter.pages;
  const unit = letter.unit === 'card' ? 'card' : n === 1 ? 'page' : 'pages';
  return `${n} ${unit}`;
}
export const dayTitle = (letter) => `Day ${letter.day} — ${letter.title}`;

// All words on the page, crossed-out lines included (you read those too).
export function wordCount(letter) {
  const parts = [letter.salutation, letter.signoff, letter.signature];
  for (const item of [...letter.body, ...(letter.postscript ?? [])]) {
    if (typeof item === 'string') parts.push(item);
    else if (item.verse) parts.push(item.verse);
    else if (item.list) parts.push(...item.list);
    else if (item.del) parts.push(item.del);
  }
  return parts.filter(Boolean).join(' ').split(/\s+/).filter((w) => /\w/.test(w)).length;
}
export const readSeconds = (letter, wps) => wordCount(letter) / wps;

// Sender hands over the letter. Records any grand name the prince bestows.
export function pickup(state) {
  const letter = currentLetter(state);
  const { line, name, feed } = letter.pickup;
  const names = name ? [...state.names, name] : state.names;
  return {
    state: { ...state, names },
    letter,
    card: { kind: 'pickup', speaker: letter.from, line, name: name ?? null, feed: feed ?? null },
  };
}

// The pigeon lands (or loses the letter). outcome: {timing, peeked}.
export function deliver(state, { timing, peeked = false }) {
  if (state.done) throw new Error('deliver: story is over');
  if (!TIMINGS.includes(timing)) throw new Error(`deliver: bad timing ${timing}`);
  const letter = currentLetter(state);
  const entry = { day: state.day, variant: letter.variant, id: letter.id, timing, peeked: !!peeked };
  const history = [...state.history, entry];
  const done = state.day >= DAYS;
  let names = state.names;
  let card;

  if (timing === 'lost') {
    card = { kind: 'lost', speaker: letter.to, lines: [letter.lost] };
  } else {
    const who = REACTIONS[letter.to];
    const lines = [];
    let name = null;
    if (letter.to === 'prince') {
      name = letter.arriveName ?? who.names[state.day];
      names = [...names, name];
      lines.push(who.bark(name));
    } else {
      lines.push(who.bark());
    }
    lines.push(who[timing][state.day]);
    if (peeked) lines.push(letter.sealLine ?? who.broken);
    lines.push(letter.arrive);
    card = { kind: 'delivery', speaker: letter.to, lines, name };
  }

  return {
    state: { day: done ? state.day : state.day + 1, history, names, done },
    card,
  };
}

// The rule from docs/DESIGN.md: happy iff the key letter (day 5) was the true
// one and arrived at all, or was the candlelight one and arrived before sunset.
export function isHappy(history) {
  const k = history[4];
  if (!k) return false;
  return (k.variant === 'true' && k.timing !== 'lost') || (k.variant === 'candlelight' && k.timing === 'ontime');
}

export function stats(history) {
  const s = { ontime: 0, late: 0, lost: 0, peeked: 0 };
  for (const h of history) {
    s[h.timing]++;
    if (h.peeked) s.peeked++;
  }
  return s;
}

export function ending(state, { crumbs = 0 } = {}) {
  if (!state.done) throw new Error('ending: story is not over');
  const happy = isHappy(state.history);
  const base = happy ? ENDINGS.happy : ENDINGS.unhappy;
  const s = stats(state.history);
  const extras = [];
  if (happy && state.history[5]?.timing === 'lost') extras.push(EPILOGUE.lastLost);
  if (s.peeked >= 3) extras.push(EPILOGUE.peeker);
  if (s.lost >= 2) extras.push(EPILOGUE.loser);
  if (s.ontime === DAYS) extras.push(EPILOGUE.punctual);
  if (crumbs >= 40) extras.push(EPILOGUE.glutton(crumbs));
  return {
    id: base.id,
    title: base.title,
    subtitle: base.subtitle ?? null,
    lines: base.lines,
    extras,
    hint: base.hint,
    stats: { ...s, crumbs },
    names: state.names,
  };
}

// Every letter the player could ever be handed, for content tests and the archive.
export function allVariants() {
  const out = [];
  for (const day of Object.keys(LETTERS)) {
    for (const variant of Object.keys(LETTERS[day])) out.push(letterFor(Number(day), variant));
  }
  return out;
}
