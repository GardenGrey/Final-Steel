# Final Steel: Story

*Working draft. Names are placeholders and live in one place in the code so they can be swapped.*

## Premise

The Sable Reach is a solar system with five worlds and no government. Three mega-corporations won the right to mine it after the old Terran Charter collapsed, and the Charter's last clause is the only law left: **whoever holds the most ground when the audit comes, owns the system.** The audit is in 12 years. Nobody trusts anyone.

## Magmore: The Only Resource

**Magmore** is a superheated ore found in seams across every world in the Reach. It is everything: it powers mechs, builds armor, forges weapons, and pays for upgrades. There is one resource, so there is one thing worth fighting over.

- Magmore sits in **seams** scattered around each planet's map, some near a company's start, many in the open.
- Mining is done by **bots**: unmanned harvesters that dig a seam and haul the ore back to a refinery. They are cheap, slow and fragile.
- A seam has a limited amount of ore. Contested seams are worth the most and cost the most to hold.
- Two companies sending bots to the same seam is how most battles start.

## The Hollow

Under the surface of every world sleeps an alien intelligence the corporations call **the Hollow**. It is not a faction. It does not negotiate, ally, or take sides. It wakes in response to extraction.

**The more Magmore is mined on a world, the more aggressive the Hollow becomes there.**

- Each world has a **Disturbance** level that rises with the total mining rate on that world, by everyone combined.
- Higher Disturbance means bigger and more frequent Hollow attacks.
- It attacks every faction, including whoever is mining quietly.
- It fights with **its own combots**: armored alien war machines that are tougher and hit harder than anything the corporations build. (See `03-mech-design.md`.)
- Hollow combots are rarely salvageable, but when one leaves a part behind, it's the most advanced technology in the Reach.
- It learns. Units that beat it once will not beat it the same way twice.
- Disturbance fades slowly if mining stops, so there's a real choice between mining hard and mining carefully.

The corporations know about the Hollow. They each hope the others take the losses first.

## The Core Decision

This is the heart of the game. A fight over a seam is going fine, and then the Hollow arrives. Now you choose:

1. **Keep fighting.** Press the attack and let the Hollow hit everyone. You might win the seam, or lose everything to a bigger threat.
2. **Team up.** Offer a truce, hold the line together, and sort out the seam afterward. The others may accept, refuse, or accept and betray you.

Every battle can turn into this choice, and the Hollow makes sure you don't get to settle things cleanly.

## The Planets

| World | Type | Starting owner | Notes |
|---|---|---|---|
| **Cinder** | Volcanic | Rakdos | Rich seams, tight chokepoints |
| **Verdis** | Jungle | Simic | Dense cover, many small seams |
| **Skyreach** | Crystal highlands | Azorious | Open ground, long sightlines |
| **Ashfall** | Dead mining colony | Contested | Depleted, but the ruins hold old seams |
| **The Hollow Moon** | Unknown | No one | The Hollow's heartland |

*The starting owners above are for the campaign. In regular games, every map has at least 5 or 6 possible start sites and each faction begins at a random one. See `05-economy.md`.*

## Campaign Structure

You choose one company. Each has its own story, but the arc has the same three acts.

**Act I: The Scramble.** Claim your home world, learn to build and fight, and stake the first seams. Contact with the other companies is light. The Hollow is a rumor, and early encounters feel like wildlife.

**Act II: The Fracture.** The easy seams run dry and Disturbance climbs. Fights over seams become routine, and the Hollow starts crashing them. A broken truce or broken alliance changes the map.

**Act III: The Audit.** The Hollow surfaces in force. The final act is a choice between:

1. **Unite.** Hold a three-company alliance together long enough to seal the Hollow. This is hardest to achieve and gives the best ending.
2. **Take the throne.** Let the others fall to the Hollow and claim the survivors' worlds.
3. **Walk away.** Evacuate and leave the Reach to the Hollow. This is the smallest ending and a fair option if the war is lost.

## Diplomacy

Each company has a **relationship** with you from -100 to +100. It moves based on your choices.

| State | Range | Effect |
|---|---|---|
| War | below -50 | Attacks on sight |
| Rivalry | -50 to -10 | Border raids, will contest your seams |
| Neutral | -10 to +10 | Leaves you alone unless you crowd them |
| Truce | +10 to +50 | Won't attack, shares sight of the Hollow |
| Alliance | above +50 | Joint defense, may share seams |

Truces and alliances are what you reach for when the Hollow shows up. Betraying one costs more reputation than never making one. Every company remembers.

## Tone

Industrial and tense, with big machines and small, human stakes. Corporate doublespeak on the surface and fear underneath. Not grimdark, and with room for dry humor.

## Open Questions

- Does the player pick a company, or lead a fourth independent contractor? (Currently: pick one.)
- How many missions per act?
- Is Disturbance visible to the player as a number, a map overlay, or only through the Hollow's behavior?
- Can a truce be offered mid-battle with one click, or does it take time to negotiate?
