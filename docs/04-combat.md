# Final Steel: Combat

*Working draft. See `03-mech-design.md` for the parts that drive the numbers below.*

## Core Principle: Combat Through Assignment

You command an army, you don't pilot it. **Combat is real-time and NPC-driven, and the player only gives orders.** There are no turns, no manual aiming, and no direct control of any combot's weapons.

You decide **where units go and what they are responsible for**. The combots work out how to carry it out.

> Protect this. Defend that. Attack here.

## The Real-Time Rule

**The game never slows down, and no one gets time to plan for free.**

- There is no slow motion, no tactical pause, and no "plan while time is stopped" mode.
- The player *can* pause the game, but **while paused, no action of any kind is allowed.** No orders, no queuing orders, no building, no changing stances, no truce offers. Pause is for stepping away, not for thinking.
- All decisions happen live. When the Hollow shows up mid-battle, the clock keeps running while you decide.

## What the Player Can Do

The player gives orders to individual units or to groups.

### Mining Bots

| Order | What it does |
|---|---|
| **Mine** | Send bots to a Magmore seam. They dig, haul to the nearest refinery, and repeat until the seam runs dry |
| **Salvage** | Send bots to a wreck on the battlefield. They pick up the part and carry it back to base (see Salvage and Captured Tech) |
| **Move** | Send bots to a position, such as pulling them back from danger |
| **Stop** | Cancel the current order |

### Combots and Infantry

Combots and infantry (trained at the Barracks, see `05-economy.md`) take the same orders.

| Order | What it does |
|---|---|
| **Move** | Go to a location. Units travel there and respond to threats on the way, based on their stance |
| **Attack** | Attack a target or an area. Units advance, find enemies, and fight until the area is clear |
| **Defend** | Guard a location or structure. Units hold the area and respond to anything that enters it |
| **Protect** | Guard a specific unit, such as a bot convoy or an artillery combot. Units stay near it and engage whatever threatens it |
| **Retreat** | Fall back to a chosen point and stop fighting |

### Stances

A stance sets how the combots behave when they aren't doing anything specific. It applies to a group.

| Stance | Behavior |
|---|---|
| **Aggressive** | Chase enemies that come into view |
| **Defensive** | Fight what comes near, but stay close to the assignment |
| **Hold** | Stay put, and only fire at what is in range |

### What the Player Cannot Do

- No manual targeting, aiming or firing.
- No turn-based phases or action points.
- No micro-controlling a single combot's cloak, charge or brace. Those fire automatically when the combot's AI judges them useful.

## How Combots Decide What to Do

Each combot runs a simple AI loop inside its current order:

1. **Look.** Detect enemies within its vision range. Heads and torsos change this range.
2. **Choose a target.** Pick based on threat, distance and its own role.
3. **Position.** Move to a good spot for its weapons.
4. **Fire.** Shoot or swing at the target.
5. **Check health.** If badly hurt, fall back toward a repair point or a friendly group (see Retreat Thresholds).

The assignment always wins when there is a conflict. A combot told to **protect** a convoy won't chase a distant enemy if it means leaving the convoy.

### Faction Behavior

The same orders look different depending on who carries them out.

| Faction | Behavior |
|---|---|
| **Azorious** | Keeps its distance, kites, and prefers high ground. Fliers circle and strafe. Backs off when enemies close in |
| **Rakdos** | Walks straight at the target. Ram Legs charge, Bulwark Legs brace when attacked, and Howitzer units plant and shell targets from behind the line |
| **Simic** | Stays cloaked until it's in position, then strikes. Drop Legs jump off cliffs to flank. Re-cloaks and moves when revealed |

This is where the faction fantasy lives. The player gives the same kind of order to each, but each army carries it out in its own way.

## Damage and Resolution

Combat resolves automatically, using the stats from the combot's parts.

- **Fire rate** and **damage** come from the weapon (for example, Azorious rifles fire fast and hit light, and the Rakdos axe swings slow and hits hard).
- **Accuracy** is affected by the head (Marksman Head adds accuracy) and the weapon. The Rakdos howitzer has poor accuracy by design.
- **Defense** reduces incoming damage. It is boosted by Rakdos heads and heavy torsos.
- **Armor and health** come from the torso. Weight from the legs affects speed.
- **Area damage** (such as the howitzer) hits everything near the impact point, including friendly units. Rakdos players need to keep their own units from standing in the way.
- **Fall damage** applies when combots drop from heights. Simic legs resist it.

## Salvage and Captured Tech

When a combot is destroyed, it may leave something behind. This is how factions steal each other's technology.

### Wreckage

- On destruction, there is a **chance** that **one intact part** survives. It is one of: the legs, one arm, the torso, or the head. Which part is random.
- Most kills leave nothing. The chance is tunable (a starting guess is around one in three), and it is higher for kills by area damage and lower for kills that fully vaporize the target.
- The surviving part stays on the battlefield as **wreckage**, visible to everyone nearby.
- Wreckage doesn't last forever. It **decays** after a few minutes, and the **Hollow consumes wreckage** it finds. That creates time pressure.

### Recovering Wreckage

- Only **mining bots** can pick up wreckage, using the **Salvage** order.
- The bot must carry the part **back to a friendly base**. If the bot dies on the way, the part drops where it died.
- Wreckage is a target. A salvage run into a hot zone needs a **Protect** escort, just like mining.
- Any faction can race for the same wreck, including the one that lost it. Rival bots can fight over it, and a faction can destroy a wreck to deny it.

### Captured Tech

- When a bot delivers a part to base, that faction **learns the part**. It is added to the build menu permanently, for use on any future combot.
- This includes the boost, weapon or special ability the part provides. A stolen Simic Static Hand, a Rakdos Bastion Head, or an Azorious Rapid Rifle becomes a real option for the capturing faction.
- Captured parts are **blueprints, not items**. Once learned, the faction can build as many as it can afford, paying the normal Magmore cost.
- If a faction already knows the part, the delivery is worth **Magmore scrap** instead.
- This is the only way to mix parts across factions.

### Hollow Wreckage

The Hollow fields its own combots (see `03-mech-design.md`), and they can leave salvage too.

- The chance of a Hollow combot leaving a part is **much lower** than for a faction combot. A starting guess is around one in ten or fewer.
- Hollow parts are **far more advanced and valuable** than any faction's. Their armor is tougher, and their arm cannons are very powerful.
- A captured Hollow part becomes a blueprint like any other, but it is a **top-tier** part. It may need research and costs more Magmore to build (see `05-economy.md`).
- Hollow wreckage is also a prize the other factions will fight over, in the middle of the Hollow's own attack.

### Why It Matters

- Fights become more than killing. A good win includes holding the ground long enough to grab the wreck.
- Factions can grow beyond their identity. A heavy Rakdos army that steals a Simic cloak head becomes something new.
- It rewards risk. Better wrecks come from the hardest fights, usually where the Hollow is also active.

## Cloaking and Detection

- A cloaked Simic combot can't be targeted by enemies who can't see it.
- Detection comes from Simic heads (Deep Scan, Echo) and from short-range sight. Other factions mostly find cloaked units by accident or with area damage.
- Attacking breaks the cloak, and the combot re-cloaks automatically when it is safe.

## Mining Bots in Combat

Bots are cheap and fragile. They don't fight back.

- Bots run to the nearest friendly group when attacked, if one is nearby.
- **Protect** is the most important order for bots. A harvester convoy with no escort will be picked off.
- Losing bots slows mining, which slows everything else. Raiding enemy bots is a real strategy.

## Retreat Thresholds

Each unit has a health threshold below which it falls back on its own.

- Rakdos combots have a **low** threshold. They fight on at low health.
- Azorious combots have a **high** threshold. They disengage and reposition early.
- Simic combots re-cloak and slip away when hurt.
- The player can override this with a hold order, if they accept the risk.

## The Hollow in Combat

The Hollow is a third party in every fight.

- It targets **everyone**. No faction is safe, and combots don't treat Hollow and enemy factions differently unless the player's orders say so.
- Hollow attacks arrive in waves that scale with the world's Disturbance level.
- It adapts. If a group beats it using the same tactic every time, the Hollow responds.
- When the Hollow appears mid-battle, the player must give new orders: **keep fighting**, or **offer a truce** and defend together.

### Truce Orders

- **Offer Truce:** a one-click proposal to the other faction in the fight. They accept, refuse or accept and betray, depending on their relationship with you and their personality.
- While a truce holds, units from both sides ignore each other and focus on the Hollow.
- A truce that is betrayed costs the betrayer a large reputation penalty.

## Interface Notes

- Select a unit or group, then right-click a location or target to give an order.
- Hotkeys for each order (Move, Attack, Defend, Protect, Retreat).
- A small icon over each group shows its current order and stance.
- A map overlay shows Disturbance, Magmore seams, wreckage and visible enemies.
- Orders can be queued during live play, so a group can go here, then there, then hold.
- Pausing blocks all actions. Whether the camera can still move while paused is an open question.

## Open Questions

- Can the camera pan while paused, or is the screen frozen?
- Should pausing be limited in multiplayer, if we add it?
- Do we want formations, or is group stance enough?
- Can a faction recover its own wrecks, for a partial refund?
- How many captured parts can a faction hold? Is there a cap or a research cost?
- How much should a combot's AI deviate from orders to survive?
- How big should a typical army be? (Affects UI and performance.)
- Do we need a way to set standing orders, such as "always defend this seam"?
