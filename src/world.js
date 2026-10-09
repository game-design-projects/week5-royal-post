// The planet: terrain mesh, sea, villages, trees, clouds, stars and crumbs.
// Ported from Pigeon Planet; every random draw now comes from the seeded rng,
// and props keep clear of the two landmarks.
import { BANDS } from './terrain.js';
import { angleBetween } from './sphere.js';
import { PROPS, CRUMBS } from './config.js';
import { dbg } from './log.js';

const THREE = window.THREE;
const V = THREE.Vector3;
export const UP = new V(0, 1, 0);

// Lambert in r128 has no flatShading flag; non-indexed geometry already gives faceted normals.
export const lam = (c, extra = {}) => new THREE.MeshLambertMaterial({ color: c, ...extra });

export function buildWorld(scene, { terrain, landmarks, rng }) {
  const { R, elev, radiusAt, groundAt } = terrain;

  // ---------- planet ----------
  const COL = { deep: '#2f6fb0', shallow: '#4aa3d6', sand: '#ecd9a0', grass: '#7cc06a', forest: '#4f9a55', rock: '#9a8f86', snow: '#f6f7fb' };
  for (const k in COL) COL[k] = new THREE.Color(COL[k]);
  {
    const g = new THREE.IcosahedronGeometry(1, 22);
    const pos = g.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const es = new Float32Array(pos.count);
    const v = new V();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      const e = elev(v);
      es[i] = e;
      v.multiplyScalar(R + (e > 0 ? e * 24 : e * 10));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    for (let i = 0; i < pos.count; i += 3) {
      const e = (es[i] + es[i + 1] + es[i + 2]) / 3;
      const j = rng.next() * 0.04;
      const c = e < BANDS.deep ? COL.deep : e < BANDS.shallow ? COL.shallow : e < BANDS.sand ? COL.sand
        : e < BANDS.grass + j ? COL.grass : e < BANDS.forest ? COL.forest : e < BANDS.rock ? COL.rock : COL.snow;
      for (let k = 0; k < 3; k++) {
        cols[(i + k) * 3] = c.r;
        cols[(i + k) * 3 + 1] = c.g;
        cols[(i + k) * 3 + 2] = c.b;
      }
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.computeVertexNormals();
    scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })));
    const sea = new THREE.Mesh(
      new THREE.IcosahedronGeometry(R + 0.05, 12),
      new THREE.MeshPhongMaterial({ color: '#3b93d3', transparent: true, opacity: 0.78, flatShading: true, shininess: 80 }),
    );
    scene.add(sea);
  }

  // ---------- props ----------
  const nearLandmark = (d) => angleBetween(d, landmarks.castle) < PROPS.clearAngle || angleBetween(d, landmarks.tower) < PROPS.clearAngle;
  function plant(obj, d, sink = 0.25) {
    obj.position.copy(d).multiplyScalar(radiusAt(d) - sink);
    obj.quaternion.setFromUnitVectors(UP, d);
    obj.rotateY(rng.next() * 6.28);
    scene.add(obj);
  }
  const M = {
    trunk: lam('#7a5537'), leaf: lam('#3f8a4a'), leaf2: lam('#5aa64f'), wall: lam('#f1e6d2'), wall2: lam('#e7c9a9'),
    roof: lam('#c4553d'), roof2: lam('#5d6f8f'),
    cloud: new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.92 }),
  };
  const G = {
    trunk: new THREE.CylinderGeometry(0.12, 0.16, 0.8, 5), cone: new THREE.ConeGeometry(0.6, 1.5, 6),
    ball: new THREE.IcosahedronGeometry(0.6, 0), box: new THREE.BoxGeometry(1, 1, 1), roof: new THREE.ConeGeometry(0.85, 0.7, 4),
  };
  const randDir = () => new V().copy(rng.dir());
  let trees = 0, houses = 0, tries = 0;
  while ((trees < PROPS.trees || houses < PROPS.houses) && tries < 20000) {
    tries++;
    const d = randDir();
    const e = elev(d);
    if (nearLandmark(d)) continue;
    if (trees < PROPS.trees && e > 0.025 && e < 0.2) {
      const t = new THREE.Group();
      const s = 0.8 + rng.next() * 0.7;
      const tr = new THREE.Mesh(G.trunk, M.trunk);
      tr.position.y = 0.4;
      t.add(tr);
      const pine = e > 0.12 || rng.next() < 0.4;
      const top = new THREE.Mesh(pine ? G.cone : G.ball, pine ? M.leaf : M.leaf2);
      top.position.y = pine ? 1.4 : 1.2;
      t.add(top);
      t.scale.setScalar(s);
      plant(t, d);
      trees++;
    } else if (houses < PROPS.houses && e > 0.02 && e < 0.09) {
      for (let k = 0; k < 4 && houses < PROPS.houses; k++) {
        const dd = d.clone().add(new V(rng.next() - 0.5, rng.next() - 0.5, rng.next() - 0.5).multiplyScalar(0.12)).normalize();
        const ee = elev(dd);
        if (ee < 0.02 || ee > 0.1 || nearLandmark(dd)) continue;
        const h = new THREE.Group();
        const w = 0.8 + rng.next() * 0.6, ht = 0.6 + rng.next() * 1.1;
        const b = new THREE.Mesh(G.box, rng.next() < 0.5 ? M.wall : M.wall2);
        b.scale.set(w, ht, w);
        b.position.y = ht / 2;
        h.add(b);
        const r = new THREE.Mesh(G.roof, rng.next() < 0.65 ? M.roof : M.roof2);
        r.scale.set(w * 0.95, 1, w * 0.95);
        r.rotation.y = Math.PI / 4;
        r.position.y = ht + 0.35;
        h.add(r);
        plant(h, dd, 0.1);
        houses++;
      }
    }
  }
  dbg('world', `props: ${trees} trees, ${houses} houses in ${tries} tries`);

  // ---------- clouds ----------
  const clouds = [];
  for (let i = 0; i < PROPS.clouds; i++) {
    const pivot = new THREE.Object3D();
    pivot.quaternion.setFromUnitVectors(UP, randDir());
    const c = new THREE.Group();
    c.position.y = R + 15 + rng.next() * 5;
    const n = 3 + Math.floor(rng.next() * 3);
    for (let k = 0; k < n; k++) {
      const p = new THREE.Mesh(G.ball, M.cloud);
      p.scale.setScalar(1.6 + rng.next() * 1.6);
      p.position.set((k - n / 2) * 1.4, rng.next() * 0.6, rng.next() * 1.2 - 0.6);
      c.add(p);
    }
    pivot.add(c);
    scene.add(pivot);
    clouds.push({ pivot, axis: new V(rng.next() - 0.5, rng.next() - 0.5, rng.next() - 0.5).normalize(), w: 0.01 + rng.next() * 0.015 });
  }

  // ---------- stars (fade in after sunset) ----------
  const starGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) {
    const d = rng.dir();
    const r = 150 + rng.next() * 40;
    sp[i * 3] = d.x * r; sp[i * 3 + 1] = d.y * r; sp[i * 3 + 2] = d.z * r;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: '#fff6d8', size: 1.1, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat);
  stars.visible = false;
  scene.add(stars);

  // ---------- crumbs ----------
  const crumbMat = new THREE.MeshLambertMaterial({ color: '#f2b13b', emissive: '#7a4a00' });
  const bagelMat = new THREE.MeshLambertMaterial({ color: '#e0a050', emissive: '#8a5200' });
  const glowMat = new THREE.MeshBasicMaterial({ color: '#fff1b0', transparent: true, opacity: 0.28, depthWrite: false });
  const crumbGeo = new THREE.DodecahedronGeometry(0.35, 0), bagelGeo = new THREE.TorusGeometry(0.5, 0.22, 6, 10), glowGeo = new THREE.SphereGeometry(0.9, 12, 8);
  const crumbs = [];
  function placeCrumb(c) {
    const d = randDir();
    c.dir = d;
    c.alt = groundAt(d) + 2 + rng.next() * 7;
    c.mesh.position.copy(d).multiplyScalar(c.alt);
    c.mesh.quaternion.setFromUnitVectors(UP, d);
  }
  function makeCrumb(bagel) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(bagel ? bagelGeo : crumbGeo, bagel ? bagelMat : crumbMat);
    g.add(core);
    const glow = new THREE.Mesh(glowGeo, glowMat);
    if (bagel) glow.scale.setScalar(1.4);
    g.add(glow);
    scene.add(g);
    const c = { mesh: g, core, bagel, ph: rng.next() * 6 };
    placeCrumb(c);
    crumbs.push(c);
  }
  for (let i = 0; i < CRUMBS.count; i++) makeCrumb(false);
  for (let i = 0; i < CRUMBS.bagels; i++) makeCrumb(true);

  return {
    clouds, crumbs, placeCrumb,
    update(dt, t, sky) {
      for (const c of clouds) c.pivot.rotateOnAxis(c.axis, c.w * dt);
      for (const c of crumbs) {
        c.core.rotation.y += dt * 2;
        c.core.rotation.x += dt * 0.7;
        c.mesh.position.copy(c.dir).multiplyScalar(c.alt + Math.sin(t * 2 + c.ph) * 0.25);
      }
      starMat.opacity = sky.stars;
      stars.visible = sky.stars > 0.01;
      stars.rotation.y += dt * 0.004;
    },
  };
}
