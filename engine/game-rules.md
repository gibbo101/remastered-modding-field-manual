---
title: Letting players change the rules
description: Where a player's own rules file can go in Red Alert's rule passes (after MPLAYER.INI, before Fill_In_Data, and again on load), what the engine already does for you (Read_INI keeps every key a file doesn't name, LAN games use the host's values), and the limits and traps a rules editor has to respect, from Strength and Sight bounds to Verses resetting to 100% and keys that leak into the next match.
tags: [engine, rules, ini, dll, skirmish, saves]
holds_for: Steam build 21590013
status: design
unproven: [a player rules pass in play (read from source, not built), Verses resetting to 100% when a pass names a warhead without it (read from source), the lobby's credits list growing past 10000, showing the host's rules to joiners at match start]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Letting players change the rules

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod wants players to tune unit values or match rules (costs, strength, damage, build speed) without
editing your INIs. A player who edits a file in your mod's folder loses the edit when the mod updates. A rules
file of their own, read by your DLL, survives. If your rules are fixed, or only you change them, you don't need
this page.

**Status:** the rule passes, the limits and the traps below are read from EA's source and the base game's files.
A player rules pass built on them is a **design**: none has been built or played yet.

## Where the rules come from in a match

The game reads `rules.ini` and `aftrmath.ini` once, at start-up (`INIT.CPP`), and keeps both in memory. Every
scenario load (`Read_Scenario_INI`, `SCENARIO.CPP`) then applies, in order:

1. the in-memory `rules.ini`;
2. the in-memory `aftrmath.ini`;
3. the scenario's own INI (the map);
4. `MPLAYER.INI`, in skirmish and multiplayer only, and only with **Aftermath units** on in the lobby
   (`bAftermathMultiplayer`). The base game's copy sets a few multiplayer values, such as `[BRIK] Cost=50`.

Then `Fill_In_Data` builds the match. Each pass is the same set of calls, from `Rule.General` through
`Rule.Difficulty`.

**A player pass goes after `MPLAYER.INI` and before `Fill_In_Data`,** in `Read_Scenario`. Earlier, `MPLAYER.INI`
can override what the player set. Keep the file in the player's `Documents/CnCRemastered/` folder (see
[A player settings page](../structuring/player-settings-page.md)) and open it by full path, not through the
game's search path (see [Known engine traps](../troubleshooting/known-engine-traps.md)). Leave campaign missions
(`GAME_NORMAL`) alone: their balance is the mission's.

## What the engine does for you

- **A file changes only the keys it names.** Every type's `Read_INI` reads each key with its current value as the
  default (`ini.Get_Int(Name(), "Cost", Cost)` and the like). A player file of `[MTNK] Cost=900` changes one cost.
- **LAN games use the host's file.** Only the host runs the simulation (see [LAN games](lan-games.md)), so the
  host's values are the match's rules for everyone, with nothing to sync. Joiners won't know unless you tell them:
  EA's `On_Message` sends a line to one player's launcher, so the host can name the edited rules at match start
  (not built).

## What a pass can't do

- **Add objects.** Every weapon and warhead object is created once, at start-up, in `RulesClass::Heap_Maximums`.
  The per-match passes only look names up. A name nothing created is never found (see
  [Raising the limits](../units/raising-the-limits.md)).
- **Change a type's weapon safely.** `Primary=` and `Secondary=` look the name up (`Weapon_From_Name`), and an
  unknown name gives `WEAPON_NONE`. A typo removes the unit's weapon without a word. Don't let players edit them.
- **Survive a save on its own.** The type tables aren't saved. `Load_Game` (`SAVELOAD.CPP`) re-applies `rules.ini`,
  `aftrmath.ini`, the scenario's INI and, for network loads, `MPLAYER.INI`, so your pass has to run there too. It
  has to use the values the save was played with, or a saved unit's strength no longer matches its type's maximum.
  One way is to store a copy of the player's file in the save. Note that EA's load reads `MPLAYER.INI` in skirmish
  whenever Aftermath is installed, whatever the lobby said.

## Limits for each value

| Key | Limit | Why |
|---|---|---|
| `Strength` | at least `RepairStep` (7 for buildings) or `URepairStep` (10 for units), at most 32767 | Repair cost divides by `MaxStrength / RepairStep`, which is zero below the step (`TechnoTypeClass::Repair_Cost`). Strength is a `short`. |
| `Sight` | 1 to 10 | `MapClass::Sight_From` reveals nothing for a range above 10. |
| Weapon `ROF` | at least 1 | The AI's threat values divide by it (`TECHNO.CPP`). |
| Projectile `Speed` | at least 1 | A projectile's flight time divides by it (`BULLET.CPP`). |
| Building `Power` | keep its sign | A building that drains power, given a positive `Power`, produces it and keeps its old drain (`BuildingTypeClass::Read_INI`). |
| Warhead `Verses` | all five values, always | See below. |
| `Name` | don't expose | Each pass that sets it takes a slot in a small table (see [Known engine traps](../troubleshooting/known-engine-traps.md)). |

## Traps

- **`Verses` is all or nothing.** `WarheadTypeClass::Read_INI` reads `Verses` with a default of five 100% values,
  not the warhead's current ones. A pass that names a warhead section without `Verses`, to change `Spread` say,
  resets that warhead to 100% against every armour (read from source, not tested). A `Verses` with fewer than five
  values reads the missing ones as 0% (`fixed(NULL)` is zero). A 0% against steel also makes the warhead count as
  organic (`IsOrganic`). Always write all five.
- **Keys leak into the next match.** Nothing restores a type's start-up values between matches. A key your player
  pass sets, and that `rules.ini`, `aftrmath.ini` and the map don't, keeps its value into the next match and the
  campaign. EA met the same problem with campaign INIs: `Read_Scenario_INI` resets a handful of values by hand
  (the spy's weapons, the ants' tech level and others) before re-applying the rules. The simplest fix is to let
  players edit only keys `rules.ini` sets, so every match's first pass resets them.
- **A weapon or warhead is shared.** Many types fire the same weapon, and many weapons use one warhead (in the base
  game's `rules.ini`, `AP` is the warhead of 15 of its 36 weapons). Editing it for one unit edits it for all of
  them. Show the player every type that uses it.
- **Scaling in `Read_INI` scales every pass.** If your DLL adjusts a value as it's read (doubling a ported type's
  strength, say), a player pass is read the same way, and a section without the key scales the already-scaled
  value again. Do the scaling in the first pass only.
- **Some values belong to code.** A value your DLL hard-codes, or derives from another key, won't follow the INI.
  An editor should show those as fixed.

## Starting credits

The lobby's credit choices are the `CNCStartingCredits` list in `GameConstants.xml` (in `CONFIG.MEG`): 500, 1000,
1500, 2000, 5000 and 10000. The DLL gives every house the value the lobby sends (`game_options.MPlayerCredits`,
copied to `Session.Options.Credits` with no cap). So more credits belong in that list, through
[GameConstants_Mod.xml](../launcher-data/overriding-launcher-data.md), not in a rules file. **Unproven:** that the
lobby's slider sizes itself to a longer list.

## How it was verified

- **EA's source**, read with `grep -a`: the pass order in `Read_Scenario_INI` and `Read_Scenario`, and the
  `bAftermathMultiplayer` gate (`SCENARIO.CPP`); the start-up loads (`INIT.CPP`); the passes in `Load_Game`
  (`SAVELOAD.CPP`); `Heap_Maximums` and the weapon and warhead lists (`RULES.CPP`); `Weapon_From_Name`
  (`WEAPON.CPP`); `Read_INI`'s defaults (`TECHNO.CPP`, `BDATA.CPP`, `WARHEAD.CPP`); `fixed(char const *)`
  (`FIXED.CPP`); `Repair_Cost`, `Sight_From`, the divisions by `ROF` and `MaxSpeed`; `On_Message` and the lobby
  credits in `DLLInterface.cpp`.
- **The base game's files:** `rules.ini` (`RepairStep=7`, `URepairStep=10`) from `LOCAL.MIX` inside
  `REDALERT.MIX`; `MPLAYER.INI` from `EXPAND2.MIX`; `CNCStartingCredits` in `CONFIG.MEG`'s `GameConstants.xml`.
- **A working mod's DLL** has the same passes, with its own changes, and its design research counted the keys each
  type reads and the shared weapons.
- **Not built or played:** the player pass itself, and every trap above that says "read from source".

> [!TIP]
> **In Tiberian Factions**
>
> TF plans an in-game rules editor, as a design: per-faction unit values and a short list of match rules, a
> DEFAULT or CUSTOM switch, and the file kept in `Documents/CnCRemastered/` so updates never touch it. Its unit
> values would live in the Faction Encyclopedia, which already reads the mod's rules. Nothing of it ships yet.
