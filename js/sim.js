// Game simulation. Pure logic: no rendering, no DOM, so it can be tested in Node.
// Design references: docs/04-combat.md (orders), docs/05-economy.md, docs/07-world.md.

import {
  MAP_SIZE, HALF, HEIGHT_GRID, FOG_GRID, FACTIONS, PLAYABLE, PLANETS,
  UNIT, STRUCT, BASE_LAYOUT, BALANCE, PARTS,
} from './config.js';
import { makeRng, makeNoise } from './rng.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const isUnit = (e) => e.type === 'bot' || e.type === 'combot' || e.type === 'infantry';
const isCombat = (e) => e.type === 'combot' || e.type === 'infantry';

export class Sim {
  constructor(opts = {}) {
    this.seed = (opts.seed ?? Math.floor(Math.random() * 1e9)) | 0;
    this.rng = makeRng(this.seed);
    this.planetKey = PLANETS[opts.planet] ? opts.planet : 'verdis';
    this.planet = PLANETS[this.planetKey];
    this.player = PLAYABLE.includes(opts.faction) ? opts.faction : PLAYABLE[Math.floor(this.rng() * 3)];

    this.time = 0;
    this.paused = false;
    this.over = null; // 'victory' | 'defeat'
    this.nextId = 1;
    this.entities = new Map();
    this.live = [];
    this.seams = [];
    this.nests = [];
    this.shots = []; // consumed by the renderer
    this.fx = []; // consumed by the renderer
    this.messages = []; // consumed by the HUD
    this.stock = { azorious: 0, rakdos: 0, simic: 0 };
    this.known = { azorious: new Set(), rakdos: new Set(), simic: new Set() };
    this.eliminated = new Set();
    this.disturbance = 0;
    this.nextWave = BALANCE.firstWave;
    this.lastMined = null;
    this.fog = new Float32Array(FOG_GRID * FOG_GRID);
    this._fogTimer = 0;
    this._aiTimer = 0;
    this._elimTimer = 0;

    this._genSites();
    this._genTerrain();
    this._genSeams();
    this._genNests();
    this._spawnBases();
    this._updateFog();
  }

  // ---------- World generation ----------

  _rawHeight(x, z) {
    if (!this._noise) this._noise = makeNoise(this.seed);
    const n = this._noise;
    const p = this.planet;
    const u = x / p.scale;
    const v = z / p.scale;
    let f = 0, a = 1, fr = 1, sum = 0;
    for (let o = 0; o < 5; o++) { f += n(u * fr, v * fr) * a; sum += a; a *= 0.5; fr *= 2; }
    f /= sum;
    let r = 0; a = 1; fr = 1.4; sum = 0;
    for (let o = 0; o < 4; o++) {
      const s = 1 - Math.abs(n(u * fr + 17.3, v * fr + 9.1) * 2 - 1);
      r += s * s * a; sum += a; a *= 0.5; fr *= 2;
    }
    r /= sum;
    const t = f * (1 - p.ridged) + r * p.ridged;
    return Math.pow(clamp(t, 0, 1), 1.5) * p.amp;
  }

  _genSites() {
    this.sites = [];
    const start = this.rng() * Math.PI * 2;
    for (let k = 0; k < 6; k++) {
      const ang = start + (k * Math.PI * 2) / 6 + (this.rng() - 0.5) * 0.3;
      const rad = 74 + this.rng() * 14;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      this.sites.push({ x, z, h: this._rawHeight(x, z), faction: null });
    }
    // Shuffle which site each faction gets.
    const order = [0, 1, 2, 3, 4, 5];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const facs = [...PLAYABLE];
    for (let i = facs.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [facs[i], facs[j]] = [facs[j], facs[i]];
    }
    facs.forEach((f, i) => { this.sites[order[i]].faction = f; });
  }

  _genTerrain() {
    const N = HEIGHT_GRID;
    const cs = MAP_SIZE / N;
    this.heights = new Float32Array((N + 1) * (N + 1));
    for (let j = 0; j <= N; j++) {
      for (let i = 0; i <= N; i++) {
        const x = -HALF + i * cs;
        const z = -HALF + j * cs;
        let h = this._rawHeight(x, z);
        for (const s of this.sites) {
          const d = Math.hypot(x - s.x, z - s.z);
          if (d < 28) {
            const w = 1 - smooth(13, 28, d);
            h = h * (1 - w) + s.h * w;
          }
        }
        this.heights[j * (N + 1) + i] = h;
      }
    }
  }

  heightAt(x, z) {
    const N = HEIGHT_GRID;
    const cs = MAP_SIZE / N;
    const fx = clamp((x + HALF) / cs, 0, N - 0.001);
    const fz = clamp((z + HALF) / cs, 0, N - 0.001);
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const u = fx - i;
    const v = fz - j;
    const H = this.heights;
    const a = H[j * (N + 1) + i];
    const b = H[j * (N + 1) + i + 1];
    const c = H[(j + 1) * (N + 1) + i];
    const d = H[(j + 1) * (N + 1) + i + 1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  _slope(x, z) {
    const e = 1.5;
    const dx = this.heightAt(x + e, z) - this.heightAt(x - e, z);
    const dz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
    return Math.hypot(dx, dz) / (2 * e);
  }

  _genSeams() {
    const mk = (x, z, amount) => {
      const s = { id: this.nextId++, x, z, amount, max: amount, discovered: false, inView: false, workers: 0 };
      this.seams.push(s);
      return s;
    };
    for (const s of this.sites) {
      mk(s.x, s.z - 18, s.faction ? BALANCE.starterSeam : BALANCE.vacantSeam);
    }
    let tries = 0;
    let made = 0;
    while (made < 16 && tries < 600) {
      tries++;
      const x = (this.rng() * 2 - 1) * (HALF - 14);
      const z = (this.rng() * 2 - 1) * (HALF - 14);
      if (this.sites.some((s) => Math.hypot(x - s.x, z - s.z) < 30)) continue;
      if (this.seams.some((s) => Math.hypot(x - s.x, z - s.z) < 24)) continue;
      if (this._slope(x, z) > 0.9) continue;
      mk(x, z, Math.round(500 + this.rng() * 800));
      made++;
    }
  }

  _genNests() {
    let tries = 0;
    while (this.nests.length < 4 && tries < 400) {
      tries++;
      const x = (this.rng() * 2 - 1) * (HALF - 10);
      const z = (this.rng() * 2 - 1) * (HALF - 10);
      if (this.sites.some((s) => Math.hypot(x - s.x, z - s.z) < 40)) continue;
      if (this.nests.some((n) => Math.hypot(x - n.x, z - n.z) < 50)) continue;
      this.nests.push({ x, z });
    }
    if (!this.nests.length) this.nests.push({ x: 0, z: 0 });
  }

  _spawnBases() {
    for (const s of this.sites) {
      if (!s.faction) continue;
      const f = s.faction;
      this.stock[f] = BALANCE.startMagmore;
      for (const [kind, ox, oz] of BASE_LAYOUT) this.createStruct(kind, f, s.x + ox, s.z + oz);
      this.createUnit('bot', f, s.x - 4, s.z + 11);
      this.createUnit('bot', f, s.x + 4, s.z + 11);
      this.createUnit('combot', f, s.x - 6, s.z + 15);
      this.createUnit('combot', f, s.x + 6, s.z + 15);
    }
  }

  playerSite() {
    return this.sites.find((s) => s.faction === this.player);
  }

  // ---------- Entities ----------

  _add(e) {
    e.id = this.nextId++;
    e.dead = false;
    e.hp = e.maxHp;
    e.cooldown = 0;
    e.lastFired = -99;
    e.heading = 0;
    e.target = null;
    e.cloaked = false;
    e.hit = -99;
    e.visibleToPlayer = e.faction === this.player;
    this.entities.set(e.id, e);
    this.live.push(e);
    return e;
  }

  createStruct(kind, faction, x, z) {
    const st = STRUCT[kind];
    return this._add({
      type: 'structure', kind, faction, x, z, maxHp: st.hp, stats: st,
      queue: [], order: { type: 'idle' }, r: st.r,
    });
  }

  createUnit(type, faction, x, z, scale = 1) {
    const base = UNIT[type][faction];
    const stats = { ...base };
    stats.hp = Math.round(base.hp * scale);
    const e = this._add({
      type, faction, x, z, maxHp: stats.hp, stats,
      order: { type: 'idle' }, stance: 'aggressive', cargo: 0, home: { x, z }, r: 1.6,
    });
    return e;
  }

  _spawnWreck(from) {
    const slots = ['legs', 'torso', 'arm', 'head'];
    const slot = slots[Math.floor(this.rng() * slots.length)];
    const names = PARTS[from.faction][slot];
    const partName = names[Math.floor(this.rng() * names.length)];
    const w = this._add({
      type: 'wreck', faction: from.faction, x: from.x, z: from.z, maxHp: 1,
      slot, partName, ttl: from.faction === 'hollow' ? BALANCE.wreckLife * 0.6 : BALANCE.wreckLife,
      order: { type: 'idle' }, stats: {}, r: 1.5,
    });
    w.visibleToPlayer = false;
    return w;
  }

  msg(text, kind = 'info') {
    this.messages.push({ text, kind, t: this.time });
  }

  // ---------- Player commands ----------

  _accepts(e, t) {
    if (e.type === 'bot') return ['move', 'mine', 'salvage', 'stop', 'retreat'].includes(t);
    return ['move', 'attack', 'defend', 'protect', 'patrol', 'stop', 'retreat'].includes(t);
  }

  // Orders are only accepted during live play.
  order(ids, o) {
    if (this.paused || this.over) return 0;
    let n = 0;
    for (const id of ids) {
      const e = this.entities.get(id);
      if (!e || e.dead || e.faction !== this.player || !isUnit(e)) continue;
      if (!this._accepts(e, o.type)) continue;
      this._setOrder(e, o);
      n++;
    }
    return n;
  }

  _setOrder(e, o) {
    // Leaving a seam frees up its worker slot.
    if (e.order && e.order.type === 'mine' && e.order.counted) {
      e.order.seam.workers = Math.max(0, e.order.seam.workers - 1);
      e.order.counted = false;
    }
    e.order = { ...o };
    e.target = null;
    if (o.type === 'stop') { e.order = { type: 'idle' }; e.home = { x: e.x, z: e.z }; }
    if (o.type === 'patrol') { e.order.ax = e.x; e.order.az = e.z; e.order.leg = 0; }
    if (o.type === 'mine') {
      const seam = this.seams.find((s) => s.id === o.seamId);
      if (!seam) { e.order = { type: 'idle' }; return; }
      e.order.seam = seam;
      e.order.phase = e.cargo > 0 ? 'toRefinery' : 'toSeam';
    }
    if (o.type === 'salvage') e.order.phase = 'toWreck';
    if (o.type === 'defend') e.home = { x: o.x, z: o.z };
  }

  setStance(ids, stance) {
    if (this.paused || this.over) return 0;
    let n = 0;
    for (const id of ids) {
      const e = this.entities.get(id);
      if (!e || e.faction !== this.player || !isCombat(e)) continue;
      e.stance = stance;
      n++;
    }
    return n;
  }

  produce(structId, unitType) {
    if (this.paused || this.over) return { ok: false, reason: 'Orders are disabled while paused.' };
    const s = this.entities.get(structId);
    if (!s || s.type !== 'structure' || s.faction !== this.player) return { ok: false, reason: 'Invalid structure.' };
    return this._queue(s, unitType);
  }

  _queue(s, unitType) {
    if (s.stats.builds !== unitType) return { ok: false, reason: 'This structure cannot build that.' };
    const st = UNIT[unitType][s.faction];
    if (s.queue.length >= 5) return { ok: false, reason: 'Queue is full.' };
    if (this.stock[s.faction] < st.cost) return { ok: false, reason: 'Not enough Magmore.' };
    if (this._count(s.faction) >= BALANCE.popCap) return { ok: false, reason: 'Population limit reached.' };
    this.stock[s.faction] -= st.cost;
    s.queue.push({ type: unitType, t: st.time, total: st.time });
    return { ok: true };
  }

  _count(faction) {
    let n = 0;
    for (const e of this.live) if (e.faction === faction && isUnit(e) && !e.dead) n++;
    return n;
  }

  // ---------- Main update ----------

  update(dt) {
    if (this.paused || this.over) return;
    dt = Math.min(dt, 0.1);
    this.time += dt;
    this.live = [...this.entities.values()];

    for (const e of this.live) {
      if (e.dead) continue;
      if (e.type === 'structure') this._structThink(e, dt);
      else if (isUnit(e)) this._think(e, dt);
      else if (e.type === 'wreck') this._wreckThink(e, dt);
    }
    this._separate(dt);
    this._reap();

    this._hollowDirector(dt);
    this._aiTimer -= dt;
    if (this._aiTimer <= 0) { this._aiTimer = 1.5; this._ai(); }

    if (this.shots.length > 200) this.shots.splice(0, this.shots.length - 200);
    if (this.fx.length > 100) this.fx.splice(0, this.fx.length - 100);
    if (this.messages.length > 100) this.messages.splice(0, this.messages.length - 100);
    this.disturbance = Math.max(0, this.disturbance - BALANCE.disturbanceDecay * dt);
    this._fogTimer -= dt;
    if (this._fogTimer <= 0) { this._fogTimer = 0.1; this._updateFog(); }
    this._elimTimer -= dt;
    if (this._elimTimer <= 0) { this._elimTimer = 1; this._checkElimination(); }
  }

  _structThink(s, dt) {
    if (!s.queue.length) return;
    const job = s.queue[0];
    job.t -= dt;
    if (job.t > 0) return;
    s.queue.shift();
    const u = this.createUnit(job.type, s.faction, s.x + (this.rng() - 0.5) * 6, s.z + s.r + 3);
    if (s.rally) this._setOrder(u, { type: 'move', x: s.rally.x, z: s.rally.z });
    if (s.faction === this.player) this.msg(`${FACTIONS[s.faction].name} ${job.type} ready.`);
  }

  _wreckThink(w, dt) {
    w.ttl -= dt;
    if (w.ttl <= 0) { w.dead = true; w.silent = true; return; }
    if (w.faction !== 'hollow') {
      for (const o of this.live) {
        if (o.faction === 'hollow' && !o.dead && isUnit(o) && dist(o, w) < 5) {
          w.dead = true; w.silent = true;
          o.hp = Math.min(o.maxHp, o.hp + 20);
          return;
        }
      }
    }
  }

  // ---------- Movement ----------

  _moveTo(e, x, z, dt, arrive = 1.2) {
    const dx = x - e.x;
    const dz = z - e.z;
    const d = Math.hypot(dx, dz);
    if (d <= arrive) return true;
    let step = Math.min(e.stats.speed * dt, d);
    const nx = e.x + (dx / d) * step;
    const nz = e.z + (dz / d) * step;
    const dh = this.heightAt(nx, nz) - this.heightAt(e.x, e.z);
    const slope = step > 0 ? dh / step : 0;
    const factor = clamp(1 - Math.max(0, slope - 0.4) * 0.8, 0.25, 1.3);
    step *= factor;
    e.x = clamp(e.x + (dx / d) * step, -HALF + 2, HALF - 2);
    e.z = clamp(e.z + (dz / d) * step, -HALF + 2, HALF - 2);
    e.heading = Math.atan2(dx, dz);
    return false;
  }

  _moveFrom(e, t, dt) {
    const dx = e.x - t.x;
    const dz = e.z - t.z;
    const d = Math.hypot(dx, dz) || 1;
    const step = e.stats.speed * 0.8 * dt;
    e.x = clamp(e.x + (dx / d) * step, -HALF + 2, HALF - 2);
    e.z = clamp(e.z + (dz / d) * step, -HALF + 2, HALF - 2);
  }

  _separate(dt) {
    const units = this.live.filter((e) => isUnit(e) && !e.dead);
    const structs = this.live.filter((e) => e.type === 'structure' && !e.dead);
    for (let i = 0; i < units.length; i++) {
      const a = units[i];
      for (let j = i + 1; j < units.length; j++) {
        const b = units[j];
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        const d = Math.hypot(dx, dz);
        if (d > 0 && d < 2.4) {
          const push = ((2.4 - d) * 0.5 * Math.min(1, dt * 8)) / d;
          a.x += dx * push; a.z += dz * push;
          b.x -= dx * push; b.z -= dz * push;
        }
      }
      for (const s of structs) {
        const dx = a.x - s.x;
        const dz = a.z - s.z;
        const d = Math.hypot(dx, dz);
        const min = s.r + 1.5;
        if (d < min && d > 0.001) {
          a.x = s.x + (dx / d) * min;
          a.z = s.z + (dz / d) * min;
        }
      }
    }
  }

  // ---------- Unit behavior ----------

  _nearestRefinery(e) {
    let best = null, bd = Infinity;
    for (const o of this.live) {
      if (o.type !== 'structure' || o.kind !== 'refinery' || o.faction !== e.faction || o.dead) continue;
      const d = dist(e, o);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  _think(e, dt) {
    e.cooldown = Math.max(0, e.cooldown - dt);
    const st = e.stats;
    if (st.cloak) {
      e.cloaked = e.type === 'bot'
        ? !(e.order.type === 'mine' && e.order.phase === 'mining')
        : this.time - e.lastFired > 3;
    }
    if (e.type === 'bot') { this._botThink(e, dt); return; }

    // Wounded units fall back on their own (unless told to hold).
    if (e.faction !== 'hollow' && e.stance !== 'hold' && e.order.type !== 'retreat'
        && e.hp < e.maxHp * st.retreatAt && this.time - e.hit < 5) {
      e.order = { type: 'retreat' };
    }

    const tgt = this._acquire(e);
    const o = e.order;
    const chase = e.stance === 'aggressive' || (e.stance === 'defensive' && dist(e, e.home) < 22);

    switch (o.type) {
      case 'idle':
        if (tgt) this._engage(e, tgt, dt, chase);
        break;
      case 'move': {
        if (tgt && dist(e, tgt) <= st.range && e.cooldown <= 0) this._fire(e, tgt);
        if (this._moveTo(e, o.x, o.z, dt)) { e.order = { type: 'idle' }; e.home = { x: e.x, z: e.z }; }
        break;
      }
      case 'attack':
        if (tgt) this._engage(e, tgt, dt, true);
        else if (this._moveTo(e, o.x, o.z, dt, 2)) { e.order = { type: 'idle' }; e.home = { x: e.x, z: e.z }; }
        break;
      case 'defend':
        if (tgt && Math.hypot(tgt.x - o.x, tgt.z - o.z) < 28) this._engage(e, tgt, dt, true);
        else if (Math.hypot(e.x - o.x, e.z - o.z) > 3) this._moveTo(e, o.x, o.z, dt, 2.5);
        break;
      case 'protect': {
        const ward = this.entities.get(o.targetId);
        if (!ward || ward.dead) { e.order = { type: 'idle' }; break; }
        if (tgt && dist(tgt, ward) < 28) this._engage(e, tgt, dt, true);
        else if (dist(e, ward) > 8) this._moveTo(e, ward.x, ward.z, dt, 6);
        break;
      }
      case 'patrol': {
        if (tgt) { this._engage(e, tgt, dt, true); break; }
        const px = o.leg === 0 ? o.x : o.ax;
        const pz = o.leg === 0 ? o.z : o.az;
        if (this._moveTo(e, px, pz, dt, 2)) o.leg = 1 - o.leg;
        break;
      }
      case 'retreat': {
        const base = this._nearestRefinery(e);
        if (tgt && dist(e, tgt) <= st.range && e.cooldown <= 0) this._fire(e, tgt);
        const bx = base ? base.x : e.home.x;
        const bz = base ? base.z + 9 : e.home.z;
        if (this._moveTo(e, bx, bz, dt, 3)) {
          e.order = { type: 'idle' };
          e.home = { x: e.x, z: e.z };
          if (e.stance === 'aggressive') e.stance = 'defensive';
        }
        break;
      }
      default:
        break;
    }

    // Idle Hollow units go looking for someone to attack.
    if (e.faction === 'hollow' && e.order.type === 'idle' && !tgt) {
      let best = null, bd = Infinity;
      for (const t of this.live) {
        if (t.faction === 'hollow' || t.dead || t.type === 'wreck') continue;
        const d = dist(e, t);
        if (d < bd) { bd = d; best = t; }
      }
      if (best) e.order = { type: 'attack', x: best.x, z: best.z };
    }
  }

  _canSee(e, o) {
    if (!o.cloaked) return true;
    return dist(e, o) <= 9;
  }

  _acquire(e) {
    const st = e.stats;
    let t = e.target ? this.entities.get(e.target) : null;
    const reach = e.stance === 'hold' ? st.range : st.sight;
    if (t && (t.dead || !this._canSee(e, t) || dist(e, t) > reach + 2)) t = null;
    if (!t) {
      let best = null, bs = Infinity;
      for (const o of this.live) {
        if (o.faction === e.faction || o.type === 'wreck' || o.dead) continue;
        const d = dist(e, o);
        if (d > reach) continue;
        if (!this._canSee(e, o)) continue;
        const score = d + (o.type === 'structure' ? 12 : 0);
        if (score < bs) { bs = score; best = o; }
      }
      t = best;
    }
    e.target = t ? t.id : null;
    return t;
  }

  _engage(e, t, dt, chase) {
    const st = e.stats;
    const d = dist(e, t);
    e.heading = Math.atan2(t.x - e.x, t.z - e.z);
    if (d <= st.range + (t.type === 'structure' ? t.r : 0)) {
      if (e.cooldown <= 0) this._fire(e, t);
      if (st.kite && chase && d < st.range * 0.35) this._moveFrom(e, t, dt);
    } else if (chase) {
      this._moveTo(e, t.x, t.z, dt, Math.max(1, st.range * 0.85));
    }
  }

  _fire(e, t) {
    const st = e.stats;
    e.cooldown = st.cooldown;
    e.lastFired = this.time;
    e.cloaked = false;
    if (this.rng() < st.acc) {
      this._damage(t, st.dmg, e);
      if (st.stall && t.cooldown !== undefined) t.cooldown = Math.min(t.cooldown + st.stall, 3);
    }
    this.shots.push({ x1: e.x, z1: e.z, x2: t.x, z2: t.z, fx: st.fx, faction: e.faction });
  }

  _damage(t, dmg, src) {
    if (t.dead) return;
    t.hp -= dmg;
    t.hit = this.time;
    if (src && t.type !== 'wreck' && !t.target && isCombat(t)) t.target = src.id;
    if (t.hp <= 0) t.dead = true;
  }

  _botThink(e, dt) {
    const o = e.order;
    const st = e.stats;
    if (o.type === 'move') {
      if (this._moveTo(e, o.x, o.z, dt)) e.order = { type: 'idle' };
    } else if (o.type === 'retreat') {
      const r = this._nearestRefinery(e);
      if (!r || this._moveTo(e, r.x, r.z + r.r + 3, dt, 2)) e.order = { type: 'idle' };
    } else if (o.type === 'mine') {
      const seam = o.seam;
      if (o.phase === 'toSeam') {
        if (seam.amount <= 0) { e.order = { type: 'idle' }; return; }
        if (this._moveTo(e, seam.x, seam.z, dt, 2.5)) { o.phase = 'mining'; seam.workers++; o.counted = true; }
      } else if (o.phase === 'mining') {
        const take = Math.min(st.mineRate * dt, seam.amount, st.cap - e.cargo);
        e.cargo += take;
        seam.amount -= take;
        this.lastMined = { x: seam.x, z: seam.z };
        if (e.cargo >= st.cap - 0.01 || seam.amount <= 0) {
          if (o.counted) { seam.workers = Math.max(0, seam.workers - 1); o.counted = false; }
          o.phase = 'toRefinery';
        }
      } else if (o.phase === 'toRefinery') {
        const r = this._nearestRefinery(e);
        if (!r) { e.order = { type: 'idle' }; return; }
        if (this._moveTo(e, r.x, r.z, dt, r.r + 2)) {
          this.stock[e.faction] += e.cargo;
          this.disturbance += e.cargo * BALANCE.disturbancePerMagmore;
          e.cargo = 0;
          if (seam.amount <= 0) e.order = { type: 'idle' };
          else o.phase = 'toSeam';
        }
      }
    } else if (o.type === 'salvage') {
      if (o.phase === 'toWreck') {
        const w = this.entities.get(o.wreckId);
        if (!w || w.dead || e.carryPart) { e.order = { type: 'idle' }; return; }
        if (this._moveTo(e, w.x, w.z, dt, 2.5)) {
          e.carryPart = { faction: w.faction, slot: w.slot, partName: w.partName };
          w.dead = true; w.silent = true;
          o.phase = 'toRefinery';
        }
      } else if (o.phase === 'toRefinery') {
        const r = this._nearestRefinery(e);
        if (!r) { e.order = { type: 'idle' }; return; }
        if (this._moveTo(e, r.x, r.z, dt, r.r + 2)) {
          this._deliverPart(e);
          e.order = { type: 'idle' };
        }
      }
    }
  }

  _deliverPart(e) {
    const p = e.carryPart;
    e.carryPart = null;
    if (!p) return;
    const set = this.known[e.faction];
    const label = `${FACTIONS[p.faction].name} ${p.partName}`;
    if (set.has(label)) {
      this.stock[e.faction] += BALANCE.scrapValue;
      if (e.faction === this.player) this.msg(`Already known: ${label}. Recovered ${BALANCE.scrapValue} Magmore in scrap.`, 'good');
    } else {
      set.add(label);
      if (e.faction === this.player) this.msg(`Captured tech learned: ${label}. (Recorded only in this prototype.)`, 'good');
    }
  }

  _reap() {
    for (const e of [...this.entities.values()]) {
      if (!e.dead) continue;
      this.entities.delete(e.id);
      if (e.type === 'bot' && e.order.type === 'mine' && e.order.counted) {
        e.order.seam.workers = Math.max(0, e.order.seam.workers - 1);
      }
      if (e.silent) continue;
      this.fx.push({ kind: 'boom', x: e.x, z: e.z, big: e.type === 'structure', faction: e.faction });
      if (isCombat(e)) {
        const chance = e.faction === 'hollow' ? BALANCE.hollowSalvageChance : BALANCE.salvageChance;
        if (this.rng() < chance) this._spawnWreck(e);
      }
      if (e.faction === this.player && e.type === 'structure') this.msg(`Your ${e.stats.label} was destroyed!`, 'bad');
    }
    this.live = this.live.filter((e) => !e.dead);
  }

  // ---------- Hollow and Disturbance ----------

  _hollowDirector() {
    if (this.disturbance < this.nextWave) {
      if (this.disturbance < this.nextWave - 2.2 * BALANCE.waveStep) this.nextWave = Math.max(BALANCE.firstWave, this.disturbance + BALANCE.waveStep);
      return;
    }
    const at = this.lastMined || { x: 0, z: 0 };
    let nest = this.nests[0], bd = Infinity;
    for (const n of this.nests) {
      const d = Math.hypot(n.x - at.x, n.z - at.z);
      if (d < bd) { bd = d; nest = n; }
    }
    const count = Math.min(8, 1 + Math.floor(this.disturbance / 25));
    const scale = 1 + this.disturbance * 0.004;
    for (let i = 0; i < count; i++) {
      const u = this.createUnit('combot', 'hollow', nest.x + (this.rng() - 0.5) * 8, nest.z + (this.rng() - 0.5) * 8, scale);
      u.order = { type: 'attack', x: at.x, z: at.z };
      u.stance = 'aggressive';
    }
    this.nextWave = this.disturbance + BALANCE.waveStep;
    this.msg(`The Hollow stirs. ${count} Hollow combot${count > 1 ? 's' : ''} are on the move.`, 'bad');
  }

  // ---------- AI for the other companies ----------

  _ai() {
    for (const f of PLAYABLE) {
      if (f === this.player || this.eliminated.has(f)) continue;
      const mine = this.live.filter((e) => e.faction === f && !e.dead);
      const bots = mine.filter((e) => e.type === 'bot');
      const fighters = mine.filter(isCombat);
      const refinery = mine.find((e) => e.kind === 'refinery');
      if (refinery) {
        for (const b of bots) {
          if (b.order.type !== 'idle') continue;
          let best = null, bd = Infinity;
          for (const s of this.seams) {
            if (s.amount <= 0 || s.workers >= 3) continue;
            const d = dist(b, s);
            if (d < bd) { bd = d; best = s; }
          }
          if (best) this._setOrder(b, { type: 'mine', seamId: best.id });
        }
      }
      const df = mine.find((e) => e.kind === 'droidFactory');
      const ms = mine.find((e) => e.kind === 'mechStation');
      const bar = mine.find((e) => e.kind === 'barracks');
      if (df && bots.length < 6 && !df.queue.length) this._queue(df, 'bot');
      if (ms && fighters.filter((e) => e.type === 'combot').length < 12 && !ms.queue.length) this._queue(ms, 'combot');
      if (bar && fighters.filter((e) => e.type === 'infantry').length < 6 && !bar.queue.length && this.stock[f] > 300) this._queue(bar, 'infantry');

      const idle = fighters.filter((e) => e.order.type === 'idle');
      if (idle.length >= 5) {
        let tgt = null, bd = Infinity;
        for (const t of this.live) {
          if (t.type !== 'structure' || t.faction === f || t.faction === 'hollow' || t.dead) continue;
          const d = dist(idle[0], t);
          if (d < bd) { bd = d; tgt = t; }
        }
        if (tgt) for (const u of idle) this._setOrder(u, { type: 'attack', x: tgt.x, z: tgt.z });
      }
    }
  }

  // ---------- Vision ----------

  visibleAt(x, z, threshold = 0.45) {
    const cs = MAP_SIZE / FOG_GRID;
    const gx = clamp(Math.floor((x + HALF) / cs), 0, FOG_GRID - 1);
    const gz = clamp(Math.floor((z + HALF) / cs), 0, FOG_GRID - 1);
    return this.fog[gz * FOG_GRID + gx] > threshold;
  }

  sightRadius(e, friends) {
    const base = e.stats.sight || 20;
    let n = 0;
    for (const o of friends) if (o !== e && Math.abs(o.x - e.x) < 25 && Math.abs(o.z - e.z) < 25 && dist(o, e) < 25) n++;
    const presence = 1 + Math.min(0.6, 0.04 * n); // bigger presence, bigger view
    const high = 1 + clamp(this.heightAt(e.x, e.z) * 0.015, 0, 0.35); // high ground sees farther
    return base * presence * high;
  }

  _updateFog() {
    const fog = this.fog;
    fog.fill(0);
    const cs = MAP_SIZE / FOG_GRID;
    const mine = this.live.filter((e) => e.faction === this.player && !e.dead && e.type !== 'wreck');
    for (const e of mine) {
      const R = this.sightRadius(e, mine);
      const gx0 = Math.max(0, Math.floor((e.x + HALF - R) / cs));
      const gx1 = Math.min(FOG_GRID - 1, Math.ceil((e.x + HALF + R) / cs));
      const gz0 = Math.max(0, Math.floor((e.z + HALF - R) / cs));
      const gz1 = Math.min(FOG_GRID - 1, Math.ceil((e.z + HALF + R) / cs));
      for (let gz = gz0; gz <= gz1; gz++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          const wx = -HALF + (gx + 0.5) * cs;
          const wz = -HALF + (gz + 0.5) * cs;
          const d = Math.hypot(wx - e.x, wz - e.z);
          if (d > R) continue;
          const v = 1 - smooth(R * 0.65, R, d);
          const i = gz * FOG_GRID + gx;
          if (v > fog[i]) fog[i] = v;
        }
      }
    }
    for (const s of this.seams) {
      s.inView = this.visibleAt(s.x, s.z);
      if (s.inView) s.discovered = true;
    }
    for (const e of this.live) {
      if (e.dead) continue;
      if (e.faction === this.player) { e.visibleToPlayer = true; continue; }
      let vis = this.visibleAt(e.x, e.z);
      if (vis && e.cloaked) vis = mine.some((m) => dist(m, e) <= 9);
      e.visibleToPlayer = vis;
    }
  }

  // ---------- Win and lose ----------

  _checkElimination() {
    for (const f of PLAYABLE) {
      if (this.eliminated.has(f)) continue;
      const alive = this.live.some((e) => e.faction === f && !e.dead && e.type !== 'wreck');
      if (!alive) {
        this.eliminated.add(f);
        this.msg(`${FACTIONS[f].name} has been eliminated.`, f === this.player ? 'bad' : 'good');
      }
    }
    if (this.eliminated.has(this.player)) this.over = 'defeat';
    else if (PLAYABLE.filter((f) => f !== this.player).every((f) => this.eliminated.has(f))) this.over = 'victory';
  }
}
