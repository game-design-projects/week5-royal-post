// Royal Post — bootstrap and game loop. Owns the run state (G), the flight,
// the camera and the day clock; story decisions live in story.js, text in
// letters.js, DOM in ui.js.
import {
  SEED, R, LANDMARK_BAND_DEG, SPEED, ALT, STAMINA, TURN_RATE, READ_TURN, WEIGHT, DAY,
  DELIVER_RADIUS, DROP_HOLD, DROP_FALL, CRUMBS, APP_VERSION,
} from './config.js';
import { createRng } from './rng.js';
import { createTerrain } from './terrain.js';
import { findLandmarks } from './sphere.js';
import { buildWorld } from './world.js';
import { buildLandmarks, orientOnSphere } from './npc.js';
import { buildPigeon, spawnFallingLetter } from './pigeon.js';
import { createStory, pickup, deliver, ending } from './story.js';
import { CHARACTERS } from './letters.js';
import { skyAt, isLate } from './daylight.js';
import { ui } from './ui.js';
import { initAudio, sfx } from './audio.js';
import { log, dbg } from './log.js';

const THREE = window.THREE;
const V = THREE.Vector3, Q = THREE.Quaternion;
const $ = (id) => document.getElementById(id);

log('boot', `Royal Post v${APP_VERSION} (three r${THREE.REVISION})`);

/* ---------- renderer / scene ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.domElement.tabIndex = 0;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#9fd3f2');
scene.fog = new THREE.Fog('#9fd3f2', 35, 95);
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff1d6, 0.95);
scene.add(sun, sun.target);

/* ---------- world ---------- */
const terrain = createTerrain(SEED, R);
const landmarks = findLandmarks(terrain, { minDeg: LANDMARK_BAND_DEG[0], maxDeg: LANDMARK_BAND_DEG[1] });
log('world', `seed ${SEED}: Highroost ↔ Westmere ${landmarks.angleDeg.toFixed(1)}°`);
const rng = createRng(SEED);
const world = buildWorld(scene, { terrain, landmarks, rng });
const lm = buildLandmarks(scene, terrain, landmarks);
const pigeon = buildPigeon(scene);
const { pivot, bird } = pigeon;

// The Harvest Moon, for the ending (and for anyone late enough to look up).
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(9, 24, 16),
  new THREE.MeshBasicMaterial({ color: '#ffe7a8', fog: false, transparent: true, opacity: 0 }),
);
scene.add(moon);

/* ---------- run state ---------- */
const NO_LETTER = { cruise: 1, boost: 1, drain: 1 };
const G = {
  phase: 'title', // title | card | flying | ending
  story: createStory(),
  letter: null, // the letter in the claws (null once dropped or delivered)
  clock: 0,
  peeked: false,
  reading: false,
  sunsetAnnounced: false,
  dropHold: 0,
  dropping: 0,
  falling: null,
  crumbs: 0,
  stamina: 1,
  alt: R + 10,
  speed: SPEED.cruise,
  turn: 0,
  climb: 0,
  perched: null, // site id while sitting on a balcony
  snapCam: false, // cut the camera next frame instead of easing
  sky: skyAt(0.4),
  skyPhase: 0.4,
  endingData: null,
  moonOn: false,
};

/* ---------- input ---------- */
const keys = {};
addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code) && G.phase === 'flying') e.preventDefault();
  if (e.repeat) {
    keys[e.code] = true;
    return;
  }
  keys[e.code] = true;
  if (G.phase === 'title' && !$('title').hidden && (e.code === 'Enter' || e.code === 'NumpadEnter')) {
    $('go').click();
    return;
  }
  if (G.phase !== 'flying') return;
  if (e.code === 'KeyE') G.reading ? closeLetter() : openLetter();
  if (e.code === 'Escape') closeLetter();
});
addEventListener('keyup', (e) => {
  keys[e.code] = false;
});
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
});
let stick = null;
let touchBoost = false;
let touchDrop = false;
const stickEl = $('stick'), knob = $('knob');
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse') return;
  stick = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
  stickEl.hidden = false;
  stickEl.style.left = e.clientX + 'px';
  stickEl.style.top = e.clientY + 'px';
});
addEventListener('pointermove', (e) => {
  if (!stick || e.pointerId !== stick.id) return;
  stick.dx = Math.max(-1, Math.min(1, (e.clientX - stick.x) / 50));
  stick.dy = Math.max(-1, Math.min(1, (e.clientY - stick.y) / 50));
  knob.style.transform = `translate(${stick.dx * 35}px,${stick.dy * 35}px)`;
});
const endStick = (e) => {
  if (stick && e.pointerId === stick.id) {
    stick = null;
    stickEl.hidden = true;
    knob.style.transform = '';
  }
};
addEventListener('pointerup', endStick);
addEventListener('pointercancel', endStick);
const hold = (btn, on) => {
  btn.addEventListener('pointerdown', (e) => { on(true); e.stopPropagation(); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, () => on(false));
};
hold($('boost'), (v) => { touchBoost = v; });
hold($('btnDrop'), (v) => { touchDrop = v; });
$('btnRead').addEventListener('click', () => (G.reading ? closeLetter() : openLetter()));
$('closeLetter').addEventListener('click', () => closeLetter());

/* ---------- placement helpers ---------- */
// Point the pigeon's nose (local −Z) along the surface toward `toward`.
function aimPivot(up, toward) {
  orientOnSphere(pivot, up, toward.clone().negate());
}
// Sit on the balcony rail, facing the royal (nose = local −Z).
function perchAt(site) {
  orientOnSphere(pivot, site.perch.clone().normalize(), site.perch.clone().sub(site.npcWorld));
  G.alt = site.perch.length();
  G.perched = site.id;
  G.snapCam = true; // story beats cut to the balcony instead of swooping
  G.turn = G.climb = 0;
  bird.position.set(0, G.alt, 0);
}
function setFlying(on) {
  document.body.classList.toggle('not-flying', !on);
  document.body.classList.toggle('ended', G.phase === 'ending');
}

/* ---------- sky ---------- */
function applySky(phase) {
  G.skyPhase = phase;
  G.sky = skyAt(phase);
  scene.background.set(G.sky.sky);
  scene.fog.color.set(G.sky.fog);
  ambient.intensity = G.sky.ambient;
  sun.intensity = G.sky.sun;
  sun.color.set(G.sky.sunColor);
}

/* ---------- the day ---------- */
function startRun() {
  G.story = createStory();
  G.crumbs = 0;
  G.stamina = 1;
  G.endingData = null;
  G.moonOn = false;
  ui.setCrumbs(0);
  log('story', 'new run');
  beginDay();
}

async function beginDay() {
  const p = pickup(G.story);
  G.story = p.state;
  G.letter = p.letter;
  G.peeked = false;
  G.reading = false;
  G.clock = 0;
  G.sunsetAnnounced = false;
  G.dropHold = 0;
  G.dropping = 0;
  G.phase = 'card';
  setFlying(false);
  const sender = lm.sites[p.letter.from];
  perchAt(sender);
  lm.setTarget(null);
  applySky(0);
  pigeon.setLetter(p.letter);
  ui.setDay(p.letter);
  ui.setParcel(p.letter, false);
  ui.setDropProgress(0);
  if (p.card.feed) {
    G.stamina = Math.max(G.stamina, p.card.feed.stamina);
    G.crumbs += p.card.feed.crumbs;
    ui.setCrumbs(G.crumbs);
    sfx.feed();
  }
  sfx.pickup();
  log('story', `day ${p.letter.day} pickup ${p.letter.id} (${letterSummary(p.letter)}) from ${p.letter.from}${p.card.name ? ` — named “${p.card.name}”` : ''}`);
  await ui.showCard({ kind: 'pickup', card: p.card, letter: p.letter });
  takeOff();
}

function letterSummary(l) {
  return `${l.pages} ${l.unit}, ${l.weight}`;
}

function takeOff() {
  const s = lm.sites[G.letter.from], r = lm.sites[G.letter.to];
  G.perched = null;
  // Launch from a few wingbeats out in front of the balcony, so the chase
  // camera starts in open air instead of inside the tower.
  const start = s.perch.clone().addScaledVector(s.front, 6).addScaledVector(s.up, 1.2);
  aimPivot(start.clone().normalize(), r.perch.clone().normalize());
  G.alt = start.length();
  G.snapCam = true;
  G.speed = SPEED.cruise * WEIGHT[G.letter.weight].cruise;
  G.phase = 'flying';
  lm.setTarget(G.letter.to);
  setFlying(true);
  renderer.domElement.focus({ preventScroll: true });
  dbg('flight', 'take off', { from: s.id, to: r.id, alt: G.alt.toFixed(2) });
}

async function arrive() {
  const letter = G.letter;
  const timing = isLate(G.clock, DAY.length) ? 'late' : 'ontime';
  closeLetter();
  G.phase = 'card';
  setFlying(false);
  perchAt(lm.sites[letter.to]);
  lm.setTarget(null);
  const res = deliver(G.story, { timing, peeked: G.peeked });
  G.story = res.state;
  G.letter = null;
  pigeon.setLetter(null);
  ui.setParcel(null);
  sfx.deliver();
  log('story', `day ${letter.day} delivered ${letter.id} ${timing}${G.peeked ? ' (seal broken)' : ''} at ${G.clock.toFixed(1)}s`);
  await ui.showCard({ kind: 'delivery', card: res.card, letter, timing, peeked: G.peeked, last: G.story.done });
  next();
}

function dropLetter() {
  if (!G.letter || G.dropping > 0 || G.phase !== 'flying') return;
  closeLetter();
  G.dropping = DROP_FALL;
  G.dropHold = 0;
  ui.setDropProgress(0);
  const bw = bird.getWorldPosition(new V());
  G.falling = spawnFallingLetter(scene, bw, bw.clone().normalize(), G.letter);
  pigeon.setLetter(null);
  ui.setParcel(null);
  lm.setTarget(null);
  sfx.drop();
  ui.toast('Gone.');
  log('story', `day ${G.letter.day} dropped ${G.letter.id} at ${G.clock.toFixed(1)}s`);
}

async function loseLetter() {
  const letter = G.letter;
  G.phase = 'card';
  setFlying(false);
  const res = deliver(G.story, { timing: 'lost', peeked: G.peeked });
  G.story = res.state;
  G.letter = null;
  log('story', `day ${letter.day} lost ${letter.id}`);
  await ui.showCard({ kind: 'lost', card: res.card, letter, last: G.story.done });
  next();
}

function next() {
  if (G.story.done) showEnding();
  else beginDay();
}

function openLetter() {
  if (!G.letter || G.dropping > 0 || G.phase !== 'flying') return;
  if (!G.peeked) {
    G.peeked = true;
    sfx.seal();
    ui.setParcel(G.letter, true);
    ui.toast('Seal broken');
    log('story', `day ${G.letter.day} peeked ${G.letter.id} at ${G.clock.toFixed(1)}s`);
  } else sfx.rustle();
  G.reading = true;
  ui.showLetter(G.letter);
}
function closeLetter() {
  if (!G.reading) return;
  G.reading = false;
  ui.hideLetter();
}

function showEnding() {
  const end = ending(G.story, { crumbs: G.crumbs });
  G.endingData = end;
  G.phase = 'ending';
  setFlying(false);
  // The Harvest Moon rises over Highroost.
  const site = lm.sites.prince;
  perchAt(site);
  applySky(1.25);
  moon.position.copy(site.perch).addScaledVector(site.front, -150).addScaledVector(site.up, 70);
  G.moonOn = true;
  sfx.ending(end.id === 'happy');
  log('story', `ending: ${end.id} — ${end.title}`, end.stats);
  ui.showEnding(end);
}

$('go').addEventListener('click', () => {
  initAudio();
  $('title').hidden = true;
  startRun();
});
$('again').addEventListener('click', () => {
  ui.hideEnding();
  G.phase = 'card';
  setFlying(false);
  startRun();
});
$('archiveBtn').addEventListener('click', () => {
  ui.hideEnding();
  ui.showArchive(G.story.history);
});
$('archiveClose').addEventListener('click', () => {
  ui.hideArchive();
  ui.showEnding(G.endingData);
});

/* ---------- loop ---------- */
const tmpQ = new Q(), X = new V(1, 0, 0), Y = new V(0, 1, 0);
const birdW = new V(), upW = new V(), camT = new V(), look = new V(), fwd = new V(), loc = new V(), side = new V(), east = new V();
aimPivot(new V().copy(landmarks.castle).normalize(), new V().copy(landmarks.tower));
G.alt = R + 10;
camera.position.set(0, R + 20, 20);
setFlying(false);
let last = performance.now();
let t = 0;

const APPROACH = {
  prince: { day: 'Ah! My winged herald!', night: 'At this hour?! Come in, come in!', leave: 'Fly, herald! Fly!' },
  princess: { day: 'Pigeon.', night: 'It’s late, Pigeon.', leave: 'Go on.' },
};

function frame(now) {
  // rAF can hand back a timestamp from before `last` on the first frame after a
  // long setup; a negative dt would fling every exponential lerp outward.
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
  last = now;
  t += dt;
  const flying = G.phase === 'flying';
  if (flying) G.clock += dt;

  // input → intent
  let ix = 0, iy = 0, boost = false;
  if (flying && !G.reading) {
    ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    iy = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    if (stick) {
      ix = stick.dx;
      iy = -stick.dy;
    }
    boost = (keys.Space || keys.ShiftLeft || keys.ShiftRight || touchBoost) && G.stamina > 0.02;
  } else if (G.phase === 'title') {
    ix = Math.sin(t * 0.3) * 0.35;
    iy = Math.sin(t * 0.5) * 0.3;
  } else {
    ix = READ_TURN; // reading, or waiting on a card mid-air: circle lazily
  }
  G.turn += (ix - G.turn) * Math.min(1, dt * 4);
  G.climb += (iy - G.climb) * Math.min(1, dt * 4);
  const w = G.letter && G.dropping <= 0 ? WEIGHT[G.letter.weight] : NO_LETTER;
  G.stamina = Math.max(0, Math.min(1, G.stamina + (boost ? -STAMINA.drain * w.drain : STAMINA.regen) * dt));
  const cruise = SPEED.cruise * w.cruise;
  const target = G.reading ? cruise * SPEED.glide : boost ? SPEED.boost * w.boost : G.climb < -0.3 ? SPEED.dive * w.cruise : cruise;
  G.speed += (target - G.speed) * Math.min(1, dt * 2);

  // drop: hold Q / DROP
  if (flying && G.letter && G.dropping <= 0) {
    if (keys.KeyQ || touchDrop) {
      G.dropHold += dt;
      ui.setDropProgress(G.dropHold / DROP_HOLD);
      if (G.dropHold >= DROP_HOLD) dropLetter();
    } else if (G.dropHold > 0) {
      G.dropHold = 0;
      ui.setDropProgress(0);
    }
  }
  if (G.falling && !G.falling.update(dt)) G.falling = null;
  if (flying && G.dropping > 0) {
    G.dropping -= dt;
    if (G.dropping <= 0) loseLetter();
  }

  // move on the sphere (not while perched)
  if (!G.perched) {
    pivot.quaternion.multiply(tmpQ.setFromAxisAngle(Y, -G.turn * TURN_RATE * dt));
    pivot.quaternion.multiply(tmpQ.setFromAxisAngle(X, (-G.speed * dt) / G.alt));
    pivot.quaternion.normalize();
    G.alt += G.climb * 5 * dt;
  }
  upW.set(0, 1, 0).applyQuaternion(pivot.quaternion);
  const ground = terrain.groundAt(upW);
  if (!G.perched) {
    const floor = ground + ALT.min;
    if (G.alt < floor) G.alt += (floor - G.alt) * Math.min(1, dt * 10);
    G.alt = Math.min(G.alt, R + ALT.max);
  }
  bird.position.set(0, G.alt, 0);
  pigeon.animate(dt, { boost, climb: G.climb, turn: G.turn, perched: !!G.perched });
  bird.getWorldPosition(birdW);

  // crumbs
  for (const c of world.crumbs) {
    if (!flying) break;
    if (c.mesh.position.distanceTo(birdW) < CRUMBS.pickupRadius) {
      G.crumbs += c.bagel ? CRUMBS.bagelValue : 1;
      ui.setCrumbs(G.crumbs);
      sfx.crumb(c.bagel);
      if (c.bagel) ui.toast('Bagel! +5');
      G.stamina = Math.min(1, G.stamina + CRUMBS.stamina);
      world.placeCrumb(c);
    }
  }

  // day clock → sky
  if (flying) {
    applySky(G.clock / DAY.length);
    if (!G.sunsetAnnounced && isLate(G.clock, DAY.length)) {
      G.sunsetAnnounced = true;
      sfx.sunset();
      ui.toast('Sunset — you’re late', 1800);
      log('story', `day ${G.story.day} sunset — still ${G.letter ? 'carrying' : 'empty'}`);
    }
  }
  world.update(dt, t, G.sky);
  lm.update(dt, t, G.sky);
  moon.material.opacity += ((G.moonOn || G.skyPhase > 1.05 ? 1 : 0) - moon.material.opacity) * Math.min(1, dt * 2);
  moon.visible = moon.material.opacity > 0.01;

  // sun: a personal sun above the pigeon, rising in the east and setting in the west
  east.set(1, 0, 0).applyQuaternion(pivot.quaternion);
  const a = Math.PI * Math.min(1, Math.max(0, G.skyPhase));
  const el = Math.max(0.3, Math.sin(a));
  sun.position.copy(birdW).addScaledVector(upW, 60 * el).addScaledVector(east, 60 * Math.cos(a));
  sun.target.position.copy(birdW);

  // arrival
  if (flying && G.letter && G.dropping <= 0) {
    const r = lm.sites[G.letter.to];
    const d = birdW.distanceTo(r.perch);
    if (d < DELIVER_RADIUS) arrive();
    loc.copy(r.perch);
    pivot.worldToLocal(loc);
    ui.setCompass(Math.atan2(loc.x, -loc.z), d, `to ${r.home}`);
  } else if (flying) {
    ui.setCompass(0, null, 'empty claws');
  }

  // camera
  if (G.perched) {
    const s = lm.sites[G.perched];
    side.crossVectors(s.up, s.front);
    // Royal on the right third, card on the left (desktop) / bottom (phone).
    const narrow = innerWidth < innerHeight;
    camT.copy(s.perch).addScaledVector(s.front, narrow ? 7.5 : 6.2).addScaledVector(s.up, narrow ? 0.2 : 0.9).addScaledVector(side, narrow ? 0.6 : 2.2);
    if (G.snapCam) {
      camera.position.copy(camT);
      camera.up.copy(s.up);
      G.snapCam = false;
    }
    camera.position.lerp(camT, 1 - Math.exp(-dt * 3));
    camera.up.lerp(s.up, 1 - Math.exp(-dt * 4)).normalize();
    look.copy(s.headWorld()).lerp(s.perch, 0.3).addScaledVector(side, narrow ? 0 : -1.5).addScaledVector(s.up, narrow ? -1.6 : -0.2);
    camera.lookAt(look);
    camera.fov += (55 - camera.fov) * Math.min(1, dt * 3);
  } else {
    // On a 30-unit planet the horizon drops fast with height (48° below level at
    // 15 units up), so the camera pitches down as the pigeon climbs to keep the
    // ground in frame.
    const high = Math.max(0, Math.min(4.5, (G.alt - ground - 2) * 0.32));
    camT.set(0, G.alt + 2.4 + high * 0.6 - G.climb * 0.6, 6.8 + high * 0.3).applyQuaternion(pivot.quaternion);
    if (G.snapCam) {
      camera.position.copy(camT);
      camera.up.copy(upW);
      G.snapCam = false;
    }
    camera.position.lerp(camT, 1 - Math.exp(-dt * 5));
    camera.up.lerp(upW, 1 - Math.exp(-dt * 6)).normalize();
    fwd.set(0, 0, -1).applyQuaternion(pivot.quaternion);
    look.copy(birdW).addScaledVector(fwd, 3).addScaledVector(upW, 0.6 - high);
    camera.lookAt(look);
    camera.fov += ((boost ? 72 : 62) - camera.fov) * Math.min(1, dt * 3);
  }
  camera.updateProjectionMatrix();

  // HUD
  if (flying) {
    ui.setStamina(G.stamina);
    ui.setSpeed(Math.round(G.speed * 6), Math.round((G.alt - ground) * 10));
    ui.setDial(G.clock / DAY.length, G.clock, DAY.length);
  }
  updateBubble();

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

function updateBubble() {
  if (G.phase !== 'flying' || G.reading) return ui.bubble(0, 0, null);
  const late = isLate(G.clock, DAY.length);
  let pick = null;
  if (G.letter && G.dropping <= 0) {
    const r = lm.sites[G.letter.to];
    if (birdW.distanceTo(r.perch) < 24) pick = { site: r, text: late ? APPROACH[r.id].night : APPROACH[r.id].day };
  }
  if (!pick && G.clock < 5 && G.story.history.length < 6) {
    const from = G.letter ? lm.sites[G.letter.from] : null;
    if (from && birdW.distanceTo(from.perch) < 14) pick = { site: from, text: APPROACH[from.id].leave };
  }
  if (!pick) return ui.bubble(0, 0, null);
  const p = pick.site.headWorld().project(camera);
  if (p.z > 1 || Math.abs(p.x) > 1.1 || Math.abs(p.y) > 1.1) return ui.bubble(0, 0, null);
  ui.bubble((p.x * 0.5 + 0.5) * innerWidth, (-p.y * 0.5 + 0.5) * innerHeight, pick.text, pick.site.id);
}

requestAnimationFrame(frame);

/* ---------- debug hooks (e2e + playtesting) ---------- */
function teleport(where) {
  const id = where === 'sender' ? G.letter?.from : G.letter?.to;
  const s = lm.sites[id];
  if (!s) return false;
  aimPivot(s.perch.clone().normalize(), s.perch.clone().normalize().add(s.front));
  G.alt = s.perch.length();
  return true;
}
window.__rp = {
  version: APP_VERSION,
  ready: true,
  state: () => ({
    phase: G.phase,
    day: G.story.day,
    done: G.story.done,
    letter: G.letter && { id: G.letter.id, variant: G.letter.variant, weight: G.letter.weight, title: G.letter.title, from: G.letter.from, to: G.letter.to },
    clock: G.clock,
    late: isLate(G.clock, DAY.length),
    peeked: G.peeked,
    reading: G.reading,
    dropping: G.dropping > 0,
    perched: G.perched,
    crumbs: G.crumbs,
    stamina: G.stamina,
    history: G.story.history,
    names: G.story.names,
    card: ui.cardOpen(),
    ending: G.endingData && { id: G.endingData.id, title: G.endingData.title, stats: G.endingData.stats },
    landmarksDeg: landmarks.angleDeg,
    characters: Object.keys(CHARACTERS),
  }),
  debug: {
    start: () => $('go').click(),
    continue: () => ui.continueCard(),
    deliverNow: () => teleport('recipient'),
    // Hover `dist` units out in front of the recipient's balcony, facing it.
    // `skew` aims beside the balcony (negative = landmark sits right of the bird).
    approach: (dist = 14, lift = 2.5, skew = 0) => {
      const r = lm.sites[G.letter?.to];
      if (!r) return false;
      const side = new V().crossVectors(r.up, r.front);
      const p = r.perch.clone().addScaledVector(r.front, dist).addScaledVector(r.up, -2);
      aimPivot(p.clone().normalize(), r.perch.clone().addScaledVector(side, skew).normalize());
      G.alt = r.perch.length() + lift;
      G.climb = G.turn = 0;
      G.snapCam = true;
      return true;
    },
    teleport,
    setClock: (s) => { G.clock = s; },
    peek: () => openLetter(),
    closeLetter: () => closeLetter(),
    drop: () => dropLetter(),
    inspect: () => ({
      camera: camera.position.toArray(),
      bird: bird.getWorldPosition(new V()).toArray(),
      sites: Object.fromEntries(Object.entries(lm.sites).map(([k, s]) => [k, { perch: s.perch.toArray(), up: s.up.toArray(), front: s.front.toArray(), head: s.headWorld().toArray() }])),
    }),
    cover: (on = true) => {
      document.body.classList.toggle('cover', on);
      $('coverTitle').hidden = !on;
    },
  },
};
dbg('boot', 'debug hooks on window.__rp');
