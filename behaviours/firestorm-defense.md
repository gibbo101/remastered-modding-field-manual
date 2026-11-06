---
title: Firestorm Defense
description: "Tiberian Sun's Firestorm Defense in Red Alert, which has nothing like it: a charge-drain superweapon toggled from the sidebar, wall sections that become a lethal, shot-eating field, and line-fill placement for every wall; OpenTS and TS's rules as the model."
tags: [behaviours, firestorm, superweapons, walls, tiberian-sun, dll]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
status: verified
unproven: [the enemy-side checks in a LAN game]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Firestorm Defense

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod wants a toggled defensive field, like Tiberian Sun's Firestorm Defense, or a superweapon that drains
while it's on. Red Alert has neither: EA's source has no firestorm and no charge-drain superweapon. A mod without
them doesn't need this page.

## How Tiberian Sun does it

From TS's `RULES.INI` and OpenTS (`super.cpp`, `house.cpp`, `building.cpp`, `bullet.cpp`):

- **A charge-drain superweapon** (`UseChargeDrain=true`). While on, the field drains the charge. Turned on, the
  drain time is the charge × `ChargeToDrainRatio` (.333, so a full charge buys about a minute). Turned off early,
  each frame of drain left comes back as three frames of charge (1 ÷ .333), and the weapon stays usable while it
  charges on, so a part charge buys a shorter field. It can be raised in any state except charging from zero. A
  drain that runs out, low power, or losing the last generator drops the field and starts the charge from zero.
- **A section costs $250.** TS's own `RULES.INI` says `Cost=50` for `[GAFSDF]`, but TS's executable, as OpenTS
  reconstructs it, charges 250 whatever the rules say.
- **Every wall section the house owns goes live**, anywhere on the map. A live section blocks everyone, its owner
  included, and kills anything standing on it or moving in.
- **Aircraft over a live section die,** at any height.
- **`IgnoresFirestorm=yes` passes the field** untouched: TS sets it on its two Hunter Seekers.
- **Shots are eaten:** a projectile entering a live cell is deleted unless the wall's owner fired it, and instant
  weapons stop at the first live cell of another house's wall.
- **A live section takes no damage.** Each hit drains the field instead (damage × 0.1).
- **Line fill:** placing a section within 5 cells, in a straight line, of another of the house's sections fills
  the gap.

## The method in Red Alert's DLL

1. **The superweapon:** add a drain state to `SuperClass`: start a drain sized from the charge, stop it early and
   bank the remainder, and drop it on low power or when the last generator goes.
2. **The toggle:** a superweapon cameo in Red Alert normally needs a target. TS's Firestorm toggles on one click.
   That takes a launcher patch on the cameo click, which then arrives as a build request your DLL turns into the
   toggle. See [Patching the launcher's code from your DLL](../clientg-ram/patching-the-launchers-code.md).
3. **The field, every frame:** kill what stands on live sections (own units too), and aircraft over them. Make live
   sections block movement, and passable again while the field is down.
4. **Shots:** in `BulletClass::AI`, delete a projectile in a hostile live cell. Cut instant shots at the first live cell
   of another house's wall on their path at launch.
5. **Sections as buildings:** 1×1, not selectable. Their frame comes from their neighbours (north, east, south, west
   as 1, 2, 4, 8), plus an offset while live. Make them sellable only while the field is down.

## Line fill, for every wall

The same fill works for any wall. When a wall is placed in a straight line within a few cells of another of the
house's walls of the same type, and every cell between is clear, fill the gap, charging for each piece. The launcher
owns the placement ghost, so the line appears only when the second end is placed.

## Traps

- **Flying aircraft take half damage.** Red Alert's `AircraftClass::Take_Damage` halves it ("Flying aircraft take
  half damage"), so double the field's damage to airborne targets to kill them.
- **Sections chain only from your own sections,** and the placement ghost's distance map is the real gate, so
  limit it there too.
- **Wall seams.** Keep wall-section classic stubs even, or each piece lands half a classic pixel (about 2.7 HD
  pixels) off its neighbour (see [Gates](gates.md)).
- **One click counts once.** The launcher can deliver a click more than once, so ignore repeats within a fraction
  of a second.

## How it was verified

- **What stock Red Alert lacks:** `grep -a` over EA's Red Alert source finds no firestorm or charge drain.
- **TS's model:** TS's `RULES.INI` (`UseChargeDrain=true`, `ChargeToDrainRatio=.333`, `[GAFSDF]` `Cost=50`,
  `IgnoresFirestorm=yes` on `[GHUNTER]` and `[NHUNTER]`, the section and generator entries) and OpenTS's `super.cpp`
  (`Discharged`: the leftover drain divided by the ratio; `Can_Place`: anything but `CHARGING`), `techtype.cpp`
  (`GAFSDF`'s cost forced to 250), `house.cpp`, `building.cpp`, `bullet.cpp` and `map.cpp`.
- **The same rules in Red Alert:** the working mod's charge-drain `SuperClass` refunds three frames of charge per
  frame of drain left and keeps a part-charged weapon usable, charges $250 a section, and spares its Hunter Seeker.
- **A working mod:** the generator, sections, field, toggle and line fill in its release, played under Proton on
  Linux and on the Steam Deck.
- **Unproven:** the enemy-side checks in a LAN game.

> [!TIP]
> **In Tiberian Factions**
>
> TS GDI's Firestorm Generator raises the field with one click on its cameo, and drops it with another, banking
> what's left. Sections cost $250, as in TS. Line fill works for every wall in the mod, from sandbags to
> Firestorm sections.
>
> ![A live Firestorm wall](img/firestorm-wall-live.jpg)
>
> TS GDI's Firestorm Generator with the field up: its core glows blue, and so does the wall line beside it, posts and bars alike.
