---
title: Harvesters
description: "Why Red Alert's harvesters get stuck, queue at one refinery or drive into enemy bases (a latch that never resets, an overwritten idle order, zones that ignore buildings, a sticky refinery choice, ore picks with no sense of danger and, outside a campaign, no shroud), each confirmed in EA's source, the few rules.ini knobs, and the fixes Tiberian Factions ships."
tags: [ai, harvesters, economy, pathfinding, dll]
holds_for: Steam build 21590013
status: verified
unproven: [a harvester whose only ore is walled off by a mix of buildings and units it can't shove (the watchdog's limit, not measured)]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Harvesters

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When harvesters in your mod stop harvesting, park in the open, crowd one refinery while another sits idle, or feed
themselves to enemy defences. Or when a computer player's economy dies part-way through a match. A mod that doesn't
change harvesters still inherits every stock problem below.

## Stock problems

Each confirmed in EA's released source:

| Problem | Where | What happens |
|---|---|---|
| **"Ore is short" is a latch that never resets.** When one harvester's search finds no ore, it sets the house's `IsTiberiumShort`, and nothing ever clears it. | `UNIT.CPP` (set), `HOUSE.CPP` (initialised once) | The computer player stops building refineries, stops replacing harvesters, and its idle harvesters stop going back to work, for the rest of the match, even after new ore appears. |
| **Only computer harvesters go back to work by themselves.** The re-queue from guard is gated on `!House->IsHuman`. | `UNIT.CPP` | A player's harvester that runs out of ore sits there until it's given an order. |
| **An idle harvester's repair or hunt order is overwritten.** The `GOINGTOIDLE` case assigns repair or hunt, then always `MISSION_GUARD`. | `UNIT.CPP` | It just stops where it is. |
| **No replacement harvesters for a computer on a Hard handicap: campaign only.** The computer's replacement check requires its house's `Difficulty != DIFF_HARD`. A computer house takes that from `Scen.CDifficulty`, which only the original game's campaign menus set to Hard (on the player's two easiest settings). A skirmish AI gets `Scen.Difficulty`, which the lobby can't change from Normal, and the Remastered DLL never sets `CDifficulty`, so in Remastered the check only bites a mod that gives a computer house a Hard handicap. | `HOUSE.CPP`, `AI_Unit` | A campaign computer on a Hard handicap that loses its harvesters doesn't rebuild them that way. A stock skirmish AI always passes the check. |
| **The refinery choice is sticky.** `Find_Best_Refinery` returns the last refinery used whenever it's still valid ("Remember our last refinery and prefer that one"). | `UNIT.CPP` | Harvesters queue at one refinery while another stands idle. |
| **Ore picks ignore danger, and outside a campaign the shroud.** `Tiberium_Check` scores a cell by its ore alone, `(OverlayData+1)` × the ore's value, in the harvester's zone and with no unit on it, and the harvester returns first to the last cell it mined (`ArchiveTarget`). Its fog test applies only to the player's own harvester in a campaign (`Session.Type != GAME_NORMAL \|\| !IsOwnedByPlayer \|\| Is_Mapped(PlayerPtr)`). | `UNIT.CPP` | A harvester that once mined in an enemy's base keeps going back, and in a skirmish every harvester, human or computer, picks ore it has never seen. |
| **Zones ignore buildings.** A field walled off by a turret still counts as reachable. See [Pathfinding](pathfinding.md). | `CELL.CPP`, `MAP.CPP` | A harvester heads for ore it can never reach. Because the edge-following pathfinder nearly always returns *some* path, nothing reports a failure. It just never arrives. |

## The rules.ini knobs

These are all `rules.ini` offers, with their stock values. None of them touches the problems above, which are DLL
changes:

| Key | Section | Stock | What it sets |
|---|---|---|---|
| `OreNearScan` | `[AI]` | 6 | Search radius in cells for the next ore once a patch runs out (`TiberiumShortScan`). |
| `OreFarScan` | `[AI]` | 48 | Search radius in cells when looking for a new field (`TiberiumLongScan`). |
| `RefineryRatio`, `RefineryLimit` | `[AI]` | .16, 4 | The computer builds a refinery while refineries are under this share of its buildings, and never more than the limit. |
| `Harvester` | `[IQ]` | 2 | The IQ at which a computer player replaces lost harvesters. |
| `BailCount` | `[General]` | 28 | Bails a full harvester carries. |
| `GoldValue`, `GemValue` | `[General]` | 25, 50 | Credits per bail of ore and of gems. The ore search weighs each cell by them too: an ore cell at `GoldValue`, a gem cell at four times `GemValue`. |
| `OreTruckRate` | `[General]` | 1 | How slowly the harvester loads and dumps; larger is slower. |

The stock column is the base game's `rules.ini`. A `rules.ini` of your own that leaves a key out gets the code's
default instead (`RulesClass`'s constructor, `RULES.CPP`), and five of those differ: `OreFarScan` 32 cells
(`0x2000` leptons), `GoldValue` 35, `GemValue` 110, `Harvester` 3 and `OreTruckRate` 2.

## What Tiberian Factions ships

Each is a DLL change, behind one "harvesters" switch on a settings page that restores EA's code when it's off (see
[A player settings page](../structuring/player-settings-page.md)).

- **Reset the latch** whenever a harvester finds ore.
- **Fix the idle order.** An idle harvester pulls back to guard beside its best refinery, instead of parking in the
  open. Any order the player gives overrides it.
- **Detect no progress, not failure.** While a harvester heads for ore, track the closest it has come. No
  improvement for 5 seconds means the ore is unreachable, whatever the pathfinder says. This is the only signal
  that works: three detectors hooked to failure events missed the stuck state entirely.
- **Blacklist the whole field.** Flood-fill the ore field from the failed cell (up to 256 cells) and skip its
  bounding box for 15 seconds, so the harvester doesn't give up on one cell and pick its neighbour.
- **Go home and rescan.** A harvester more than 4 cells from its refinery heads back and searches again from there.
- **Only return to the last field if it's in the same zone.** Otherwise a walled-off last field stays a legal target
  forever.
- **An anti-stuck watchdog** for harvesters that stop moving: shove blocking infantry after 3 seconds, scatter after
  6, and re-decide after 12. It never blacklists a field, because it can't tell an unreachable field from a wedged
  harvester.
- **Pick ore by distance, with danger as a penalty.** Take each search ring's nearest ore cell (picking the densest
  sent every harvester to distant untouched fields). Treat units parked on the route as passable for the
  reachability test, and weigh the distance against enemy defences nearby.
- **Spread harvesters across refineries.** Choose a refinery by its distance plus a weight for each harvester
  already heading there. A harvester much farther away than you doesn't count against it, so a nearer harvester
  can jump the queue.

## Traps

- **Rebuilding zones on building placement doesn't help.** It looks like the obvious fix, but the zone fill ignores
  buildings by design, so a building-walled field stays in the same zone however often zones are rebuilt. Making
  the fill respect buildings would change every zone check in the game.
- **Give-way loops among queued harvesters.** A mod that adds give-way to movement can send packed units, such as
  harvesters queueing at a refinery, giving way to each other in a loop until the game crashes. That needs a mod's own
  give-way code: EA's source has none. Guard the retreat against re-entering itself (see
  [Pathfinding](pathfinding.md)).
- **Don't scatter harvesters to free a base.** A scatter meant to unstick units in a crowded base can pull a
  harvester off its dock approach part-way through. Leave harvesters out of it.

## How it was verified

- **The stock problems:** EA's `UNIT.CPP` (the `IsTiberiumShort` set, the `!House->IsHuman` re-queue, the
  `GOINGTOIDLE` case, `Find_Best_Refinery`'s cache, `Tiberium_Check`'s score and its `GAME_NORMAL` fog gate, and `ArchiveTarget`; Vanilla Conquer's `unit.cpp` and Tiberian Factions' fork have the same `Tiberium_Check` lines) and `HOUSE.CPP` (the
  latch's only initialisation, its use in refinery building and harvester replacement, and the `DIFF_HARD` check),
  each read with `grep -a`. Where a computer's `Difficulty` comes from: `HouseClass`'s constructor (`Scen.CDifficulty`), `CDifficulty`'s only writers in `INIT.CPP` and `NULLDLG.CPP` (the original menus, which the
  DLL never calls), and `GlyphX_Assign_Houses` (`DLLInterface.cpp`, `Assign_Handicap(Scen.Difficulty)`).
- **The rules.ini knobs:** each key read in EA's `RULES.CPP` (`OreNearScan` and `OreFarScan` into `TiberiumShortScan`
  and `TiberiumLongScan`), used in `UNIT.CPP` (`Goto_Tiberium`, `Tiberium_Check`'s `GoldValue` and `GemValue*4`, the bail count) and
  `HOUSE.CPP` (`RefineryRatio`, `RefineryLimit`), and the stock values in the base game's `rules.ini`. TF's
  harvester notes list the same keys. The code defaults are `RulesClass`'s constructor initialisers
  (`TiberiumLongScan(0x2000)`, `GoldValue(35)`, `GemValue(110)`, `IQHarvester(3)`, `OreDumpRate(2)`), checked
  against the `rules.ini` extracted from `REDALERT.MIX`; TF's notes give the same 110 fallback for `GemValue`.
- **The fixes:** TF's design notes and code: the no-progress detector, field blacklist, retreat, zone
  gate, watchdog and field pick, shipped and tested in play. The refinery spreading is a CFE Patch Redux port.
- **The zone trap:** EA's `Zone_Span` and `Is_Clear_To_Move` (the cleared building bit), and TF's failed
  attempt to rebuild zones on placement.

**Credit:** the refinery choice (CFE's Harvester Optimization, not its separate Harvester Load Balancing) and
queue-jumping come from CFE Patch Redux, whose credits list ChthonVII's harvester refinery-selection work. See
[Porting CFE Patch Redux](../engine/cfe-patch-ports.md).

> [!TIP]
> **In Tiberian Factions**
>
> Every TF harvester, TD's, Red Alert's and Tiberian Sun's, docks at every faction's refinery, with dock times kept
> equal across pairings. The stuck-harvester work came from a turret built across the only route to an ore field:
> the harvester headed for it forever, and the computer player's economy died with it.
