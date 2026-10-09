// DOM layer: HUD, story cards, the letter overlay, ending and archive. Knows
// nothing about THREE; main.js feeds it numbers and story objects.
import { CHARACTERS } from './letters.js';
import { letterSize, dayTitle, letterFor } from './story.js';
import { WEIGHT } from './config.js';
import { sunArcPoint, formatClock } from './daylight.js';

const $ = (id) => document.getElementById(id);
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
const WEIGHT_STEPS = { light: 1, medium: 2, heavy: 3, heaviest: 4 };

// ---------- the letter as paper ----------
export function renderLetter(letter, { blot = false } = {}) {
  const prince = letter.from === 'prince';
  const art = el('div', prince ? 'parchment' : 'index-card');
  const wax = el('div', 'wax');
  const seal = el('div', `seal ${CHARACTERS[letter.from].seal} broken`);
  seal.append(el('span'));
  wax.append(seal);
  art.append(wax);
  art.append(el('p', 'salutation', letter.salutation));
  let first = true;
  const item = (it, parent) => {
    if (typeof it === 'string') {
      const p = el('p', first && prince ? 'first' : '', it);
      first = false;
      parent.append(p);
    } else if (it.verse) {
      parent.append(el('p', 'verse', it.verse));
    } else if (it.list) {
      const ul = el('ul');
      for (const li of it.list) ul.append(el('li', '', li));
      parent.append(ul);
    } else if (it.del) {
      const p = el('p');
      const d = el('del', blot ? 'blot' : 'struck', it.del);
      if (blot) d.title = 'Crossed out. You never peeked at this one.';
      p.append(d);
      parent.append(p);
    }
  };
  for (const it of letter.body) item(it, art);
  if (letter.signoff) art.append(el('p', 'signoff', letter.signoff));
  art.append(el('p', 'signature', letter.signature));
  if (letter.postscript?.length) {
    const ps = el('div', 'ps');
    for (const it of letter.postscript) item(it, ps);
    art.append(ps);
  }
  return art;
}

// ---------- story cards ----------
let cardResolve = null;
function resolveCard() {
  if (!cardResolve) return;
  const r = cardResolve;
  cardResolve = null;
  $('cardLayer').hidden = true;
  r();
}
$('cardGo').addEventListener('click', resolveCard);
addEventListener('keydown', (e) => {
  if (cardResolve && !e.repeat && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) {
    e.preventDefault();
    resolveCard();
  }
});

function parcelRow(letter) {
  const row = $('cardParcel');
  row.replaceChildren();
  const seal = el('div', `seal ${CHARACTERS[letter.from].seal}`);
  seal.append(el('span'));
  const text = el('div');
  text.append(el('strong', '', dayTitle(letter)));
  text.append(el('small', '', `${letterSize(letter)} · ${WEIGHT[letter.weight].label} · to ${CHARACTERS[letter.to].home}`));
  row.append(seal, text);
  row.hidden = false;
}

export const ui = {
  // kind: pickup | delivery | lost
  showCard({ kind, card, letter, timing, peeked, last }) {
    const box = $('storyCard');
    const lines = $('cardLines');
    lines.replaceChildren();
    $('cardParcel').hidden = true;
    const speaker = kind === 'lost' ? null : CHARACTERS[card.speaker];
    box.className = `card story-card ${speaker ? speaker.id : 'pigeon'}`;
    $('cardCrest').className = `crest ${speaker ? speaker.id : 'pigeon'}`;
    $('cardName').textContent = speaker ? speaker.name : 'The Royal Post';
    $('cardHome').textContent = speaker ? speaker.home : `Day ${letter.day}`;
    if (kind === 'pickup') {
      lines.append(el('p', 'stage', `Dawn, Day ${letter.day}. ${speaker.name} hands you a letter.`));
      lines.append(el('p', '', card.line));
      if (card.feed) lines.append(el('p', 'gift', `+${card.feed.crumbs} crumbs · wing power full`));
      parcelRow(letter);
      $('cardGo').textContent = 'Take off ⏎';
    } else if (kind === 'delivery') {
      const when = timing === 'late' ? 'Delivered after dark' : 'Delivered before sunset';
      lines.append(el('p', 'stage', `${when}${peeked ? ' · the seal was broken' : ''}.`));
      for (const l of card.lines) lines.append(el('p', '', l));
      $('cardGo').textContent = last ? 'The Harvest Moon ⏎' : 'Next morning ⏎';
    } else {
      lines.append(el('p', 'big', 'The letter never arrived.'));
      for (const l of card.lines) lines.append(el('p', '', l));
      lines.append(el('p', 'stage', `${CHARACTERS[letter.to].name} waits at the window until dark. You arrive empty-clawed.`));
      $('cardGo').textContent = last ? 'The Harvest Moon ⏎' : 'Next morning ⏎';
    }
    $('cardLayer').hidden = false;
    $('cardGo').focus({ preventScroll: true });
    return new Promise((r) => { cardResolve = r; });
  },
  continueCard: resolveCard,
  cardOpen: () => !!cardResolve,

  // ---------- HUD ----------
  setDay(letter) {
    $('dayPill').textContent = `Day ${letter.day} · ${letter.title}`;
  },
  setCrumbs(n) {
    $('crumbs').textContent = n;
  },
  setParcel(letter, broken) {
    const p = $('parcel');
    if (!letter) {
      p.classList.add('empty');
      $('parcelSize').textContent = 'No letter';
      $('weightLabel').textContent = 'empty claws';
      $('sealIcon').className = 'seal sun broken';
      for (const i of $('weight').querySelectorAll('i')) i.classList.remove('on');
      return;
    }
    p.classList.remove('empty');
    $('parcelSize').textContent = letterSize(letter);
    $('weightLabel').textContent = WEIGHT[letter.weight].label;
    $('weight').className = `weight ${letter.weight}`;
    const n = WEIGHT_STEPS[letter.weight];
    [...$('weight').querySelectorAll('i')].forEach((i, k) => i.classList.toggle('on', k < n));
    $('sealIcon').className = `seal ${CHARACTERS[letter.from].seal}${broken ? ' broken' : ''}`;
  },
  setDropProgress(p) {
    $('dropRing').style.strokeDashoffset = String(132 * (1 - Math.max(0, Math.min(1, p))));
  },
  setDial(phase, clock, length) {
    const day = phase <= 1;
    const sp = sunArcPoint(phase);
    $('sun').setAttribute('transform', `translate(${(sp.x * 50).toFixed(1)} ${(50 - sp.y * 50).toFixed(1)})`);
    $('sun').style.opacity = day ? 1 : 0;
    const mp = sunArcPoint(Math.min(0.42, (phase - 1) * 1.4));
    $('moon').setAttribute('transform', `translate(${(mp.x * 50).toFixed(1)} ${(50 - mp.y * 50).toFixed(1)})`);
    $('moon').setAttribute('opacity', day ? 0 : 1);
    const lbl = $('sunset');
    if (day) {
      const left = length - clock;
      lbl.textContent = `Sunset in ${formatClock(left)}`;
      lbl.className = `dial-label${left < 10 ? ' warn' : ''}`;
    } else {
      lbl.textContent = 'After sunset · late';
      lbl.className = 'dial-label late';
    }
  },
  setCompass(angle, dist, label) {
    $('arrow').style.transform = `rotate(${angle}rad)`;
    $('dist').textContent = dist == null ? '—' : `${Math.round(dist * 10)} m`;
    $('target').textContent = label;
  },
  setSpeed(kmh, altM) {
    $('spd').textContent = `${kmh} km/h · alt ${altM} m`;
  },
  setStamina(s) {
    $('stam').style.transform = `scaleX(${s})`;
  },
  toast: (() => {
    let timer = 0;
    return (msg, ms = 1300) => {
      const t = $('toast');
      t.textContent = msg;
      t.style.opacity = 1;
      clearTimeout(timer);
      timer = setTimeout(() => { t.style.opacity = 0; }, ms);
    };
  })(),
  bubble(x, y, text, who) {
    const b = $('bubble');
    if (text == null) {
      b.hidden = true;
      return;
    }
    b.hidden = false;
    b.className = `bubble ${who}`;
    if (b.textContent !== text) b.textContent = text;
    b.style.left = `${x.toFixed(0)}px`;
    b.style.top = `${y.toFixed(0)}px`;
  },

  // ---------- the letter ----------
  showLetter(letter) {
    const box = $('letter');
    box.replaceChildren(renderLetter(letter));
    box.scrollTop = 0;
    $('letterLayer').hidden = false;
  },
  hideLetter() {
    $('letterLayer').hidden = true;
  },
  letterOpen: () => !$('letterLayer').hidden,

  // ---------- ending & archive ----------
  showEnding(end) {
    $('endTitle').textContent = end.title;
    $('endSub').textContent = end.subtitle ?? '';
    const lines = $('endLines');
    lines.replaceChildren();
    for (const l of end.lines) lines.append(el('p', '', l));
    for (const l of end.extras) lines.append(el('p', 'extra', l));
    const st = $('endStats');
    st.replaceChildren();
    for (const [k, label] of [['ontime', 'On time'], ['late', 'Late'], ['lost', 'Lost'], ['peeked', 'Peeked'], ['crumbs', 'Crumbs']]) {
      const d = el('div');
      d.append(el('b', '', String(end.stats[k])), el('span', '', label));
      st.append(d);
    }
    const names = $('endNames');
    names.replaceChildren();
    if (!end.names.length) names.append(el('span', 'plain', 'Nothing. You never landed at Highroost.'));
    for (const n of end.names) names.append(el('span', n === 'Pigeon' ? 'plain' : '', n));
    $('endHint').textContent = end.hint;
    $('endingLayer').hidden = false;
  },
  hideEnding() {
    $('endingLayer').hidden = true;
  },
  showArchive(history) {
    const list = $('archiveList');
    list.replaceChildren();
    for (const h of history) {
      const letter = letterFor(h.day, h.variant);
      const tag = el('div', 'letter-tag');
      tag.append(el('span', '', `Day ${h.day} · ${CHARACTERS[letter.from].home} → ${CHARACTERS[letter.to].home}`));
      const state = h.timing === 'lost' ? 'lost' : h.timing === 'late' ? 'late' : 'on time';
      tag.append(el('span', `state${h.timing === 'ontime' ? ' ok' : ''}`, state));
      if (h.peeked) tag.append(el('span', 'state', 'you peeked'));
      list.append(tag, renderLetter(letter, { blot: !h.peeked }));
    }
    $('archiveLayer').hidden = false;
    $('archiveLayer').scrollTop = 0;
  },
  hideArchive() {
    $('archiveLayer').hidden = true;
  },
};
