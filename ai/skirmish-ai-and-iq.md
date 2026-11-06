---
title: The skirmish AI and its IQ levels
description: "How Red Alert's computer player works in a Remastered skirmish (IQ levels from rules.ini's [IQ] section, difficulty as a stat handicap, the urgency checks that choose what to build) and the stock bugs and gaps every DLL mod inherits, confirmed in EA's source, with what one mod did about them."
tags: [ai, skirmish, iq, difficulty, rules-ini, dll]
holds_for: Steam build 21590013
status: verified
unproven: [the stock AI's behaviour on native Windows beyond what the source shows; how much each TF change helps against a human at Hard (TF has measured AI-against-AI only)]
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
| `SuperWeapons` | 4 | Fires its superweapons. |
| `GuardArea` | 4 | New units start in guard-area mode rather than guard. |
| `ContentScan` | 4 | Weighs what a transport carries when picking targets. |
| `Aircraft` | 4 | Replaces lost aircraft (`AI_Aircraft`). |
| `Scatter` | 3 | Scatters from incoming fire. |
| `AutoCrush` | 2 | Drives over infantry it can crush. |
| `Harvester` | 2 | Replaces lost harvesters. |
| `SellBack` | 2 | Sells buildings. |
| `RepairSell` | 1 | Repairs or sells damaged buildings. |

**In a stock skirmish every AI gets `IQ = MaxIQ`** (`SCENARIO.CPP`), so all of the above is on whatever the
difficulty. IQ is a lever the stock skirmish never uses.

> [!WARNING]
> **Lowering IQ can stop an AI building at all.** A computer house only starts base building if
> `IQ >= Production` (or a trigger has set it building), and stock `Production` is 5. Give an AI IQ 3 for an easy
> difficulty and it sits there with its MCV. Lower `Production` in your `rules.ini` along with it.

## Difficulty

Stock difficulty is a **stat handicap**. `Assign_Handicap` (`HOUSE.CPP`) multiplies each house's firepower, ground
and air speed, armour, rate of fire and cost from `rules.ini`'s `[Easy]`, `[Normal]` and `[Difficult]` sections, and
sets its repair and build delays. With more than one human and `CompEasyBonus` on, the computer's difficulty drops a
step. The launcher hands the DLL only one difficulty for all AIs; for each AI's own lobby setting, see
[Per-AI lobby difficulty](../maps-and-lobby/per-ai-lobby-difficulty.md).

## How it chooses what to build

`Expert_AI` (`HOUSE.CPP`) runs a list of checks, each returning an **urgency** (none, low, medium, high, critical):
build power, build defence, build income, fire sale, build offence, raise money, raise power, lower power, attack.
`AI_Building`, `AI_Unit`, `AI_Infantry` and `AI_Aircraft` then pick one item per category, kept in the house as
`BuildUnit`, `BuildInfantry` and so on. Each factory asks the house what to build next (`Suggest_New_Object`), and
the choice is cleared only when one is delivered, so with several factories of a kind the AI can build in parallel
in a way a human player doesn't.

## Stock bugs and gaps

Each confirmed in EA's released source:

| Problem | Where | Effect |
|---|---|---|
| **The skirmish AI never builds ships.** All of `AI_Vessel`'s logic sits inside `if (Session.Type == GAME_NORMAL)`. | `HOUSE.CPP` | No navy at all, on any map. |
| **The radar dome is only built against an air threat.** In skirmish, `AI_Building` queues `STRUCT_RADAR` only inside its air-defence block, which runs when an enemy owns aircraft. | `HOUSE.CPP` | No radar, so no tech centre and nothing that needs one, unless the player builds aircraft first. |
| **Two of the urgency checks are stubs.** `Check_Build_Defense` and `Check_Build_Offense` always return `URGENCY_NONE`. | `HOUSE.CPP` | Those strategies never drive a decision. |
| **The power check's `|`.** "Under attack, so power is urgent" tests `BScan \| STRUCTF_CHRONOSPHERE`, which is always true. | `HOUSE.CPP`, `Check_Build_Power` | Any threatened house rates power as high urgency. |
| **Target choice keeps the last candidate, not the best.** In `Greatest_Threat`'s area scan, a better target sets `bestobject` but never updates `bestval`. | `TECHNO.CPP` (extended ASCII: use `grep -a`) | Units attack whatever scored above the first candidate last, not the most valuable target. |
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
  `UNIT.CPP`, `INFANTRY.CPP`, `VESSEL.CPP`, `TECHNO.CPP`), the skirmish house set-up in `SCENARIO.CPP`
  (`IQ = Rule.MaxIQ`, `Assign_Handicap`, `IsCompEasyBonus`), and the stock `rules.ini` read from `REDALERT.MIX`
  (`[IQ]`, `[Easy]`, `[Normal]`, `[Difficult]`).
- **The bugs:** each line in EA's source, as listed (`AI_Vessel`'s `GAME_NORMAL` gate included). A working mod's problem inventory found them, and its code
  fixes them.
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
