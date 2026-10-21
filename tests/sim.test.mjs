// Headless tests for the simulation. Run with: npm test
import assert from 'node:assert/strict';
import { Sim } from '../js/sim.js';
import { PLAYABLE, PLANETS, MAP_SIZE, HALF, BALANCE } from '../js/config.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed++; console.log(`ok   ${name}`); }
  catch (e) { console.error(`FAIL ${name}\n  ${e.stack}`); process.exitCode = 1; }
};
const step = (sim, seconds, dt = 0.05) => { for (let t = 0; t < seconds; t += dt) sim.update(dt); };
const mine = (sim) => [...sim.entities.values()].filter((e) => e.faction === sim.player);
const allFinite = (sim) => [...sim.entities.values()].every((e) => Number.isFinite(e.x) && Number.isFinite(e.z) && Number.isFinite(e.hp));

test('every planet generates a valid map with 6 start sites', () => {
  for (const planet of Object.keys(PLANETS)) {
    const sim = new Sim({ seed: 7, planet });
    assert.equal(sim.sites.length, 6);
    assert.equal(sim.sites.filter((s) => s.faction).length, 3);
    assert.ok(sim.heights.every(Number.isFinite));
    assert.ok(sim.seams.length >= 6 + 8, `seams: ${sim.seams.length}`);
    assert.ok(sim.nests.length >= 1);
  }
});

test('skyreach is more mountainous than ashfall', () => {
  const range = (planet) => {
    const sim = new Sim({ seed: 3, planet });
    return Math.max(...sim.heights) - Math.min(...sim.heights);
  };
  assert.ok(range('skyreach') > range('ashfall') * 1.8);
});

test('same seed gives the same map', () => {
  const a = new Sim({ seed: 99, planet: 'cinder', faction: 'rakdos' });
  const b = new Sim({ seed: 99, planet: 'cinder', faction: 'rakdos' });
  assert.deepEqual([...a.heights.slice(0, 500)], [...b.heights.slice(0, 500)]);
  assert.deepEqual(a.sites.map((s) => s.faction), b.sites.map((s) => s.faction));
});

test('each faction starts with a full base on a flat site', () => {
  const sim = new Sim({ seed: 11, planet: 'skyreach', faction: 'simic' });
  for (const f of PLAYABLE) {
    const es = [...sim.entities.values()].filter((e) => e.faction === f);
    for (const k of ['refinery', 'droidFactory', 'mechStation', 'barracks', 'research']) {
      assert.ok(es.some((e) => e.kind === k), `${f} missing ${k}`);
    }
    assert.equal(es.filter((e) => e.type === 'bot').length, 2);
    assert.equal(es.filter((e) => e.type === 'combot').length, 2);
  }
  const s = sim.playerSite();
  const hs = [-10, 0, 10].flatMap((dx) => [-10, 0, 10].map((dz) => sim.heightAt(s.x + dx, s.z + dz)));
  assert.ok(Math.max(...hs) - Math.min(...hs) < 2.5, 'base site should be roughly flat');
});

test('fog: terrain unseen far from player, seen near player; seams are discovered by sight', () => {
  const sim = new Sim({ seed: 5, planet: 'verdis', faction: 'azorious' });
  const s = sim.playerSite();
  assert.ok(sim.visibleAt(s.x, s.z));
  const other = sim.sites.find((x) => x.faction && x.faction !== sim.player);
  assert.ok(!sim.visibleAt(other.x, other.z), 'enemy base must be hidden at start');
  const enemy = [...sim.entities.values()].filter((e) => e.faction === other.faction);
  assert.ok(enemy.every((e) => !e.visibleToPlayer));
  const far = sim.seams.filter((x) => Math.hypot(x.x - s.x, x.z - s.z) > 80);
  assert.ok(far.every((x) => !x.discovered));
  assert.ok(sim.seams.some((x) => x.discovered), 'starter seam is discovered');
});

test('bigger presence gives bigger view', () => {
  const sim = new Sim({ seed: 5, planet: 'ashfall', faction: 'rakdos' });
  const bot = mine(sim).find((e) => e.type === 'bot');
  const alone = sim.sightRadius(bot, [bot]);
  const crowd = sim.sightRadius(bot, mine(sim));
  assert.ok(crowd > alone * 1.2, `${crowd} vs ${alone}`);
});

test('mining bots earn Magmore and raise Disturbance', () => {
  const sim = new Sim({ seed: 21, planet: 'verdis', faction: 'rakdos' });
  const bots = mine(sim).filter((e) => e.type === 'bot');
  const s = sim.playerSite();
  const seam = sim.seams.find((x) => Math.hypot(x.x - s.x, x.z - (s.z - 18)) < 1);
  const before = sim.stock[sim.player];
  sim.order(bots.map((b) => b.id), { type: 'mine', seamId: seam.id });
  step(sim, 60);
  assert.ok(sim.stock[sim.player] > before + 50, `stock ${before} -> ${sim.stock[sim.player]}`);
  assert.ok(sim.disturbance > 0);
  assert.ok(seam.amount < seam.max);
  assert.ok(allFinite(sim));
});

test('faction mining styles differ (azorious faster, rakdos carries more)', () => {
  const stats = (f) => new Sim({ seed: 1, faction: f }).entities.values().next().value && f;
  assert.ok(stats('azorious'));
  const a = new Sim({ seed: 1, faction: 'azorious' });
  const r = new Sim({ seed: 1, faction: 'rakdos' });
  const sa = [...a.entities.values()].find((e) => e.type === 'bot' && e.faction === 'azorious').stats;
  const sr = [...r.entities.values()].find((e) => e.type === 'bot' && e.faction === 'rakdos').stats;
  assert.ok(sa.speed > sr.speed);
  assert.ok(sr.cap > sa.cap);
});

test('production spends Magmore and spawns a unit', () => {
  const sim = new Sim({ seed: 8, faction: 'azorious' });
  const df = mine(sim).find((e) => e.kind === 'droidFactory');
  const bots = () => mine(sim).filter((e) => e.type === 'bot').length;
  const b0 = bots();
  const m0 = sim.stock.azorious;
  assert.ok(sim.produce(df.id, 'bot').ok);
  assert.equal(sim.stock.azorious, m0 - 50);
  step(sim, 8);
  assert.equal(bots(), b0 + 1);
  assert.equal(sim.produce(df.id, 'combot').ok, false, 'wrong structure');
  sim.stock.azorious = 0;
  assert.equal(sim.produce(df.id, 'bot').ok, false, 'no money');
});

test('no orders are accepted while paused', () => {
  const sim = new Sim({ seed: 8, faction: 'simic' });
  const c = mine(sim).find((e) => e.type === 'combot');
  sim.paused = true;
  assert.equal(sim.order([c.id], { type: 'move', x: 0, z: 0 }), 0);
  assert.equal(sim.produce(mine(sim).find((e) => e.kind === 'mechStation').id, 'combot').ok, false);
  assert.equal(sim.setStance([c.id], 'hold'), 0);
  const t = sim.time;
  sim.update(1);
  assert.equal(sim.time, t, 'time must not advance while paused');
  sim.paused = false;
  assert.equal(sim.order([c.id], { type: 'move', x: 0, z: 0 }), 1);
});

test('orders are filtered by unit type', () => {
  const sim = new Sim({ seed: 8, faction: 'rakdos' });
  const bot = mine(sim).find((e) => e.type === 'bot');
  const combot = mine(sim).find((e) => e.type === 'combot');
  assert.equal(sim.order([bot.id], { type: 'attack', x: 0, z: 0 }), 0);
  assert.equal(sim.order([combot.id], { type: 'mine', seamId: sim.seams[0].id }), 0);
  assert.equal(sim.order([bot.id, combot.id], { type: 'move', x: 5, z: 5 }), 2);
});

test('combat: Hollow and companies fight and units die', () => {
  const sim = new Sim({ seed: 31, planet: 'cinder', faction: 'azorious' });
  const s = sim.playerSite();
  const h = [1, 2, 3].map((i) => sim.createUnit('combot', 'hollow', s.x + 12 + i, s.z + 4));
  step(sim, 40);
  const dead = h.filter((u) => u.dead || !sim.entities.has(u.id)).length;
  assert.ok(sim.shots.length > 0, 'shots were fired');
  assert.ok(dead > 0 || mine(sim).length < 11, 'someone should have died');
  assert.ok(allFinite(sim));
});

test('Hollow wakes when mining pushes Disturbance up', () => {
  const sim = new Sim({ seed: 2, faction: 'rakdos' });
  sim.lastMined = { x: sim.playerSite().x, z: sim.playerSite().z };
  sim.disturbance = BALANCE.firstWave + 5;
  const hollow = () => [...sim.entities.values()].filter((e) => e.faction === 'hollow').length;
  assert.equal(hollow(), 0);
  step(sim, 1);
  assert.ok(hollow() >= 1);
  assert.ok(sim.messages.some((m) => /Hollow stirs/.test(m.text)));
});

test('salvage: wreck is picked up by a bot and the part is learned', () => {
  const sim = new Sim({ seed: 4, faction: 'simic' });
  const s = sim.playerSite();
  const enemy = sim.createUnit('combot', 'rakdos', s.x + 30, s.z + 30);
  const w = sim._spawnWreck(enemy);
  w.x = s.x + 8; w.z = s.z + 14;
  const bot = mine(sim).find((e) => e.type === 'bot');
  assert.equal(sim.order([bot.id], { type: 'salvage', wreckId: w.id }), 1);
  step(sim, 30);
  assert.ok(sim.known.simic.size === 1, `known: ${[...sim.known.simic]}`);
  assert.ok(!sim.entities.has(w.id), 'wreck removed');
});

test('long run: three seeds, no NaN, elimination logic stays sane', () => {
  for (const [seed, planet, faction] of [[101, 'cinder', 'azorious'], [202, 'skyreach', 'rakdos'], [303, 'ashfall', 'simic']]) {
    const sim = new Sim({ seed, planet, faction });
    const bots = mine(sim).filter((e) => e.type === 'bot');
    const s = sim.playerSite();
    const seam = sim.seams.find((x) => Math.hypot(x.x - s.x, x.z - (s.z - 18)) < 1);
    sim.order(bots.map((b) => b.id), { type: 'mine', seamId: seam.id });
    const t0 = Date.now();
    step(sim, 900);
    assert.ok(allFinite(sim), `${planet} produced NaN`);
    for (const e of sim.entities.values()) {
      assert.ok(Math.abs(e.x) <= HALF && Math.abs(e.z) <= HALF, 'unit left the map');
    }
    assert.ok(Date.now() - t0 < 20000, 'simulation too slow');
    assert.ok(sim.stock.azorious >= 0 && sim.stock.rakdos >= 0 && sim.stock.simic >= 0);
    console.log(`     ${planet}: ${sim.entities.size} entities, disturbance ${sim.disturbance.toFixed(1)}, over=${sim.over}, elim=[${[...sim.eliminated]}]`);
  }
});

test('victory and defeat are detected', () => {
  const sim = new Sim({ seed: 6, faction: 'azorious' });
  for (const e of [...sim.entities.values()]) if (e.faction !== 'azorious' && e.faction !== 'hollow') e.dead = true;
  sim._reap();
  step(sim, 2);
  assert.equal(sim.over, 'victory');
  const sim2 = new Sim({ seed: 6, faction: 'azorious' });
  for (const e of [...sim2.entities.values()]) if (e.faction === 'azorious') e.dead = true;
  sim2._reap();
  step(sim2, 2);
  assert.equal(sim2.over, 'defeat');
});

console.log(`\n${passed} tests passed`);
void MAP_SIZE;
