// Mouse and keyboard: selection, orders, camera.
// The player only gives orders (see docs/04-combat.md). Orders are refused while paused.

const isUnit = (e) => e.type === 'bot' || e.type === 'combot' || e.type === 'infantry';

export class Input {
  constructor(canvas, renderer, sim, hud) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.sim = sim;
    this.hud = hud;
    this.selected = new Set();
    this.mode = null; // pending order: 'move' | 'attack' | 'defend' | 'protect' | 'patrol'
    this.keys = new Set();
    this.mouse = { x: 0.5, y: 0.5, inside: false };
    this.drag = null;
    this.selbox = document.getElementById('selbox');
    this._bind();
  }

  _bind() {
    const c = this.canvas;
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('mousedown', (e) => this._down(e));
    window.addEventListener('mouseup', (e) => this._up(e));
    window.addEventListener('mousemove', (e) => this._move(e));
    c.addEventListener('mouseleave', () => { this.mouse.inside = false; });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.renderer.cam.zoom *= e.deltaY > 0 ? 1.1 : 0.9;
    }, { passive: false });
    window.addEventListener('keydown', (e) => this._key(e, true));
    window.addEventListener('keyup', (e) => this._key(e, false));
  }

  // ---- helpers ----

  _rel(e) {
    const r = this.canvas.getBoundingClientRect();
    return { sx: (e.clientX - r.left) / r.width, sy: (e.clientY - r.top) / r.height, px: e.clientX - r.left, py: e.clientY - r.top };
  }

  selectedEntities() {
    const out = [];
    for (const id of this.selected) {
      const e = this.sim.entities.get(id);
      if (e && !e.dead) out.push(e);
      else this.selected.delete(id);
    }
    return out;
  }

  _pickR(e) {
    if (e.type === 'structure') return e.r + 1.5;
    if (e.type === 'combot') return 3.4;
    if (e.type === 'bot') return 2.8;
    if (e.type === 'infantry') return 2.2;
    return 2.6;
  }

  // Best visible entity near a ground point. `filter` narrows which are allowed.
  entityAt(p, filter) {
    let best = null, bs = Infinity;
    for (const e of this.sim.entities.values()) {
      if (e.dead || !e.visibleToPlayer || (filter && !filter(e))) continue;
      const d = Math.hypot(e.x - p.x, e.z - p.z) - this._pickR(e);
      if (d > 0) continue;
      const score = d + (e.type === 'structure' ? 1.5 : 0);
      if (score < bs) { bs = score; best = e; }
    }
    return best;
  }

  seamAt(p) {
    for (const s of this.sim.seams) {
      if (s.discovered && s.amount > 0.5 && Math.hypot(s.x - p.x, s.z - p.z) < 4.5) return s;
    }
    return null;
  }

  _blockedByPause() {
    if (this.sim.paused) { this.hud.toast('Orders are disabled while paused.', 'bad'); return true; }
    if (this.sim.over) return true;
    return false;
  }

  // ---- mouse ----

  _down(e) {
    const r = this._rel(e);
    if (e.button === 0) {
      this.drag = { x: r.px, y: r.py, sx: r.sx, sy: r.sy, moved: false, shift: e.shiftKey };
    } else if (e.button === 2) {
      if (this.mode) { this.setMode(null); return; }
      this._contextOrder(r);
    }
  }

  _move(e) {
    const r = this._rel(e);
    this.mouse = { x: r.sx, y: r.sy, inside: r.sx >= 0 && r.sx <= 1 && r.sy >= 0 && r.sy <= 1 };
    if (!this.drag) return;
    const dx = r.px - this.drag.x;
    const dy = r.py - this.drag.y;
    if (Math.hypot(dx, dy) > 6) this.drag.moved = true;
    if (this.drag.moved && !this.mode) {
      const b = this.selbox;
      b.style.display = 'block';
      b.style.left = `${Math.min(r.px, this.drag.x) + this.canvas.getBoundingClientRect().left}px`;
      b.style.top = `${Math.min(r.py, this.drag.y) + this.canvas.getBoundingClientRect().top}px`;
      b.style.width = `${Math.abs(dx)}px`;
      b.style.height = `${Math.abs(dy)}px`;
    }
  }

  _up(e) {
    if (e.button !== 0 || !this.drag) return;
    const d = this.drag;
    this.drag = null;
    this.selbox.style.display = 'none';
    const r = this._rel(e);
    if (r.sx < 0 || r.sx > 1 || r.sy < 0 || r.sy > 1) return;
    if (this.mode) { this._modeClick(r, d.shift); return; }
    if (d.moved) this._boxSelect(d, r, d.shift);
    else this._clickSelect(r, d.shift);
  }

  _clickSelect(r, additive) {
    const p = this.renderer.groundAt(r.sx, r.sy);
    if (!p) return;
    const e = this.entityAt(p, (x) => x.faction === this.sim.player && x.type !== 'wreck');
    if (!additive) this.selected.clear();
    if (e) {
      if (additive && this.selected.has(e.id)) this.selected.delete(e.id);
      else if (e.type !== 'structure' || this.selected.size === 0) this.selected.add(e.id);
    }
  }

  _boxSelect(a, r, additive) {
    const x0 = Math.min(a.x, r.px), x1 = Math.max(a.x, r.px);
    const y0 = Math.min(a.y, r.py), y1 = Math.max(a.y, r.py);
    if (!additive) this.selected.clear();
    for (const e of this.sim.entities.values()) {
      if (e.dead || e.faction !== this.sim.player || !isUnit(e)) continue;
      const s = this.renderer.worldToScreen(e.x, e.z, 2);
      if (!s.behind && s.x >= x0 && s.x <= x1 && s.y >= y0 && s.y <= y1) this.selected.add(e.id);
    }
  }

  // Right-click: choose a sensible order for what is under the cursor.
  _contextOrder(r) {
    const sel = this.selectedEntities();
    if (!sel.length) return;
    const p = this.renderer.groundAt(r.sx, r.sy);
    if (!p) return;
    if (this._blockedByPause()) return;
    const player = this.sim.player;

    // A selected structure: right-click sets its rally point.
    const structs = sel.filter((e) => e.type === 'structure');
    if (structs.length && structs.length === sel.length) {
      for (const s of structs) s.rally = { x: p.x, z: p.z };
      this.renderer.ping(p.x, p.z, 0xffffff);
      this.hud.toast('Rally point set.');
      return;
    }

    const units = sel.filter(isUnit);
    const bots = units.filter((e) => e.type === 'bot').map((e) => e.id);
    const fighters = units.filter((e) => e.type !== 'bot').map((e) => e.id);
    const target = this.entityAt(p, (e) => e.type !== 'wreck');
    const wreck = this.entityAt(p, (e) => e.type === 'wreck');
    const seam = this.seamAt(p);
    const o = this.sim;

    if (target && target.faction !== player) {
      o.order(fighters, { type: 'attack', x: target.x, z: target.z });
      o.order(bots, { type: 'move', x: p.x, z: p.z });
      this.renderer.ping(target.x, target.z, 0xff4040);
    } else if (wreck) {
      o.order(bots, { type: 'salvage', wreckId: wreck.id });
      o.order(fighters, { type: 'move', x: wreck.x, z: wreck.z });
      this.renderer.ping(wreck.x, wreck.z, 0xffc83d);
    } else if (seam) {
      o.order(bots, { type: 'mine', seamId: seam.id });
      o.order(fighters, { type: 'move', x: seam.x, z: seam.z });
      this.renderer.ping(seam.x, seam.z, 0xff9a3a);
    } else if (target && isUnit(target) && fighters.length && !fighters.includes(target.id)) {
      o.order(fighters, { type: 'protect', targetId: target.id });
      o.order(bots, { type: 'move', x: p.x, z: p.z });
      this.renderer.ping(target.x, target.z, 0x66ff66);
    } else {
      o.order(units.map((e) => e.id), { type: 'move', x: p.x, z: p.z });
      this.renderer.ping(p.x, p.z, 0x66ff66);
    }
  }

  _modeClick(r, keep) {
    const p = this.renderer.groundAt(r.sx, r.sy);
    const mode = this.mode;
    if (!p) return;
    if (this._blockedByPause()) { this.setMode(null); return; }
    const ids = this.selectedEntities().filter(isUnit).map((e) => e.id);
    const o = this.sim;
    if (mode === 'protect') {
      const t = this.entityAt(p, (e) => isUnit(e) && e.faction === this.sim.player);
      if (!t) { this.hud.toast('Click a friendly unit to protect.', 'bad'); return; }
      o.order(ids.filter((id) => id !== t.id), { type: 'protect', targetId: t.id });
      this.renderer.ping(t.x, t.z, 0x66ff66);
    } else if (mode === 'attack') {
      const t = this.entityAt(p, (e) => e.type !== 'wreck' && e.faction !== this.sim.player);
      o.order(ids, { type: 'attack', x: t ? t.x : p.x, z: t ? t.z : p.z });
      this.renderer.ping(p.x, p.z, 0xff4040);
    } else {
      o.order(ids, { type: mode, x: p.x, z: p.z });
      this.renderer.ping(p.x, p.z, mode === 'defend' ? 0x4aa8ff : 0x66ff66);
    }
    if (!keep) this.setMode(null);
  }

  // ---- commands from buttons and hotkeys ----

  setMode(m) {
    this.mode = m;
    this.canvas.style.cursor = m ? 'crosshair' : 'default';
    this.hud.setActiveMode(m);
  }

  command(type) {
    if (this._blockedByPause()) return;
    const ids = this.selectedEntities().filter(isUnit).map((e) => e.id);
    if (!ids.length) return;
    if (type === 'stop' || type === 'retreat') { this.setMode(null); this.sim.order(ids, { type }); return; }
    this.setMode(type); // move / attack / defend / protect / patrol: click a target next
  }

  stance(s) {
    if (this._blockedByPause()) return;
    this.sim.setStance([...this.selected], s);
  }

  jumpToBase() {
    const s = this.sim.playerSite();
    this.renderer.cam.x = s.x;
    this.renderer.cam.z = s.z;
  }

  _key(e, down) {
    const k = e.key.toLowerCase();
    if (['input', 'textarea', 'select'].includes((e.target.tagName || '').toLowerCase())) return;
    if (down) {
      if (k === ' ') { e.preventDefault(); this.hud.togglePause(); return; }
      if (k === 'escape') { this.setMode(null); this.selected.clear(); this.hud.hideHelp(); return; }
      if (k === 'h') { this.hud.toggleHelp(); return; }
      if (k === 'home' || k === 'b') { this.jumpToBase(); return; }
      // Letter hotkeys give orders when units are selected. With nothing selected, WASD pans the camera.
      const cmd = { m: 'move', a: 'attack', d: 'defend', e: 'protect', p: 'patrol', r: 'retreat', s: 'stop' }[k];
      if (cmd && !e.ctrlKey && !e.metaKey && this.selectedEntities().some(isUnit)) { this.command(cmd); return; }
      if (k === '1') this.stance('aggressive');
      if (k === '2') this.stance('defensive');
      if (k === '3') this.stance('hold');
    }
    if (down) this.keys.add(k); else this.keys.delete(k);
  }

  // Camera panning: arrow keys and screen edges (WASD is reserved for orders when units are selected).
  update(dt) {
    const cam = this.renderer.cam;
    const speed = 75 * cam.zoom * dt;
    let dx = 0, dz = 0;
    if (this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('arrowright')) dx += 1;
    if (this.keys.has('arrowup')) dz -= 1;
    if (this.keys.has('arrowdown')) dz += 1;
    if (this.keys.has('w') && !this.selected.size) dz -= 1;
    if (this.keys.has('s') && !this.selected.size) dz += 1;
    if (this.keys.has('a') && !this.selected.size) dx -= 1;
    if (this.keys.has('d') && !this.selected.size) dx += 1;
    const m = this.mouse;
    if (m.inside && !this.drag) {
      if (m.x < 0.008) dx -= 1;
      if (m.x > 0.992) dx += 1;
      if (m.y < 0.008) dz -= 1;
      if (m.y > 0.992) dz += 1;
    }
    cam.x += dx * speed;
    cam.z += dz * speed;
  }
}
