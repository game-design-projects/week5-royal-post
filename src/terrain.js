// Planet terrain: seeded value noise on the unit sphere → elevation → radius.
// Pure (no THREE) so tests can check where the landmarks sit.
import { createRng } from './rng.js';

function hash(x, y, z) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function vnoise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  fz = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (a, b, d) => hash(ix + a, iy + b, iz + d);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy),
    l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz,
  );
}

// Elevation thresholds used by the planet colouring and prop placement.
export const BANDS = { deep: -0.06, shallow: 0, sand: 0.02, grass: 0.12, forest: 0.19, rock: 0.25 };

export function createTerrain(seed, R) {
  const rng = createRng(seed ^ 0x9e3779b9);
  const ox = rng.range(0, 64), oy = rng.range(0, 64), oz = rng.range(0, 64);
  // d: unit vector → elevation; < 0 is sea.
  function elev(d) {
    let a = 0, amp = 1, f = 1.5, tot = 0;
    for (let i = 0; i < 5; i++) {
      a += amp * vnoise(d.x * f + ox, d.y * f + oy, d.z * f + oz);
      tot += amp;
      amp *= 0.5;
      f *= 2.1;
    }
    return a / tot - 0.47;
  }
  const radiusAt = (d) => {
    const e = elev(d);
    return R + (e > 0 ? e * 24 : e * 10);
  };
  const groundAt = (d) => Math.max(radiusAt(d), R);
  return { R, elev, radiusAt, groundAt };
}
