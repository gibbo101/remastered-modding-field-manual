---
title: Launcher key commands and superweapon clicks
description: The launcher, not the DLL, decides what the deploy, select-all and camera-to-yard keys act on, and that a superweapon cameo opens a targeting cursor. Patch ClientG's command jump table to turn a stock key into one of EA's mod commands, and its cameo click handler to send a chosen superweapon to the DLL on one click.
tags: [clientg, code-patch, hotkeys, sidebar, superweapons, advanced]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
clientg_sha256: d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897
status: verified
unproven: [build hotkeys for new types and the superweapon "Cost" line by the same route (not tried), what the launcher does with the cost, power and build-time fields of its sidebar-entry copy]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Launcher key commands and superweapon clicks

## When you need this

When a stock key should act on your mod's own types: deploy a unit that isn't the stock MCV, jump the camera to a
construction yard of your own, or leave your harvesters out of select-all. Or when a superweapon should act on one
click, with no targeting cursor: a toggle, or a launch that needs no target. The launcher decides all of these in
its own code, and no data file reaches them. A key that does something new is simpler: bind one of EA's
[mod hotkey commands](../launcher-data/mod-hotkey-commands.md) instead.

> [!WARNING]
> **Fragile: this patches the launcher's code.** Read
> [Patching the launcher's code from your DLL](patching-the-launchers-code.md) first. Its rules apply to every
> write here.
>
> - **Verified against:** `ClientG.exe` version 1.153 (745903), 34,797,928 bytes, SHA-256
>   `d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897` (Steam build 21590013).
> - **What it depends on:** the command dispatcher's jump table and the stock handler address in each slot you
>   change, the cameo click handler's superweapon test, and free bytes in the code cave.
> - **How it fails if the client changes:** check every slot's stock address and every patch site's bytes before
>   writing, and write nothing if one differs. The keys and cameos then behave as stock.
> - **Keep it in the launcher.** These patches only change what one launcher sends. The DLL still decides what each
>   request does, so they can't desync a LAN game.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

**Holds for:** the client in the box above. EA has stopped patching the game and archived the source in January
2025, so the build should stay put, but check the hash before trusting any address.

## What the stock keys act on

The launcher picks the objects for these keys itself, by name, and only then tells the DLL:

- **Deploy** (`COMMAND_CNC_DEPLOY_SELECTED_MCV`) acts only on the stock MCV. A unit exported under any other name
  is ignored, and renaming it `MCV` also changes its art, which follows the same name.
- **Camera to construction yard** (`COMMAND_CNC_CAMERA_TO_CONSTRUCTION_YARD`) looks for a building named `FACT`.
- **Select all** (`_ON_SCREEN` and `_IN_WORLD`) leaves out only the stock harvester and MCV, by name, and hands the
  DLL the rest through `CNC_Clear_Object_Selection` and `CNC_Select_Object`.

`ClientG.exe` holds `MCV` and `FACT` side by side in one name table. `RABUILDABLES.XML`, the only per-unit table
in `CONFIG.MEG`, has no field that marks a unit as deployable or a harvester.

## Re-routing a key to a mod command

**The dispatcher.** In-match commands go through one function, `0x168A1B0`. It reads the command number from
`[cmd+0x24]`. For commands `0x1006` to `0x1035` it looks the number up in a byte table at `0x168ADB8`, and jumps
through a table of handler addresses at `0x168AD74`, indexed by that byte:

| Command | Number | Slot in `0x168AD74` | Stock handler in the slot |
|---|---|---|---|
| Camera to construction yard | `0x100B` | 5 | `0x168AB0C` |
| Select all in world | `0x101A` | 7 | `0x168A9E7` |
| Select all on screen | `0x101B` | 8 | `0x168A830` |
| Deploy selected MCV | `0x1020` | 10 | `0x168AB18` |
| Mod commands 1 to 4 | `0x1032` to `0x1035` | 15 | the mod-command send at `0x168ABDB` |

**The patch.** The mod-command send at `0x168ABDB` starts with `cmp ebx, 0x1032`, and passes the command on to the
DLL as `INPUT_REQUEST_MOD_GAME_COMMAND_n_AT_POSITION` with the cell under the mouse. So to turn a stock key into a
mod command:

1. Write a stub in the cave: `mov ebx, 0x1032` (mod command 1), then `jmp 0x168ABDB`.
2. Check the slot still holds the stock handler, then write the stub's address over it.

The DLL now gets that key for every player, as a mod command, with no binding for the player to make. Handle it in
`CNC_Handle_Input`, as on [Mod hotkey commands](../launcher-data/mod-hotkey-commands.md).

**Keeping the stock behaviour too.** For select-all, which should still select, the stub can tell the DLL first and
then run the stock handler: set `[edi+0x24]` to the mod command's number, `push edi`, `mov ecx, esi`,
`call 0x168A1B0`, put the original number back in `[edi+0x24]`, and jump to the stock handler. The DLL then knows a
select-all is coming, and can drop the objects it shouldn't take from the selection the launcher sends next.

## Superweapon cameos: one click, no cursor

**The click handler.** A left click on a sidebar cameo runs `0x73E950` (a right click runs `0x73EDF0`). It reads
the launcher's own copy of the sidebar entry: `+0x18` is the entry's `BuildableType`, `+0x1C` its `BuildableID`,
`+0x20` its `Type` (`DllObjectTypeEnum`) and `+0x24` its `SuperWeaponType`. The four state flags are bytes:
`+0x44` `Completed`, `+0x45` `Constructing`, `+0x46` `ConstructionOnHold` and `+0x47` `Busy`. The copy follows the
order of EA's `CNCSidebarEntryStruct`, with the name held as a 24-byte `std::string` at `+0x00` and the placement
list as a 12-byte vector at `+0x38`. At `0x73EA39` it tests the type:

```
0x73EA39  8B 4E 20            mov ecx, [esi+20h]      ; Type
          83 F9 0B            cmp ecx, 0Bh            ; SPECIAL
          0F 85 92 01 00 00   jne 0x73EBD7
```

- **A superweapon, ready** (`Completed` set): the launcher plays "select target" and opens its targeting cursor.
  Nothing reaches the DLL until the map click (`SUPERWEAPON_REQUEST_PLACE_SUPER_WEAPON`) or the cancel
  (`SIDEBAR_CANCEL_PLACE` at -1, -1).
- **A superweapon, not ready:** a sound at most. Nothing reaches the DLL.
- **Anything else:** the build path, which sends `START_CONSTRUCTION` with the entry's type and ID at `0x73ECE9`.
  It goes there at once when the entry is neither busy nor constructing, and also when it's on hold. The click can
  also arrive as `START_CONSTRUCTION_MULTI`, which EA's comment describes as a 1x or 5x left click resuming a held
  build. EA's `CNC_Handle_Sidebar_Request` lets it fall through to `START_CONSTRUCTION`, so code of your own that
  acts on a construction request should accept both.

**The patch.** Replace the 12 bytes at `0x73EA39` with a jump to the cave. There, redo the original test, and for
each superweapon that should act on one click (`BuildableType` the special type, `BuildableID` its number), jump to
`0x73ECE9`. Everything else jumps back to the original path. The click then reaches the DLL in
`CNC_Handle_Sidebar_Request` as `START_CONSTRUCTION`, in every state, and the cameo keeps its tab, clock and
"Ready" label.

**The launcher's input mode** is a global at `0x20F1C90`: 0 idle, 4 aiming a superweapon, 5 placing a building.
The function that opens the cursor (`0x1689200`) sets it, after storing the entry's type, ID, name and superweapon
type for the map click to send. Its twin `0x1689130` sets it too: that one runs when the DLL asks for a target with
`CALLBACK_EVENT_SPECIAL_WEAPON_TARGETTING`, which EA's Red Alert sends for the Chronosphere's second step (picking
where the unit goes) and the Chrono Tank's jump. Aiming never reaches
the simulation (observed): with every DLL export logged, the traffic while a player aimed matched idle. So
anything that should show only while a player aims, such as a range ring, has to read this global from inside that
player's launcher.

**The tab follows `Type` alone** (observed): an entry exported as a unit type goes to the vehicle tab whatever its
superweapon type. The cameo's art is ordinary `AssetName` wiring, as on [Sidebar cameos](../art/sidebar-cameos.md).

## Addresses in this client

| What | Address | Opening bytes on disk |
|---|---|---|
| Command dispatcher | `0x168A1B0` | `55 8B EC 81 EC 2C 01 00 00` |
| Mod-command send | `0x168ABDB` | `81 FB 32 10 00 00` |
| Cameo left click | `0x73E950` | `55 8B EC 81 EC 8C 01 00 00` |
| Cameo right click | `0x73EDF0` | `55 8B EC 81 EC 60 01 00 00` |
| The superweapon test (patch site) | `0x73EA39` | `8B 4E 20 83 F9 0B 0F 85 92 01 00 00` |
| Build request send | `0x73ECE9` | `B9 90 07 0E 02 32 DB` |
| Open the targeting cursor | `0x1689200` | `55 8B EC 83 EC 08 56` |

Use the zero-filled tail of ClientG's last code page for the stubs, as on
[Patching the launcher's code](patching-the-launchers-code.md#three-hook-shapes), and check every byte is still
zero first.

## Traps

- **Install it in every launcher.** Patch at the DLL's start-up load inside ClientG, so a LAN joiner's keys and
  clicks are patched too. A patch made from the simulation reaches only the host's launcher.
- **A key read twice.** A DLL that also reads the keyboard itself sees the host's presses twice (once from the
  keyboard, once as the mod command). Count one press per house.
- **Select-all's hand-over is a burst.** The launcher clears the selection and selects each object in turn. Filter
  for a few frames after the mod command, not on one call.

## How it was verified

- **The dispatcher and its table:** disassembled from `ClientG.exe` on disk for this page: the command read at
  `[edi+0x24]`, the range check, the byte table and the jump table, with each slot above holding the stock handler
  listed, and the mod-command send's `0x1032` to `0x1035` range. The command names are `ClientG.exe` strings, and
  the input events are in EA's `DLLInterface.h`.
- **The click handler:** the bytes above read from disk; `0x0B` is `SPECIAL` in EA's `DllObjectTypeEnum`; the
  cursor function's writes of 0, 4 and 5 to `0x20F1C90` disassembled for this page. The two construction requests:
  `SIDEBAR_REQUEST_START_CONSTRUCTION_MULTI` in EA's `DLLInterface.h` and its fall-through, with the "1x or 5x Left
  click" comment, in `CNC_Handle_Sidebar_Request` (`DLLInterface.cpp`); Tiberian Factions' handler takes both, after
  its one-click superweapons were seen arriving as either.
- **The entry copy's fields:** the handler's byte tests of `+0x44` to `+0x47` and the cursor function's reads of
  `+0x18`, `+0x1C` and `+0x24`, disassembled for this page, line up with EA's `CNCSidebarEntryStruct`
  (`DLLInterface.h`) once the name is a `std::string` (the cursor function checks its capacity at `+0x14`) and the
  placement list a vector. TF's notes give the same offsets.
- **The twin:** `0x1689130` has one caller, in the launcher's event handling, which passes it the targeting event's
  four fields (type, ID, name, superweapon type). EA's `On_Special_Weapon_Targetting` sends that event, and its
  only callers in Red Alert are the Chronosphere's second step (`HOUSE.CPP`, `SPC_CHRONO2`) and the Chrono Tank
  (`UNIT.CPP`).
- **In play:** TF routes deploy, camera-to-yard and both select-alls this way, and fires two
  superweapons on one click, on Linux under Proton and on the Steam Deck, in skirmish and in a LAN game with a
  joiner. The aiming traffic, the tab rule and the stock keys' name tests are TF's records (observed).

> [!TIP]
> **In Tiberian Factions**
>
> TF's deploy key works on every unit that deploys or unloads (MCVs, transports, minelayers, its Mobile War
> Factory), the camera key finds any faction's construction yard, and select-all leaves out every faction's
> harvesters and MCVs. The Firestorm Defense toggles and the Hunter Seeker launches on one click from the
> superweapon tab.
