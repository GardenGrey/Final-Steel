// Three.js rendering: tilted bird's-eye terrain, fog of war, units, effects.
// The simulation (sim.js) is the source of truth. This only draws it.

import * as THREE from '../vendor/three.module.js';
import { MAP_SIZE, HALF, HEIGHT_GRID, FOG_GRID, FACTIONS } from './config.js';
import {
  makeCombot, makeBot, makeInfantry, makeStructure, makeSeam, makeWreck,
  makeRing, makeHealthBar, setOpacity,
} from './models.js';

const TERRAIN_VERT = /* glsl */ `
  attribute vec3 aColor;
  uniform float mapSize;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vColor = aColor;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vUv = (position.xz + vec2(mapSize * 0.5)) / mapSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Outside your vision the land is still visible, but heavily grayed out and dark.
const TERRAIN_FRAG = /* glsl */ `
  uniform sampler2D fogTex;
  uniform vec3 sunDir;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vec3 n = normalize(vNormal);
    float light = 0.36 + 0.78 * max(dot(n, normalize(sunDir)), 0.0);
    vec3 col = vColor * light;
    float vis = texture2D(fogTex, vUv).r;
    float g = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 grayCol = vec3(g) * 0.34;
    gl_FragColor = vec4(mix(grayCol, col, smoothstep(0.04, 0.96, vis)), 1.0);
    #include <colorspace_fragment>
  }
`;

export function buildTerrainGeometry(sim) {
  const N = HEIGHT_GRID;
  const cs = MAP_SIZE / N;
  const p = sim.planet;
  const count = (N + 1) * (N + 1);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const idx = new Uint32Array(N * N * 6);
  const c1 = new THREE.Color();
  const c2 = new THREE.Color();
  const out = new THREE.Color();
  const lerpCol = (a, b, t) => {
    c1.setRGB(a[0], a[1], a[2], THREE.SRGBColorSpace);
    c2.setRGB(b[0], b[1], b[2], THREE.SRGBColorSpace);
    return out.copy(c1).lerp(c2, t);
  };
  for (let j = 0; j <= N; j++) {
    for (let i = 0; i <= N; i++) {
      const k = j * (N + 1) + i;
      const x = -HALF + i * cs;
      const z = -HALF + j * cs;
      const h = sim.heights[k];
      pos[k * 3] = x;
      pos[k * 3 + 1] = h;
      pos[k * 3 + 2] = z;
      const t = Math.min(1, h / (p.amp * 0.85));
      let c = t < 0.5 ? lerpCol(p.low, p.mid, t * 2) : lerpCol(p.mid, p.high, (t - 0.5) * 2);
      const slope = sim._slope(x, z);
      const rockAmt = Math.min(1, Math.max(0, (slope - 0.35) * 1.6));
      if (rockAmt > 0) {
        c2.setRGB(p.rock[0], p.rock[1], p.rock[2], THREE.SRGBColorSpace);
        c = c.lerp(c2, rockAmt);
      }
      const n = ((i * 73856093) ^ (j * 19349663)) & 255;
      const jitter = 0.93 + (n / 255) * 0.14;
      col[k * 3] = c.r * jitter;
      col[k * 3 + 1] = c.g * jitter;
      col[k * 3 + 2] = c.b * jitter;
    }
  }
  let w = 0;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i;
      const b = a + 1;
      const c = a + (N + 1);
      const d = c + 1;
      idx[w++] = a; idx[w++] = c; idx[w++] = b;
      idx[w++] = b; idx[w++] = c; idx[w++] = d;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}

export class Renderer {
  // `gl` lets tests pass a stand-in for the WebGL renderer.
  constructor(canvas, sim, gl = null) {
    this.sim = sim;
    this.canvas = canvas;
    this.renderer = gl || new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040506);
    this.camera = new THREE.PerspectiveCamera(42, 1, 1, 700);

    // Camera rig: a point on the ground and a zoom level. Fixed tilt.
    const site = sim.playerSite();
    this.cam = { x: site.x, z: site.z, zoom: 0.8 };

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.05));
    const sun = new THREE.DirectionalLight(0xfff1dd, 1.5);
    sun.position.set(-60, 120, 40);
    this.scene.add(sun);

    // Fog-of-war texture, updated from the sim.
    this.fogData = new Uint8Array(FOG_GRID * FOG_GRID);
    this.fogTex = new THREE.DataTexture(this.fogData, FOG_GRID, FOG_GRID, THREE.RedFormat, THREE.UnsignedByteType);
    this.fogTex.magFilter = THREE.LinearFilter;
    this.fogTex.minFilter = THREE.LinearFilter;
    this.fogTex.needsUpdate = true;

    this.terrain = new THREE.Mesh(
      buildTerrainGeometry(sim),
      new THREE.ShaderMaterial({
        vertexShader: TERRAIN_VERT,
        fragmentShader: TERRAIN_FRAG,
        uniforms: {
          fogTex: { value: this.fogTex },
          sunDir: { value: new THREE.Vector3(-0.5, 1, 0.35) },
          mapSize: { value: MAP_SIZE },
        },
      }),
    );
    this.scene.add(this.terrain);

    this.entityViews = new Map(); // id -> { root, model, ring, bar, kind }
    this.seamViews = new Map();
    this.shotPool = [];
    this.boomPool = [];
    for (let i = 0; i < 90; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
      m.visible = false;
      m.userData.ttl = 0;
      this.scene.add(m);
      this.shotPool.push(m);
    }
    for (let i = 0; i < 40; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true }));
      m.visible = false;
      m.userData.ttl = 0;
      this.scene.add(m);
      this.boomPool.push(m);
    }
    this.raycaster = new THREE.Raycaster();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ----- camera -----

  placeCamera() {
    const c = this.cam;
    const half = HALF - 4;
    c.x = Math.max(-half, Math.min(half, c.x));
    c.z = Math.max(-half, Math.min(half, c.z));
    c.zoom = Math.max(0.35, Math.min(1.8, c.zoom));
    const gy = this.sim.heightAt(c.x, c.z);
    const dist = 95 * c.zoom;
    // Tilted bird's-eye: camera sits up and back, looking down at about 55 degrees.
    this.camera.position.set(c.x, gy + dist * 0.82, c.z + dist * 0.58);
    this.camera.lookAt(c.x, gy, c.z);
  }

  // Screen point (0..1 from the top-left of the canvas) to a world point on the terrain.
  groundAt(sx, sy) {
    const ndc = new THREE.Vector2(sx * 2 - 1, -(sy * 2 - 1));
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObject(this.terrain, false)[0];
    return hit ? { x: hit.point.x, z: hit.point.z, y: hit.point.y } : null;
  }

  // World point to screen position in CSS pixels, relative to the canvas.
  worldToScreen(x, z, yOffset = 0) {
    const v = new THREE.Vector3(x, this.sim.heightAt(x, z) + yOffset, z).project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * this.canvas.clientWidth,
      y: (-v.y * 0.5 + 0.5) * this.canvas.clientHeight,
      behind: v.z > 1,
    };
  }

  // ----- entities -----

  _buildEntityView(e) {
    const root = new THREE.Group();
    let model;
    let ringR = 2.2;
    if (e.type === 'structure') { model = makeStructure(e.kind, e.faction); ringR = e.r + 1.5; }
    else if (e.type === 'combot') { model = makeCombot(e.faction); ringR = 3; }
    else if (e.type === 'bot') { model = makeBot(e.faction); ringR = 2.2; }
    else if (e.type === 'infantry') { model = makeInfantry(e.faction); ringR = 1.4; }
    else { model = makeWreck(e.faction, e.slot); ringR = 2; }
    root.add(model);
    const ring = makeRing(ringR);
    ring.position.y = 0.4;
    ring.visible = false;
    root.add(ring);
    const bar = makeHealthBar();
    bar.visible = false;
    this.scene.add(bar);
    this.scene.add(root);
    return { root, model, ring, bar, barW: e.type === 'structure' ? 7 : e.type === 'combot' ? 4.5 : 3, top: e.type === 'structure' ? 10 : e.type === 'combot' ? 8 : 4 };
  }

  _syncEntities(selected) {
    const sim = this.sim;
    const seen = new Set();
    for (const e of sim.entities.values()) {
      if (e.dead) continue;
      seen.add(e.id);
      let v = this.entityViews.get(e.id);
      if (!v) { v = this._buildEntityView(e); this.entityViews.set(e.id, v); }
      const shown = e.visibleToPlayer;
      v.root.visible = shown;
      const y = sim.heightAt(e.x, e.z);
      v.root.position.set(e.x, y, e.z);
      if (e.type !== 'structure' && e.type !== 'wreck') v.root.rotation.y = e.heading || 0;
      if (e.type === 'structure') v.root.position.y = y; // structures sit on flattened ground
      if (e.stats && e.stats.cloak) {
        const target = e.cloaked ? (e.faction === sim.player ? 0.38 : 0.12) : 1;
        if (v.opacity !== target) { setOpacity(v.model, target); v.opacity = target; }
      }
      const isSel = selected && selected.has(e.id);
      v.ring.visible = shown && !!isSel;
      const hurt = e.hp < e.maxHp && e.type !== 'wreck';
      v.bar.visible = shown && (isSel || (hurt && sim.time - e.hit < 6));
      if (v.bar.visible) {
        const f = Math.max(0.02, e.hp / e.maxHp);
        v.bar.position.set(e.x, y + v.top, e.z);
        v.bar.quaternion.copy(this.camera.quaternion);
        v.bar.scale.set(v.barW, 1, 1);
        const fg = v.bar.userData.fg;
        fg.scale.x = f;
        fg.position.x = -(1 - f) * 0.5;
        fg.material.color.setHex(f > 0.5 ? 0x4cff6a : f > 0.25 ? 0xffc83d : 0xff4040);
      }
    }
    for (const [id, v] of this.entityViews) {
      if (!seen.has(id)) {
        this.scene.remove(v.root);
        this.scene.remove(v.bar);
        this.entityViews.delete(id);
      }
    }
  }

  _syncSeams() {
    for (const s of this.sim.seams) {
      let v = this.seamViews.get(s.id);
      if (!v) {
        v = makeSeam(s.id);
        v.position.set(s.x, this.sim.heightAt(s.x, s.z), s.z);
        this.scene.add(v);
        this.seamViews.set(s.id, v);
      }
      v.visible = s.discovered && s.amount > 0.5;
      const k = 0.5 + 0.5 * Math.max(0.15, s.amount / s.max);
      v.scale.set(k, k, k);
      // Discovered but out of sight: dimmed.
      v.userData.dim = !s.inView;
      v.traverse((c) => {
        if (c.isMesh && c.material.emissive) c.material.emissiveIntensity = s.inView ? 1 : 0.25;
      });
    }
  }

  _syncEffects(dt) {
    const sim = this.sim;
    const up = new THREE.Vector3(0, 0, 1);
    for (const sh of sim.shots.splice(0)) {
      const m = this.shotPool.find((p) => !p.visible);
      if (!m) break;
      const y1 = sim.heightAt(sh.x1, sh.z1) + 3;
      const y2 = sim.heightAt(sh.x2, sh.z2) + 2.5;
      const a = new THREE.Vector3(sh.x1, y1, sh.z1);
      const b = new THREE.Vector3(sh.x2, y2, sh.z2);
      const len = a.distanceTo(b);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
      const style = {
        bullet: [0xffd27a, 0.18, 0.12],
        melee: [0xffa23a, 0.5, 0.15],
        shock: [0xcdb8ff, 0.3, 0.18],
        green: [0x39ff14, 0.7, 0.28],
      }[sh.fx] || [0xffd27a, 0.2, 0.12];
      m.material.color.setHex(style[0]);
      const sz = sh.fx === 'melee' ? Math.min(len, 3) : len;
      if (sh.fx === 'melee') m.position.copy(b);
      m.scale.set(style[1], style[1], Math.max(0.5, sz));
      m.userData.ttl = style[2];
      // Only show shots the player can actually see.
      m.visible = sim.visibleAt(sh.x2, sh.z2) || sim.visibleAt(sh.x1, sh.z1);
      if (!m.visible) m.userData.ttl = 0;
      else m.userData.active = true;
    }
    for (const m of this.shotPool) {
      if (!m.userData.active) continue;
      m.userData.ttl -= dt;
      if (m.userData.ttl <= 0) { m.visible = false; m.userData.active = false; }
    }
    for (const fx of sim.fx.splice(0)) {
      if (!sim.visibleAt(fx.x, fx.z)) continue;
      const m = this.boomPool.find((p) => !p.visible);
      if (!m) break;
      m.position.set(fx.x, sim.heightAt(fx.x, fx.z) + 2, fx.z);
      m.material.color.setHex(fx.faction === 'hollow' ? 0x39ff14 : 0xff8a2a);
      m.userData.ttl = 0.5;
      m.userData.max = fx.big ? 7 : 3;
      m.visible = true;
      m.userData.active = true;
    }
    for (const m of this.boomPool) {
      if (!m.userData.active) continue;
      m.userData.ttl -= dt;
      const t = 1 - Math.max(0, m.userData.ttl) / 0.5;
      m.scale.setScalar(0.5 + t * m.userData.max);
      m.material.opacity = Math.max(0, 1 - t);
      if (m.userData.ttl <= 0) { m.visible = false; m.userData.active = false; }
    }
  }

  // A brief ring on the ground to confirm where an order was given.
  ping(x, z, color = 0x66ff66) {
    if (!this.pings) {
      this.pings = [];
      for (let i = 0; i < 8; i++) {
        const m = makeRing(2.5, 0xffffff);
        m.visible = false;
        m.userData.ttl = 0;
        this.scene.add(m);
        this.pings.push(m);
      }
    }
    const m = this.pings.find((p) => !p.visible) || this.pings[0];
    m.position.set(x, this.sim.heightAt(x, z) + 0.6, z);
    m.material.color.setHex(color);
    m.userData.ttl = 0.7;
    m.visible = true;
  }

  _syncPings(dt) {
    if (!this.pings) return;
    for (const m of this.pings) {
      if (!m.visible) continue;
      m.userData.ttl -= dt;
      const t = 1 - Math.max(0, m.userData.ttl) / 0.7;
      m.scale.setScalar(0.6 + t * 1.2);
      m.material.opacity = Math.max(0, 1 - t);
      if (m.userData.ttl <= 0) m.visible = false;
    }
  }

  _syncFog() {
    const f = this.sim.fog;
    for (let i = 0; i < f.length; i++) this.fogData[i] = Math.round(f[i] * 255);
    this.fogTex.needsUpdate = true;
  }

  render(dt, selected) {
    this.placeCamera();
    this._syncFog();
    this._syncSeams();
    this._syncEntities(selected);
    this._syncEffects(dt);
    this._syncPings(dt);
    this.renderer.render(this.scene, this.camera);
  }

  factionColor(f) {
    return FACTIONS[f].css;
  }
}
