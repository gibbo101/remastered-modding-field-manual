---
title: Save versions
description: Red Alert's save version is the sum of its saved classes' sizes, so growing a class breaks old saves, and EA's Load_Game reads the DLL's save data before the version check; lead the DLL's save data with your own marker and version. Loading re-constructs each object in place, so a field with a default in its declaration is reset on every load.
tags: [engine, saves, dll]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
clientg_sha256: d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897
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
- **There's no padding to grow into on a Vanilla Conquer base.** EA's saved classes end in a spare
  `SaveLoadPadding` array that a patch could take fields from; Vanilla Conquer removed it. See
  [Porting CFE Patch Redux](cfe-patch-ports.md).
- **A change of the same size keeps the version,** even if it reorders things. A save then loads with its data
  in the wrong places. Reordering an enum of types is the usual way to do this by accident.

**The trap:** in EA's `Load_Game` the DLL's own save data is read (`DLLLoad`) *before* the version check, and its
result is ignored. So a save from another build is read into the DLL's state before anything refuses it. In a
working mod, old saves crashed rather than being refused (observed).

**The fix:** write your own marker and version first in the DLL's save data (`DLLExportClass::Save`), check them
first in `DLLExportClass::Load`, and make `Load_Game` stop when `DLLLoad` returns false. A save from another build
is then refused before anything else is read. The same leading bytes also let a launcher-side check grey out the
Load button before the player tries: [Save files](../formats/save-files.md) shows how to reach them in a `.sav`.

The load screen already has a refusal of its own to reuse: a save whose custom map is missing gets Load greyed
out and a reason, the `TEXT_LOAD_MISSING_CUSTOM_MAP` text. A launcher patch can send a save your DLL would refuse
down that same path with a reason of its own. In `ClientG.exe` 1.153 (745903), the map check's result is tested
just after `0x64E4D6`, and the reason is pushed at `0x64E540` (`6A 1C 68 1C 20 C1 01`: the text's length, 28, and
its address). This is a launcher code patch, with all the rules and fragility of
[Patching the launcher's code from your DLL](../clientg-ram/patching-the-launchers-code.md).

## Loading re-runs a constructor: no default values in declarations

Red Alert doesn't load objects field by field. For each saved object, the heap's `Load` (`HEAP.CPP`) reads its bytes
straight into the slot, then constructs it again in place with the class's `NoInitClass` constructor
(`new(ptr) T(NoInitClass())`), which is written to leave every field alone.

C++ applies a default given in a field's declaration (`int Kills = 0;`) in every constructor that doesn't set that
field itself, `NoInitClass` included. So a field declared that way is reset on every load, and its saved value is
lost without an error. Give new fields no default in the class body: set them in the normal constructor, and leave
them out of the `NoInitClass` one. Vanilla Conquer loads the same way.

## How it was verified

- **Saves:** `SAVEGAME_VERSION` and the order of `DLLLoad` and the version check in EA's `SAVELOAD.CPP`, with
  `DLLExportClass::Load` reading without checking. A working mod writes its own marker and version first, and
  refuses any other save. The crash on an old save is observed, not traced.
- **The load screen's refusal:** the code round `0x64E4D6` and the push at `0x64E540`, read from `ClientG.exe` on
  disk, with `TEXT_LOAD_MISSING_CUSTOM_MAP` (28 characters) at the pushed address; a shipped mod that hooks both
  sites, checking those stock bytes first, and greys Load with its own reason; and that mod's notes.
- **The constructor on load:** EA's `TFixedIHeapClass::Load` (`HEAP.CPP`: `file.Get(ptr, sizeof(T))` then
  `new(ptr) T(NoInitClass())`), the same two lines in Vanilla Conquer's `heap.cpp`, and CFE Patch Redux, which hit
  it: its 1.8 changelog fixes "veterancy and other mod variables being reset to 0 when loading a saved game in RA",
  and the fix commit moves each field's default out of its declaration and into the constructor. The C++ rule for
  default member initialisers is the language's own.

> [!TIP]
> **In Tiberian Factions**
>
> TF's updates often grow the game classes, which makes earlier saves unloadable. Its DLL
> writes a `TFS2` marker, the save version and a flags word ahead of everything else. Its load screen then greys
> out the Load button, with a reason, for a save from another build, or for one that needs an add-on pack that
> isn't enabled.
