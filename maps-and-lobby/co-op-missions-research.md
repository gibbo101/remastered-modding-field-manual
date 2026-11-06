---
title: "Co-op missions: research"
description: What is known about scripted co-op missions in a Remastered mod. Co-op skirmish works today; the launcher's own co-op campaign is compiled code with no screen or data; and a scripted mission in a LAN game meets Red Alert's single-player gates on win, lose and the briefing. Research only, nothing built.
tags: [maps, multiplayer, co-op, lan, missions, research]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
clientg_sha256: d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897
status: design
unproven: [a scripted win or loss firing in a LAN game once the gates are opened, whether a scenario house that isn't a multiplayer slot comes to life in a LAN game, how a scripted win should be shared between two human players, whether the launcher opens a co-op screen supplied as a loose file, whether an inserted button reaches the launcher's co-op class]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Co-op missions: research

> [!CAUTION]
> **Research, not built.** No co-op mission has been made or played with any of this. The facts below are read
> from EA's source and the game's files, and each is marked with how it was checked. Everything about making a
> scripted mission work in a LAN game is **unproven**.

**Holds for:** C&C Remastered Collection, Steam build 21590013, and the launcher in the frontmatter. EA has stopped
patching the game and archived the source in January 2025, so this should hold.

## When you need this

When you want two players to play a scripted mission together in your mod: a pre-placed enemy base, attack waves
from triggers, a briefing, and objectives such as "destroy the Soviet base" or "hold out for 20 minutes". If your
players only want to fight the AI side by side, you don't need this page: that works today, as a team skirmish.

## Co-op skirmish works today

Two humans on the same team in the LAN lobby, against AIs on another team, is a team skirmish, and needs no code.
The DLL gives every player, human or AI, a multiplayer house slot (`HOUSE_MULTI1` plus their index) in
`GlyphX_Assign_Houses`, and allies players who share a lobby team ID (`DLLInterface.cpp`). The game ends when every
house still alive is allied with the rest (`HouseClass::MPlayer_Defeated`, `HOUSE.CPP`). Each player picks their
own faction in the lobby; a map can't force one.

Checked against EA's source. Team games against the AI are an ordinary lobby option.

## Mods play in LAN games only

A modded co-op game has to be a LAN game: the base game turns online multiplayer off while a mod is enabled (see
[LAN games](../engine/lan-games.md)). So anything that starts a match through EA's online services starts it
without the mod.

## The launcher's own co-op campaign: code with no content

The launcher was built with a co-op campaign, and none of it can be used.

- **The code is there.** `ClientG.exe` contains `CoopCampaignMenuImplementationClass`, `Button_CoopCampaign`,
  `CoOp_MissionDetails_Group`, `Faction5CoOpCampaign1Star`, the screen name `UI_CampaignMenu_CoOp`, and
  `Host_Coop_Campaign_Lobby(ClientProgressiveCampaignMissionTypeClass *, ProgressiveCampaignDifficultyTypeEnum, ...)`:
  a campaign mission hosted through the multiplayer lobby.
- **The data is empty.** `FACTIONS.XML` in `CONFIG.MEG` gives each of its 11 factions a `<CoopCampaignType>` beside
  its `<CampaignType>`, and every one is empty. `PROGRESSIVECAMPAIGNFILES.XML` defines no co-op campaign.
- **The screen doesn't ship.** No member of `CONFIG.MEG` has "coop" in its name, so `UI_CampaignMenu_CoOp` isn't
  there. The campaign menu that does ship, `UI_CAMPAIGNMENU.BUI`, has no co-op button or group.
- **It would host the wrong game.** Hosting goes through EA's online coordinator, and a mod doesn't load there (see
  above).

A loose screen file can replace a shipped one (see [BUI screens](../front-end/bui-screens.md)), but whether the
launcher opens a screen that has no member in the archive is **unproven**, and the screen would have to match what
the compiled class expects. Whether a button inserted into the campaign menu reaches the co-op class is
**unproven** too.

Checked by reading `ClientG.exe`'s strings and the `CONFIG.MEG` members named.

## A scripted mission in a LAN game

The route that stays in code a mod controls: a LAN skirmish on a map that carries the mission, with the DLL letting
that map's scripting count. The map side is already supported; the engine side meets four gates.

### The map

- **Custom maps are three files.** A map in `Documents/CnCRemastered/Local_Custom_Maps/Red_Alert/` is
  `<name>.mpr` (the scenario INI: houses, triggers, teams, briefing), `<name>.tga` (its preview) and `<name>.json`
  (`MapTileX`, `MapTileY`, `MapTileWidth`, `MapTileHeight`, `Theater` and `Waypoints`, the start cells). Nothing
  in the `.json` marks a map as co-op. Checked on disk.
- **The DLL reads the map as an INI.** `CNC_Start_Custom_Instance` (`DLLInterface.cpp`) builds the file name
  `<directory><scenario>.mpr`, loads it and reads `[Basic] Name` and `[Digest]`. A map flag of your own can be read
  at the same point. Checked against EA's source.
- **Any map can carry triggers.** EA's map editor has a single-player switch, `[Basic] SoloMission=`, but uses it
  only in its settings, its Steam dialog and its checks: a multiplayer map needs at least two start waypoints, a
  single-player one a home waypoint (`GamePlugin.cs` in EA's `CnCTDRAMapEditor`). Its trigger and team editing
  doesn't depend on it, and Red Alert's DLL never reads `SoloMission`. Checked against EA's source.

### The gates in Red Alert's code

Red Alert lets a map's scripting win or lose the game only in single player:

| Gate | Where | What it does |
|---|---|---|
| Win | `HouseClass::AI` (`HOUSE.CPP`) | `Session.Type == GAME_NORMAL && IsToWin && ...` sets `PlayerWins` or `PlayerLoses`. |
| Lose | `HouseClass::AI` | The same test on `IsToLose`. |
| Briefing text | `Start_Scenario` (`SCENARIO.CPP`) | Shows the briefing text only when `Session.Type == GAME_NORMAL` and there's no briefing movie. |
| Briefing, in Vanilla Conquer | `Start_Scenario` | Vanilla Conquer adds `if (Session.Type != GAME_NORMAL) briefing = false;`. EA's own source doesn't have it. |

Each gate also waits on the map: `IsToWin` is set only by a trigger's win action, and the briefing only shows if
the map has text. So a gate opened for one flagged map changes nothing for others. Checked against EA's source and
Vanilla Conquer's.

### Open problems

- **Who wins.** A trigger's win and lose actions (`TACTION_WIN`, `TACTION_LOSE` in `TACTION.CPP`) compare the
  house they name with `PlayerPtr`, and `HouseClass::AI` sets `PlayerWins` for `PlayerPtr`. In a LAN game,
  `PlayerPtr` switches between players as the host's simulation works (see [LAN games](../engine/lan-games.md)). How a
  scripted win should reach both humans is **unproven**: it likely needs per-house handling, not the single flags.
- **The enemy house.** The game-over check in `MPlayer_Defeated` looks only at the multiplayer houses
  (`HOUSE_MULTI1` onwards). A pre-placed enemy in a scenario house such as `USSR` or `BadGuy` doesn't keep the game
  going, and whether such a house plays at all in a LAN game is **unproven**. An AI player in a lobby slot, with the
  map's triggers aimed at that slot's house, avoids the question.
- **Factions.** The lobby picks each player's faction, so "player 1 is GDI, player 2 is the Allies" is a lobby
  convention, not something the map can force.
- **A first test.** A map with one scripted win (a timer, or one building to destroy), the win gate opened for it,
  and two people in a LAN game, to see whether the scripted win fires rather than last team standing. Not done.

## How it was verified

- **EA's source:** `GlyphX_Assign_Houses`, the team alliances and `CNC_Start_Custom_Instance` (`DLLInterface.cpp`);
  `MPlayer_Defeated` and the win and lose gates (`HOUSE.CPP`); `Start_Scenario` (`SCENARIO.CPP`); `TACTION_WIN` and
  `TACTION_LOSE` (`TACTION.CPP`); `SoloMission` in the map editor's `GamePlugin.cs`, and its absence from Red Alert's
  DLL. Vanilla Conquer's `redalert/scenario.cpp` for its extra briefing gate.
- **The game's files:** the co-op strings in `ClientG.exe` (the build above), `FACTIONS.XML`,
  `PROGRESSIVECAMPAIGNFILES.XML`, `UI_CAMPAIGNMENU.BUI` and the member list of `CONFIG.MEG`.
- **On disk:** a custom map's three files in `Local_Custom_Maps/Red_Alert/`, and its `.json` fields.
- **Not tested at all:** everything under "Open problems".

> [!TIP]
> **In Tiberian Factions**
>
> TF has no co-op missions yet; co-op skirmish, two humans against the AI, works in TF as in any mod. The plan, when it is
> built, is a flag in a map's `[Basic]` section that opens the win and lose gates for that map only, tested first
> with a single scripted win.
