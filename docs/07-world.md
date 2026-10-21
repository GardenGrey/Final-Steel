# Final Steel: World and Terrain

*Working draft. See `01-story.md` for the planets, `05-economy.md` for bases and seams, and `06-art-direction.md` for the look.*

## Camera

The game is shown from a **tilted bird's-eye view**: a 3D battlefield seen from high above at an angle, not a flat top-down map. Hills, rocks and ridges have real height, and units and structures are small against the terrain. Fog of war covers everything outside your vision.

### Reference Look

Based on the reference screenshot:

- **Angled 3D terrain.** Grassy and rocky ground with visible rises, boulders and ridgelines. Height is readable from the camera angle.
- **Vision as soft pools of light.** Areas near your units and structures are lit and in full color. Areas beyond them fall off into shadow with soft, rounded edges.
- **Dark outside vision.** The land is still faintly visible in the shadow, but dim. Our rule is **grayed terrain, not black**. Pure black is used only past the map's edge.
- **Small, readable units.** Combots, bots and buildings are small but clearly colored by faction, with a small health bar and selection marker on selected units.
- **Bases look like bases.** Clusters of structures with distinct shapes: a big round central building, boxy factories, and small support pieces.

### Interface Layout

A classic strategy layout, arranged around the edges so the battlefield stays in view:

| Area | Contents |
|---|---|
| **Top bar** | Game clock, your **Magmore** stockpile, and income rate |
| **Top right** | **Minimap**, showing the map outline and your current view box |
| **Right panel** | Selected unit or group portrait, and the order buttons |
| **Bottom bar** | Details of the selected combot: health, defense, and the parts it is built from (legs, torso, arms, head) |

- The reference game shows two resource counters. **We only have one: Magmore.**
- Order buttons match `04-combat.md`: **Move, Attack, Defend, Protect, Patrol, Retreat, Stop**, plus the three stances (Aggressive, Defensive, Hold).
- Faction colors tint the UI frame (see `06-art-direction.md`).
- The screenshot is a reference for look and feel only. We build our own art, names and layout, and don't copy its assets.

## Winning a Planet

**The only way to win a planet is to eliminate the other two factions from the map.**

- A faction is **eliminated** when it has nothing left on the map that can rebuild or fight. (Starting rule: all structures and all combots, infantry and bots destroyed. Exact definition to be tuned.)
- **The Hollow doesn't count.** It can't be eliminated, and it keeps attacking until the end.
- There is **one winner per planet.** Truces and alliances are real and useful, especially against the Hollow, but they can't end the game. To win, you'll eventually have to break them or outlast your partner.
- You lose if your own faction is eliminated first.

This keeps the central tension alive: the allies you rely on against the Hollow are the rivals you have to beat.

## Seeing the World

### Terrain Is Always Visible, Everything Else Is Not

You can always see the **shape of the land**: mountains, valleys, lava rivers, forests. What you can't see is **what's on it**.

- **Inside your vision**, the map is shown in full color: terrain, units and structures.
- **Outside your vision**, the terrain is **heavily grayed out**. You can still see the land, but no color, and no information about who is there.
- You **cannot see another faction's movements** until your units, structures or bots are in their line of sight, or theirs are in yours.
- Magmore **seams** are hidden until you explore close enough to find them. Once discovered, a seam stays marked on your map, but you won't see who is working it unless it's in view.

### Vision Rules

- **Every unit and structure has a sight radius.** Combots, infantry, bots and structures each see a different distance.
- **Bigger presence means bigger view.** The more of your assets in an area, the larger your view there. A lone bot sees a little, a base or a big army sees far. (Starting rule: sight radius grows with the number of nearby friendly assets, up to a cap.)
- **Line of sight is blocked** by mountains, cliffs and dense foliage. You can't see over or through them.
- **High ground sees farther.** A unit on a ridge sees more than a unit in a valley.
- **Vision goes both ways.** If your unit sees an enemy, they usually see you. The exceptions are longer sight radius (a scout may spot you first) and cloaking (Simic).
- **Heads and torsos matter.** Simic Wide-Eye Heads and Azorious Sensor Spines extend sight (see `03-mech-design.md`). Hollow Hive-Eyes share vision across all nearby Hollow units.
- **Fliers** (Azorious) see over low terrain, but not through walls of rock.

### Fog Summary

| What | In vision | Outside vision |
|---|---|---|
| Terrain | Full color | Heavily grayed, still visible |
| Your own units and structures | Shown | Shown (you always know your own) |
| Enemy units and structures | Shown | **Hidden** |
| Seams | Shown, with current activity | Marked if discovered, with no activity shown |
| Wreckage | Shown | Hidden |
| Hollow | Shown | Hidden |

## Terrain Types

Every map is built from a mix of terrain types. Each helps and hinders the factions differently.

| Terrain | Description | Azorious | Rakdos | Simic |
|---|---|---|---|---|
| **Open ground** | Flat, clear, long sightlines | **Strong.** Long-range fire and free movement | Weak. Easy to kite | Weak. Nowhere to hide |
| **High ground** | Ridges, mesas, peaks | **Strong.** Better range and vision | Slow to climb | **Strong** with Gecko Legs |
| **Narrows** | Canyons, passes, chokepoints | Weak. Few lines of fire, little room to fly | **Strong.** Short range, crowded fights | Good for ambushes |
| **Dense cover** | Jungle, thickets, ruins | Weak. Blocked sight | Slow, but tough | **Strong.** Easy cloaking and ambush |
| **Lava and hazard** | Burning ground that damages units | Fliers cross it freely | **Resistant** (heat-built) | Hurts, with a few exceptions |
| **Cliffs and drops** | Steep edges and falls | Fliers ignore them | Slow, and cannot climb | **Strong.** Drop Legs and Gecko Legs ignore them |
| **Ruins and tunnels** | Old colony structures | Mixed | Mixed | Good cover |

### The Hollow

**The Hollow is suited to every terrain.** This is its native environment.

- No terrain slows or weakens it.
- Burrowing units cross mountains and rock by tunneling.
- It can appear from underground anywhere, which is what makes it so unpredictable.
- Terrain never favors anyone over the Hollow, so the only way to beat it is by working together or by out-planning it.

## The Planets

Each world has its own terrain, and its own feel.

### Cinder (Volcanic)

- **Terrain:** Basalt ridges, ash flats, lava rivers and a large central caldera. Rough and rugged, with lots of climbs and drops.
- **Strong for Rakdos** in the tight passes between ridges, and in the ground heated by lava.
- **Strong for Azorious** along the open ash flats and the rim of the caldera.
- **Strong for Simic** in the shadowed cracks and fissures.
- **Hazards:** Lava rivers damage ground units. Eruptions can temporarily block passes.
- **Magmore:** Rich seams, close to the lava.

### Verdis (Jungle)

- **Terrain:** Thick canopy, swamp flats, deep ravines and vine-covered cliffs. Lots of height changes. Sight is short almost everywhere.
- **Strong for Simic** in the thickets and on the cliffs.
- **Strong for Rakdos** in the narrow ravines and river crossings.
- **Strong for Azorious** over the canopy and along the river valleys.
- **Hazards:** Swamps slow ground units. Fog banks cut vision for everyone.
- **Magmore:** Many small seams, hidden in the jungle.

### Skyreach (Crystal Highlands)

- **Terrain:** **Very mountainous.** Tall mesas, crystal spires and deep canyons. Plenty of ups and downs, and open plateaus up high.
- **Strong for Azorious** on the plateaus and over the peaks.
- **Strong for Rakdos** in the canyons and passes between mesas.
- **Strong for Simic** on the cliff faces and among the spires.
- **Hazards:** Steep climbs wear down heavy units. Thin air and wind don't hurt anyone, but they slow flight a little.
- **Magmore:** Larger seams on high ground, and harder to defend.

### Ashfall (Dead Mining Colony)

- **Terrain:** Collapsed buildings, open pits, tailings piles and tunnels. A broken, mixed landscape.
- **Strong for Simic** in the ruins and tunnels.
- **Strong for Rakdos** in the tight streets and tunnels.
- **Strong for Azorious** from rooftops and across the open pits.
- **Hazards:** Unstable ground can collapse. Old equipment sometimes wakes the Hollow.
- **Magmore:** Depleted, but with scattered old seams.

### The Hollow Moon

- **Terrain:** Strange and alien. Grown ridges, bone-colored plains and glowing growths. The terrain looks like it's alive.
- **Fair for no one.** This is the Hollow's home, and the map is full of its nests.
- Reserved for late-game and finale content.

## Map Balance Rules

**No map is built for one faction.** Every map has terrain that favors each faction, and terrain that works against each of them.

1. **Every map has all three terrain types.** At least one large region each of open ground (Azorious), narrows (Rakdos) and dense cover (Simic).
2. **Start sites are fair.** Each of the 5 or 6 start sites has access to a mix of terrain within a similar distance, so no start site hands one faction an edge.
3. **Seams sit in every kind of terrain.** Every faction has to fight, sometimes, on ground that favors an enemy to get the Magmore it wants.
4. **Routes between regions.** Each faction must be able to reach every area. It may be slower or harder, but never impossible.
5. **The Hollow ignores the map.** Hollow nests are spread across the map, so no region is truly safe.
6. **Playtest by faction.** Each map should be tested with each faction at each start site. If one faction wins too often, the map is changed.

Random start positions help: since no one knows which site they'll get, nobody can design around it.

## Open Questions

- Should the camera rotate or zoom, or stay at one fixed angle?
- Should the map edge be black, or fade into a faint gray horizon?
- Does a faction count as eliminated when its structures are gone, or only when every unit is gone too?
- Is there a timer or a stalemate rule if two factions hide and the Hollow never finishes them?
- How does the campaign's final "Unite" ending (see `01-story.md`) work, if every planet is won by elimination?
- Is each planet one fixed hand-built map, or are maps generated from rules like these?
- How big should a map be, in screens or in minutes of travel?
- Can terrain change during the game (eruptions, collapses)?
- Do all five worlds appear in one campaign, or do skirmishes pick one at random?
- Is the Hollow Moon a normal map, or a special finale?
