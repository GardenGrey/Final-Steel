// Simple primitive-based 3D models, colored by faction (see docs/06-art-direction.md).
// These are placeholder art: boxes, cylinders and cones that read clearly from above.

import * as THREE from '../vendor/three.module.js';
import { FACTIONS } from './config.js';

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 14),
  cone: new THREE.ConeGeometry(1, 1, 8),
  sphere: new THREE.SphereGeometry(1, 12, 8),
  dome: new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
};

function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

// Adds a primitive to a group. `s` is [sx, sy, sz], `p` is [x, y, z], `r` optional [rx, ry, rz].
function part(group, geom, color, s, p, r, opts) {
  const m = new THREE.Mesh(geom, mat(color, opts));
  m.scale.set(s[0], s[1], s[2]);
  m.position.set(p[0], p[1], p[2]);
  if (r) m.rotation.set(r[0], r[1], r[2]);
  group.add(m);
  return m;
}

const GLOW_GREEN = { emissive: 0x39ff14, emissiveIntensity: 1 };
const GLOW_ORANGE = { emissive: 0xff7a1a, emissiveIntensity: 1 };

export function makeCombot(faction) {
  const f = FACTIONS[faction];
  const g = new THREE.Group();
  if (faction === 'azorious') {
    part(g, G.box, f.color, [0.55, 2.4, 0.65], [-0.7, 1.2, 0]);
    part(g, G.box, f.color, [0.55, 2.4, 0.65], [0.7, 1.2, 0]);
    part(g, G.box, f.color, [1.8, 1.7, 1.2], [0, 3.2, 0]);
    part(g, G.box, f.trim, [1.9, 0.25, 1.3], [0, 3.5, 0]);
    part(g, G.sphere, f.trim, [0.6, 0.6, 0.6], [0, 4.5, 0.1]);
    part(g, G.box, f.trim, [0.35, 0.35, 3.2], [-1.3, 3.2, 1.2]); // rifles
    part(g, G.box, f.trim, [0.35, 0.35, 3.2], [1.3, 3.2, 1.2]);
    part(g, G.box, f.trim, [4.2, 0.12, 1.1], [0, 3.6, -0.9]); // wings
  } else if (faction === 'rakdos') {
    part(g, G.box, f.color, [1.2, 2.2, 1.4], [-1.1, 1.1, 0]);
    part(g, G.box, f.color, [1.2, 2.2, 1.4], [1.1, 1.1, 0]);
    part(g, G.box, f.color, [3.2, 2.6, 2.2], [0, 3.5, 0]);
    part(g, G.box, f.trim, [3.4, 0.3, 2.4], [0, 4.5, 0]);
    part(g, G.box, f.color, [1.3, 1.1, 1.3], [0, 5.4, 0.2]);
    part(g, G.box, f.trim, [0.3, 0.8, 1.2], [0, 6.1, 0.2]); // crest
    part(g, G.box, f.color, [1.1, 0.9, 1.6], [-2.1, 4.7, 0]); // shoulders
    part(g, G.box, f.color, [1.1, 0.9, 1.6], [2.1, 4.7, 0]);
    part(g, G.box, f.trim, [0.3, 0.3, 3.2], [-2.2, 3.4, 1.5]); // axe haft
    part(g, G.box, f.trim, [0.2, 1.8, 1.4], [-2.2, 3.4, 3]); // axe blade
    part(g, G.box, f.trim, [0.3, 0.3, 3.2], [2.2, 3.4, 1.5]);
    part(g, G.box, f.trim, [0.2, 1.8, 1.4], [2.2, 3.4, 3]);
  } else if (faction === 'simic') {
    part(g, G.box, f.color, [2, 1.1, 2.8], [0, 1.9, 0]);
    part(g, G.box, 0x8b5bc4, [1.4, 0.5, 2.2], [0, 2.55, 0]);
    part(g, G.box, f.color, [0.5, 1.7, 0.5], [-1.1, 0.9, 0.9], [0, 0, 0.5]);
    part(g, G.box, f.color, [0.5, 1.7, 0.5], [1.1, 0.9, 0.9], [0, 0, -0.5]);
    part(g, G.box, f.color, [0.5, 1.7, 0.5], [-1.1, 0.9, -0.9], [0, 0, 0.5]);
    part(g, G.box, f.color, [0.5, 1.7, 0.5], [1.1, 0.9, -0.9], [0, 0, -0.5]);
    part(g, G.box, f.color, [1.1, 0.8, 1.5], [0, 2.4, 1.9]); // head
    part(g, G.sphere, 0xe9d8ff, [0.28, 0.28, 0.28], [-0.35, 2.6, 2.6], null, { emissive: 0xb28cff });
    part(g, G.sphere, 0xe9d8ff, [0.28, 0.28, 0.28], [0.35, 2.6, 2.6], null, { emissive: 0xb28cff });
    part(g, G.box, f.trim, [0.5, 0.5, 2.6], [0, 1.9, -2.3]); // tail
    part(g, G.sphere, 0xcfb6ff, [0.55, 0.55, 0.55], [-1.3, 2.1, 1.6], null, { emissive: 0x9b6bff }); // shock hands
    part(g, G.sphere, 0xcfb6ff, [0.55, 0.55, 0.55], [1.3, 2.1, 1.6], null, { emissive: 0x9b6bff });
  } else {
    // The Hollow: sage gray, asymmetrical, neon green glow.
    part(g, G.box, f.color, [3.2, 3, 2.4], [0, 3.8, 0], [0.05, 0.2, 0.1]);
    part(g, G.cone, f.color, [0.5, 2.6, 0.5], [-1.5, 6, -0.4], [0.2, 0, 0.3]);
    part(g, G.cone, f.color, [0.4, 1.9, 0.4], [0.9, 6, 0.3], [-0.2, 0, -0.2]);
    part(g, G.cone, f.color, [0.35, 1.4, 0.35], [1.6, 5.6, -0.7], [0.3, 0, -0.5]);
    part(g, G.cone, f.color, [0.5, 3.2, 0.5], [-1.8, 1.6, 0.8], [0, 0, 0.35]);
    part(g, G.cone, f.color, [0.5, 3.6, 0.5], [1.9, 1.8, -0.6], [0, 0, -0.25]);
    part(g, G.cone, f.color, [0.4, 2.6, 0.4], [0.2, 1.3, 1.4], [0.35, 0, 0]);
    part(g, G.sphere, 0xaab5a5, [1.1, 0.9, 1.1], [-0.2, 5.6, 1.1]);
    part(g, G.sphere, f.trim, [0.22, 0.22, 0.22], [-0.6, 5.7, 2.0], null, GLOW_GREEN);
    part(g, G.sphere, f.trim, [0.22, 0.22, 0.22], [0.2, 5.8, 2.1], null, GLOW_GREEN);
    part(g, G.sphere, f.trim, [0.7, 0.7, 0.7], [0, 4, 1.3], null, GLOW_GREEN); // core
    part(g, G.cyl, f.color, [0.7, 3.4, 0.7], [2.2, 4.1, 1.8], [Math.PI / 2, 0, 0]); // arm cannon
    part(g, G.sphere, f.trim, [0.55, 0.55, 0.55], [2.2, 4.1, 3.6], null, GLOW_GREEN);
  }
  g.scale.setScalar(1.1);
  return g;
}

export function makeBot(faction) {
  const f = FACTIONS[faction];
  const g = new THREE.Group();
  if (faction === 'azorious') {
    part(g, G.box, f.color, [1.2, 0.7, 1.8], [0, 0.9, 0]);
    part(g, G.box, f.trim, [2.8, 0.1, 0.7], [0, 1.3, -0.2]);
    part(g, G.cyl, f.trim, [0.3, 0.5, 0.3], [0, 1.5, 0.5]);
  } else if (faction === 'rakdos') {
    part(g, G.box, f.color, [2.4, 1.3, 3], [0, 1.2, 0]);
    part(g, G.box, f.trim, [2.5, 0.2, 3.1], [0, 1.9, 0]);
    part(g, G.box, 0x4a1a18, [1.6, 0.9, 1.4], [0, 2.1, -0.5]);
    part(g, G.cyl, 0x222222, [0.5, 0.5, 2.6], [-1.3, 0.6, 0], [Math.PI / 2, 0, 0]);
    part(g, G.cyl, 0x222222, [0.5, 0.5, 2.6], [1.3, 0.6, 0], [Math.PI / 2, 0, 0]);
  } else {
    part(g, G.box, f.color, [1.5, 0.6, 2.2], [0, 0.8, 0]);
    part(g, G.box, 0x8b5bc4, [1, 0.3, 1.6], [0, 1.2, 0]);
    part(g, G.box, f.color, [0.3, 0.9, 0.3], [-0.9, 0.4, 0.8], [0, 0, 0.5]);
    part(g, G.box, f.color, [0.3, 0.9, 0.3], [0.9, 0.4, 0.8], [0, 0, -0.5]);
    part(g, G.box, f.color, [0.3, 0.9, 0.3], [-0.9, 0.4, -0.8], [0, 0, 0.5]);
    part(g, G.box, f.color, [0.3, 0.9, 0.3], [0.9, 0.4, -0.8], [0, 0, -0.5]);
  }
  return g;
}

export function makeInfantry(faction) {
  const f = FACTIONS[faction];
  const g = new THREE.Group();
  part(g, G.cyl, f.color, [0.45, 1.3, 0.45], [0, 0.9, 0]);
  part(g, G.sphere, f.trim, [0.4, 0.4, 0.4], [0, 1.9, 0]);
  part(g, G.box, f.trim, [0.15, 0.15, faction === 'rakdos' ? 1.4 : 1.1], [0.55, 1.2, 0.4]);
  return g;
}

export function makeStructure(kind, faction) {
  const f = FACTIONS[faction];
  const g = new THREE.Group();
  switch (kind) {
    case 'refinery':
      part(g, G.cyl, f.color, [5, 4, 5], [0, 2, 0]);
      part(g, G.cyl, f.trim, [3.2, 1.2, 3.2], [0, 4.6, 0]);
      part(g, G.cyl, 0x555555, [0.9, 6, 0.9], [2.6, 5, -1.8]);
      part(g, G.cyl, 0xff9a3a, [2.4, 0.3, 2.4], [0, 5.3, 0], null, GLOW_ORANGE);
      break;
    case 'droidFactory':
      part(g, G.box, f.color, [9, 3.8, 6.5], [0, 1.9, 0]);
      part(g, G.box, f.trim, [9.2, 0.5, 6.7], [0, 4, 0]);
      part(g, G.box, 0x333333, [3, 2.4, 0.4], [0, 1.2, 3.3]);
      part(g, G.cyl, 0x666666, [0.6, 3, 0.6], [3.5, 5, -2]);
      break;
    case 'mechStation':
      part(g, G.box, f.color, [10, 4.5, 9], [0, 2.25, 0]);
      part(g, G.box, f.trim, [10.2, 0.6, 9.2], [0, 4.7, 0]);
      part(g, G.box, 0x444444, [0.8, 8, 0.8], [-4.4, 4, 4]);
      part(g, G.box, 0x444444, [0.8, 8, 0.8], [4.4, 4, 4]);
      part(g, G.box, 0x555555, [9.6, 0.8, 0.8], [0, 8, 4]);
      break;
    case 'barracks':
      part(g, G.box, f.color, [10, 2.8, 5], [0, 1.4, 0]);
      part(g, G.box, f.trim, [10.4, 0.5, 5.4], [0, 3, 0]);
      part(g, G.box, 0x333333, [1.4, 1.8, 0.3], [-3, 0.9, 2.6]);
      part(g, G.box, 0x333333, [1.4, 1.8, 0.3], [3, 0.9, 2.6]);
      break;
    case 'research':
      part(g, G.dome, f.color, [4, 3.6, 4], [0, 0, 0]);
      part(g, G.cyl, f.trim, [4.2, 0.4, 4.2], [0, 0.2, 0]);
      part(g, G.cyl, 0x666666, [0.2, 4.5, 0.2], [0, 5.2, 0]);
      part(g, G.sphere, f.trim, [0.6, 0.3, 0.6], [0, 7.6, 0]);
      break;
    default:
      part(g, G.box, f.color, [4, 4, 4], [0, 2, 0]);
  }
  return g;
}

export function makeSeam(seed = 0) {
  const g = new THREE.Group();
  part(g, G.cyl, 0x201510, [4.2, 0.3, 4.2], [0, 0.1, 0]);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed;
    const r = i === 0 ? 0 : 1.9;
    const h = 1.2 + ((i * 37 + seed * 11) % 10) / 6;
    part(g, G.cone, 0xff8a2a, [0.55, h, 0.55], [Math.cos(a) * r, h / 2, Math.sin(a) * r], [0.1 * i, 0, 0.1], GLOW_ORANGE);
  }
  return g;
}

export function makeWreck(faction, slot) {
  const f = FACTIONS[faction];
  const col = new THREE.Color(f.color).multiplyScalar(0.45).getHex();
  const g = new THREE.Group();
  const glow = faction === 'hollow' ? GLOW_GREEN : GLOW_ORANGE;
  if (slot === 'legs') {
    part(g, G.box, col, [0.6, 2.4, 0.7], [-0.6, 0.4, 0], [0, 0, 1.2]);
    part(g, G.box, col, [0.6, 2.4, 0.7], [0.6, 0.4, 0.4], [0, 0.4, 1.4]);
  } else if (slot === 'torso') {
    part(g, G.box, col, [2.4, 1.6, 1.8], [0, 0.7, 0], [0.2, 0.5, 0.3]);
  } else if (slot === 'arm') {
    part(g, G.box, col, [0.5, 0.5, 3], [0, 0.4, 0], [0, 0.6, 0.15]);
  } else {
    part(g, G.sphere, col, [0.8, 0.8, 0.8], [0, 0.6, 0]);
  }
  part(g, G.sphere, 0xffffff, [0.25, 0.25, 0.25], [0.3, 1.4, 0.2], null, glow);
  return g;
}

export function makeRing(radius, color = 0x66ff66) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.88, radius, 28),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthTest: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 5;
  return m;
}

export function makeHealthBar() {
  const g = new THREE.Group();
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.22), new THREE.MeshBasicMaterial({ color: 0x111111, depthTest: false }));
  const fg = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.16), new THREE.MeshBasicMaterial({ color: 0x4cff6a, depthTest: false }));
  bg.renderOrder = 6;
  fg.renderOrder = 7;
  g.add(bg, fg);
  g.userData.fg = fg;
  return g;
}

// Fade a whole model (used for cloaked Simic units).
export function setOpacity(group, o) {
  group.traverse((c) => {
    if (c.isMesh && c.material && c.material.opacity !== undefined && c.material.userData.keep !== true) {
      c.material.transparent = o < 1;
      c.material.opacity = o;
    }
  });
}
