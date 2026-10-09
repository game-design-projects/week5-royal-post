// Highroost (the prince's gold-roofed castle, with a statue of himself) and
// Westmere (the princess's one slim slate tower, garden and beehive), each
// with its royal on a balcony, a perch for the pigeon, and glowing windows.
import { lam } from './world.js';
import { dbg } from './log.js';

const THREE = window.THREE;
const V = THREE.Vector3;

const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
};
const phong = (color, extra = {}) => new THREE.MeshPhongMaterial({ color, flatShading: true, shininess: 70, ...extra });

// Orient `obj` so local +Y is the surface normal `up` and local +Z points along
// the surface toward `face` (both unit vectors).
export function orientOnSphere(obj, up, face) {
  const y = up.clone().normalize();
  const z = face.clone().sub(y.clone().multiplyScalar(y.dot(face))).normalize();
  const x = new V().crossVectors(y, z).normalize();
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

// ---------- the royals ----------
export function buildPrince({ material } = {}) {
  const g = new THREE.Group();
  const skin = material ?? lam('#f2c9a0');
  const M = material
    ? { tunic: material, cape: material, legs: material, gold: material, hair: material, quill: material }
    : { tunic: lam('#f6ead0'), cape: lam('#b8322b'), legs: lam('#3a2a4a'), gold: phong('#e8b93a', { specular: '#fff3c4' }), hair: lam('#d9a441'), quill: lam('#fbfbf6') };
  for (const s of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.5, 6), M.legs, s * 0.1, 0.25, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.6, 8), M.tunic, 0, 0.78, 0));
  const belt = mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.07, 8), M.gold, 0, 0.62, 0);
  g.add(belt);
  const cape = mesh(new THREE.ConeGeometry(0.46, 1.15, 8, 1, true), M.cape, 0, 0.62, -0.1);
  cape.scale.z = 0.55;
  g.add(cape);
  const head = mesh(new THREE.SphereGeometry(0.2, 12, 10), skin, 0, 1.28, 0);
  g.add(head);
  const hair = mesh(new THREE.SphereGeometry(0.21, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.hair, 0, 1.31, -0.02);
  g.add(hair);
  const crown = new THREE.Group();
  crown.position.set(0, 1.44, 0);
  crown.add(mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.1, 10, 1, true), M.gold));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    crown.add(mesh(new THREE.ConeGeometry(0.035, 0.12, 4), M.gold, Math.cos(a) * 0.16, 0.1, Math.sin(a) * 0.16));
  }
  g.add(crown);
  // the enormous quill, held high in the right hand
  const arm = new THREE.Group();
  arm.position.set(0.24, 0.98, 0.02);
  arm.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 6), M.tunic, 0.08, 0.12, 0).rotateZ(-0.5));
  const quill = new THREE.Group();
  quill.position.set(0.2, 0.3, 0.05);
  quill.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 4), M.gold, 0, 0.35, 0));
  const vane = mesh(new THREE.ConeGeometry(0.11, 1.0, 4), M.quill, 0, 0.6, 0);
  vane.scale.z = 0.25;
  quill.add(vane);
  quill.rotation.z = -0.35;
  arm.add(quill);
  g.add(arm);
  const otherArm = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 6), M.tunic, -0.27, 0.9, 0.02);
  otherArm.rotation.z = 0.25;
  g.add(otherArm);
  return { group: g, head, arm, quill, crown };
}

export function buildPrincess() {
  const g = new THREE.Group();
  const M = {
    dress: lam('#2f3f6e'), skin: lam('#e8c0a0'), hair: lam('#3b2a22'), silver: phong('#dfe4ee', { specular: '#ffffff', shininess: 110 }),
    glass: lam('#1d2a3a'), ledger: lam('#7a4a2a'), page: lam('#f6f1e1'), sleeve: lam('#253357'),
  };
  g.add(mesh(new THREE.ConeGeometry(0.36, 0.78, 10), M.dress, 0, 0.39, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.28, 8), M.dress, 0, 0.88, 0));
  const head = mesh(new THREE.SphereGeometry(0.16, 12, 10), M.skin, 0, 1.15, 0);
  g.add(head);
  g.add(mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), M.hair, 0, 1.17, -0.025));
  g.add(mesh(new THREE.SphereGeometry(0.085, 8, 6), M.hair, 0, 1.25, -0.15));
  const circlet = mesh(new THREE.TorusGeometry(0.155, 0.014, 6, 20), M.silver, 0, 1.25, 0);
  circlet.rotation.x = Math.PI / 2 - 0.15;
  g.add(circlet);
  for (const s of [-1, 1]) {
    const lens = mesh(new THREE.TorusGeometry(0.045, 0.011, 5, 12), M.glass, s * 0.06, 1.16, 0.15);
    g.add(lens);
  }
  g.add(mesh(new THREE.BoxGeometry(0.04, 0.012, 0.012), M.glass, 0, 1.165, 0.155));
  // the ledger, held open at the chest
  const ledger = new THREE.Group();
  ledger.position.set(0, 0.84, 0.2);
  ledger.rotation.x = -0.9;
  ledger.add(mesh(new THREE.BoxGeometry(0.34, 0.035, 0.24), M.ledger));
  ledger.add(mesh(new THREE.BoxGeometry(0.31, 0.02, 0.21), M.page, 0, 0.022, 0));
  g.add(ledger);
  for (const s of [-1, 1]) {
    const arm = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6), M.sleeve, s * 0.14, 0.86, 0.1);
    arm.rotation.x = -1.0;
    g.add(arm);
  }
  return { group: g, head, ledger };
}

// ---------- buildings ----------
function buildCastle(windowMat) {
  const g = new THREE.Group();
  const stone = lam('#d6c8ae'), wall = lam('#f1e6d2'), dark = lam('#5a4636');
  const gold = phong('#e8b93a', { specular: '#fff3c4', shininess: 90 });
  const red = lam('#c4553d', { side: THREE.DoubleSide });
  g.add(mesh(new THREE.CylinderGeometry(3.5, 4.3, 1.8, 12), stone, 0, -0.1, 0));
  g.add(mesh(new THREE.BoxGeometry(3.5, 2.4, 2.6), wall, 0, 2.0, 0));
  for (let x = -1.5; x <= 1.51; x += 0.6) {
    for (const z of [-1.3, 1.3]) g.add(mesh(new THREE.BoxGeometry(0.3, 0.34, 0.3), wall, x, 3.37, z));
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(mesh(new THREE.CylinderGeometry(0.52, 0.6, 3.7, 10), wall, sx * 1.8, 2.65, sz * 1.35));
      g.add(mesh(new THREE.ConeGeometry(0.78, 1.4, 10), gold, sx * 1.8, 5.2, sz * 1.35));
      g.add(mesh(new THREE.BoxGeometry(0.22, 0.36, 0.06), windowMat, sx * 1.8, 3.4, sz * 1.35 + sz * 0.57));
    }
  }
  // the great tower with the balcony
  g.add(mesh(new THREE.CylinderGeometry(0.85, 0.95, 5.8, 12), wall, 0, 3.7, -0.45));
  g.add(mesh(new THREE.ConeGeometry(1.15, 2.1, 12), gold, 0, 7.65, -0.45));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 4), dark, 0, 9.4, -0.45));
  const flag = mesh(new THREE.PlaneGeometry(1.0, 0.55), red, 0.5, 9.85, -0.45);
  g.add(flag);
  g.add(mesh(new THREE.BoxGeometry(2.0, 0.18, 1.2), stone, 0, 5.0, 0.55));
  g.add(mesh(new THREE.BoxGeometry(2.0, 0.1, 0.08), gold, 0, 5.48, 1.12));
  for (const x of [-0.95, -0.5, 0, 0.5, 0.95]) g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 5), gold, x, 5.25, 1.12));
  g.add(mesh(new THREE.BoxGeometry(0.55, 0.9, 0.06), windowMat, 0, 5.55, 0.47));
  // door, windows, banners
  g.add(mesh(new THREE.BoxGeometry(0.75, 1.1, 0.06), dark, 0, 1.35, 1.31));
  for (const x of [-1.0, 1.0]) g.add(mesh(new THREE.BoxGeometry(0.3, 0.45, 0.06), windowMat, x, 2.55, 1.31));
  for (const x of [-0.55, 0.55]) {
    g.add(mesh(new THREE.PlaneGeometry(0.42, 1.25), red, x, 2.35, 1.34));
    g.add(mesh(new THREE.TorusGeometry(0.11, 0.025, 5, 14), gold, x, 2.55, 1.35));
  }
  // a statue of himself, naturally
  g.add(mesh(new THREE.BoxGeometry(0.8, 0.9, 0.8), stone, 0, 1.2, 3.0));
  const statue = buildPrince({ material: gold });
  statue.group.position.set(0, 1.65, 3.0);
  statue.group.scale.setScalar(1.35);
  g.add(statue.group);
  return { group: g, flag, npcAt: new V(0, 5.09, 0.75), perch: new V(-0.78, 5.62, 1.12) };
}

function buildTower(windowMat) {
  const g = new THREE.Group();
  const stone = lam('#b9bfcc'), slate = lam('#6f80a3'), roof = lam('#3e4a66'), iron = lam('#2c3240');
  const gold = phong('#e3b34c', { specular: '#fff1c0' });
  g.add(mesh(new THREE.CylinderGeometry(1.25, 1.7, 1.4, 12), stone, 0, -0.1, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.62, 0.8, 7.2, 12), slate, 0, 4.2, 0));
  for (const y of [2.4, 4.6, 7.0]) g.add(mesh(new THREE.CylinderGeometry(0.7 - y * 0.012, 0.7 - y * 0.012, 0.12, 12), roof, 0, y, 0));
  g.add(mesh(new THREE.ConeGeometry(0.98, 2.0, 12), roof, 0, 8.8, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 4), iron, 0, 10.2, 0));
  const vane = mesh(new THREE.ConeGeometry(0.08, 0.5, 5), gold, 0.18, 10.45, 0);
  vane.rotation.z = -Math.PI / 2;
  g.add(vane);
  // balcony (half disc + iron rail) and the lit door behind her
  g.add(mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.14, 14, 1, false, -Math.PI / 2, Math.PI), stone, 0, 6.2, 0.5));
  const rail = mesh(new THREE.TorusGeometry(0.85, 0.025, 4, 18, Math.PI), iron, 0, 6.62, 0.5);
  rail.rotation.x = Math.PI / 2;
  rail.rotation.z = Math.PI;
  g.add(rail);
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI;
    g.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 4), iron, Math.cos(a) * 0.85, 6.42, 0.5 + Math.sin(a) * 0.85));
  }
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.95, 0.06), windowMat, 0, 6.75, 0.66));
  for (const y of [2.0, 3.6, 5.1]) g.add(mesh(new THREE.BoxGeometry(0.2, 0.36, 0.06), windowMat, 0, y, 0.77 - y * 0.012));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.8, 0.06), lam('#3a2d26'), 0, 0.95, 1.05));
  return { group: g, npcAt: new V(0, 6.27, 0.82), perch: new V(-0.62, 6.82, 1.1) };
}

function buildGarden(g, groundY) {
  const soil = lam('#7a5537'), leaf = lam('#5aa64f'), carrot = lam('#e8873a');
  for (const dz of [-0.65, 0, 0.65]) {
    const x = 2.3, z = 0.6 + dz, y = groundY(x, z);
    g.add(mesh(new THREE.BoxGeometry(1.5, 0.28, 0.45), soil, x, y + 0.1, z));
    for (let i = 0; i < 4; i++) {
      const cx = x - 0.55 + i * 0.37;
      if ((i + Math.round(dz * 2)) % 2) g.add(mesh(new THREE.IcosahedronGeometry(0.14, 0), leaf, cx, y + 0.32, z));
      else {
        const c = mesh(new THREE.ConeGeometry(0.06, 0.24, 5), carrot, cx, y + 0.35, z);
        c.rotation.x = Math.PI;
        g.add(c);
        g.add(mesh(new THREE.ConeGeometry(0.07, 0.16, 4), leaf, cx, y + 0.52, z));
      }
    }
  }
}

function buildBeehive(g, groundY) {
  const straw = lam('#e3b34c'), dark = lam('#3a2a1a');
  const x = -1.95, z = 1.15, y = groundY(x, z);
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 5), dark, x, y + 0.25, z));
  const radii = [0.4, 0.36, 0.3, 0.2, 0.08];
  radii.forEach((r, i) => g.add(mesh(new THREE.CylinderGeometry(r * 0.9, r, 0.2, 12), straw, x, y + 0.6 + i * 0.18, z)));
  g.add(mesh(new THREE.BoxGeometry(0.14, 0.09, 0.06), dark, x, y + 0.62, z + 0.38));
  const bees = [];
  const beeMat = lam('#ffd23f');
  for (let i = 0; i < 4; i++) {
    const b = mesh(new THREE.SphereGeometry(0.05, 6, 4), beeMat, x, y + 0.9, z);
    g.add(b);
    bees.push({ m: b, ph: i * 1.7, cx: x, cy: y + 0.9, cz: z });
  }
  return bees;
}

function buildBeacon(color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.AdditiveBlending });
  const beam = mesh(new THREE.CylinderGeometry(0.3, 0.75, 34, 16, 1, true), mat, 0, 17.5, 0);
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, fog: false, depthWrite: false });
  const ring = mesh(new THREE.TorusGeometry(1.5, 0.07, 6, 36), ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(beam, ring);
  return { group, beam, ring, mat, ringMat };
}

export function buildLandmarks(scene, terrain, landmarks) {
  const winMat = () => new THREE.MeshLambertMaterial({ color: '#2b3550', emissive: '#ffb347', emissiveIntensity: 0 });

  function place(built, dir, faceDir) {
    const d = dir.clone().normalize();
    built.group.position.copy(d).multiplyScalar(terrain.groundAt(d) - 0.3);
    orientOnSphere(built.group, d, faceDir.clone().normalize());
    scene.add(built.group);
    built.group.updateMatrixWorld(true);
    const baseR = built.group.position.length();
    // local y at which a prop at local (x, z) sits on the terrain
    built.groundY = (x, z) => {
      const w = built.group.localToWorld(new V(x, 0, z));
      return terrain.groundAt(w.clone().normalize()) - baseR - 0.05;
    };
    return built;
  }

  const castleWin = winMat(), towerWin = winMat();
  const castle = place(buildCastle(castleWin), new V().copy(landmarks.castle), new V().copy(landmarks.tower));
  const tower = place(buildTower(towerWin), new V().copy(landmarks.tower), new V().copy(landmarks.castle));
  buildGarden(tower.group, tower.groundY);
  const bees = buildBeehive(tower.group, tower.groundY);

  const prince = buildPrince();
  prince.group.position.copy(castle.npcAt);
  castle.group.add(prince.group);
  const princess = buildPrincess();
  princess.group.position.copy(tower.npcAt);
  princess.group.scale.setScalar(1.05);
  tower.group.add(princess.group);
  castle.group.updateMatrixWorld(true);
  tower.group.updateMatrixWorld(true);

  const site = (built, npc, id, home) => ({
    id, home, built, npc,
    perch: built.group.localToWorld(built.perch.clone()),
    npcWorld: built.group.localToWorld(built.npcAt.clone()),
    up: built.group.position.clone().normalize(),
    front: new V(0, 0, 1).applyQuaternion(built.group.quaternion),
    headWorld: () => npc.head.getWorldPosition(new V()).add(built.group.position.clone().normalize().multiplyScalar(0.45)),
  });
  const sites = {
    prince: site(castle, prince, 'prince', 'Highroost'),
    princess: site(tower, princess, 'princess', 'Westmere'),
  };

  const beacon = buildBeacon('#ffd36b');
  scene.add(beacon.group);
  const BEACON_COLORS = { prince: '#ffcf5a', princess: '#9cc4ff' };
  function setTarget(id) {
    const s = sites[id];
    if (!s) {
      beacon.group.visible = false;
      return;
    }
    beacon.group.visible = true;
    beacon.group.position.copy(s.perch);
    beacon.group.quaternion.setFromUnitVectors(new V(0, 1, 0), s.up);
    beacon.mat.color.set(BEACON_COLORS[id]);
    beacon.ringMat.color.set(BEACON_COLORS[id]);
  }

  dbg('world', 'landmarks placed', { castle: castle.group.position.toArray().map((n) => n.toFixed(2)), tower: tower.group.position.toArray().map((n) => n.toFixed(2)) });

  return {
    sites,
    setTarget,
    update(dt, t, sky) {
      castleWin.emissiveIntensity = 0.05 + sky.windows * 1.1;
      towerWin.emissiveIntensity = 0.08 + sky.windows * 1.2;
      castle.flag.rotation.y = Math.sin(t * 2.3) * 0.25;
      prince.arm.rotation.z = Math.sin(t * 1.6) * 0.18;
      prince.group.position.y = castle.npcAt.y + Math.abs(Math.sin(t * 1.6)) * 0.03;
      princess.head.rotation.y = Math.sin(t * 0.7) * 0.35;
      princess.ledger.rotation.z = Math.sin(t * 0.9) * 0.08;
      for (const b of bees) b.m.position.set(b.cx + Math.cos(t * 3 + b.ph) * 0.45, b.cy + Math.sin(t * 5 + b.ph) * 0.15, b.cz + Math.sin(t * 3 + b.ph) * 0.45);
      if (beacon.group.visible) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 3);
        beacon.ring.scale.setScalar(1 + pulse * 0.25);
        beacon.ringMat.opacity = 0.55 + pulse * 0.35;
        beacon.mat.opacity = 0.12 + sky.windows * 0.12 + pulse * 0.05;
      }
    },
  };
}
