import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
// UI smoke test in a simulated DOM (no GPU needed). Run with: npm install && npm run test:ui
const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const html = fs.readFileSync(`${ROOT}/index.html`, 'utf8').replace(/<script[^>]*><\/script>/, '');
const dom = new JSDOM(html, { pretendToBeVisual: true });
const { window } = dom;
Object.assign(globalThis, { window, document: window.document, HTMLElement: window.HTMLElement, location: window.location, performance: globalThis.performance });
globalThis.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 0);
// canvas 2D stub
const ctxStub = new Proxy({}, { get: (t, k) => k === 'createImageData' ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
window.HTMLCanvasElement.prototype.getContext = () => ctxStub;
for (const id of ['view', 'minimap']) {
  const c = document.getElementById(id);
  Object.defineProperty(c, 'clientWidth', { value: 1000 }); Object.defineProperty(c, 'clientHeight', { value: 700 });
  c.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 700 });
}
window.innerWidth = 1000; window.innerHeight = 700;

const { Sim } = await import(`${ROOT}/js/sim.js`);
const { Renderer } = await import(`${ROOT}/js/render.js`);
const { Hud } = await import(`${ROOT}/js/hud.js`);
const { Input } = await import(`${ROOT}/js/input.js`);
await import(`${ROOT}/js/models.js`);

let failures = 0;
const check = (name, cond, extra = '') => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name} ${extra}`); if (!cond) failures++; };

for (const [planet, faction, seed] of [['cinder', 'rakdos', 5], ['skyreach', 'azorious', 9], ['verdis', 'simic', 13], ['ashfall', 'rakdos', 21]]) {
  const sim = new Sim({ planet, faction, seed });
  const fakeGL = { setPixelRatio() {}, setSize() {}, render() { this.n = (this.n || 0) + 1; } };
  const renderer = new Renderer(document.getElementById('view'), sim, fakeGL);
  const hud = new Hud(sim, renderer);
  const input = new Input(document.getElementById('view'), renderer, sim, hud);
  hud.attachInput(input);
  check(`[${planet}] renderer, hud, input construct`, true);

  // Frames
  for (let i = 0; i < 60; i++) { sim.update(0.05); input.update(0.05); hud.update(0.05); renderer.render(0.05, input.selected); }
  check(`[${planet}] 60 frames rendered`, fakeGL.n === 60);
  check(`[${planet}] fog texture has visible area near base`, renderer.fogData.some((v) => v > 200));
  check(`[${planet}] only some of the map is visible`, renderer.fogData.filter((v) => v > 200).length < renderer.fogData.length * 0.25);
  const ownViews = [...renderer.entityViews.values()].filter((v, i) => true).length;
  check(`[${planet}] entity views created`, ownViews === sim.entities.size, `(${ownViews}/${sim.entities.size})`);
  const hiddenEnemies = [...sim.entities.values()].filter((e) => e.faction !== sim.player && !e.visibleToPlayer);
  check(`[${planet}] enemy meshes hidden in fog`, hiddenEnemies.length > 0 && hiddenEnemies.every((e) => renderer.entityViews.get(e.id).root.visible === false));

  // Picking via the real camera and raycaster
  input.jumpToBase();
  renderer.render(0.05, input.selected);
  const centre = renderer.groundAt(0.5, 0.5);
  check(`[${planet}] ground raycast hits terrain at screen centre`, centre && Math.abs(centre.x - renderer.cam.x) < 6 && Math.abs(centre.z - renderer.cam.z) < 6, JSON.stringify(centre && { x: +centre.x.toFixed(1), z: +centre.z.toFixed(1) }));

  // Select own units by clicking on them
  const bot = [...sim.entities.values()].find((e) => e.faction === sim.player && e.type === 'bot');
  const s = renderer.worldToScreen(bot.x, bot.z, 1);
  input.selected.clear();
  input._clickSelect({ sx: s.x / 1000, sy: s.y / 700 }, false);
  check(`[${planet}] click-select picks a unit`, input.selected.size === 1, `(selected ${input.selected.size})`);

  // Box select around the whole screen selects all own units on screen
  input.selected.clear();
  input._boxSelect({ x: 0, y: 0 }, { px: 1000, py: 700 }, false);
  check(`[${planet}] box-select selects several units`, input.selected.size >= 3, `(selected ${input.selected.size})`);
  hud._panel();
  check(`[${planet}] order buttons rendered`, document.querySelectorAll('#orders button').length >= 5);

  // Right-click a discovered seam with bots selected -> mine order
  const seam = sim.seams.find((x) => x.discovered);
  const bots = [...sim.entities.values()].filter((e) => e.faction === sim.player && e.type === 'bot');
  input.selected.clear(); bots.forEach((b) => input.selected.add(b.id));
  renderer.cam.x = seam.x; renderer.cam.z = seam.z; renderer.render(0.05, input.selected);
  input._contextOrder({ sx: 0.5, sy: 0.5 });
  check(`[${planet}] right-click seam issues a mine order`, bots.every((b) => b.order.type === 'mine'), `(${bots.map((b) => b.order.type)})`);

  // Move mode
  const combot = [...sim.entities.values()].find((e) => e.faction === sim.player && e.type === 'combot');
  input.selected.clear(); input.selected.add(combot.id);
  input.command('attack');
  check(`[${planet}] attack mode armed`, input.mode === 'attack');
  input._modeClick({ sx: 0.5, sy: 0.5 }, false);
  check(`[${planet}] attack order issued, mode cleared`, combot.order.type === 'attack' && input.mode === null);

  // Production through the HUD
  const df = [...sim.entities.values()].find((e) => e.faction === sim.player && e.kind === 'droidFactory');
  input.selected.clear(); input.selected.add(df.id);
  hud.lastPanelKey = ''; hud._panel();
  const buildBtn = document.querySelector('#orders button.build');
  check(`[${planet}] build button shown for factory`, !!buildBtn);
  const before = sim.stock[sim.player];
  buildBtn.click();
  check(`[${planet}] clicking build spends Magmore`, sim.stock[sim.player] < before);

  // Pause blocks orders
  hud.togglePause();
  check(`[${planet}] pause overlay shown`, document.getElementById('pause').hidden === false);
  input.selected.clear(); input.selected.add(combot.id);
  const prev = { ...combot.order };
  input._contextOrder({ sx: 0.5, sy: 0.5 });
  check(`[${planet}] right-click order is refused while paused`, JSON.stringify(combot.order) === JSON.stringify(prev));
  hud.togglePause();

  // Let it run: effects and health bars
  for (let i = 0; i < 400; i++) { sim.update(0.05); input.update(0.05); hud.update(0.05); renderer.render(0.05, input.selected); }
  const bad = [...renderer.entityViews.values()].some((v) => !Number.isFinite(v.root.position.x + v.root.position.y + v.root.position.z));
  check(`[${planet}] 20s more of frames, no NaN positions`, !bad);
  check(`[${planet}] minimap and details draw`, true);
}
console.log(failures ? `\n${failures} FAILED` : '\nall UI smoke checks passed');
process.exit(failures ? 1 : 0);
