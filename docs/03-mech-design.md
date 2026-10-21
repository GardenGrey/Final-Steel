# Final Steel: Combot Design

*Working draft. Numbers are relative ratings (Low / Med / High) until we tune in the combat and economy docs.*

## The Build System

Every faction builds its **combot** from the same five slots. The slots are shared, so the interface is the same for everyone, but the parts in each slot are unique to the faction.

| Slot | What it does |
|---|---|
| **Legs** | Speed, movement type, load capacity, terrain handling |
| **Torso** | Armor, power, and any back-mounted systems |
| **Left Arm** | A weapon or tool |
| **Right Arm** | A weapon or tool (can differ from the left) |
| **Head** | A faction-flavored bonus: defense, accuracy, or perception |

Each slot has **three part options per faction**, so a faction has 3 x 3 x 3 x 3 x 3 build choices (arms are picked independently).

### Weight and Power

- Every part has a **weight**. Legs have a **load capacity**, and a build that exceeds it slows the combot down.
- The torso supplies **power**. Heavy weapons and special systems draw more of it.
- Heavier builds are tougher and slower. Light builds are fast and fragile.
- Part costs are paid in Magmore. Better parts unlock in tiers. (Costs and tiers are covered in the economy doc.)

### Head Bonuses

Each faction's heads give a bonus matching its identity:

| Faction | Head bonus |
|---|---|
| **Azorious** | Accuracy and sharpshooting |
| **Rakdos** | Defense |
| **Simic** | Perception and awareness (see farther into the map) |

---

## Azorious Combots: Speed and Flight

**Role:** Fast, mobile gunners. They strike from range, reposition, and strike again. Their rifles fire **faster** than the other factions' weapons but hit **lighter**.

### Legs

| Part | Movement | Notes |
|---|---|---|
| **Strider Legs** | Fast ground | Light and sturdy, the safe pick. High ground speed, Low capacity |
| **Jump-Jet Legs** | Short flight bursts | Hop over terrain and enemies. Med speed, Low capacity, limited fuel |
| **Skyframe Legs** | Full flight | Fly over everything and the fastest unit on the field. Cannot carry heavy parts, and is vulnerable to anti-air |

### Torsos

| Part | Notes |
|---|---|
| **Lattice Frame** | Lightest torso. Low armor, bonus to speed |
| **Fuel Cell Core** | Longer flight time and more power for weapons. Med armor |
| **Sensor Spine** | Extends weapon range and sight. Low armor |

### Arms (weapons)

| Part | Notes |
|---|---|
| **Rapid Rifle** | Very high fire rate, low damage per shot. Good sustained fire |
| **Longshot Rifle** | Longest range of any common weapon, medium fire rate, medium damage |
| **Twin Carbine** | Two-shot bursts, short cooldown, good against fliers |

### Heads

| Part | Bonus |
|---|---|
| **Marksman Head** | Big accuracy boost |
| **Rangefinder Head** | Accuracy boost at long range, and bonus weapon range |
| **Tracker Head** | Accuracy against fast or flying targets |

**Weakness:** Low armor and low damage per hit. A pinned or grounded Azorious combot dies quickly.

---

## Rakdos Combots: Tanky, Heavy and Slow

**Role:** Armored bruisers who carry a lot and hit hard at close range. They are slow but very hard to kill.

### Legs

| Part | Movement | Notes |
|---|---|---|
| **Pillar Legs** | Slow walker | Highest load capacity in the game. Low speed |
| **Ram Legs** | Charge | Slow, but can charge forward to close the gap. Med capacity |
| **Bulwark Legs** | Braced | Can plant in place for a large defense bonus, but cannot move while braced |

### Torsos

| Part | Notes |
|---|---|
| **Furnace Core** | High armor and high power. Heavy |
| **Bulwark Plate** | Highest armor. Low power, so limits weapon choices |
| **Howitzer Mount** | A back-mounted **howitzer**. See below. Med armor |

### Arms (weapons)

| Part | Notes |
|---|---|
| **Battle Axe** | Very high damage, slow swing |
| **Longsword** | Balanced damage, longer reach, faster swing |
| **Heavy Gauntlet** | Lower damage, but knocks enemies back. Good for pushing fliers and Simic units out of position |

### Heads

| Part | Bonus |
|---|---|
| **Bastion Head** | Big defense boost |
| **Warden Head** | Defense boost to nearby friendly combots |
| **Brace Head** | Defense boost while standing still or braced |

### The Howitzer

Rakdos's one ranged option, available only on the **Howitzer Mount** torso.

- **Fire rate:** Very low
- **Damage:** Very high, with area effect
- **Accuracy:** Poor. Shells land near the target, not on it
- **Role:** Zone denial, breaking up a group, and punishing slow or stationary targets
- Pairs well with Bulwark Legs, since a braced combot is steady and a steady combot is a better gun platform.

**Weakness:** Slow and easy to kite. Rakdos has no way to catch a flier, so it relies on its howitzer, allies and terrain.

---

## Simic Combots: Stealth, Terrain and Tricks

**Role:** Ambushers who use cloaking, terrain and disruption. They rarely win a straight fight, and they rarely have to.

Simic combots have a lizard-like feel: gecko, chameleon, and a bit of ambush predator.

### Legs

| Part | Movement | Notes |
|---|---|---|
| **Gecko Legs** | Wall-climbing | Climb steep terrain and cliffs, and take shortcuts others cannot |
| **Chameleon Legs** | Stealth mover | Move faster than normal while cloaked, but slower in the open |
| **Drop Legs** | Fall-proof | Take no damage from large drops. Can jump off cliffs to ambush |

All Simic legs **withstand large falls** better than any other faction's, and Drop Legs are immune to fall damage entirely.

### Torsos

| Part | Notes |
|---|---|
| **Cloak Core** | Full cloak. Longest cloak duration. Low armor |
| **Mimic Plating** | Adaptive skin. Slightly reduces enemy detection range even when uncloaked. Med armor |
| **Ghost Frame** | Low signature. Harder for sensors to lock on to. Lightest torso |

### Arms (stealthy weapons and tools)

| Part | Notes |
|---|---|
| **Static Hand** | A shock hand that stuns and stalls an enemy combot at close range. Low damage |
| **Silent Darts** | Quiet ranged weapon. Low damage, does not reveal the shooter |
| **Disruptor Claw** | Temporarily disables an enemy's special ability or sensors |

### Heads

| Part | Bonus |
|---|---|
| **Wide-Eye Head** | Big boost to vision range, so you see farther across the map |
| **Deep Scan Head** | Can see other cloaked units nearby |
| **Echo Head** | Briefly pings the area to reveal enemy positions |

### Cloaking Rules (first draft)

- A cloaked combot cannot be seen except at very short range or by detection abilities (such as Deep Scan or Echo).
- Cloak drains energy while active.
- **Attacking reveals you.** Silent Darts reveal you less than other weapons.
- Area damage, such as the Rakdos howitzer, can hit a cloaked target if it lands nearby.
- Cloak is the Simic equivalent of a shield. It buys time and position, not durability.

**Weakness:** Fragile when found. Simic needs scouting, patience and good timing.

---

## Hollow Combots: Alien Technology

**Role:** The Hollow is not a faction and isn't built by the player, but it fights with its own combots. They use the same five slots, and they're the strongest machines in the Reach. They are **tougher than any faction's armor**, and their arm cannons are **very powerful**.

Like the other factions, the Hollow has its own identity: **adaptation, burrowing and consuming**. Hollow parts are also **higher tier** than anything the corporations build (call it tier 4).

### Legs

| Part | Movement | Notes |
|---|---|---|
| **Skitter Legs** | Fast, adaptive | Quick across any terrain, and hard to pin down |
| **Burrow Legs** | Underground | Tunnels beneath the ground and emerges to ambush. Can't be targeted while underground |
| **Colossus Legs** | Heavy walker | Huge load capacity and very slow. Shakes the ground when it walks |

### Torsos

| Part | Notes |
|---|---|
| **Carapace Core** | **Toughest armor in the game.** Slow to damage and heavy |
| **Regen Core** | Slowly repairs itself, even in combat |
| **Devourer Core** | Heals by consuming wreckage and kills. Also removes salvage from the field |

### Arms (weapons)

| Part | Notes |
|---|---|
| **Resonance Cannon** | **Very powerful** arm cannon. High damage, moderate fire rate, long range |
| **Rend Claw** | Close-range slashes that strip armor |
| **Pulse Lance** | A piercing beam that hits everything in a line, including several combots at once |

### Heads

| Part | Bonus |
|---|---|
| **Hive-Eye** | Shares vision with every nearby Hollow unit. They always know where you are |
| **Adaptive Mind** | Builds resistance to the damage types used against it, which makes it the hardest to beat by using the same tactic repeatedly |
| **Disturbance Crown** | Boosts nearby Hollow units, and draws reinforcements as Disturbance rises |

### Hollow Salvage

- Hollow combots drop wreckage at a **much rarer rate** than the faction combots (see `04-combat.md`).
- A recovered Hollow part is the **most valuable** tech in the game. It can be learned and built by a faction, but costs more and may need research (see `05-economy.md`).
- A Hollow arm cannon on a Rakdos Juggernaut, or an Adaptive Mind head on an Azorious sniper, would be a big swing in any fight.

**Weakness:** None in the traditional sense, but the Hollow is blind to nothing and slow to react to a united front. Its power scales with Disturbance, so mining less makes it weaker.

---

## Example Builds

| Name | Faction | Build | Playstyle |
|---|---|---|---|
| **Gunship** | Azorious | Skyframe Legs, Fuel Cell Core, Rapid Rifle x2, Marksman Head | Strafes from the air and shreds soft targets |
| **Sniper** | Azorious | Strider Legs, Sensor Spine, Longshot Rifle x2, Rangefinder Head | Holds a ridge and picks off targets from far away |
| **Juggernaut** | Rakdos | Pillar Legs, Furnace Core, Battle Axe x2, Bastion Head | Walks into the enemy line and refuses to die |
| **Artillery** | Rakdos | Bulwark Legs, Howitzer Mount, Longsword, Brace Head | Braces in place and lobs shells while a friend guards it |
| **Assassin** | Simic | Drop Legs, Cloak Core, Static Hand x2, Echo Head | Drops from a cliff, shocks a target and disappears |
| **Scout** | Simic | Gecko Legs, Ghost Frame, Silent Darts, Wide-Eye Head | Climbs high and gives the team eyes on the whole map |

## Balance Notes (to test later)

- Azorious range and speed should win over Rakdos, but only if they have room to retreat.
- Rakdos should beat Simic if it catches them, and area damage helps.
- Simic should beat Azorious by sneaking close to fliers, but should lose if revealed.
- Heavy builds should get weaker the more weight they carry, so the choice is meaningful.
- The Rakdos howitzer must be dangerous but unreliable, so players are afraid of it but not bound to it.

## Open Questions

- Captured parts from salvage (see `04-combat.md`) let a faction use another faction's parts. Should they have any penalty, such as higher cost or lower efficiency?
- Should each faction have a fourth, tier-three "signature" part per slot?
- Do arms need a left/right distinction, or can any arm go on either side?
- How many combots can a player field at once?
