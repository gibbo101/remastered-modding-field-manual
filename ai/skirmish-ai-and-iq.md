---
title: The skirmish AI and its IQ levels
description: "How Red Alert's computer player works in a Remastered skirmish (IQ levels from rules.ini's [IQ] section, difficulty as a stat handicap that stock skirmish never varies, the urgency checks and weighted dice that choose what to build, the attack timer) and the stock bugs and gaps every DLL mod inherits, from missing ships and superweapons to targets picked through the shroud, confirmed in EA's source, with what one mod did about them."
tags: [ai, skirmish, iq, difficulty, rules-ini, dll]
holds_for: Steam build 21590013
status: verified
unproven: [the stock AI's behaviour on native Windows beyond what the source shows; how much each of one mod's changes helps against a human at Hard (measured AI against AI only)]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# The skirmish AI and its IQ levels

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod changes how computer players build, fight or scale with difficulty, or when its AI behaves oddly in
skirmish and you need to know whether that's your code or Red Alert's. A mod that leaves the AI alone still
inherits the stock gaps below.

## Why the skirmish AI is thin

Red Alert's AI was written for the campaign, where each mission hands it a base layout and scripted teams. A
Remastered skirmish runs as `GAME_GLYPHX_MULTIPLAYER` (set in EA's `DLLInterface.cpp`), so every campaign path gated
on `Session.Type == GAME_NORMAL` is skipped. For example, `AI_Building` only builds from the scenario's base list
in a normal game. What's left is a thinner fallback that chooses what to build on the fly, and most of the gaps
below live there.

## IQ levels

Each house has an `IQ`, and `rules.ini`'s `[IQ]` section sets the level at which each behaviour switches on
(`RulesClass::IQ` in `RULES.CPP`). Stock values:

| Key | Stock level | What it switches on, and where it's tested |
|---|---|---|
| `MaxIQLevels` | 5 | The highest IQ. |
| `Production` | 5 | The house starts building its base and units on its own (`HOUSE.CPP`). |
| `SuperWeapons` | 4 | Gets the GPS satellite, Iron Curtain, nuke and Chronosphere from their buildings. |
| `GuardArea` | 4 | New units start in guard-area mode rather than guard. |
| `ContentScan` | 4 | Weighs what a transport carries when picking targets. |
| `Aircraft` | 4 | Replaces lost aircraft (`AI_Aircraft`). |
| `Scatter` | 3 | Scatters from incoming fire. |
| `AutoCrush` | 2 | Drives over infantry it can crush. |
| `Harvester` | 2 | Replaces lost harvesters. |
| `RepairSell` | 1 | Repairs or sells damaged buildings. |

**In a stock skirmish every AI gets `IQ = MaxIQ`** (`GlyphX_Assign_Houses`, `DLLInterface.cpp`), so all of the
above is on whatever the difficulty. IQ is a lever the stock skirmish never uses.

`[IQ]` also has `SellBack`, but despite its section it isn't an IQ check: a damaged building sells itself when the
house's **tech level** is at least `SellBack` (`BuildingClass::AI`, `BUILDING.CPP`), not its IQ.

> [!WARNING]
> **Lowering IQ can stop an AI building at all.** A computer house only starts base building if
> `IQ >= Production` (or a trigger has set it building), and stock `Production` is 5. Give an AI IQ 3 for an easy
> difficulty and it sits there with its MCV. Lower `Production` in your `rules.ini` along with it.

## Difficulty

Difficulty in Red Alert is a **stat handicap**. `Assign_Handicap` (`HOUSE.CPP`) multiplies a house's firepower,
ground and air speed, armour, rate of fire and cost from `rules.ini`'s `[Easy]`, `[Normal]` and `[Difficult]`
sections, and sets its repair and build delays.

**In a stock Remastered skirmish the lobby's difficulty changes nothing.** The DLL sets up skirmish and LAN houses
in `GlyphX_Assign_Houses`, which gives every house, human and computer, `Assign_Handicap(Scen.Difficulty)`.
`Scen.Difficulty` starts at Normal, and the only thing that changes it, `CNC_Set_Difficulty`, acts only in a
campaign (`GAME_NORMAL`). So every skirmish house plays at Normal. `CompEasyBonus` is read only by the old
`Assign_Houses`, which the Remastered DLL no longer calls. To make the lobby's choice count, the DLL has to read
each AI's pick itself: see [Per-AI lobby difficulty](../maps-and-lobby/per-ai-lobby-difficulty.md).

## How it chooses what to build

`Expert_AI` (`HOUSE.CPP`) runs a list of checks, each returning an **urgency** (none, low, medium, high, critical):
build power, build defence, build income, fire sale, build offence, raise money, raise power, lower power, attack.
`AI_Building`, `AI_Unit`, `AI_Infantry` and `AI_Aircraft` then pick one item per category, kept in the house as
`BuildUnit`, `BuildInfantry` and so on. Each factory asks the house what to build next (`Suggest_New_Object`), and
the choice is cleared only when one is delivered, so with several factories of a kind the AI can build in parallel
in a way a human player doesn't.

The skirmish picks are weighted dice, not plans:

- **Vehicles** (`AI_Unit`): every buildable type except the harvester gets weight 20 if it has a primary weapon and
  1 if not, and one is drawn at random. An MCV or a minelayer is a weight-1 roll among weight-20 tanks, so a
  computer player that loses its construction yard rarely gets another.
- **Infantry** (`AI_Infantry`): rifleman 3, grenadier 5, rocket soldier 2, flamethrower 5, one engineer at a time
  once it has more than five infantry, and one Tanya. **Every other infantry type is weight 0**, so the skirmish AI
  never trains spies, thieves, dogs or medics.

## How it attacks

`Check_Attack` rates an attack critical once the house's `Attack` timer reaches zero (never in the first minute).
`AI_Attack` then rolls: one time in three it attacks, and every armed unit and aircraft, plus engineers, has a 75%
chance of being set to `MISSION_HUNT`. The other two times nothing attacks, and each unit on guard-area duty has a
20% chance of shuffling to a new spot. Either way the timer restarts at `AttackInterval` × half a minute to two
minutes (stock `[AI]` `AttackInterval=3`); the first comes after `AttackDelay` × the same (stock 5).

So there is no wave: whatever is armed at that moment goes, each unit hunting on its own, however large or small
the army. A house with no buildings left always attacks.

## Stock bugs and gaps

Each confirmed in EA's released source:

| Problem | Where | Effect |
|---|---|---|
| **The skirmish AI never builds ships.** All of `AI_Vessel`'s logic sits inside `if (Session.Type == GAME_NORMAL)`. | `HOUSE.CPP` | No navy at all, on any map. |
| **Its building list stops short.** `AI_Building`'s skirmish list has no shipyard, sub pen, missile silo, Iron Curtain or Chronosphere, and its repair bay entry is compiled out (`#ifdef OLD`). | `HOUSE.CPP` | No naval yards, no superweapon buildings, and damaged vehicles never repair. |
| **The radar dome is only built against an air threat.** In skirmish, `AI_Building` queues `STRUCT_RADAR` only inside its air-defence block, which runs when an enemy owns aircraft. | `HOUSE.CPP` | No radar, so no tech centre and nothing that needs one, unless the player builds aircraft first. |
| **Half the superweapons have no AI trigger.** `Super_Weapon_Handler` calls `Special_Weapon_AI` for the nuke, spy plane, parabombs and paratroopers only; nothing fires the Iron Curtain, Chronosphere or sonar pulse for a computer player. Parabombs are enabled only in `GAME_NORMAL`, for every house. | `HOUSE.CPP` | A computer player given those buildings never uses them. Nobody, human or computer, gets parabombs in a skirmish. |
| **Superweapon aim can't serve the Iron Curtain or Chronosphere.** `Special_Weapon_AI` aims at the enemy building of highest `Value` (each candidate has a 90% chance of being considered). Fired there, the Iron Curtain would shield the enemy's building, and the Chronosphere moves only allied units. `Place_Special_Blast` also picks the object in the target cell by the last mouse position (`Keyboard->MouseQX`). | `HOUSE.CPP`, `CELL.CPP` (`Cell_Techno`) | Adding the missing calls alone isn't enough: those two need their own target choice. |
| **Target picks ignore the shroud outside a campaign.** `Evaluate_Object`'s "not visible, bail" test runs only in `GAME_NORMAL`, and `Special_Weapon_AI` looks at every enemy building on the map. | `TECHNO.CPP`, `HOUSE.CPP` | A computer player picks targets, and aims nukes, at things it has never seen. |
| **Deploy abilities are never used.** Chrono tank teleports, MAD tank quakes and minelayer mines all run from `MISSION_UNLOAD`, and outside a campaign's team scripts nothing gives a computer unit that mission (the MCV is the one exception, in `Mission_Guard`). | `UNIT.CPP`, `TEAM.CPP` | Those units drive and shoot like tanks, or wander unarmed. |
| **Four urgency checks and five build actions are stubs.** `Check_Build_Defense`, `Check_Build_Engineer`, `Check_Build_Income` and `Check_Build_Offense` always return `URGENCY_NONE`; `AI_Build_Defense`, `AI_Build_Engineer`, `AI_Build_Income`, `AI_Build_Offense` and `AI_Build_Power` always return `false`. | `HOUSE.CPP` | Those strategies never drive a decision. Power is the one rated but not acted on. |
| **The power check's `|`.** "Under attack, so power is urgent" tests `BScan \| STRUCTF_CHRONOSPHERE`, which is always true. | `HOUSE.CPP`, `Check_Build_Power` | Any threatened house rates power as high urgency. |
| **Target choice keeps the last candidate, not the best.** In `Greatest_Threat`'s ring scan, a candidate sets `bestobject` but never updates `bestval`, which stays at its starting -1 (or the best aircraft's score). | `TECHNO.CPP` (extended ASCII: use `grep -a`) | Every valid target replaces the last, so a unit attacks the last one the scan reaches, not the most valuable. |
| **Harvester bugs:** the "ore is short" latch that never resets, an idle harvester's overwritten order, and no replacement harvesters on Hard. See [Harvesters](harvesters.md). | `UNIT.CPP`, `HOUSE.CPP` | The AI's economy can stop for good. |
| **The factory pool is small.** `[Maximums]` `Factory=` defaults to 20 in code (stock `rules.ini` raises it to 32), and every factory in production takes one. | `RULES.CPP`, `INIT.CPP` | Late in a big game, production silently stops. See [Raising the limits](../units/raising-the-limits.md). |

## What a mod can do about it

These are methods one mod uses, each a DLL change:

- **Make difficulty behavioural, not a stat bonus.** Map each difficulty to an IQ and to which behaviours run
  (scouting, attack-move waves, threat-aware defences), and leave firepower and cost alone.
- **Build through a primary factory,** one order per category, as a human does. This removes the parallel-factory
  advantage and stops the factory pool running dry.
- **Fair fog.** Route the AI's target picks, superweapon aim and attack destinations through what its own house has
  seen, instead of the whole map.
- **Fix the bugs above,** and queue the radar dome once the base has power, a refinery, a barracks and a factory.
- **Keep the stock AI one switch away.** See [A player settings page](../structuring/player-settings-page.md): its
  "classic AI" switch puts every change back to EA's code path.

## How it was verified

- **IQ and difficulty:** EA's `RulesClass::IQ`, every use of each IQ value (`HOUSE.CPP`, `BUILDING.CPP`,
  `UNIT.CPP`, `INFANTRY.CPP`, `VESSEL.CPP`, `TECHNO.CPP`), the skirmish house set-up in `GlyphX_Assign_Houses`
  (`DLLInterface.cpp`: `IQ = Rule.MaxIQ`, `Assign_Handicap(Scen.Difficulty)`), `Scen.Difficulty`'s Normal default
  (`ScenarioClass`'s constructor), `Set_Scenario_Difficulty`'s `GAME_NORMAL` gate and `CNC_Set_Difficulty`, the
  unused `Assign_Houses` that reads `IsCompEasyBonus` (`SCENARIO.CPP`), `SellBack`'s tech-level test, a working mod's
  DLL, which keeps the same `Assign_Handicap(Scen.Difficulty)` call, and the stock `rules.ini` read from `REDALERT.MIX`
  (`[IQ]`, `[Easy]`, `[Normal]`, `[Difficult]`, `[AI]`).
- **The build picks and attacks:** `AI_Unit`'s and `AI_Infantry`'s skirmish weights, `Check_Attack`, `AI_Attack` and
  the `Attack` timer's two resets, each in EA's `HOUSE.CPP`; `AttackInterval` and `AttackDelay` in `RULES.CPP` and the
  stock `rules.ini`.
- **The bugs:** each line in EA's source, as listed (`AI_Vessel`'s `GAME_NORMAL` gate, `AI_Building`'s full list,
  the four `Special_Weapon_AI` calls, the parabomb gate, `Evaluate_Object`'s visibility test, every
  `MISSION_UNLOAD` assignment). A working mod's problem inventory found them, and its code fixes most of them (the
  ring scan's `bestval`, the radar dome, ships and shipyards, the repair bay, parabombs, fog in target and
  superweapon picks). **AI Boost**, an independent mod, adds the missing naval yards, superweapon buildings,
  Iron Curtain and Chronosphere calls, and spy, thief, chrono tank and MAD tank use, which agrees with each gap.
- **The `Production` trap:** EA's base-building gate in `HouseClass::AI`, stock `Production=5`, and a working mod
  that lowers it to 3 so its easiest AI still builds.

**Credit:** several of the methods above are ported from **AI Boost 3.2** by Bast75 and xXMini FrankiXx (GPL v3),
including primary-factory production, the share of the army sent per attack, and scatter on launch.

> [!TIP]
> **In Tiberian Factions**
>
> TF maps lobby difficulty to IQ (Easy 3, Medium 4, Hard 5) and to behaviours. Easy builds and fights but scouts
> lazily and never fires superweapons. Medium and Hard attack in staged attack-move waves and place defences against
> the threats they've seen, and Hard scouts actively. It never touches firepower or cost. Its AI also builds navies
> and ferries armies over water, which the stock skirmish AI never does.
