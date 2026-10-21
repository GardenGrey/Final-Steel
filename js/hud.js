// HUD: top bar, minimap, selection panel, order buttons, production, toasts.
// Layout follows the reference (see docs/07-world.md): top bar, minimap and orders on the right, details at the bottom.

import { MAP_SIZE, HALF, FOG_GRID, FACTIONS, UNIT, STRUCT } from './config.js';

const $ = (id) => document.getElementById(id);
const isUnit = (e) => e.type === 'bot' || e.type === 'combot' || e.type === 'infantry';

const ORDER_BUTTONS = [
  { type: 'move', label: 'Move', key: 'M', forBots: true },
  { type: 'attack', label: 'Attack', key: 'A' },
  { type: 'defend', label: 'Defend', key: 'D' },
  { type: 'protect', label: 'Protect', key: 'E' },
  { type: 'patrol', label: 'Patrol', key: 'P' },
  { type: 'retreat', label: 'Retreat', key: 'R', forBots: true },
  { type: 'stop', label: 'Stop', key: 'S', forBots: true },
];
const STANCES = [
  { id: 'aggressive', label: 'Aggressive', key: '1' },
  { id: 'defensive', label: 'Defensive', key: '2' },
  { id: 'hold', label: 'Hold', key: '3' },
];

export class Hud {
  constructor(sim, renderer) {
    this.sim = sim;
    this.renderer = renderer;
    this.input = null;
    this.timer = 0;
    this.miniTimer = 0;
    this.incomeLog = [];
    this.income = 0;
    this.activeMode = null;
    this.lastPanelKey = '';

    const fcol = FACTIONS[sim.player].css;
    document.documentElement.style.setProperty('--faction', fcol);
    $('planet').textContent = `${sim.planet.name} · ${FACTIONS[sim.player].name}`;
    $('pauseBtn').onclick = () => this.togglePause();
    $('helpBtn').onclick = () => this.toggleHelp();
    $('helpClose').onclick = () => this.hideHelp();
    $('restart').onclick = () => location.reload();

    this.mini = $('minimap');
    this.mctx = this.mini.getContext('2d');
    this.mini.width = 220; this.mini.height = 220;
    this.terrainImg = this._buildTerrainImage();
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = FOG_GRID; this.fogCanvas.height = FOG_GRID;
    this.fogCtx = this.fogCanvas.getContext('2d');
    this.fogImg = this.fogCtx.createImageData(FOG_GRID, FOG_GRID);
    let down = false;
    const go = (e) => {
      const r = this.mini.getBoundingClientRect();
      this.renderer.cam.x = ((e.clientX - r.left) / r.width) * MAP_SIZE - HALF;
      this.renderer.cam.z = ((e.clientY - r.top) / r.height) * MAP_SIZE - HALF;
    };
    this.mini.addEventListener('mousedown', (e) => { down = true; go(e); });
    window.addEventListener('mousemove', (e) => { if (down) go(e); });
    window.addEventListener('mouseup', () => { down = false; });
  }

  attachInput(input) { this.input = input; }

  // ---- messages ----

  toast(text, kind = 'info') {
    const box = $('toasts');
    const d = document.createElement('div');
    d.className = `toast ${kind}`;
    d.textContent = text;
    box.appendChild(d);
    while (box.children.length > 5) box.removeChild(box.firstChild);
    setTimeout(() => d.classList.add('fade'), 4200);
    setTimeout(() => d.remove(), 5200);
  }

  togglePause() {
    if (this.sim.over) return;
    this.sim.paused = !this.sim.paused;
    $('pause').hidden = !this.sim.paused;
    $('pauseBtn').textContent = this.sim.paused ? 'Resume' : 'Pause';
    if (this.sim.paused && this.input) this.input.setMode(null);
  }

  toggleHelp() { $('help').hidden = !$('help').hidden; }
  hideHelp() { $('help').hidden = true; }

  setActiveMode(m) {
    this.activeMode = m;
    document.querySelectorAll('#orders button[data-order]').forEach((b) => {
      b.classList.toggle('active', b.dataset.order === m);
    });
    $('hint').textContent = m
      ? ({ move: 'Click where to move', attack: 'Click where to attack', defend: 'Click where to defend', protect: 'Click a friendly unit to protect', patrol: 'Click the other end of the patrol' }[m] || '')
      : '';
  }

  // ---- per frame ----

  update(dt) {
    const sim = this.sim;
    for (const m of sim.messages.splice(0)) this.toast(m.text, m.kind);

    // Top bar
    const t = Math.floor(sim.time);
    $('clock').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    const stock = Math.floor(sim.stock[sim.player]);
    $('magmore').textContent = stock;
    this.incomeLog.push([sim.time, sim.stock[sim.player]]);
    while (this.incomeLog.length > 1 && sim.time - this.incomeLog[0][0] > 8) this.incomeLog.shift();
    if (this.incomeLog.length > 1 && !sim.paused) {
      const a = this.incomeLog[0], b = this.incomeLog[this.incomeLog.length - 1];
      this.income = b[0] > a[0] ? Math.max(0, (b[1] - a[1]) / (b[0] - a[0])) : this.income;
    }
    $('income').textContent = `+${this.income.toFixed(1)}/s`;
    const D = Math.min(100, sim.disturbance);
    $('distfill').style.width = `${D}%`;
    $('distfill').style.background = D > 60 ? '#39ff14' : D > 30 ? '#8bd45a' : '#6f8f6a';
    $('distval').textContent = D.toFixed(0);

    // Selection panel, rebuilt when the selection or affordability changes.
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = 0.15; this._panel(); }
    this.miniTimer -= dt;
    if (this.miniTimer <= 0) { this.miniTimer = 0.2; this._minimap(); }

    if (sim.over && $('endscreen').hidden) {
      $('endscreen').hidden = false;
      $('endtitle').textContent = sim.over === 'victory' ? 'Victory' : 'Defeat';
      $('endtext').textContent = sim.over === 'victory'
        ? 'The other two companies have been eliminated. The planet is yours.'
        : 'Your company has been eliminated.';
    }
  }

  _panel() {
    const sim = this.sim;
    const sel = this.input ? this.input.selectedEntities() : [];
    const units = sel.filter(isUnit);
    const key = [
      sel.map((e) => e.id).join(','), this.activeMode, Math.floor(sim.stock[sim.player] / 10),
      sel.length === 1 ? sel[0].queue?.length : '', units.map((u) => u.stance).join(''), sim.paused,
    ].join('|');

    // Details change every frame (hp, cargo, queue), so refresh the text always.
    this._details(sel);
    if (key === this.lastPanelKey) { this._queueProgress(sel); return; }
    this.lastPanelKey = key;

    const orders = $('orders');
    orders.innerHTML = '';
    if (!sel.length) {
      orders.innerHTML = '<p class="muted">Click a unit or building to select it. Drag to box-select. Right-click to give an order.</p>';
      return;
    }
    if (units.length) {
      const botsOnly = units.every((u) => u.type === 'bot');
      const grid = document.createElement('div');
      grid.className = 'grid';
      for (const b of ORDER_BUTTONS) {
        if (botsOnly && !b.forBots) continue;
        const el = document.createElement('button');
        el.dataset.order = b.type;
        el.innerHTML = `${b.label}<small>${b.key}</small>`;
        if (this.activeMode === b.type) el.classList.add('active');
        el.onclick = () => this.input.command(b.type);
        grid.appendChild(el);
      }
      orders.appendChild(grid);
      if (units.some((u) => u.type !== 'bot')) {
        const row = document.createElement('div');
        row.className = 'grid stances';
        for (const s of STANCES) {
          const el = document.createElement('button');
          el.innerHTML = `${s.label}<small>${s.key}</small>`;
          if (units.every((u) => u.stance === s.id)) el.classList.add('active');
          el.onclick = () => this.input.stance(s.id);
          row.appendChild(el);
        }
        orders.appendChild(row);
      }
      if (botsOnly) {
        const p = document.createElement('p');
        p.className = 'muted';
        p.textContent = 'Right-click a Magmore seam to mine it, or a wreck to salvage it.';
        orders.appendChild(p);
      }
    }
    if (sel.length === 1 && sel[0].type === 'structure') {
      const s = sel[0];
      if (s.stats.builds) {
        const ut = s.stats.builds;
        const st = UNIT[ut][s.faction];
        const b = document.createElement('button');
        b.className = 'build';
        const afford = sim.stock[sim.player] >= st.cost;
        b.disabled = !afford;
        b.innerHTML = `Build ${ut === 'bot' ? 'Mining Bot' : ut === 'combot' ? 'Combot' : 'Infantry'}<small>${st.cost} Magmore · ${st.time}s</small>`;
        b.onclick = () => {
          const r = sim.produce(s.id, ut);
          if (!r.ok) this.toast(r.reason, 'bad');
        };
        orders.appendChild(b);
        const q = document.createElement('div');
        q.id = 'queue';
        orders.appendChild(q);
        const p = document.createElement('p');
        p.className = 'muted';
        p.textContent = 'Right-click the ground to set where new units go.';
        orders.appendChild(p);
      } else {
        orders.innerHTML = '<p class="muted">This building does not build anything yet in this prototype.</p>';
      }
    }
    this._queueProgress(sel);
  }

  _queueProgress(sel) {
    const q = $('queue');
    if (!q || sel.length !== 1 || !sel[0].queue) return;
    q.innerHTML = sel[0].queue.map((j, i) => {
      const pct = i === 0 ? Math.round((1 - j.t / j.total) * 100) : 0;
      return `<div class="qjob"><i style="width:${pct}%"></i><span>${j.type}</span></div>`;
    }).join('');
  }

  _details(sel) {
    const el = $('details');
    if (!sel.length) { el.textContent = ''; return; }
    if (sel.length > 1) {
      const counts = {};
      for (const e of sel) counts[e.type] = (counts[e.type] || 0) + 1;
      el.textContent = Object.entries(counts).map(([k, v]) => `${v} ${k}${v > 1 ? 's' : ''}`).join(' · ');
      return;
    }
    const e = sel[0];
    const f = FACTIONS[e.faction].name;
    if (e.type === 'structure') {
      el.textContent = `${f} ${STRUCT[e.kind].label} · HP ${Math.ceil(e.hp)}/${e.maxHp}`;
    } else if (e.type === 'bot') {
      el.textContent = `${f} Mining Bot · HP ${Math.ceil(e.hp)}/${e.maxHp} · Cargo ${Math.floor(e.cargo)}/${e.stats.cap} · Order: ${e.order.type}`;
    } else {
      const s = e.stats;
      el.textContent = `${f} ${e.type === 'combot' ? 'Combot' : 'Infantry'} · HP ${Math.ceil(e.hp)}/${e.maxHp} · Dmg ${s.dmg} · Range ${s.range} · Speed ${s.speed} · Stance: ${e.stance} · Order: ${e.order.type}`;
    }
  }

  // ---- minimap ----

  _buildTerrainImage() {
    const N = 160;
    const c = document.createElement('canvas');
    c.width = N; c.height = N;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(N, N);
    const sim = this.sim;
    const p = sim.planet;
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = -HALF + ((i + 0.5) / N) * MAP_SIZE;
        const z = -HALF + ((j + 0.5) / N) * MAP_SIZE;
        const h = sim.heightAt(x, z);
        const t = Math.min(1, h / (p.amp * 0.85));
        const shade = 0.55 + 0.6 * (sim.heightAt(x - 2, z - 2) - sim.heightAt(x + 2, z + 2)) / 6;
        const a = t < 0.5 ? [p.low, p.mid, t * 2] : [p.mid, p.high, (t - 0.5) * 2];
        const k = (j * N + i) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const v = (a[0][ch] + (a[1][ch] - a[0][ch]) * a[2]) * Math.max(0.35, Math.min(1.4, shade));
          img.data[k + ch] = Math.max(0, Math.min(255, v * 255));
        }
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  _minimap() {
    const ctx = this.mctx;
    const W = this.mini.width;
    const sim = this.sim;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.terrainImg, 0, 0, W, W);
    // Fog: darken everything outside vision.
    const d = this.fogImg.data;
    for (let i = 0; i < sim.fog.length; i++) {
      d[i * 4] = 0; d[i * 4 + 1] = 0; d[i * 4 + 2] = 0;
      d[i * 4 + 3] = Math.round((1 - sim.fog[i]) * 215);
    }
    this.fogCtx.putImageData(this.fogImg, 0, 0);
    ctx.drawImage(this.fogCanvas, 0, 0, W, W);

    const sc = W / MAP_SIZE;
    const mx = (x) => (x + HALF) * sc;
    for (const s of sim.seams) {
      if (!s.discovered || s.amount <= 0.5) continue;
      ctx.fillStyle = '#ff9a3a';
      ctx.fillRect(mx(s.x) - 2, mx(s.z) - 2, 4, 4);
    }
    for (const e of sim.entities.values()) {
      if (e.dead || !e.visibleToPlayer || e.type === 'wreck') continue;
      ctx.fillStyle = FACTIONS[e.faction].css;
      const big = e.type === 'structure';
      const sz = big ? 5 : 3;
      ctx.fillRect(mx(e.x) - sz / 2, mx(e.z) - sz / 2, sz, sz);
      if (e.faction === 'hollow') { ctx.fillStyle = '#39ff14'; ctx.fillRect(mx(e.x) - 1, mx(e.z) - 1, 2, 2); }
    }
    // View box
    const corners = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => this.renderer.groundAt(x, y));
    if (corners.every(Boolean)) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      corners.forEach((c, i) => (i ? ctx.lineTo(mx(c.x), mx(c.z)) : ctx.moveTo(mx(c.x), mx(c.z))));
      ctx.closePath();
      ctx.stroke();
    } else {
      const c = this.renderer.cam;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(mx(c.x) - 14, mx(c.z) - 10, 28, 20);
    }
  }
}
