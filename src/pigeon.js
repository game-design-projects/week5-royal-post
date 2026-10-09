// The pigeon (Pigeon Planet's model) plus the letter it carries: a fat
// ribboned bundle for the prince's pages, a thin card for the princess's.
import { lam } from './world.js';

const THREE = window.THREE;

export function buildPigeon(scene) {
  const pivot = new THREE.Object3D();
  scene.add(pivot);
  const bird = new THREE.Group();
  pivot.add(bird);
  const P = {
    body: lam('#8c95a8'), dark: lam('#5f667a'), light: lam('#b5bccb'), bar: lam('#2c2f3a'), eye: lam('#e8762c'),
    pupil: lam('#111111'), beak: lam('#3a3a40'), cere: lam('#eef0f3'),
    neck: new THREE.MeshPhongMaterial({ color: '#4f9b7c', emissive: '#2a1b48', shininess: 120, specular: '#c9a0ff', flatShading: true }),
  };
  const sph = new THREE.SphereGeometry(0.5, 14, 10);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const add = (geo, mat, p, s, par = bird) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...p);
    if (s) m.scale.set(...s);
    par.add(m);
    return m;
  };
  add(sph, P.body, [0, 0, 0], [0.75, 0.7, 1.3]);
  add(sph, P.light, [0, -0.12, -0.25], [0.6, 0.5, 0.9]);
  add(sph, P.neck, [0, 0.2, -0.6], [0.55, 0.6, 0.55]);
  add(sph, P.dark, [0, 0.38, -0.85], [0.6, 0.6, 0.62]);
  const beak = add(new THREE.ConeGeometry(0.07, 0.26, 6), P.beak, [0, 0.32, -1.2]);
  beak.rotation.x = -Math.PI / 2;
  add(sph, P.cere, [0, 0.37, -1.1], [0.14, 0.1, 0.14]);
  for (const s of [-1, 1]) {
    add(sph, P.eye, [s * 0.16, 0.43, -1.0], [0.12, 0.12, 0.12]);
    add(sph, P.pupil, [s * 0.19, 0.44, -1.03], [0.06, 0.06, 0.06]);
  }
  const tail = new THREE.Group();
  tail.position.set(0, 0.05, 0.6);
  bird.add(tail);
  add(box, P.body, [0, 0, 0.4], [0.55, 0.06, 0.75], tail);
  add(box, P.bar, [0, 0, 0.82], [0.57, 0.07, 0.14], tail);
  const wings = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(s * 0.3, 0.15, -0.1);
    bird.add(sh);
    add(box, P.body, [s * 0.65, 0, 0], [1.3, 0.07, 0.75], sh);
    add(box, P.bar, [s * 0.6, 0.045, 0.08], [0.7, 0.02, 0.07], sh);
    add(box, P.bar, [s * 0.6, 0.045, 0.24], [0.7, 0.02, 0.07], sh);
    const tip = new THREE.Group();
    tip.position.x = s * 1.3;
    sh.add(tip);
    add(box, P.dark, [s * 0.45, 0, 0.06], [0.9, 0.06, 0.6], tip);
    wings.push({ sh, tip, s });
  }

  // the letter in its claws
  const parcel = new THREE.Group();
  parcel.position.set(0, -0.48, -0.05);
  bird.add(parcel);
  const paperMat = lam('#f3e2b8');
  const cardMat = lam('#fdfcf6');
  const ribbonMat = lam('#b8322b');
  const blueMat = lam('#3f5482');
  const bundle = new THREE.Group();
  bundle.add(new THREE.Mesh(box, paperMat));
  const ribbon = new THREE.Mesh(box, ribbonMat);
  ribbon.scale.set(1.04, 1.06, 0.18);
  bundle.add(ribbon);
  const ribbon2 = new THREE.Mesh(box, ribbonMat);
  ribbon2.scale.set(0.16, 1.06, 1.04);
  bundle.add(ribbon2);
  parcel.add(bundle);
  const card = new THREE.Group();
  card.add(new THREE.Mesh(box, cardMat));
  const stamp = new THREE.Mesh(box, blueMat);
  stamp.scale.set(0.25, 1.4, 0.3);
  card.add(stamp);
  parcel.add(card);

  bird.scale.setScalar(0.75);

  function setLetter(letter) {
    parcel.visible = !!letter;
    if (!letter) return;
    const prince = letter.from === 'prince';
    bundle.visible = prince;
    card.visible = !prince;
    if (prince) {
      const thick = Math.min(0.42, 0.06 + letter.pages * 0.026);
      bundle.scale.set(0.62, thick, 0.46);
      bundle.position.y = -thick / 2 + 0.05;
    } else {
      card.scale.set(0.6, 0.03, 0.4);
    }
  }

  let flapPh = 0;
  function animate(dt, { boost, climb, turn, perched }) {
    const glide = !perched && climb < -0.4 && !boost;
    flapPh += dt * (perched ? 0 : boost ? 20 : glide ? 0 : 10 + climb * 3);
    for (const w of wings) {
      // perched: wings folded back along the body
      const a = perched ? -0.35 : glide ? 0.08 : Math.sin(flapPh) * (boost ? 0.95 : 0.7) + 0.1;
      w.sh.rotation.set(0, perched ? -w.s * 1.38 : 0, w.s * a);
      w.tip.rotation.set(0, perched ? -w.s * 0.35 : 0, w.s * (perched ? 0 : glide ? 0.05 : Math.sin(flapPh - 0.8) * 0.4));
      w.sh.scale.x += ((perched ? 0.5 : 1) - w.sh.scale.x) * Math.min(1, dt * 8);
    }
    const sc = perched ? 0.5 : 0.75;
    bird.scale.setScalar(bird.scale.x + (sc - bird.scale.x) * Math.min(1, dt * 6));
    tail.rotation.x = perched ? 0.25 : -climb * 0.25;
    bird.rotation.set(perched ? 0 : climb * 0.35, 0, perched ? 0 : -turn * 0.7, 'YXZ');
  }

  return { pivot, bird, parcel, setLetter, animate };
}

// A letter tumbling out of the sky after a drop. World-space, self-removing.
export function spawnFallingLetter(scene, fromWorld, up, letter) {
  const g = new THREE.Group();
  const prince = letter.from === 'prince';
  const n = prince ? Math.min(8, Math.ceil(letter.pages / 2)) : 1;
  const mat = lam(prince ? '#f3e2b8' : '#fdfcf6', { side: THREE.DoubleSide, transparent: true });
  const sheets = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), mat);
    s.position.set((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4);
    g.add(s);
    sheets.push({ m: s, vx: (Math.random() - 0.5) * 1.6, vz: (Math.random() - 0.5) * 1.6, spin: 2 + Math.random() * 4, ph: Math.random() * 6 });
  }
  g.position.copy(fromWorld);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up.clone().normalize());
  scene.add(g);
  let t = 0;
  return {
    update(dt) {
      t += dt;
      for (const s of sheets) {
        s.m.position.x += s.vx * dt;
        s.m.position.z += s.vz * dt;
        s.m.position.y -= dt * (1.4 + t * 0.9);
        s.m.rotation.x = Math.sin(t * s.spin + s.ph) * 1.2;
        s.m.rotation.z += dt * s.spin * 0.5;
      }
      mat.opacity = Math.max(0, 1 - t / 3);
      if (t > 3) {
        scene.remove(g);
        return false;
      }
      return true;
    },
  };
}
