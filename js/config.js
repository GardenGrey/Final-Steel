// Shared constants and data tables for Final Steel.
// Names, colors and stats live here so they are easy to change (see docs/).

export const MAP_SIZE = 240;
export const HALF = MAP_SIZE / 2;
export const HEIGHT_GRID = 160; // terrain cells per side
export const FOG_GRID = 160; // fog cells per side

export const FACTIONS = {
  azorious: { name: 'Azorious', color: 0x2f6fd6, trim: 0xf2f5fa, css: '#2f6fd6', tag: 'Flight and ranged' },
  rakdos: { name: 'Rakdos', color: 0xb3201f, trim: 0xd6a93a, css: '#b3201f', tag: 'Melee and armor' },
  simic: { name: 'Simic', color: 0x6b3fa0, trim: 0x2e1a47, css: '#6b3fa0', tag: 'Stealth and tricks' },
  hollow: { name: 'The Hollow', color: 0x8e9a8a, trim: 0x39ff14, css: '#8e9a8a', tag: 'Alien intelligence' },
};
export const PLAYABLE = ['azorious', 'rakdos', 'simic'];

// Terrain palettes are sRGB 0..1. amp = peak height, ridged = how mountainous.
export const PLANETS = {
  cinder: {
    name: 'Cinder', blurb: 'Volcanic ridges and ash flats',
    amp: 18, ridged: 0.55, scale: 55,
    low: [0.17, 0.13, 0.12], mid: [0.32, 0.23, 0.18], high: [0.5, 0.42, 0.37], rock: [0.12, 0.1, 0.1],
  },
  verdis: {
    name: 'Verdis', blurb: 'Jungle ravines and thick cover',
    amp: 14, ridged: 0.3, scale: 45,
    low: [0.09, 0.2, 0.1], mid: [0.16, 0.31, 0.13], high: [0.34, 0.38, 0.27], rock: [0.28, 0.27, 0.24],
  },
  skyreach: {
    name: 'Skyreach', blurb: 'Very mountainous crystal highlands',
    amp: 34, ridged: 0.72, scale: 60,
    low: [0.36, 0.38, 0.44], mid: [0.52, 0.54, 0.62], high: [0.84, 0.87, 0.94], rock: [0.4, 0.4, 0.48],
  },
  ashfall: {
    name: 'Ashfall', blurb: 'Ruined colony, pits and tailings',
    amp: 9, ridged: 0.15, scale: 40,
    low: [0.24, 0.23, 0.21], mid: [0.36, 0.34, 0.3], high: [0.5, 0.48, 0.44], rock: [0.3, 0.29, 0.28],
  },
};

// Per-faction unit stats. Speeds are world units per second.
// fx: how a hit looks: bullet (man-made tracer), melee (sparks), shock (electric arc), green (Hollow energy).
export const UNIT = {
  bot: {
    azorious: { hp: 35, speed: 6.5, cap: 20, mineRate: 7, cost: 50, time: 6, sight: 22 },
    rakdos: { hp: 90, speed: 3.2, cap: 48, mineRate: 6, cost: 60, time: 8, sight: 20 },
    simic: { hp: 40, speed: 5, cap: 28, mineRate: 6, cost: 55, time: 7, sight: 22, cloak: true },
  },
  infantry: {
    azorious: { hp: 30, speed: 5, range: 20, dmg: 2, cooldown: 0.35, acc: 0.85, cost: 40, time: 5, sight: 24, fx: 'bullet', retreatAt: 0.4 },
    rakdos: { hp: 70, speed: 3.2, range: 3, dmg: 7, cooldown: 1.0, acc: 0.85, cost: 45, time: 5, sight: 18, fx: 'melee', retreatAt: 0.15 },
    simic: { hp: 35, speed: 4.5, range: 8, dmg: 3, cooldown: 0.8, acc: 0.85, cost: 40, time: 5, sight: 24, fx: 'shock', cloak: true, retreatAt: 0.35 },
  },
  combot: {
    azorious: { hp: 80, speed: 6, range: 28, dmg: 4, cooldown: 0.35, acc: 0.9, cost: 120, time: 10, sight: 38, fx: 'bullet', kite: true, retreatAt: 0.5 },
    rakdos: { hp: 240, speed: 2.6, range: 5, dmg: 24, cooldown: 1.5, acc: 0.85, cost: 150, time: 14, sight: 26, fx: 'melee', retreatAt: 0.15 },
    simic: { hp: 100, speed: 4.2, range: 9, dmg: 10, cooldown: 0.9, acc: 0.85, cost: 130, time: 11, sight: 34, fx: 'shock', cloak: true, stall: 0.4, retreatAt: 0.4 },
    hollow: { hp: 240, speed: 3.4, range: 24, dmg: 28, cooldown: 1.8, acc: 0.85, cost: 0, time: 0, sight: 32, fx: 'green', retreatAt: 0 },
  },
};

export const STRUCT = {
  refinery: { label: 'Refinery', hp: 700, sight: 34, r: 6 },
  droidFactory: { label: 'Droid Factory', hp: 450, sight: 26, r: 5, builds: 'bot' },
  mechStation: { label: 'Mech Station', hp: 450, sight: 26, r: 6, builds: 'combot' },
  barracks: { label: 'Barracks', hp: 320, sight: 26, r: 5, builds: 'infantry' },
  research: { label: 'Research Facility', hp: 320, sight: 24, r: 4 },
};

// Where each structure sits relative to a start site.
export const BASE_LAYOUT = [
  ['refinery', 0, 0],
  ['droidFactory', -13, 7],
  ['mechStation', 13, 7],
  ['barracks', -14, -6],
  ['research', 14, -6],
];

export const BALANCE = {
  startMagmore: 300,
  starterSeam: 1400,
  vacantSeam: 2600,
  popCap: 60,
  salvageChance: 0.33,
  hollowSalvageChance: 0.08,
  wreckLife: 150,
  disturbancePerMagmore: 0.008,
  disturbanceDecay: 0.1,
  firstWave: 20, // Disturbance needed before the first Hollow wave
  waveStep: 10, // extra Disturbance needed for each following wave
  scrapValue: 40,
};

// Part names used for salvage (see docs/03-mech-design.md).
export const PARTS = {
  azorious: {
    legs: ['Strider Legs', 'Jump-Jet Legs', 'Skyframe Legs'],
    torso: ['Lattice Frame', 'Fuel Cell Core', 'Sensor Spine'],
    arm: ['Rapid Rifle', 'Longshot Rifle', 'Twin Carbine'],
    head: ['Marksman Head', 'Rangefinder Head', 'Tracker Head'],
  },
  rakdos: {
    legs: ['Pillar Legs', 'Ram Legs', 'Bulwark Legs'],
    torso: ['Furnace Core', 'Bulwark Plate', 'Howitzer Mount'],
    arm: ['Battle Axe', 'Longsword', 'Heavy Gauntlet'],
    head: ['Bastion Head', 'Warden Head', 'Brace Head'],
  },
  simic: {
    legs: ['Gecko Legs', 'Chameleon Legs', 'Drop Legs'],
    torso: ['Cloak Core', 'Mimic Plating', 'Ghost Frame'],
    arm: ['Static Hand', 'Silent Darts', 'Disruptor Claw'],
    head: ['Wide-Eye Head', 'Deep Scan Head', 'Echo Head'],
  },
  hollow: {
    legs: ['Skitter Legs', 'Burrow Legs', 'Colossus Legs'],
    torso: ['Carapace Core', 'Regen Core', 'Devourer Core'],
    arm: ['Resonance Cannon', 'Rend Claw', 'Pulse Lance'],
    head: ['Hive-Eye', 'Adaptive Mind', 'Disturbance Crown'],
  },
};
