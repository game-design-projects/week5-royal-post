// Seeded PRNG (mulberry32). Everything that shapes the world — terrain offsets,
// trees, villages, clouds, crumbs — draws from one of these so the planet is the
// same on every load and the landmarks never end up in the sea.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  const next = mulberry32(seed);
  return {
    next,
    range: (lo, hi) => lo + (hi - lo) * next(),
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    // Uniform random unit vector (plain object, so it works without THREE).
    dir() {
      const u = next() * 2 - 1;
      const t = next() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      return { x: s * Math.cos(t), y: u, z: s * Math.sin(t) };
    },
  };
}
