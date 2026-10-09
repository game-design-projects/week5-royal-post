// Small-sphere geometry on plain {x,y,z} objects: great-circle angles, landmark
// placement and flight-time estimates. No THREE, so it runs under node --test.

export const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
export const len = (a) => Math.sqrt(dot(a, a));
export function normalize(a) {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
}
export const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
export const deg = (rad) => (rad * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;

// Great-circle angle (radians) between two directions.
export function angleBetween(a, b) {
  const c = dot(normalize(a), normalize(b));
  return Math.acos(Math.max(-1, Math.min(1, c)));
}

// Evenly spread unit vectors (deterministic): the candidate sites for landmarks.
export function fibonacciSphere(n) {
  const out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    out.push({ x: r * Math.cos(t), y, z: r * Math.sin(t) });
  }
  return out;
}

// Points on a small ring around d (angular radius `ang`), for flatness checks.
export function ringAround(d, ang, count = 8) {
  const n = normalize(d);
  const helper = Math.abs(n.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const u = normalize(cross(n, helper));
  const v = cross(n, u);
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const s = Math.sin(ang), c = Math.cos(ang);
    out.push(normalize({
      x: n.x * c + (u.x * Math.cos(t) + v.x * Math.sin(t)) * s,
      y: n.y * c + (u.y * Math.cos(t) + v.y * Math.sin(t)) * s,
      z: n.z * c + (u.z * Math.cos(t) + v.z * Math.sin(t)) * s,
    }));
  }
  return out;
}

// A site is good when it is dry, low and flat-ish: the site and a ring around it
// are all on land, and the elevation barely changes across the ring.
export function siteScore(terrain, d, { minElev, maxElev, ring }) {
  const e = terrain.elev(d);
  if (e < minElev || e > maxElev) return -Infinity;
  let spread = 0;
  for (const p of ringAround(d, ring, 8)) {
    const pe = terrain.elev(p);
    if (pe < 0.01) return -Infinity; // coast too close
    spread = Math.max(spread, Math.abs(pe - e));
  }
  return -spread;
}

// Highroost (castle) and Westmere (tower): the flattest dry site, then the
// flattest dry site whose great-circle angle from it lies in [minDeg, maxDeg].
export function findLandmarks(terrain, { samples = 3000, minDeg = 150, maxDeg = 160, minElev = 0.03, maxElev = 0.11, ring = 0.06 } = {}) {
  const sites = [];
  for (const d of fibonacciSphere(samples)) {
    const s = siteScore(terrain, d, { minElev, maxElev, ring });
    if (s > -Infinity) sites.push({ d, s });
  }
  sites.sort((a, b) => b.s - a.s);
  for (const castle of sites) {
    let best = null;
    for (const tower of sites) {
      const a = deg(angleBetween(castle.d, tower.d));
      if (a < minDeg || a > maxDeg) continue;
      if (!best || tower.s > best.s) best = tower;
    }
    if (best) {
      return { castle: castle.d, tower: best.d, angleDeg: deg(angleBetween(castle.d, best.d)) };
    }
  }
  throw new Error('findLandmarks: no pair of dry sites in the separation band — change SEED');
}

// Seconds to fly a great-circle `angle` (radians) at altitude `alt` (distance
// from the planet centre) and linear speed `speed`. The flight code advances the
// pivot by speed*dt/alt radians per frame, so this is exact for a straight line;
// `maneuver` pads it for take-off, turning and the final approach.
export function travelTime({ angle, alt, speed, maneuver = 1 }) {
  return ((angle * alt) / speed) * maneuver;
}
