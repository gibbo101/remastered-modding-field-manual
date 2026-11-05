---
title: Save versions
description: Red Alert's save version is the sum of its saved classes' sizes, so growing a class breaks old saves, and EA's Load_Game reads the DLL's save data before the version check; lead the DLL's save data with your own marker and version.
tags: [engine, saves, dll]
holds_for: Steam build 21590013
status: verified
unproven: [the exact crash an old save causes when loaded into a build with different class sizes; observed, not traced]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Save versions

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod adds units, buildings or anything else that grows a game class in the DLL. It decides whether your
players' saves survive your updates.

## Every class size is the version

Red Alert stamps each save with `SAVEGAME_VERSION` (`SAVELOAD.CPP`). That isn't a number anyone bumps: it's a
constant plus the `sizeof()` of every saved game class (`AircraftClass`, `BuildingClass`, `HouseClass`,
`UnitClass`, the type classes and more). So:

- **Any change that grows a saved class changes the version,** so no save made before the change matches it any
  more. That includes adding a field, or growing a fixed table to hold more types.
- **A change of the same size keeps the version,** even if it reorders things. A save then loads with its data
  in the wrong places. Reordering an enum of types is the usual way to do this by accident.

**The trap:** in EA's `Load_Game` the DLL's own save data is read (`DLLLoad`) *before* the version check, and its
result is ignored. So a save from another build is read into the DLL's state before anything refuses it. In a
working mod, old saves crashed rather than being refused (observed).

**The fix:** write your own marker and version first in the DLL's save data (`DLLExportClass::Save`), check them
first in `DLLExportClass::Load`, and make `Load_Game` stop when `DLLLoad` returns false. A save from another build
is then refused before anything else is read. The same leading bytes also let a launcher-side check grey out the
Load button before the player tries.

## How it was verified

- **Saves:** `SAVEGAME_VERSION` and the order of `DLLLoad` and the version check in EA's `SAVELOAD.CPP`, with
  `DLLExportClass::Load` reading without checking. A working mod writes its own marker and version first, and
  refuses any other save. The crash on an old save is observed, not traced.

> [!TIP]
> **In Tiberian Factions**
>
> TF's updates often grow the game classes, which makes earlier saves unloadable. Its DLL
> writes a `TFS2` marker, the save version and a flags word ahead of everything else. Its load screen then greys
> out the Load button, with a reason, for a save from another build, or for one that needs an add-on pack that
> isn't enabled.
