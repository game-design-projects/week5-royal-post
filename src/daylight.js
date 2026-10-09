// Day clock → sky, fog, light and HUD values. Pure: phase in, numbers/hex out.
// phase = clock / DAY.length: 0 sunrise · 0.5 noon · 1 sunset · >1 night (late).

const KEYS = [
  // phase, sky, fog, ambient, sun, sunColor
  [0.0, '#f6b8a2', '#f3c3b0', 0.5, 0.75, '#ffc9a0'],
  [0.14, '#bfe2f6', '#c9e6f6', 0.55, 0.92, '#fff1d6'],
  [0.5, '#9fd3f2', '#9fd3f2', 0.55, 0.95, '#fff1d6'],
  [0.78, '#f4cf8e', '#f2d3a0', 0.52, 0.9, '#ffd59a'],
  [0.93, '#ee9a6c', '#e9a07a', 0.45, 0.7, '#ff9f6b'],
  [1.0, '#7b5f97', '#7a6496', 0.36, 0.42, '#c98fd0'],
  [1.12, '#1b2444', '#1d2748', 0.26, 0.2, '#9fb4ff'],
];

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const lerp = (a, b, t) => a + (b - a) * t;
export const lerpHex = (a, b, t) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => lerp(v, B[i], t)));
};
const smooth = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export function skyAt(phase) {
  const p = Math.max(0, phase);
  let i = 0;
  while (i < KEYS.length - 1 && p > KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const t = a === b ? 0 : Math.max(0, Math.min(1, (p - a[0]) / (b[0] - a[0])));
  return {
    sky: lerpHex(a[1], b[1], t),
    fog: lerpHex(a[2], b[2], t),
    ambient: lerp(a[3], b[3], t),
    sun: lerp(a[4], b[4], t),
    sunColor: lerpHex(a[5], b[5], t),
    stars: smooth(0.96, 1.14, p), // 0 → 1 as night falls
    windows: smooth(0.8, 1.02, p), // landmark windows start glowing at golden hour
  };
}

export const isLate = (clock, length) => clock > length;
export const sunsetIn = (clock, length) => Math.max(0, length - clock);

export function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// HUD sun arc: phase 0..1 maps to angle π..0 along the top semicircle; returns
// the sun's position on a unit semicircle (x right, y up). After sunset the sun
// sits on the right horizon and the moon takes over.
export function sunArcPoint(phase) {
  const p = Math.max(0, Math.min(1, phase));
  const a = Math.PI * (1 - p);
  return { x: Math.cos(a), y: Math.sin(a) };
}
