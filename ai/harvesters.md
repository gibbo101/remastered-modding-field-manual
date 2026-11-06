---
title: Harvesters
description: "Why Red Alert's harvesters get stuck, queue at one refinery or drive into enemy bases (a latch that never resets, an overwritten idle order, zones that ignore buildings, a sticky refinery choice, ore picks with no sense of danger), each confirmed in EA's source, and the fixes one mod ships."
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
| **No replacement harvesters on Hard.** The computer's replacement check requires `Difficulty != DIFF_HARD`. | `HOUSE.CPP`, `AI_Unit` | A Hard AI that loses its harvesters doesn't rebuild them that way. |
| **The refinery choice is sticky.** `Find_Best_Refinery` returns the last refinery used whenever it's still valid ("Remember our last refinery and prefer that one"). | `UNIT.CPP` | Harvesters queue at one refinery while another stands idle. |
| **Ore picks ignore danger.** `Tiberium_Check` scores a cell by land type, ore, fog and zone only, and the harvester returns first to the last cell it mined (`ArchiveTarget`). | `UNIT.CPP` | A harvester that once mined in an enemy's base keeps going back. |
| **Zones ignore buildings.** A field walled off by a turret still counts as reachable. See [Pathfinding](pathfinding.md). | `CELL.CPP`, `MAP.CPP` | A harvester heads for ore it can never reach. Because the edge-following pathfinder nearly always returns *some* path, nothing reports a failure. It just never arrives. |

## What one mod ships

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
  `GOINGTOIDLE` case, `Find_Best_Refinery`'s cache, `Tiberium_Check` and `ArchiveTarget`) and `HOUSE.CPP` (the
  latch's only initialisation, its use in refinery building and harvester replacement, and the `DIFF_HARD` check),
  each read with `grep -a`.
- **The fixes:** a working mod's design notes and code: the no-progress detector, field blacklist, retreat, zone
  gate, watchdog and field pick, shipped and tested in play. The refinery spreading is a CFE Patch Redux port.
- **The zone trap:** EA's `Zone_Span` and `Is_Clear_To_Move` (the cleared building bit), and a working mod's failed
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
