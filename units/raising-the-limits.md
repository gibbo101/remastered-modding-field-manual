---
title: Raising the limits
description: How many types and objects Red Alert allows, where each limit lives (type heaps sized by enum, rules.ini [Maximums] for live objects and for weapon and warhead types, AI-only per-house caps, the 75-entry sidebar column with its stock off-by-one), and what raising each one touches.
tags: [units, limits, heaps, rules-ini, sidebar, dll]
holds_for: Steam build 21590013
status: verified
unproven: [how many objects the launcher's object-list buffer holds before the export refuses a frame]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Raising the limits

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod adds many new types, or lets players build far more than stock Red Alert does. Each limit below is
in a different place. Some are data, some are DLL code, and one is a stock bug waiting for a mod big enough to hit
it.

## The limits

| Limit | Stock value | Where it lives | Raise it with |
|---|---|---|---|
| Unit, building, infantry, aircraft, ship, bullet and anim **types** | exactly the enum's count | `X_Types.Set_Heap(X_COUNT)` in `INIT.CPP` | Nothing, for types in the enum: each heap grows with it. Spare slots only for types made at run time. |
| **Weapon** types | 55 | `rules.ini` `[Maximums]` `Weapon=` (`Weapons.Set_Heap(WeaponMax)`) | `rules.ini`, but see the trap below |
| **Warhead** types | 10 | `[Maximums]` `Warhead=` | the same |
| **Projectile** types | 20 in `[Maximums]` | read, but never used | Nothing: projectiles are the `BULLET_COUNT` enum |
| Live **units, infantry, buildings** | 500 each | `[Maximums]` `Unit=`, `Infantry=`, `Building=` (object heaps in `INIT.CPP`) | `rules.ini` |
| Live **aircraft, ships** | 100 each | `[Maximums]` `Aircraft=`, `Vessel=` | `rules.ini` |
| Bullets, anims, factories, teams | 50, 100, 32, 60 | `[Maximums]` | `rules.ini` |
| Per-house unit and infantry caps | a sixth of the global cap, adjusted per scenario | `HouseClass::Control.MaxUnit` and the rest | These throttle only the **AI's** production (`AI_Unit`, `AI_Infantry`). Human players aren't capped by them. |
| Entries in one **sidebar column** | 75 | `MAX_BUILDABLES` in `SIDEBAR.H` | DLL code, and fix the off-by-one (below) |
| Types with a `Name=` override in the INI | 25, with no de-duplication and the last slot unreachable | `NameOverride` in `GLOBALS.CPP` | DLL code, with the lookup fixed: see [Known engine traps](../troubleshooting/known-engine-traps.md) |
| Cells in a building's footprint | 36 | `MAX_OCCUPY_CELLS` in `DLLInterface.h` | Can't: it's part of the interface the launcher reads |

## Traps

> [!WARNING]
> **A coded weapon or warhead past `[Maximums]` shifts every one after it.** The weapon and warhead heaps are
> sized from `rules.ini`'s `Weapon=` and `Warhead=`, then filled with the types coded in `RULES.CPP`. Stock Red
> Alert codes 43 weapons against a cap of 55, and 9 warheads against 10. Add one coded type too many and its
> allocation fails silently, and every later weapon reads the wrong slot. Size each heap to at least its enum's
> count in code, not only in data:
>
> ```cpp
> WeaponMax  = max(WeaponMax,  (int)WEAPON_COUNT);
> WarheadMax = max(WarheadMax, (int)WARHEAD_COUNT);
> ```

- **The 75-entry sidebar column has a stock off-by-one** that crashes the game at the 76th entry. Fix the test
  before raising `MAX_BUILDABLES`: see [Known engine traps](../troubleshooting/known-engine-traps.md).
- **Prerequisites stop at 32 building types.** `Prerequisite=` is a 32-bit bitfield, and stock Red Alert already
  fills it: see [Porting Tiberian Dawn buildings and defences](porting-td-buildings-and-defences.md).
- **Spare type slots for run-time types.** A DLL that creates types from INI data at run time (a `[NewUnits]`-style
  list, as some extension mods do) needs spare heap slots, since the stock heap is exactly full. Such types also sit
  past the enum, so every loop bounded by `UNIT_COUNT`, such as the sidebar's list of what can be built, has to
  iterate the heap's own count instead (`UnitTypes.Count()`).
- **More types change your saves.** `HouseClass` keeps per-type arrays (`BQuantity[STRUCT_COUNT]`,
  `UQuantity[UNIT_COUNT]`, `IQuantity[INFANTRY_COUNT]`), so every new type grows a saved class. See
  [Save versions](../engine/save-versions.md).
- **The launcher's object list is variable length**, but its buffer isn't unlimited. When a frame's objects don't
  fit, the DLL refuses the whole object export for that frame (`memory_needed >= buffer_size`). **Unproven:** how
  many objects that is.

## How it was verified

- **EA's source:** the type heaps (`INIT.CPP`), the object heaps and their `Rule.*Max` sizes, `RULES.CPP` reading
  `[Maximums]` (including `ProjectileMax`, which nothing uses) and filling the weapon and warhead heaps, the AI-only
  use of `MaxUnit` and `MaxInfantry` (`HOUSE.CPP`), `MAX_BUILDABLES` and the `<=` test (`SIDEBAR.H`,
  `SIDEBAR.CPP`), `HouseClass`'s per-type arrays (`HOUSE.H`) and the object export's buffer check
  (`DLLInterface.cpp`).
- **The game's files:** stock `rules.ini`'s `[Maximums]`, from `REDALERT.MIX`.
- **A working mod:** it hit the sidebar crash at 75 entries, and a misaligned weapon heap when its coded weapons
  outgrew `[Maximums]`. Both are fixed as above, and its columns hold 120.

> [!TIP]
> **In Tiberian Factions**
>
> With five factions' tech trees, TF hit the 75-entry column first. Its columns hold 120, its weapon and warhead
> heaps always fit every coded type, and its building and unit heaps keep 50 spare slots. Its `[Maximums]` follow
> NightFalcon101's Moderate Warfare values: 9999 live units, infantry, buildings, aircraft and ships, and 100 each
> of weapon, warhead and projectile types.
