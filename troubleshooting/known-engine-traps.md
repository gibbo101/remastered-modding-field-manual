---
title: Known engine traps
description: Crashes and misbehaviour in EA's released Red Alert source that any DLL mod built from it inherits. The mod search-path buffer overruns with about four mods enabled; another folder's RULES.INI is read before yours; a sidebar column of exactly 75 entries writes past its array; the name table fills; a crate that destroys the unit driving onto it leaves a call on a dead unit; a misspelt INI key makes Inaccurate=yes do nothing; fixes under switches that are off (FIXIT_HELI_LANDING, TOFIX) never compile; a dead target's coordinate is the map's origin. Production contracts new code must keep: orders never ask Can_Build, Get_Quantity counts from production start, an entry with production in flight must stay, a builder must be freed, a cheap refinery gets no harvester, the draw export's name can be NULL. Each with its fix.
tags: [troubleshooting, crashes, engine, dll, ini, sidebar, crates, projectiles, defines, targets, production]
holds_for: Steam build 21590013
status: verified
unproven: [whether the stock RedAlert.dll shipped with the game behaves exactly as EA's released source on each trap, the order in which the launcher registers enabled mods' folders]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Known engine traps

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod ships a DLL built from EA's released source, directly or through Vanilla Conquer. Each trap below is
in EA's own code, so your DLL has it too unless you've fixed it. Most of them stay hidden in the stock game and
only show once a mod grows it: more mods enabled, more buildable types, crates in a busy game. A data-only mod
runs on the stock DLL and can't change them, though the two INI traps (another folder's `RULES.INI`, the misspelt
key) still apply to it.

## More than about four mods enabled: the search path overruns

The DLL collects each enabled mod's folder (`CNC_Add_Mod_Path`). When a game starts, `Set_Content_Directory`
joins them all, with the game's content folder, into one `;`-separated list, and hands it to
`CDFileClass::Set_Search_Drives`. That copies the list into `RawPath`, a **512-byte** buffer, with `strcat` and
no length check (`CDFILE.CPP`). A Remastered mod path runs to dozens of characters (a Workshop item's path is
longer still), so about four enabled mods fill it. The copy then writes past the end, over whatever follows, and
the game can crash.

**Fix:** make `RawPath` far bigger, and skip the copy when the list won't fit rather than writing past the end.
Tiberian Dawn's DLL has the same code and the same buffer.

**Credit:** found by DontCryJustDie.

## Another folder's RULES.INI is read before yours

The DLL opens `RULES.INI`, `AFTRMATH.INI` and `MPLAYER.INI` by bare name (`CCFileClass("RULES.INI")`). The file
system then takes the **first** match in this order (`CDFileClass::Set_Name`):

1. the bare name, relative to the process's current directory;
2. each search drive in turn: every enabled mod's folder, then the game's content folder.

So a `RULES.INI` in the current directory, or in any enabled mod's folder registered before yours, is read instead
of yours, whole. Your units and weapons then lose their stats. A player who once dropped a `rules.ini` into a
folder for an old mod, or who runs a small rules mod beside yours, breaks your mod without either of you knowing.

**Fix:** load your own INIs from your own mod folder. Find it from the DLL's own path
(`GetModuleHandleEx` with `GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS`, then `GetModuleFileName`), and open the files
by full path. If you want other mods to be able to override your rules on purpose, check that a found file is
really yours (for example, that it has one of your own sections) before using it, and fall back to your copy if
it isn't.

**Credit:** found by DontCryJustDie, whose own mod loads these INIs from its folder only.

## A sidebar column of exactly 75 entries writes past its array

`SidebarClass::StripClass::Add` guards with `if (BuildableCount <= MAX_BUILDABLES)`, then writes
`Buildables[BuildableCount]`. With `MAX_BUILDABLES` 75, a column's 76th item (index 75) is written one past the
end of the array, corrupting whatever follows the sidebar object (`SIDEBAR.CPP`). The same check is in the GlyphX
sidebar (`SIDEBARGlyphx.CPP`), which the DLL keeps per player for the launcher (`DLLExportClass::MultiplayerSidebars`). Stock Red Alert never comes near 75 items
in a column. A mod with several factions' trees can.

**Fix:** change the guard to `<`, and raise `MAX_BUILDABLES` to fit your largest column, in both files. CFE Patch
Redux fixes the same guard (its `Chthon CFE Note` in `SIDEBAR.CPP`).

The GlyphX sidebar also closes the gap after a removed entry with an overlapping `memcpy`: see
[Porting CFE Patch Redux](../engine/cfe-patch-ports.md).

## About 25 named types fill the name table

Every unit, building or other type whose INI section sets `Name=` takes a slot in `NameOverride`, a table of 25
(`GLOBALS.CPP`, filled in `TechnoTypeClass::Read_INI` in `TECHNO.CPP`). Three things combine:

- **There's no de-duplication.** The game reads `rules.ini` and then `aftrmath.ini`, so a type named in both takes
  two slots.
- **When the table is full, new names are silently dropped.**
- **The lookup can't reach the last slot.** `Text_String` (`INLINE.H`) tests `abs(string) < ARRAY_SIZE(NameOverride)`
  and then reads slot `-(string + 1)`, so slot 24 is never returned.

A mod that keeps adding named types runs out of slots, and a name comes back `NULL`. In a working mod that showed as
a crash when a refinery was placed or an MCV deployed, at around the 30th type. The crash is in `InstanceServerG.exe`,
the process your DLL runs in, not the launcher: the export's `OverrideDisplayName` is a `const char*`
(`DLLInterface.h`), copied into a string there, and a `NULL` crashes the copy. Stock Red Alert names few enough types
never to hit it.

**Fix:** make the table much bigger (one working mod uses 256), skip a type already in the table before taking a
new slot, change the lookup test to `<=`, and treat a `NULL` name as no override.

## A crate that kills the unit driving onto it

When a unit starts towards a cell, `FootClass::Start_Driver` checks the cell for a crate (`Goodie_Check`). An
explosion or napalm crate damages the unit (`Take_Damage`, `CELL.CPP`), and can destroy it there and then.
`Start_Driver` notices (`if (!IsActive) return(false);`), but its caller doesn't: `DriveClass::Start_Of_Move`
answers a false return by calling `Set_Speed(0)`, a **virtual** call, on the unit that's just been destroyed
(`DRIVE.CPP`). EA's own `UnitClass::Start_Driver` carries the warning in a comment: "IsActive can be cleared by
Start_Driver".

**Fix:** after any call that can pick up a crate (`Start_Driver`, `Per_Cell_Process`), check `IsActive`, and
return at once if the unit is gone. A working mod linked it to crashes in LAN games with crates on, which stopped
after the fix.

## `Inaccurate=yes` does nothing: the key is spelt `Inaccuate`

`BulletTypeClass::Read_INI` reads a projectile's inaccuracy from the key `Inaccuate`, one letter short
(`BBDATA.CPP`). Stock `rules.ini` documents and sets `Inaccurate=yes`, on `FROG`, `HeatSeeker`, `Lobbed`, `Catapult`
and `Ballistic`, and the game never reads it. Those projectiles still scatter when fired on the move, or when an
armour-piercing or fuelled shot is aimed at infantry or the ground (`BulletClass::Unlimbo`), but not by type. Your
own `Inaccurate=yes` is ignored the same way.

**Fix:** in a DLL, read both spellings, the correct one second so it wins. A data-only mod can write
`Inaccuate=yes`, which the stock DLL reads. Mind the balance: turning it on for the stock projectiles changes every
stock weapon that uses them. Vanilla Conquer keeps EA's spelling.

## A fix in an `#ifdef` that never compiles

Some of EA's code sits under switches that are off, and a change made there does nothing. `DEFINES.H` turns on
most of the `FIXIT_` switches, and comments out three of them under the note "These fixes will cause the game to go
out of sync": `FIXIT_ENGINEER_CAPTURE`, `FIXIT_HELI_LANDING` ("Fixes so new helicopters land at free helipad") and
`FIXIT_MINE_PASSABLE`. `TOFIX` is never defined at all, and guards code in 15 places in Red Alert's `.CPP` files,
such as the Hind's fast-flight frames and the credits a harvester's per-bail unload returns.

So the live branch is often the `#else`. In `HouseClass::Place_Object`, a finished helicopter's exit is the
`#else` of `FIXIT_HELI_LANDING`: it asks `Who_Can_Build_Me` for a builder "in theory", so it can leave from any
helipad, free or not. A change written into the `#ifdef` half compiles and is never run.

**Fix:** before patching code under an `#ifdef`, look the switch up in `DEFINES.H`, and patch the branch that
compiles. On Vanilla Conquer, look in its own `redalert/defines.h`: it keeps `FIXIT_HELI_LANDING` and
`FIXIT_MINE_PASSABLE` off and `TOFIX` undefined, but turns `FIXIT_ENGINEER_CAPTURE` on.

## A dead target's coordinate is the map's origin

`As_Coord` (`TARGET.CPP`) turns a target into a coordinate. When the target isn't legal, which includes an object
that has been destroyed (`Target_Legal` returns its `IsActive`), it returns `0x00000000`: the top-left corner of
the map, not an error. Code that measures a distance or aims at `As_Coord(target)` after the target has died works
with that corner instead. A projectile timed by its distance to the target, for example, then lives as long as a
flight across the whole map.

**Fix:** test `Target_Legal(target)` before using `As_Coord(target)`, and pick your own fallback. Vanilla Conquer's
`target.cpp` returns the same zero.

## Production contracts that catch new code out

None of these is a bug in the stock game, which never reaches them. Each catches a mod that adds caps, cooldowns
or new kinds of building:

- **Ordering never asks `Can_Build`.** `HouseClass::Can_Build` decides what the sidebar offers: `Update_Buildables`
  adds what it allows, and runs when the house's buildings change. An order goes through
  `DLLExportClass::Construction_Action`, which only checks the item is in the sidebar's list, and then
  `HouseClass::Begin_Production`, which doesn't call `Can_Build` either. So a cap or cooldown written into
  `Can_Build` doesn't stop orders for a cameo already showing. A sidebar entry stays until no factory could build
  it, even in theory (`StripClass::Recalc` asks `Who_Can_Build_Me`). Refuse capped orders in `Begin_Production`.
- **`Get_Quantity` counts from the start of production.** `FactoryClass::Set` creates the object as soon as
  production starts, and its constructor counts it (`Tracking_Add`), so `BQuantity` includes a building still being
  built. For a cap on standing buildings, count the buildings yourself.
- **Never drop a sidebar entry with production in flight.** Cancelling and placing find the factory through the
  sidebar entry (`Construction_Action` reads its `Factory`). If your mod removes entries more eagerly than stock,
  for example when a prerequisite is lost, skip any entry whose `Factory` isn't `-1`. Otherwise the house's factory
  is left with no entry to cancel or place it, and that column can't build again.
- **A building that skips `MISSION_CONSTRUCTION` must free its builder.** When construction ends, that mission
  sends the yard `RADIO_OVER_OUT` and runs `Grand_Opening` (`BUILDING.CPP`). `Who_Can_Build_Me` skips a builder
  still in radio contact (`OBJECT.CPP`), so a building that bypasses the mission and doesn't send it leaves the
  yard unable to place anything again.
- **A cheap refinery gets no free harvester.** A human player's refinery brings its harvester only if it was free
  (`PurchasePrice` 0) or cost more than its `Raw_Cost`, which is the refinery's cost minus a harvester's
  (`BuildingClass::Grand_Opening`, `BDATA.CPP`). A cheat or test lever that charges a token price stops the free
  harvester. Give credits instead.
- **The draw export's name can be `NULL`.** Most unit and building draws call `CC_Draw_Shape` without a shape
  name, and `DLL_Draw_Intercept` then fills the object's `AssetName` from the type's graphic name. Code in the
  intercept that keys on `shape_file_name` misses them. Key on the final `AssetName`.

## How it was verified

Each trap three ways:

- **EA's released source shows the bug:** `RawPath[512]` and the unchecked `strcat` in both games'
  `CDFILE.CPP` (the active `Set_Search_Drives`, not the `#if 0` copy), and `Set_Content_Directory` joining every
  mod path; the search order in `CDFileClass::Set_Name` and the bare-name loads in `INIT.CPP`, `SCENARIO.CPP` and
  `SAVELOAD.CPP`; the `<=` guard and `MAX_BUILDABLES=75` in `SIDEBAR.H`, `SIDEBAR.CPP` and `SIDEBARGlyphx.CPP`;
  the crate chain through `FOOT.CPP`, `CELL.CPP` and `DRIVE.CPP`, with `Set_Speed` declared `virtual` in
  `FOOT.H`; `NameOverride[25]` in `GLOBALS.CPP`, its fill loop in `TECHNO.CPP` and the `<` test in `INLINE.H`; the
  `"Inaccuate"` key in `BBDATA.CPP`, in the Remastered source, in EA's original Red Alert source and in Vanilla
  Conquer's `bbdata.cpp`, and its use in `BULLET.CPP`. Vanilla Conquer inherits the search-path code unchanged.
  The switches: the commented-out `FIXIT_` lines and their note in `DEFINES.H`, no definition of `TOFIX` anywhere
  in the source tree, its 15 `#ifdef TOFIX` lines counted over the `.CPP` files, and the helicopter branch in
  `HOUSE.CPP` with `Who_Can_Build_Me`'s "in theory" test (`OBJECT.CPP`); Vanilla Conquer's `redalert/defines.h`
  for its own settings. The dead target: `As_Coord`, `Target_Legal` and its `IsActive` test in `TARGET.CPP`, and
  the same zero in Vanilla Conquer's `target.cpp`. The production contracts: `Begin_Production` (`HOUSE.CPP`) and
  `Construction_Action` (`DLLInterface.cpp`) with no `Can_Build` call, `Can_Build`'s callers in
  `Update_Buildables` (`BUILDING.CPP`) and the house's recalc in `HouseClass::AI`, the `Who_Can_Build_Me` test in
  `SIDEBARGlyphx.CPP`'s `Recalc`; `Tracking_Add` in the `BuildingClass` constructor and `Create_One_Of` in
  `FactoryClass::Set`; the entry's `Factory` read in `Construction_Action`; `RADIO_OVER_OUT` and `Grand_Opening`
  at the end of `Mission_Construction`, and the radio-contact test in `Who_Can_Build_Me`; the `PurchasePrice` test in
  `Grand_Opening` and `BuildingTypeClass::Raw_Cost` in `BDATA.CPP`; the nameless `CC_Draw_Shape` in `CONQUER.CPP`
  passing `NULL`, and the `Graphic_Name` fallback in `DLL_Draw_Intercept`.
- **The game's files:** stock `rules.ini` (from `REDALERT.MIX`) sets `Inaccurate=yes` on five projectiles and
  never the key the code reads.
- **A working mod hit each one:** the search-path crash, reported by another modder running several mods; another
  rules mod's `RULES.INI` replacing its own; the sidebar overrun and the name table, both found as its roster grew; and the crate crash,
  found from minidumps. The name table's crash was a string built from `NULL` in `InstanceServerG.exe`. Its
  projectile code reads both spellings of the inaccuracy key. A helicopter-placement fix of its own did nothing
  until it moved from the `FIXIT_HELI_LANDING` half to the `#else`. A flame projectile timed by its distance to a
  target lived map-wide once the target died, until it tested `Target_Legal` first. Its unit caps refuse orders in
  `Begin_Production` and count standing buildings; its sidebar skips entries with production in flight; a building
  that installs without `MISSION_CONSTRUCTION` locked the yard out of placing until it sent `RADIO_OVER_OUT` and ran
  `Grand_Opening`; a token-price test lever lost the free harvester, so it gives credits instead; and its draw
  intercept keys its per-unit changes on `AssetName`.
- **The fixes** are in that mod's code and released, and the crashes stopped.
- **Unproven:** that the stock `RedAlert.dll` behaves exactly as the released source on each trap (it's built from
  it, but the binary wasn't checked), and the order in which the launcher registers enabled mods' folders, which
  decides which mod's file wins.

> [!TIP]
> **In Tiberian Factions**
>
> TF fixed all of them. It hit the sidebar limit first, once its TD and Tiberian Sun trees joined Red Alert's; its
> columns now hold 120. DontCryJustDie reported the search-path crash and the rules trap from his own mod's
> experience. TF loads its rules from its own folder, unless a found `RULES.INI` carries TF's sections, and reads
> both spellings of the inaccuracy key. Its `rules.ini` sets the five stock projectiles to `Inaccurate=no`, so they
> stay as accurate as Red Alert has always played them.
