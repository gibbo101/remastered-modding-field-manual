---
title: Hover and amphibious units
description: Units that cross land and water, like Tiberian Sun's Hover MLRS and Amphibious APC; Red Alert dropped Tiberian Dawn's SPEED_HOVER, so restoring it takes a new speed type, its own land-cost column, a movement zone that spans the shoreline, and every zone rebuild told about it; saves change with it.
tags: [behaviours, movement, hover, amphibious, zones, tiberian-sun, tiberian-dawn, dll]
holds_for: Steam build 21590013
status: verified
unproven: [how the skirmish AI's attack and path choices use a hover unit's water routes]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Hover and amphibious units

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod wants a ground unit that also crosses water: Tiberian Sun's Hover MLRS or Amphibious APC, or Tiberian
Dawn's hovercraft. Red Alert can't do it from `rules.ini`: its vehicles are tracked or wheeled, and only ships go on
water. A mod whose units stay on land or at sea doesn't need this page.

## What Red Alert dropped

- **Tiberian Dawn has `SPEED_HOVER`** in its `SpeedType` list, for its hovercraft (`LST`). Red Alert's list stops
  at `SPEED_FOOT`, `SPEED_TRACK`, `SPEED_WHEEL`, `SPEED_WINGED` and `SPEED_FLOAT`: hover is gone.
- **Land costs are read per speed type.** Each land section of `rules.ini` (`[Clear]`, `[Road]`, `[Water]`,
  `[Rock]`, `[Wall]`, `[Ore]`, `[Beach]`, `[Rough]`, `[River]`) gives `Foot=`, `Track=`, `Wheel=` and `Float=`, read
  into `GroundType::Cost[]`. A cell is passable to a speed type when its cost isn't zero
  (`CellClass::Is_Clear_To_Move`), so a new speed type needs its own column.
- **Movement zones are per kind of mover** (`MZONE_NORMAL`, `MZONE_CRUSHER`, `MZONE_DESTROYER`, `MZONE_WATER`). The
  zone fill (`MapClass::Zone_Span`) floods land zones by tracked passability and the water zone by ship
  passability. No zone spans a shoreline, so every order that compares zones refuses a land-to-water move. See
  [Pathfinding](../ai/pathfinding.md).

## How Tiberian Sun does it

TS's `RULES.INI` gives the Hover MLRS `SpeedType=Hover` and the APC `SpeedType=Amphibious` (with
`MovementZone=AmphibiousCrusher`), and every land section carries `Hover=` and `Amphibious=` columns:

- **Hover:** 100% on everything passable, water, beach and Tiberium included; 0% on rock and walls.
- **Amphibious:** full speed on roads, slower elsewhere: 80% on clear ground and water, 60% on beach, 50% on
  Tiberium, 40% on rough ground; 0% on rock and walls.

Both columns are zero on the same lands, so the two types can share one movement zone.

## The method in Red Alert's DLL

1. **A speed type:** append `SPEED_HOVER` (and an amphibious one if you want TS's slower drive) before
   `SPEED_COUNT` in `DEFINES.H`, so `GroundType::Cost[]` grows to hold it.
2. **A cost column:** read `Hover=` (and `Amphibious=`) from each land section beside `Foot=` and the rest, and
   put TS's values in your `rules.ini`. Default a missing value sensibly, since other mods' land sections won't have
   it.
3. **A rules key on the unit:** Red Alert picks tracked or wheeled from `Tracked=`. Add a key of your own (for
   example `Hover=yes`) that sets the new speed type.
4. **A movement zone that spans land and water:** append `MZONE_HOVER` to `MZoneType`, give `Zone_Span` a branch
   that floods it by the hover speed type, and make `TechnoTypeClass::Read_INI` set `MZone` to it for hover units,
   as it already sets `MZONE_WATER` for ships. With the unit's zone spanning the shore, the pathfinder, move
   orders, target choice and nearby-cell searches all accept cross-shoreline moves without touching each one.
   Each of them compares zones through the type's own zone (`Zones[Techno_Type_Class()->MZone]`, or
   `Class->MZone`): in `FOOT.CPP`, `Basic_Path`, `Approach_Target`, both `Active_Click_With`s and
   `Per_Cell_Process`; in `TECHNO.CPP`, `Evaluate_Object`, `Evaluate_Cell`, `Greatest_Threat`, `Nearby_Location`,
   `Is_In_Same_Zone`, `Base_Is_Attacked` and `Find_Docking_Bay`; and in `UNIT.CPP`, `Can_Enter_Cell`,
   `Tiberium_Check` and `Find_Best_Refinery`. Two checks name a zone outright, so a hover zone doesn't reach them:
   `HouseClass::Where_To_Go` (`MZONE_NORMAL`) and a trigger action's waypoint test in `TACTION.CPP`
   (`MZONE_CRUSHER`).
5. **Every zone rebuild:** EA's callers pass explicit masks (`Zone_Reset(MZONEF_NORMAL|MZONEF_CRUSHER)` when a wall
   is built or sold, `MZONEF_NORMAL|MZONEF_CRUSHER|MZONEF_DESTROYER` when terrain crumbles). Add `MZONEF_HOVER` to
   each, or hover zones keep walls that are gone.
6. **Other speed checks:** grep for `SPEED_FLOAT` and `MZONE_WATER`. `TechnoClass::Can_Teleport_Here`, for one,
   picks its zone from the speed type, so the Chronosphere refuses hover units until it knows the new one.

## Traps

- **Saves change.** `CellClass` holds `Zones[MZONE_COUNT]`, so a new zone grows every cell, and the save version
  with it. Old saves won't load (see [Save versions](../engine/save-versions.md)).
- **Missing a zone-reset caller** shows only later: a wall sold or crushed stays a barrier for hover units alone.
- **Nothing changes the look on water.** A hover unit draws over water as it does over land. A lift, a wake or a
  different hull afloat is art and DLL work of your own.

## How it was verified

- **What Red Alert dropped:** EA's `TIBERIANDAWN/DEFINES.H` (`SPEED_HOVER`) and `UDATA.CPP` (the hovercraft `LST` on
  it) against `REDALERT/DEFINES.H` (no `SPEED_HOVER`; `MZoneType` with four zones); Red Alert's `RULES.CPP` (the
  nine land sections and their four columns), `CELL.CPP` (`Is_Clear_To_Move` refusing a zero cost), `MAP.CPP`
  (`Zone_Span` flooding by `SPEED_TRACK` or `SPEED_FLOAT`), `TECHNO.CPP` (`MZone` set for ships only, and
  `Can_Teleport_Here`), `CELL.H` (`Zones[MZONE_COUNT]`), and the explicit masks in `CELL.CPP`, `HOUSE.CPP` and
  `TERRAIN.CPP`. Vanilla Conquer's copies match.
- **The zone gates:** `grep -a` for `Zones[` over EA's Red Alert source gives the list in step 4, each reading the
  zone through the type's `MZone`, apart from the fixed `MZONE_NORMAL` in `HOUSE.CPP`'s `Where_To_Go` and
  `MZONE_CRUSHER` in `TACTION.CPP`; Vanilla Conquer's copies match; the working mod's hover units pass all of them
  through `MZONE_HOVER` with none of them changed.
- **TS's model:** TS's `RULES.INI` (`[HVR]` `SpeedType=Hover`, `[APC]` `SpeedType=Amphibious` and
  `MovementZone=AmphibiousCrusher`, and the `Hover=` and `Amphibious=` columns in every land section).
- **A working mod:** a Hover MLRS and an Amphibious APC built this way, with `MZONE_HOVER` shared by both, the new
  columns in its `rules.ini`, and `MZONEF_HOVER` added to every zone rebuild, played under Proton on Linux and on the
  Steam Deck.
- **Unproven:** how far the skirmish AI makes use of water routes for its own hover units.

> [!TIP]
> **In Tiberian Factions**
>
> TS GDI's Hover MLRS hovers on TS's own cost table, and its Amphibious APC drives into the water on TS's
> amphibious one, switching to a water hull while afloat. The Hover MLRS bobs as it hovers, and settles onto its
> shadow when an E.M. pulse stuns it.
>
> <!-- screenshot: a Hover MLRS and an Amphibious APC crossing a shoreline -->
