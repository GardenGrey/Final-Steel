# Final Steel

A browser real-time strategy game inspired by Metal Fatigue. Three rival companies fight over one resource, Magmore, while an alien intelligence called the Hollow wakes up wherever you dig.

**Status: prototype v0.** Playable skeleton: tilted 3D map, fog of war, order-driven combat, mining economy, production, Disturbance and the Hollow, and a win/lose condition. Art is placeholder shapes.

## Run it

The game uses ES modules, so it must be served over HTTP (opening `index.html` directly will not work).

```
python3 -m http.server 8080
```

Then open http://localhost:8080. It also works as-is on GitHub Pages (Settings, Pages, deploy from a branch).

Useful URL options: `?planet=cinder|verdis|skyreach|ashfall`, `?faction=azorious|rakdos|simic`, `?seed=123`, `?autostart=1`.

## How to play

- You command, you don't pilot. Select units and give orders: Move, Attack, Defend, Protect, Patrol, Retreat, Stop. Units fight on their own.
- Right-click is a smart order: ground = move, Magmore seam = mine, wreck = salvage, enemy = attack, friendly unit = protect.
- Select a building to build units. Mining bots earn Magmore. More mining means more Disturbance, and more Hollow attacks.
- Wrecks left by destroyed combots can be salvaged by mining bots to learn the enemy's tech (recorded only in v0).
- Space pauses the game. No orders can be given while paused.
- Win by eliminating both other companies. The Hollow cannot be eliminated.

Press **H** in game for the full controls.

## Tests

```
npm test          # simulation tests, no dependencies
npm install && npm run test:ui   # UI smoke test in a simulated DOM
```

## Not built yet (v0 limits)

- Pathfinding (units move in straight lines and slow down on steep slopes), and line of sight is not blocked by mountains.
- Part-based combot building, captured tech effects, research tiers, the Rakdos howitzer.
- Truces, alliances and diplomacy. All three companies are at war with each other.
- Sound, final art, and a campaign.

## Design docs

The full design lives in [`docs/`](docs/): story, factions, combot design, combat, economy, art direction and world. (These are on the `claude/story-and-factions` branch until merged.)

## Credits

3D rendering by [three.js](https://threejs.org), MIT licensed (`vendor/THREE_LICENSE`).
