---
title: A stealth generator
description: A building that cloaks friendly buildings and units around it, driven through Red Alert's existing cloak system; the one missing line that lets buildings cloak, detectors that reveal stationary objects, armed buildings that uncloak to fire, bibs, and the traps that left a base cloaked forever.
tags: [behaviours, stealth, cloak, buildings, tiberian-sun, dll]
holds_for: Steam build 21590013
status: verified
unproven: [why a cloaked armed building failed to fire in play although EA's BuildingClass::Mission_Attack handles FIRE_CLOAKED]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# A stealth generator

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod wants a building that hides its side's base, like Tiberian Sun's Nod Stealth Generator. Red Alert
cloaks only units of a cloaking type (the submarine, and units given `Cloakable=yes`). Its gap generator shrouds
the map, but nothing cloaks buildings. A mod without area cloaking doesn't need this page.

## The method: drive the cloak system you already have

Red Alert's `TechnoClass` has a full cloak machine: `Cloak` runs through uncloaked, cloaking, cloaked and uncloaking,
`Do_Cloak`, `Do_Uncloak` and `Do_Shimmer` move it, and `Cloaking_AI` re-cloaks an object a while after it's ready.
A generator only has to decide **who may cloak**. The machine does the rest.

1. **Each frame,** gather the house's powered, active generators.
2. **Cover:** for each friendly building, unit, infantryman and aircraft within range, set its `IsCloakable` true.
   Skip the generator itself (it stays visible), and units that cloak natively.
3. **Don't force the cloak.** Let `Cloaking_AI` cloak each object when it's ready. Calling `Do_Cloak` every frame
   fights the machine (see Traps).
4. **Restore:** an object that has left coverage, or whose generators are gone, gets `IsCloakable` false and is
   uncloaked.
5. **Detectors:** for each object you cloaked, if an enemy detector (`IsScanner`) is within reveal range, shimmer it
   (`Do_Shimmer`). It re-cloaks by itself when the detector leaves.
6. **Armed buildings ambush:** when a cloaked armed building has a legal target in range, uncloak it so it can fire.
   It re-cloaks after the threat has gone.

Hidden objects stay hidden from the AI too, since `Is_Cloaked` hides them from every non-ally, players and AI alike.

## The engine gaps you have to fill

- **Buildings never copy `IsCloakable`.** EA's unit, infantry and vessel constructors copy their type's cloak flag
  (`IsCloakable = Class->IsCloakable;`), but the building constructor doesn't. Add that line, or no building can
  enter the cloak machine.
- **Detection only runs one way.** EA's `FootClass::Per_Cell_Process` shimmers a cloaked object when *it* moves next
  to an enemy scanner. Nothing reveals a stationary cloaked building, or an idle unit a scanner walks up to. So the
  generator needs the reverse scan (step 5).
- **Bibs are stamped into cells,** not drawn with the building, so cloaking a building leaves its bib showing.
  Hide the bib at draw time while its building is hidden. Don't remove the bib smudge: it also blocks building
  placement, so removing it would let an enemy build into the cloaked base.

## Traps

- **Forcing `Do_Cloak` every frame** fought `Cloaking_AI` and the uncloak-to-fire sequence. Units flickered, fired
  without doing damage, and the cloak state went inconsistent, so reveal and restore stopped working. Only set
  `IsCloakable`, and let the machine cloak.
- **A whole base stayed cloaked after the generator died.** The restore pass ran for one frame, but `Do_Uncloak` only
  *starts* a transition over several frames. The objects never reached "uncloaked", their flag was never reset, and
  `Cloaking_AI` cloaked them again. Keep restoring until a full pass finds nothing left.
- **A helipad never cloaked.** It's always in radio contact with its parked helicopter, and a "don't cloak while in
  radio contact" rule held it visible. Block cloaking only while the partner is actually moving. Aircraft need their
  own cover pass too.
- **Footprints with holes.** Finding which building owns a bib has to walk the building's real footprint, holes and
  all, or some bibs float uncovered.

## How it was verified

- **The cloak machine and its gaps:** EA's `TECHNO.CPP` (the cloak states, `Do_Cloak`, `Do_Uncloak`,
  `Cloaking_AI`), the `IsCloakable` copy in `UNIT.CPP`, `INFANTRY.CPP` and `VESSEL.CPP` but not `BUILDING.CPP`, and
  the one-way scanner shimmer in `FOOT.CPP`.
- **A working mod:** the generator in its release, played under Proton on Linux and on the Steam Deck. The traps
  above were each hit and fixed there.
- **Unproven:** in play, a cloaked armed building (an Obelisk) charged and failed to fire, which is why the ambush
  step exists. But EA's `BuildingClass::Mission_Attack` does handle the "cloaked" fire result by uncloaking, so the
  reason it didn't fire wasn't traced.

> [!TIP]
> **In Tiberian Factions**
>
> Nod's Stealth Generator, behind the Temple of Nod, hides friendly buildings and units within 10 cells. Infantry,
> ships and the Radar Jammer detect it within 3 cells, and its armed defences ambush. The generator stays visible as
> a weak point, so its power cost was halved to 100 in exchange. The Nod AI builds one once it has the Temple.
> On a development branch, Tiberian Sun's own Nod Stealth Generator takes its place (built, not in a release).
>
> ![A cloaked Nod base](img/stealth-generator-cloak.jpg)
>
> A Nod base under its Stealth Generator, as its owner sees it: the Temple, Hand of Nod, refinery and airstrip are faint outlines over their bibs, and the generator stays solid.
