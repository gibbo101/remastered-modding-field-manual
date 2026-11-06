---
title: "Units leaving buildings: exits and rails"
description: How Red Alert moves a finished unit out of a factory (exit point, radio tether, unload mission, fixed movement tracks), and the traps of giving a new building an exit path of its own with a straight-line rail; one shared track table, saved track numbers, draw order in the doorway, seat depth, and infantry spots.
tags: [units, buildings, movement, tracks, dll]
holds_for: Steam build 21590013
status: verified
unproven: [why a deployed mobile war factory sometimes loses the units it builds (observed, not traced)]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Units leaving buildings: exits and rails

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod adds a factory, refinery, repair pad or any building a unit drives into or out of, with a door or
shape the stock buildings don't have. A new building that reuses a stock building's footprint and exit doesn't need
this page.

## How Red Alert does it

`BuildingClass::Exit_Object` (`BUILDING.CPP`) handles a finished unit, case by building type:

- **War factory:** the unit is placed at the factory's exit point (`Exit_Coord`), facing south. The factory tethers
  it by radio, and its unload mission drives the unit out. If the factory is still unloading the last unit, it hands
  the new one to another idle war factory of the same owner, or waits.
- **Barracks and kennel:** the building finds a free exit cell (`Find_Exit_Cell`), places the unit at its exit point
  facing that cell, and gives it a move order.

Vehicles then move along **fixed track tables** in `DRIVE.CPP`: `TrackControl[67]` picks a track for each turn,
and `RawTracks[13]` holds the tracks, `Track1` to `Track13`, as lists of coordinate offsets. A moving unit stores the
`TrackNumber` and `TrackIndex` it's on.

## A new exit path: a rail

A building whose door isn't where the stock war factory's is needs its own path out. The stock tracks are fixed
shapes, so one approach is a **rail**: a straight line from the unit's seat inside the building to a point outside,
computed when the unit leaves. Store the start offset, the length and the facing on the unit, and generate each
step's position from those, rather than adding another fixed table. Once the unit reaches the rail's end, normal
pathfinding takes over.

## Traps

- **Never write a path into one static table.** If every unit's path is written into one shared table, two units
  on it at once follow each other's offsets. In a working mod, a harvester leaving the war factory while another
  reversed into a refinery followed the refinery's path from the factory, and drove out of the back of the
  building. Each unit has to keep its own rail.
- **Track numbers are saved.** `TrackNumber` is part of the unit's saved state, so a save stores which track the
  unit is on. Never renumber the track list. When you remove a track you added, leave its slot empty so the ones
  after it keep their numbers.
- **Draw order in the doorway.** A vehicle still inside the building has to draw *under* the building's front wall
  and door, or it pokes through them. Sort the unit just under the near wall until its body clears the threshold.
  Don't move the whole building's sort south instead: that covers every poke-through, but it also hides a vehicle
  sitting in the bay.
- **Seat depth depends on where the sprite's centre is.** The launcher anchors a sprite by its canvas centre (see
  [How the launcher draws sprites](../art/how-the-launcher-draws-sprites.md)). A walker's centre sits well above its
  feet, so it needs a deeper seat than a tank to stand on the same floor.
- **Infantry snap to spots.** A cell holds infantry at fixed spots, and an infantryman placed in a cell moves to the
  nearest free one (`CellClass::Closest_Free_Spot`). So infantry leaving a building can appear beside the door rather
  than in it. Measure where they appear before moving the exit point.
- **Log before changing an exit.** Exits involve the building's seat, the unit's rail and the cell it ends on. When
  units go missing or teleport on the way out, log all three for each delivery before changing any of them.

## How it was verified

- **The stock exit and tracks:** EA's `BUILDING.CPP` (`Exit_Object`, the war factory and barracks cases), `DRIVE.H`
  (`TrackControl[67]`, `RawTracks[13]`, `Track1`–`Track13`, `TrackNumber`, `TrackIndex`) and `CELL.CPP`
  (`Closest_Free_Spot`). That track numbers are saved: `TFixedIHeapClass::Save` (`HEAP.CPP`) writes each object
  whole.
- **The rail and its traps:** a working mod's code (a per-unit `Rail_To` in its `DriveClass`), and its history: the
  harvester that drove out of the back of the factory and its fix, the removed tracks left as empty slots because
  saves store their numbers, the doorway sort, and the deeper walker seats.
- **Observed, not traced:** a deployed mobile war factory that sometimes loses units it has built.

> [!TIP]
> **In Tiberian Factions**
>
> TF's Tiberian Sun war factory and mobile war factory open a roll-up door, and the finished unit drives out on a rail
> from a seat in the doorway, under the door's front wall until it's clear. Walkers get a deeper seat. The TS
> refinery's harvesters dock and roll off on rails too. A deployed mobile war factory still sometimes loses units it
> has built, which is an open issue.
>
> <!-- screenshot: a TS war factory's door up, a vehicle half out on its rail -->
