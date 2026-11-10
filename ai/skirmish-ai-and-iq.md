---
title: The skirmish AI and its IQ levels
description: "How Red Alert's computer player works in a Remastered skirmish (IQ levels from rules.ini's [IQ] section, difficulty as a stat handicap that stock skirmish never varies, the urgency checks and weighted dice that choose what to build, the attack timer) and the stock bugs and gaps every DLL mod inherits, from missing ships and superweapons to targets picked through the shroud, no gang-up, no threat map, empty teams and an enemy pick that almost never picks, confirmed in EA's source, with what Tiberian Factions did about them."
tags: [ai, skirmish, iq, difficulty, rules-ini, dll]
holds_for: Steam build 21590013
status: verified
unproven: [the stock AI's behaviour on native Windows beyond what the source shows; how much each of Tiberian Factions' changes helps against a human at Hard (measured AI against AI only); the chosen enemy staying unset in play (read from code and not watched)]
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

`[IQ]` also has `SellBack`, but despite its section it isn't an IQ check: it's compared with the house's **tech
level** (`BuildingClass::Repair_AI`, which `BuildingClass::AI` calls, `BUILDING.CPP`), not its IQ. A computer's
damaged building sells itself only when all of these hold: the house has `RepairSell` IQ, the building could be
repaired but the house has less money than `[AI]` `CreditReserve` (stock 100), an enemy has hit it, the tech level
is at least `SellBack` and beats a `Random_Pick(0, 50)` roll, it's below `ConditionRed` (25%), it isn't the
construction yard and has no trigger, and, in a campaign, the scenario allows selling.

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

`Expert_AI` (`HOUSE.CPP`) runs ten strategies (`STRATEGY_*` in `DEFINES.H`), each a check returning an
**urgency** (none, low, medium, high, critical) and an action: build power, build defence, build income, fire sale,
build engineer, build offence, raise money, raise power, lower power, attack. It then runs the action of every
strategy rated low or above, the most urgent first. EA's comment says it stops after the first urgency level that
acts, but the code never checks its `acted` flag, so every rated strategy acts. A base-building house runs it again
every `TICKS_PER_SECOND*5 + Random_Pick(1, TICKS_PER_SECOND/2)` game ticks: 76 to 82 at 15 ticks a game second, so
about every 5 to 5.5 game seconds.

`AI_Building`, `AI_Unit`, `AI_Infantry` and `AI_Aircraft` pick one item per category, kept in the house as
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

It builds under the player's rules. `Can_Build`'s "the computer can always build everything" bypass runs only in
`GAME_NORMAL`, so in skirmish the AI meets the same prerequisites, tech level and ownership tests.
`FactoryClass::Start` starts a computer's build only if it can pay the first step (`House->IsHuman ||
Available_Money() >= Cost_Per_Tick()`), where a human's always starts, and every step is paid as it goes. One small
edge: a computer MCV whose deploy spot is blocked tells its own idle units there to move (`Flush_For_Placement`),
where a human's only plays the can't-deploy cue (`UnitClass::Try_To_Deploy`).

## How it attacks

`Check_Attack` rates an attack critical once the house's `Attack` timer reaches zero (never in the first minute).
`AI_Attack` then rolls: one time in three it attacks, and every armed unit and aircraft, plus engineers, has a 75%
chance of being set to `MISSION_HUNT`. The other two times nothing attacks, and each unit on guard-area duty has a
20% chance of shuffling to a new spot. Either way the timer restarts at `AttackInterval` × half a minute to two
minutes (stock `[AI]` `AttackInterval=3`); the first comes after `AttackDelay` × the same (stock 5).

So there is no wave: whatever is armed at that moment goes, each unit hunting on its own, however large or small
the army. A house with no buildings left always attacks.

**The house's chosen enemy is almost never set.** Whenever the `Attack` timer is at zero, `Expert_AI` re-picks
`Enemy`. Each candidate house scores `((MAP_CELL_W*2) - Distance(Center, h->Center)) * 2`, plus 5 for each of this
house's buildings it has destroyed, 1 for each unit, the difference in base size, and 100 if it attacked last, and
the pick needs a score above 0. `MAP_CELL_W*2` is 256, but `Distance` between two coordinates is in leptons, 256 to a
cell, so any base more than about a cell away scores far below zero and the pick sets `Enemy` to none. Otherwise
`Enemy` is set only when a non-ally hits one of the house's buildings (`BuildingClass::Take_Damage`), until the next
pick clears it. Hunting units choose their own targets, so the attack still happens, but the target bonus for the
designated enemy (+500, then ×3, in `Evaluate_Object`) rarely applies.

## Stock bugs and gaps

Each confirmed in EA's released source:

| Problem | Where | Effect |
|---|---|---|
| **The skirmish AI never builds ships.** All of `AI_Vessel`'s logic sits inside `if (Session.Type == GAME_NORMAL)`. | `HOUSE.CPP` | No navy at all, on any map. |
| **Its building list stops short.** `AI_Building`'s skirmish list has no shipyard, sub pen, missile silo, Iron Curtain or Chronosphere, and its repair bay entry is compiled out (`#ifdef OLD`). | `HOUSE.CPP` | No naval yards, no missile silo, Iron Curtain or Chronosphere, and damaged vehicles never repair. |
| **The radar dome is only built against an air threat.** In skirmish, `AI_Building` queues `STRUCT_RADAR` only inside its air-defence block, at `URGENCY_HIGH`, when `Can_Build(b, ActLike)` passes and it can pay (`Cost_Of() < money \|\| hasincome`). That block runs only while the base has fewer SAM sites and AA guns than `AARatio` and `AALimit` allow, and only against an air threat: its chosen enemy, or any house it isn't allied with, has a non-zero `AScan` (it owns aircraft). | `HOUSE.CPP` | In stock `rules.ini` the dome is the prerequisite of the SAM site, the AA gun, the helipad, the airfield and both tech centres. Without it the AI gets no air defence and no aircraft (so no spy plane or paratroopers), no GPS, gap generator, V2 launcher, radar jammer or spy, and nothing that needs a tech centre (Tanya, the flamethrower, the Mammoth tank, Aftermath's tech units). A computer player can't own aircraft without a dome either, so in practice only a human player's aircraft start the chain. |
| **In practice it uses three powers, all from buildings it builds once it has a radar dome.** Its airfield brings the spy plane and paratroopers, which `Super_Weapon_Handler` fires through `Special_Weapon_AI`, and the Allied tech centre's GPS satellite launches itself for any house. `Special_Weapon_AI` also handles the nuke, but the building list never includes a missile silo. Parabombs are enabled only in `GAME_NORMAL`, for every house. Nothing fires the Iron Curtain, Chronosphere or sonar pulse for a computer player, and it never builds the first two. | `HOUSE.CPP` | No nukes, Iron Curtain or Chronosphere from a stock skirmish AI. A mod that adds those buildings to its list still has to fire the Iron Curtain and Chronosphere itself. Nobody, human or computer, gets parabombs in a skirmish. |
| **Superweapon aim can't serve the Iron Curtain or Chronosphere.** `Special_Weapon_AI` aims at the enemy building of highest `Value` (each candidate has a 90% chance of being considered). Fired there, the Iron Curtain would shield the enemy's building, and the Chronosphere moves only allied units. `Place_Special_Blast` also picks the object in the target cell by the last mouse position (`Keyboard->MouseQX`). | `HOUSE.CPP`, `CELL.CPP` (`Cell_Techno`) | Adding the missing calls alone isn't enough: those two need their own target choice. |
| **Target picks ignore the shroud outside a campaign.** `Evaluate_Object`'s "not visible, bail" test runs only in `GAME_NORMAL`, and `Special_Weapon_AI` looks at every enemy building on the map. | `TECHNO.CPP`, `HOUSE.CPP` | A computer player picks targets, and aims nukes, at things it has never seen. |
| **Deploy abilities are never used.** Chrono tank teleports, MAD tank quakes and minelayer mines all run from `MISSION_UNLOAD`, and outside a campaign's team scripts nothing gives a computer unit that mission (the MCV is the one exception, in `Mission_Guard`). | `UNIT.CPP`, `TEAM.CPP` | Those units drive and shoot like tanks, or wander unarmed. |
| **Computer players never gang up.** `Computer_Paranoid`, which allies every computer house against the humans (called when a human makes an ally, or a top-IQ computer house is defeated, with `[AI]` `Paranoid=yes`), wraps its whole body in `if (Session.Type != GAME_GLYPHX_MULTIPLAYER)`, with EA's comment "Re-enable this for multiplayer if we support classic team/ally mode". | `HOUSE.CPP` | `Paranoid=` does nothing in a skirmish: computer players fight each other as readily as the human. |
| **The threat map stays empty.** `ObjectClass::Mark` feeds each house's region threat (`Adjust_Threat`) only in `GAME_NORMAL`, so `MapClass::Cell_Threat` returns only whether the cell is visible to the house (1 or 0). | `OBJECT.CPP`, `MAP.CPP` | Nothing has per-cell threat data in a skirmish: a damaged team's regroup choice in `TEAM.CPP` weighs distance alone. The threat-avoiding path test in `FINDPATH.CPP` is itself gated to `GAME_NORMAL`. |
| **Teams are never filled.** `TeamClass::AI` recruits members only when `Session.Type == GAME_NORMAL`, though `HouseClass::AI` still creates teams from the map's TeamTypes. | `TEAM.CPP`, `HOUSE.CPP` | A skirmish map's TeamTypes produce empty teams: no squads, no team scripts. |
| **The base-defence planner is compiled out.** `AI_Base_Defense` sits inside `#ifdef NEVER`, is declared nowhere and is never called. | `HOUSE.CPP` | Defences are queued by `AI_Building`'s `[AI]` `DefenseRatio` and `DefenseLimit` alone, with no sense of where attacks come from. |
| **Friendly-fire caution covers only buildings.** `Area_Modify` halves a target's value for each allied building within `[General]` `FireSupress` cells (stock 1), checking `Cell_Building()` at all four edges of each ring and never units, and only for a weapon with `Supress=yes`, which in stock `rules.ini` is the cruiser's `8Inch` alone. It applies to every house's target scans. | `TECHNO.CPP` (`Evaluate_Object`), `WEAPON.CPP`, `RULES.CPP` | Splash weapons fire on targets beside their own side's infantry and tanks. |
| **Four urgency checks and five build actions are stubs.** `Check_Build_Defense`, `Check_Build_Engineer`, `Check_Build_Income` and `Check_Build_Offense` always return `URGENCY_NONE`; `AI_Build_Defense`, `AI_Build_Engineer`, `AI_Build_Income`, `AI_Build_Offense` and `AI_Build_Power` always return `false`. | `HOUSE.CPP` | Those strategies never drive a decision. Power is the one rated but not acted on. |
| **The power check's `|`.** "Under attack, so power is urgent" tests `BScan \| STRUCTF_CHRONOSPHERE`, which is always true. | `HOUSE.CPP`, `Check_Build_Power` | Any threatened house rates power as high urgency. |
| **Target choice keeps the last candidate, not the best.** In `Greatest_Threat`'s ring scan, a candidate sets `bestobject` but never updates `bestval`, which stays at its starting -1 (or the best aircraft's score). All four edges of each ring (top, bottom, left and right) have the same `if (bestval < value)` with no update. The aircraft pass and the whole-map scan do set `bestval`, so only scans limited to a range or area (`THREAT_RANGE`, `THREAT_AREA`) go wrong. Guard and area guard use them (through `Target_Something_Nearby`), and so does every armed building, whose `Greatest_Threat` always adds `THREAT_RANGE`. Hunt scans the whole map. | `TECHNO.CPP` (extended ASCII: use `grep -a`), `FOOT.CPP`, `BUILDING.CPP` | Every valid target replaces the last, so a guarding unit or a base defence attacks the last one the scan reaches, not the most valuable. |
| **Harvester bugs:** the "ore is short" latch that never resets, an idle harvester's overwritten order, and, in the campaign only, no replacement harvesters for a computer on a Hard handicap. See [Harvesters](harvesters.md). | `UNIT.CPP`, `HOUSE.CPP` | The AI's economy can stop for good. |
| **The factory pool is small.** `[Maximums]` `Factory=` defaults to 20 in code (stock `rules.ini` raises it to 32), and every factory in production takes one. | `RULES.CPP`, `INIT.CPP` | Late in a big game, production silently stops. See [Raising the limits](../units/raising-the-limits.md). |

## What a mod can do about it

These are methods Tiberian Factions uses, each a DLL change:

- **Make difficulty behavioural, not a stat bonus.** Map each difficulty to an IQ and to which behaviours run
  (scouting, attack-move waves, threat-aware defences), and leave firepower and cost alone.
- **Build through a primary factory,** one order per category, as a human does. This removes the parallel-factory
  advantage and stops the factory pool running dry.
- **Fair fog.** Route the AI's target picks, superweapon aim and attack destinations through what its own house has
  seen, instead of the whole map.
- **Fix the bugs above,** and queue the radar dome once the economy stands: TF waits for two refineries
  (or a map short of ore), a war factory and full power.
- **Keep the stock AI one switch away.** See [A player settings page](../structuring/player-settings-page.md): its
  "classic AI" switch puts every change back to EA's code path.

## How it was verified

- **IQ and difficulty:** EA's `RulesClass::IQ`, every use of each IQ value (`HOUSE.CPP`, `BUILDING.CPP`,
  `UNIT.CPP`, `INFANTRY.CPP`, `VESSEL.CPP`, `TECHNO.CPP`), the skirmish house set-up in `GlyphX_Assign_Houses`
  (`DLLInterface.cpp`: `IQ = Rule.MaxIQ`, `Assign_Handicap(Scen.Difficulty)`), `Scen.Difficulty`'s Normal default
  (`ScenarioClass`'s constructor, and the reset in `INIT.CPP`'s scenario set-up), `Set_Scenario_Difficulty`'s
  `GAME_NORMAL` gate and `CNC_Set_Difficulty`, the unused `Assign_Houses` that reads `IsCompEasyBonus`
  (`SCENARIO.CPP`), `SellBack`'s whole test in `Repair_AI` (the same in Vanilla Conquer's `building.cpp`), where
  `IsTickedOff` is set (`TECHNO.CPP`, damage from a non-ally) and `CreditReserve` read into `RepairThreshhold`
  (`RULES.CPP`), Tiberian Factions'
  DLL, which keeps the same `Assign_Handicap(Scen.Difficulty)` call, and the stock `rules.ini` read from `REDALERT.MIX`
  (`[IQ]`, `[Easy]`, `[Normal]`, `[Difficult]`, `[AI]`).
- **The build picks and attacks:** `AI_Unit`'s and `AI_Infantry`'s skirmish weights, `Check_Attack`, `AI_Attack` and
  the `Attack` timer's two resets, each in EA's `HOUSE.CPP`; `AttackInterval` and `AttackDelay` in `RULES.CPP` and the
  stock `rules.ini`.
- **The strategies:** the ten `STRATEGY_*` values in EA's `DEFINES.H`; `Expert_AI`'s two loops and its return value,
  and `HouseClass::AI` setting `AITimer` from it for a base-building house (`HOUSE.CPP`); `TICKS_PER_SECOND` 15
  (`DEFINES.H`). Vanilla Conquer's `house.cpp` and TF's fork have the same loops, with `acted` never
  read. TF's problem inventory counts the same ten pairs.
- **The radar dome:** the air-defence block in EA's `AI_Building` (`HOUSE.CPP`: the `AARatio`/`AALimit` test, the
  `AScan` threat test, `STRUCT_RADAR` at `URGENCY_HIGH`), the only `STRUCT_RADAR` choice in that function; the same
  block in Vanilla Conquer; and the prerequisites in the base game's own `rules.ini`, `aftrmath.ini` and
  `mplayer.ini`, read from `REDALERT.MIX` and the expansion MIXes for this page (`DOME` for `SAM`, `AGUN`, `HPAD`,
  `AFLD`, `ATEK`, `STEK`, `GAP`'s `atek`, and so on). TF's problem inventory found the gap, and its fix
  unlocked the tech tree.
- **The ring scan:** the four `if (bestval < value)` blocks and the two passes that set `bestval` in EA's
  `TechnoClass::Greatest_Threat`, the same four in Vanilla Conquer's `techno.cpp`; `Target_Something_Nearby`
  keeping only `THREAT_RANGE | THREAT_AREA`, the guard missions' calls in `FOOT.CPP`, and
  `BuildingClass::Greatest_Threat` adding `THREAT_RANGE`. TF found it and fixed it.
- **The bugs:** each line in EA's source, as listed (`AI_Vessel`'s `GAME_NORMAL` gate, `AI_Building`'s full list,
  the four `Special_Weapon_AI` calls, the parabomb gate, `Evaluate_Object`'s visibility test, every
  `MISSION_UNLOAD` assignment). TF's problem inventory found them, and its code fixes most of them (the
  ring scan's `bestval`, the radar dome, ships and shipyards, the repair bay, parabombs, fog in target and
  superweapon picks). **AI Boost**, an independent mod, adds the missing naval yards, superweapon buildings,
  Iron Curtain and Chronosphere calls, and spy, thief, chrono tank and MAD tank use, which agrees with each gap.
- **The gang-up, threat map, teams, defence planner and friendly fire:** EA's `Computer_Paranoid` and its two
  callers (`HOUSE.CPP`), the two `GAME_NORMAL` gates on `Adjust_Threat` in `ObjectClass::Mark` (`OBJECT.CPP`),
  `Cell_Threat` (`MAP.CPP`) and its two users (`TEAM.CPP`, `FINDPATH.CPP`), the recruit gate in `TeamClass::AI`
  (`TEAM.CPP`) and team creation in `HouseClass::AI`, `AI_Base_Defense` between `#ifdef NEVER` and its `#endif`
  with no other mention in the source, and `Area_Modify`'s four `Cell_Building()` tests and `IsSupressed` gate
  (`TECHNO.CPP`); Vanilla Conquer's `house.cpp`, `object.cpp`, `team.cpp` and `techno.cpp` match line for line;
  TF's fork carries the same code and its AI notes list each one; `Paranoid=yes`, `FireSupress=1`,
  `DefenseRatio` and `[8Inch]`'s `Supress=yes` (the only one) in the stock `rules.ini` from `REDALERT.MIX`.
- **The enemy pick and the build rules:** EA's `Expert_AI` (`int close = 0`, the score, `Enemy = enemy`),
  `MAP_CELL_W` 128 (`DEFINES.H`), `Distance` returning leptons (`COORD.CPP`), the `Enemy` set in
  `BuildingClass::Take_Damage` and read in `Evaluate_Object`; `Can_Build`'s `GAME_NORMAL` bypass (`HOUSE.CPP`),
  `FactoryClass::Start` and `FactoryClass::AI` (`FACTORY.CPP`), and the MCV's `Flush_For_Placement` call
  (`UNIT.CPP`, with `BDATA.CPP`'s body scattering allied idle units). Vanilla Conquer's and TF's copies
  have the same lines. The enemy pick's outcome is read from code, not watched in play.
- **The `Production` trap:** EA's base-building gate in `HouseClass::AI`, stock `Production=5`, and TF,
  which lowers it to 3 so its easiest AI still builds.

**Credit:** several of the methods above are ported from **AI Boost 3.2** by Bast75 and xXMini FrankiXx (GPL v3),
including primary-factory production, the share of the army sent per attack, and scatter on launch.

> [!TIP]
> **In Tiberian Factions**
>
> TF maps lobby difficulty to IQ (Easy 3, Medium 4, Hard 5) and to behaviours. Easy builds and fights but scouts
> lazily and never fires superweapons. Every tier gathers its attacks into staged waves, launched on army size and
> worth; Hard releases its waves on attack-move against a known enemy building, and the others release theirs to
> hunt. Medium and Hard place defences against the threats they've seen, and Hard scouts actively. It never touches firepower or cost. Its AI also builds navies
> and ferries armies over water, which the stock skirmish AI never does.
