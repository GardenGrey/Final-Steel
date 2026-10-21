// Entry point: menu, then the game loop.

import { Sim } from './sim.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { Hud } from './hud.js';
import { PLANETS, FACTIONS, PLAYABLE } from './config.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const choice = {
  planet: PLANETS[params.get('planet')] ? params.get('planet') : 'verdis',
  faction: PLAYABLE.includes(params.get('faction')) ? params.get('faction') : 'random',
  seed: params.get('seed') ? Number(params.get('seed')) : undefined,
};

function buildMenu() {
  const pl = $('planetChoices');
  for (const [key, p] of Object.entries(PLANETS)) {
    const b = document.createElement('button');
    b.dataset.value = key;
    b.innerHTML = `${p.name}<small>${p.blurb}</small>`;
    b.onclick = () => { choice.planet = key; mark(pl, key); };
    pl.appendChild(b);
  }
  const fc = $('factionChoices');
  for (const key of [...PLAYABLE, 'random']) {
    const b = document.createElement('button');
    b.dataset.value = key;
    const f = FACTIONS[key];
    b.innerHTML = f ? `${f.name}<small>${f.tag}</small>` : 'Random<small>Surprise me</small>';
    if (f) b.style.setProperty('--c', f.css);
    b.onclick = () => { choice.faction = key; mark(fc, key); };
    fc.appendChild(b);
  }
  mark(pl, choice.planet);
  mark(fc, choice.faction);
  $('start').onclick = start;
}

function mark(box, value) {
  box.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.value === value));
}

function start() {
  $('menu').hidden = true;
  const sim = new Sim({
    planet: choice.planet,
    faction: choice.faction === 'random' ? undefined : choice.faction,
    seed: choice.seed,
  });
  const canvas = $('view');
  const renderer = new Renderer(canvas, sim);
  const hud = new Hud(sim, renderer);
  const input = new Input(canvas, renderer, sim, hud);
  hud.attachInput(input);
  $('ui').hidden = false;
  hud.toast(`You are ${FACTIONS[sim.player].name} on ${sim.planet.name}. Mine Magmore, build up, find the others.`);
  hud.toast('Press H for controls.');
  window.game = { sim, renderer, input, hud }; // handy for debugging in the browser console

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    sim.update(dt);
    input.update(dt);
    hud.update(dt);
    renderer.render(dt, input.selected);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

buildMenu();
if (params.get('autostart')) start();
