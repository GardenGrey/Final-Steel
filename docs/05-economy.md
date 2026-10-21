# Final Steel: Economy and Bases

*Working draft. Costs and rates are relative until we tune in playtests. See `04-combat.md` for orders and `03-mech-design.md` for parts.*

## The Loop

**Mine Magmore, refine it, build more, mine more.** The whole economy is one loop with one resource, and the faster you run it, the faster you grow. The cost of running it faster is more Disturbance, more rivals at your seams, and more Hollow attacks.

```
Seam --> Mining bot --> Refinery --> Magmore stockpile --> Build (bots, structures, combots, infantry, research)
  ^                                                                     |
  +------------------ more bots, more seams, more Disturbance <---------+
```

## Starting a Game

- **Random start.** Every game begins at a random spot on the map. Each map has **at least 5 or 6 possible start sites**, and the three factions are placed on different sites at random.
- Unused start sites stay **vacant**. They're open to anyone who finds them, and each is a ready-made place to build a second base.
- Everything starts in **fog of war**. You know your own base and the ground around it, and nothing else. Exploring is part of the early game.
- **The Hollow starts dormant** everywhere, and wakes as mining raises Disturbance.

## The Starter Reserve

Every start site sits on a **small reserve of Magmore**. It's enough to get going, but not enough to win.

- Your first bots mine this reserve at a **slow rate**, and you build slowly at first.
- The reserve is **finite**. It runs low as the game goes on, which pushes you out to find more.
- As you explore, you find more **seams** (veins of Magmore) around the map. Richer seams are farther from home and more likely to be contested.

## Base Structures

Every base is built from the same set of structures. Each faction's versions look and behave in its own style.

| Structure | What it does |
|---|---|
| **Droid Factory** | Builds mining bots. More factories means more bots, and more bots means more income |
| **Mech Station** | Builds combots from the parts you've unlocked. More stations means faster army production |
| **Barracks** | Trains infantry |
| **Refinery** | Bots deliver ore here, and it becomes usable Magmore. Your core structure. Losing it stops income |
| **Research Facility** | Unlocks higher tiers of parts, and studies captured tech (see Research) |

### Growth

You start with one of each core structure, or close to it. Then you grow.

- **The more you mine, the faster you can expand.** Magmore income pays for new structures, so a strong early economy snowballs.
- You can build **more Droid Factories, Mech Stations, Barracks and Research Facilities** as you can afford them.
- Each structure costs Magmore and takes time to build. Costs go up slightly with each additional structure of the same type, to prevent runaway growth. (Numbers to be tuned.)
- Structures can be attacked, and a factory or station lost in a raid is a real setback.

## Mining

### How a Bot Works

1. You give a bot the **Mine** order on a seam.
2. It goes to the seam and digs until it's carrying a full load.
3. It hauls the ore to the nearest **Refinery** and drops it off.
4. It goes back to the seam and repeats until the seam runs out.

Bots don't fight back, and the trip between the seam and the refinery is where most bots die. See **Protect** in `04-combat.md`.

### Faction Mining Styles

All three factions mine, but each does it differently. The differences are small enough to balance, but big enough to feel.

| Faction | Bot style | Result |
|---|---|---|
| **Azorious** | Light, fast bots | Move **faster**, but carry **less** per trip. Good at grabbing far seams quickly and bad at heavy hauling |
| **Rakdos** | Heavy, tough bots | Carry **more ore per bot**, but move slowly and cost more. Fewer trips, bigger loads |
| **Simic** | Cloaked bots | Can **move around the map more freely under cloak**, slipping past enemies and the Hollow to reach distant seams. They're visible while digging, and stealth doesn't protect them once spotted |

### Seams

- Each seam holds a limited amount of Magmore.
- Seams vary in size. Big seams are worth more and usually sit in harder places.
- A seam that runs dry stays empty. The map doesn't refill.
- **Mining raises Disturbance.** A world's Disturbance rises with the combined mining of everyone on it. More bots on more seams means a more aggressive Hollow.

### Contested Mining

- Two factions at the same seam means a fight, usually over bots and escorts.
- Killing enemy bots is a real way to win. It costs them income and time.
- Taking a seam by force, then holding it, is how a faction grows past its rivals.

## Infantry

The **Barracks** trains infantry: cheap foot units that fill the gap between bots and combots.

- Infantry take the same orders as combots (Move, Attack, Defend, Protect, Retreat) and obey the same stances.
- They are cheaper, weaker and quicker to build than combots, and good for **escorting bots** and **holding seams**.
- Each faction has its own flavor:

| Faction | Infantry |
|---|---|
| **Azorious** | Rifle troopers. Fast-firing, light, good at range |
| **Rakdos** | Shock troops. Tough, close-range, and good in numbers |
| **Simic** | Saboteurs. Can cloak briefly, and good at disruption |

(Specific unit stats to be tuned.)

## Research

The **Research Facility** gates how strong your army can get.

- **Tiers:** parts unlock in tiers (1, 2, 3). Higher tiers cost more Magmore and research time, and are better in every way.
- **Captured tech:** parts delivered through salvage (see `04-combat.md`) are added to your build menu. Some may need research before they can be built, especially Hollow tech.
- More Research Facilities mean faster research, and each one costs Magmore to build and run.

## Salvage Economy

Salvage is the second way to grow, alongside mining.

- A recovered part you don't already know becomes a new blueprint.
- A recovered part you already know is worth **Magmore scrap**.
- Hollow wreckage is the most valuable, and the rarest. See the Hollow sections in `03-mech-design.md` and `04-combat.md`.

## Pacing (rough targets)

| Stage | What it feels like |
|---|---|
| **Early** | A slow start on the starter reserve. A few bots, one factory, light scouting |
| **Middle** | New seams found, a second or third factory, first clashes at contested ground. Disturbance rises |
| **Late** | A big economy and a big army, but the Hollow is strong now and the map is running out of Magmore |

## Open Questions

- How many structures of each type can a base have?
- Can bases be built at vacant start sites, or only near seams?
- Is there a maximum army or bot count?
- Does losing the Refinery stop income entirely, or can bots haul to a second one?
- Should refined Magmore be stored in a cap, so stockpiles can't grow without limit?
- How fast should the starter reserve run out?
