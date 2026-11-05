---
title: Mod hotkey commands
description: EA left four mod hotkey commands in the launcher; one constant turns them on, the player binds the keys in Options, and the DLL receives each press with the map cell under the mouse. A mod can't ship default bindings.
tags: [launcher, input, hotkeys, game-constants, dll]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
status: verified
unproven: []
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Mod hotkey commands

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod wants a key that does something new in a match: deploy a new unit type, toggle a mode, place a
marker. The launcher owns the keyboard, and the DLL never sees a key it doesn't know (only Ctrl, Shift and Alt
reach it). EA built four spare commands for modders. A mod with no new key actions doesn't need this page.

## What EA left in

1. **A constant.** `GameConstants.xml` has
   `<CNCEnableModHotKeyGameCommands network="client"> False </CNCEnableModHotKeyGameCommands>`, default off.
2. **Four commands.** `INPUTTRANSLATORCONFIGURATIONS.XML` declares `GAME_COMMAND_CNC_MOD_COMMAND_1` to `_4` in the
   `TACTICAL_CNC` (in-match) context, each with an empty `<Key></Key> <!-- TBD -->`, under EA's comment
   "To apply, also need to set `<CNCEnableModHotKeyGameCommands>` to True in GameConstants.xml".
3. **A DLL input event.** The launcher sends a press as `INPUT_REQUEST_MOD_GAME_COMMAND_1_AT_POSITION` to `_4`
   (in `DLLInterface.h`) through `CNC_Handle_Input`, with the mouse position. EA's own handler turns that into a
   map cell, then stops at a placeholder:

   ```c
   // TBD: For our ever-awesome Community Modders!
   //
   // PlayerPtr->Handle_Mod_Game_Command(cell, input_event - INPUT_REQUEST_MOD_GAME_COMMAND_1_AT_POSITION);
   ```

## Turning them on

1. Set the constant to `True` in your mod's `GameConstants_Mod.xml` (see
   [Overriding the launcher's data](overriding-launcher-data.md)). Mod Command 1 to 4 then appear in
   **Options > Controls**.
2. In your DLL's `CNC_Handle_Input`, replace EA's placeholder with your handler. You get the command number
   (0 to 3) and the cell under the mouse when the key was pressed.
3. Tell players to bind the keys themselves.

## Why a mod can't ship the bindings

Four routes were tried, and each left Mod Command 1 unbound:

- `INPUTTRANSLATORCONFIGURATIONS.XML` with a key filled in, inside the mod's replacement `CONFIG.MEG`;
- the same file loose in the mod's `Data/XML/`;
- Options > Controls > Restore Defaults;
- a newly created player profile.

The launcher reads none of a mod's copy of that file. An unbinding of the launcher's own deploy command, in the
same file, was ignored too. There's no `_Mod` overlay for input either: `GameConstants_Mod.xml` is the only one in
`ClientG.exe`. The bindings live in the player's own settings file, which is global to the game, synced by Steam
Cloud and kept after the mod is removed, so a mod shouldn't write it even if it could.

## Traps

- **The press arrives for whoever pressed it.** In a LAN game the DLL runs on the host, and the launcher sends a
  joiner's press across as that player's input. A key read directly from the keyboard in the DLL sees only the
  host's. See [LAN games](../engine/lan-games.md).
- **Unbound by default means invisible.** Until a player binds the key, the command does nothing. Say so in your
  mod's description.

## How it was verified

- **What EA left in:** the constant (default `False`) and the four commands with their `TBD` keys and EA's comment
  in the stock `CONFIG.MEG`; the four `INPUT_REQUEST_MOD_GAME_COMMAND_*` values in `DLLInterface.h` and the
  placeholder in `DLLInterface.cpp`; the four command names in `ClientG.exe`.
- **Turning them on:** a working mod sets the constant in `GameConstants_Mod.xml`, the commands appear in Options
  > Controls, and its DLL handles them, in skirmish and in LAN.
- **No default bindings:** the four failed routes above, in a working mod; no input `_Mod` overlay in
  `ClientG.exe`; and Kushan's guide on the PPM forums, which describes player-bound mod commands as the intended
  use.

> [!TIP]
> **In Tiberian Factions**
>
> TF turns the commands on and gets round the binding problem by sending them itself. A patch to the launcher's
> command dispatcher turns its own deploy key into Mod Command 1, and camera-to-yard into Mod Command 3. Its
> select-all keys send Mod Command 2 first, so the DLL can drop harvesters and MCVs from the selection. Players
> keep the keys they already know, and every player's press reaches the host. See
> [Patching the launcher's code from your DLL](../clientg-ram/patching-the-launchers-code.md).
