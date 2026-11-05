---
title: Adding a unit
description: A new vehicle type in Red Alert's DLL, end to end. The enum, the UnitTypeClass constructor and its geometry fields, registering it in heap order, its rules.ini section, the classic image it needs even in HD-only mods (no image means an invisible unit), and its weapons and sounds, with the launcher side linked.
tags: [units, dll, rules-ini, heaps]
holds_for: Steam build 21590013
status: verified
unproven: [infantry, buildings, aircraft and ships, which follow the same pattern with their own classes and aren't covered here]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Adding a unit

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only** for the art. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When your mod adds a new vehicle to Red Alert in its own DLL: a new type, not a stock one with changed stats. A
stock unit's stats are `rules.ini` alone. Without a DLL of your own, see
[New units without a DLL of your own](../structuring/units-without-a-dll.md).

This page covers vehicles (`UnitTypeClass`). Infantry, buildings, aircraft and ships follow the same pattern with
their own classes (`InfantryTypeClass`, `BuildingTypeClass`, `AircraftTypeClass`, `VesselTypeClass`), each with
differences of its own.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| Enum value | `UnitType` in `DEFINES.H`, before `UNIT_COUNT` | The type's number |
| Constructor | a static `UnitTypeClass` in `UDATA.CPP` | Fixed facts: name, art name, geometry, flags |
| Registration | `UnitTypeClass::Init_Heap` | Puts the type in the heap, **in enum order** |
| `rules.ini` section | `[YOURUNIT]` | Stats: strength, speed, cost, weapons, owner, prerequisite |
| Classic image | `<Image>.SHP`, in a MIX your DLL opens | Needed even in HD-only mods (below) |
| Weapons | `rules.ini` weapon, warhead and projectile sections | What it fires |
| Sounds | the DLL's sound table and the launcher's sound XML | See [TD sounds from the base game](../using-what-the-player-owns/td-sounds-from-the-base-game.md) |
| HD art, sidebar entry, cameo | the launcher's tilesets and buildables | See [HD tilesets and ZIPs](../art/hd-tilesets-and-zips.md) and [Sidebar cameos](../art/sidebar-cameos.md) |
| Name and description | text IDs | See [New text strings](../launcher-data/new-text-strings.md) |

## 1. The enum and the constructor

Add your type to `UnitType` before `UNIT_COUNT`. Then add a constructor. Red Alert's takes the type, a text ID, the
INI name, the death explosion, then **geometry**, then flags:

```cpp
static UnitTypeClass const UnitMyTank(
    UNIT_MYTANK,
    TXT_MTANK,          // text ID (a placeholder; rules.ini's Name= gives the in-game name)
    "MYTANK",           // INI name: the rules.ini section, and the default art name
    ANIM_FRAG1,         // death explosion
    REMAP_NORMAL,
    0x0040,             // vertical offset
    0x0080, 0x0018,     // primary weapon: offset along the turret, lateral offset
    0x0080, 0x0018,     // secondary weapon: offset, lateral
    true, false, true, false, false, false,  // goodie, nominal, crusher, harvester, stealthy, insignificant
    true, false, false, false,               // turret, radar dish, firing anim, lock turret
    true, false, false, false,               // gigundo, animating, jammer, gap generator
    32,                 // rotation stages (facings)
    0,                  // turret offset along the body
    MISSION_HUNT        // default order
);
```

The offsets are in leptons (256 to a cell), and only the constructor sets them: `rules.ini` can't. Copy them from a
stock unit of similar size, then tune them by eye. For a turret, see [Turrets](turrets.md).

## 2. Registration: keep heap order and enum order the same

`UnitTypeClass::Init_Heap` creates each type with `new UnitTypeClass(...)`. Lookups by type go through
`UnitTypes.Ptr(type)`, the *n*th slot of the heap. So the slots must be filled in exactly the enum's order.

> [!WARNING]
> **A registration out of order shifts every type after it,** with no error. Every later type then reads its
> neighbour's data. In one mod, a helipad built a construction yard and an AI's MCV deployed a helipad, until the
> registrations were moved to match the enum. Append new types at the end of both the enum and `Init_Heap`, in
> the same order.

Stock Red Alert sizes each type heap to exactly its enum's count (`UnitTypes.Set_Heap(UNIT_COUNT)` in `INIT.CPP`).
A type you add to the enum grows the heap with it. Types created at run time from INI data, as some extension
DLLs do, need spare slots: see [Raising the limits](raising-the-limits.md).

## 3. The `rules.ini` section

A section named after the INI name holds everything `rules.ini` can set: `Strength`, `Armor`, `Speed` (a
percentage, 0 to 100), `Cost`, `TechLevel`, `Owner`, `Prerequisite`, `Primary`, `Secondary`, `Sight`, `ROT`,
`Tracked`, `Crusher`, `Passengers` and the rest. Two keys worth knowing:

- **`Image=`** sets the art name, so several types can share one set of shapes. Every techno type reads it.
- **`Tracked=yes`** uses track speeds instead of wheel speeds. In stock `rules.ini`, clear ground is 80% for
  tracks and 60% for wheels, and rough ground 70% and 40%.

Ship your `rules.ini` in your mod's `CCDATA/` folder.

## 4. A classic image, even in an HD-only mod

At start-up, `UnitTypeClass::One_Time` loads `<Image>.SHP` into the type's `ImageData`. The HD export
(`Techno_Draw_Object_Virtual`) does nothing at all when that pointer is null. **A unit with no classic image is
never sent to the launcher, so it's invisible**, however good its HD art.

So ship a classic shape for every new type. The launcher draws the HD art by name, so the classic shape's pixels
are never seen in an HD-only mod, but its **frame size** is used. `UnitTypeClass::Dimensions` sets the unit's
selection box to three-quarters of the image's largest frame side, at most 48 classic pixels, and the launcher
sizes the box from that (see [Building selection boxes](../art/building-selection-boxes.md)). A new bullet with no
classic shape drew at a fallback size, as a large block.

Three ways to supply one, each in use in a shipped mod:

- **The original game's own shape.** A Tiberian Dawn unit can use TD's classic shape, copied from TD's MIX
  under your unit's art name.
- **A transparent stub.** For a unit with no classic art at all, generate a shape whose frames are fully
  transparent. Give it the frame size you want the selection box to follow, and as many frames as the HD art has.
- **Another type's image (a donor).** Point the new type's `ImageData` at a stock type of the same size after
  `One_Time` has run. This is quick for infantry, but the box is then the donor's.

Put the shapes in a MIX archive of your own (see [MEG and MIX archives](../formats/meg-and-mix-archives.md)), ship it
in `CCDATA/`, and have the DLL open it at start-up the way EA opens its own:

```cpp
if (CCFileClass("MYMOD.MIX").Is_Available()) {
    new MFCD("MYMOD.MIX", &FastKey);
}
```

Animations differ: one with a null `ImageData` draws as a green placeholder instead of nothing. Give it another
animation's `ImageData`, and its HD tile is then still found by name.

## 5. Weapons and sounds

A weapon is a `rules.ini` section (`Damage`, `ROF`, `Range`, `Projectile`, `Warhead`, `Burst` and more). It names a
projectile and a warhead, each its own section. `Burst=2` gives a two-shot volley. A weapon or warhead *coded* in
the DLL also has to fit its heap, sized by `rules.ini`'s `[Maximums]`: see
[Raising the limits](raising-the-limits.md).

A sound plays by name: add it to the DLL's sound table, and route it in the launcher's sound XML. See
[TD sounds from the base game](../using-what-the-player-owns/td-sounds-from-the-base-game.md).

## How it was verified

- **EA's source:** the `UnitTypeClass` constructor and a stock tank's values (`UDATA.CPP`); `Init_Heap`, and
  `As_Reference` reading `UnitTypes.Ptr(type)`; `UnitTypes.Set_Heap(UNIT_COUNT)` (`INIT.CPP`); `One_Time` loading
  `ImageData` with `MFCD::Retrieve`; the null check in `Techno_Draw_Object_Virtual` (`TECHNO.CPP`); `Image=`
  (`TECHNO.CPP`), `Tracked=` (`UDATA.CPP`) and `Burst=` (`WEAPON.CPP`); and `new MFCD(...)` for EA's own MIXes.
- **The game's files:** stock `rules.ini`'s land speeds, from `REDALERT.MIX`.
- **A working mod:** dozens of added vehicles, each with a classic shape in its own MIX: TD's real shapes for TD
  units, transparent generated stubs sized to each unit for the rest, and donor images for some infantry. Also the
  heap-order bug and its fix, and the invisible unit and green placeholder seen before the shapes went in.
- **The box size:** `UnitTypeClass::Dimensions` and `One_Time`'s largest-frame measure in EA's `UDATA.CPP`.

**Credit:** DontCryJustDie suggested sharing one set of shapes between types through `Image=` to save video
memory.

> [!TIP]
> **In Tiberian Factions**
>
> TF adds Tiberian Dawn's and Tiberian Sun's vehicles this way, each appended to the end of the enum and the heap.
> Its classic shapes live in one MIX of its own, opened at start-up: TD's own shapes for TD units, and transparent
> stubs for Tiberian Sun and C&C3 units (the Titan's stub has 128 frames, matching its HD art). A TD unit's HD art
> comes from the base game, and the classic shape only sets its size.
