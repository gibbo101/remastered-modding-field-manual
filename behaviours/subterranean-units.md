---
title: Subterranean units
description: Units that dig, travel underground in a straight line and surface, ported from Tiberian Sun's tunnel locomotion (OpenTS tunnel.cpp) into Red Alert, which has none; the drive-or-dig decision, the state machine, staying a live object while hidden, detection, the EMP, and the dive animation TS made in the engine.
tags: [behaviours, subterranean, movement, tiberian-sun, dll]
holds_for: Steam build 21590013
status: verified
unproven: [saving and loading a game while a unit is underground]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Subterranean units

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only** for the dive art. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When your mod wants units that travel underground, like Tiberian Sun's Subterranean APC and Devil's Tongue. Red
Alert has no such movement: EA's released source has no tunnel locomotion or underground layer. A mod without
digging units doesn't need this page.

## How Tiberian Sun does it

OpenTS's `tunnel.cpp` reconstructs TS's `TunnelLocomotionClass`, and its `unit.cpp` the drive-or-dig decision:

- **Dig unless a short surface route exists.** TS digs on a move order unless the destination is in the same zone,
  within 12 cells, and reachable by a short trial walk.
- **Underground travel is a straight line** through any terrain, water included, at a fixed speed.
- **Surfacing:** on arrival, a blocked cell is swapped for a nearby legal one. With no legal cell anywhere, the unit
  is destroyed. A stop order underground heads for the nearest place it can surface.

## The method in Red Alert's DLL

1. **A state machine on the unit:** idle, turning, digging in, tunnelling, emerging, aborting. Decide to dig when
   the move is assigned: to another zone, or past a distance threshold, but never to an adjacent cell.
2. **Stay a live object, not in limbo.** A unit in limbo has no position in the world, which breaks anything that
   has to find it underground (detection, an EMP). Keep a real `Coord`, tick it along a straight line with no
   pathfinding and no zones, and take it out of cell occupancy and target scans.
3. **Hide it from everyone but allies.** Fold "is tunnelling" into the cloak check (`Is_Cloaked`) for every
   non-ally question, export it to the launcher as cloaked, with its visibility flags cleared for non-allies.
4. **Protect it while under:** no damage unless forced, no firing, no scattering, no unloading.
5. **Let orders aim at anything:** a click on water or a cliff is a legal order, resolved to the nearest cell it can
   surface on.
6. **Surface only on legal ground:** not water, rock, an occupied cell or a building.

The owner sees an earth marker. A useful trick: make the marker the unit's own underground frame, because the
launcher draws an owner's cloaked unit solid. The owner sees the marker, and enemies see nothing.

## Detection, and the EMP

- **Detected means seen, not attackable,** as in TS. A sensor can show buried enemies to its owner as see-through
  copies that can't be targeted.
- **An EMP surfaces a digger:** it's stunned and rerouted to the nearest cell it can surface on, and destroyed only
  if there's none. See [EMP and stun](emp-and-stun.md).

## The dive is made in the engine

Tiberian Sun has no "dive" animation: its art registry has only the dirt mound (`DIG`) and a dirt explosion. The
units tilt nose-down at run time (`IsTilter`). To reproduce it with sprites, render the unit pitched at a few
angles (for example 0, -8, -16, -24, -32 and -40 degrees going down, and the reverse coming up) for 8 facings, snap
the facing at dig start, and play the dirt mound over the top. That's about 112 shapes, which fits under the
128-shape limit on a second draw (see [How the launcher draws sprites](../art/how-the-launcher-draws-sprites.md)).

The order that reads right: tilt first, at ground level and with no dirt; start the dirt mound partway into the
tilt; hide the hull the moment the last step completes, while the mound is still solid. Surfacing mirrors it.

## Traps

- **Not limbo** (above): limbo breaks the EMP and detection.
- **Nothing shared with the cloak system:** use your own underground state, folded into the cloak *check*, not
  the cloak *machine*, which would try to shimmer or reveal it.
- **Decode TS's dirt art without the team-colour remap.** In TS's animation palette, indices 16 to 31 are real dirt
  tones, not house colour.

## How it was verified

- **What stock Red Alert lacks:** `grep -a` over EA's Red Alert source finds no tunnel locomotion.
- **TS's model:** OpenTS's `tunnel.cpp` and `unit.cpp`, and TS's `RULES.INI` (`[SAPC]`, `[SUBTANK]`, `[General]`'s
  `TunnelSpeed`, `DigSound`, `Dig=DIG`) and art registry.
- **A working mod:** both TS digging units in its release, with the behaviour above, played under Proton on Linux
  and on the Steam Deck.
- **Unproven:** saving and loading with a unit underground.

> [!TIP]
> **In Tiberian Factions**
>
> TF's Subterranean APC and Devil's Tongue are crate finds, since they're Nod units in TS. They dig on longer trips,
> a Mobile Sensor Array shows them to its owner, and an E.M. pulse brings them up. The Devil's Tongue fires TS's own
> fire stream, with TS's damage formula worked out for Red Alert's smaller cells.
>
> ![A Subterranean APC digging in](img/subterranean-apc-dive.jpg)
>
> A Subterranean APC on a long move, left to right: on the surface, sinking into its dirt mound, then underground, its selection box still tracking it beyond the ring of dirt it left. Taken from TF's development build with TS Nod, where the APC is built at the Nod War Factory rather than found in crates.
