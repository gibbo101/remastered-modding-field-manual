---
title: "What the launcher owns: the modding walls"
description: The behaviours the Remastered launcher (ClientG) owns, which the community often calls impossible to mod, with the route that reaches each one (data, cached-record RAM, launcher code patch) or the evidence it is a real wall, and how to tell who owns a behaviour before trying to change it.
tags: [engine, launcher, clientg, dll, walls, reference]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
status: verified
unproven: [how the launcher decides to hide a superweapon's cost line, routes for that line and for build hotkeys on new types, and new widgets on the in-match HUD, none of which has been tried with a code patch]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# What the launcher owns: the modding walls

**Holds for:** C&C Remastered Collection, Steam build 21590013, `ClientG.exe` 1.153 (745903). EA has stopped
patching the game and archived the source in January 2025, so this should hold.

## When you need this

Before you spend a build-test cycle on something the game "won't let you do". A large part of what players see is
drawn and decided by the launcher, `ClientG.exe`, which your DLL can't touch through EA's interface. Some of
those behaviours really are walls. Many are not: they can be reached through the launcher's own data, through its
cached records in memory, or through a patch to its code. This page lists each one and its route.

> [!IMPORTANT]
> **"Real wall" means not found yet, not impossible.** Every wall in this table is one nobody has found a way round
> *so far*. Several rows here started out as walls. The sidebar's faction crest was listed as one for months: data
> couldn't change it, and attempts kept failing, until re-pointing the launcher's cached records in memory got
> round it. If you find a route past any wall here, it's a wall no longer.

## The walls, and the way through

| Behaviour the launcher owns | Status | Route, and the page that covers it |
|---|---|---|
| Classic/HD graphics toggle (option and spacebar) | **Data lever** | `CNCDisableLegacyGraphicsOption` in `GameConstants_Mod.xml`. [HD-only mods](../getting-started/hd-only-mods.md) |
| The DLL detecting whether classic or HD graphics are on screen | **Real wall** | Tried: input keys (the spacebar never reaches the DLL), page requests (asked every frame in both modes), a RAM search for a mode flag. None worked. [HD-only mods](../getting-started/hd-only-mods.md) |
| Which HUD scene a faction gets (TD's sidebar or RA's) | **Data lever** | Each faction in `FACTIONS.XML` names both scenes. Swap them. [Adding a faction](adding-a-faction.md), [Overriding the launcher's data](../launcher-data/overriding-launcher-data.md) |
| Side-keyed HUD art: radar crest, waypoint and rally markers | **RAM lever** (cached records) | [Re-pointing launcher UI art in memory](../clientg-ram/repointing-atlas-regions.md) |
| Sidebar tab icons per faction (the launcher builds their names in code) | **RAM lever** (a string in ClientG's image) | Rewrite the four RA prefix strings with TD's, which are shorter and fit. [Rewriting launcher strings in memory](../clientg-ram/rewriting-launcher-strings.md) |
| EVA voice lines the launcher plays itself: "Mission accomplished", "Mission failed", "Low power", "Select target" and others | **RAM lever** (cached samples) | Overwrite ClientG's cached copy of each sample at match start. The same route carries end-of-game lines, since the launcher drops speech the DLL sends after game over. [EVA voice lines the launcher plays](../sound-and-music/launcher-eva-lines-by-faction.md) |
| Superweapon that fires on one click, with no targeting cursor | **Code-patch lever** | The cameo click handler's superweapon test. [Launcher key commands and superweapon clicks](../clientg-ram/launcher-key-commands-and-clicks.md) |
| The deploy key on units other than the stock MCV, the camera-to-construction-yard key for new yards, and select-all filters | **Code-patch lever** | Patch the launcher's key commands into mod commands, and handle them in the DLL. [Launcher key commands and superweapon clicks](../clientg-ram/launcher-key-commands-and-clicks.md) |
| The credit counter's tick sound, per faction | **Data lever** + DLL | Silence the launcher's own tick sample, and have the DLL play the faction's. The routing is on [TD sounds from the base game](../using-what-the-player-owns/td-sounds-from-the-base-game.md). The silencing: [Credit tick and radar sounds by faction](../sound-and-music/credit-tick-and-radar-by-faction.md) |
| Music by faction | **Code-patch lever** | `AUDIO_FACTIONS.XML`'s music map is dead (EA's own comment says it isn't used for TD or RA). A launcher hook redirects the music lookup instead. [Music by faction, and the jukebox](../sound-and-music/music-by-faction-and-the-jukebox.md) |
| New maps in the skirmish Official list | **Data** + **code-patch lever** | [New maps in the skirmish Official list](../maps-and-lobby/new-maps-in-the-skirmish-list.md) |
| New text strings | **Data lever** | Adding records to `MASTERTEXTFILE_*.LOC` crashes the launcher at boot. Ship new strings in `Data/ModText.csv` instead. [New text strings](../launcher-data/new-text-strings.md) |
| Keyboard commands of your own (EA's four mod hotkey commands) | **Data lever** | `CNCEnableModHotKeyGameCommands` in `GameConstants_Mod.xml` turns on four mod commands, which the DLL receives with a map cell. [Mod hotkey commands](../launcher-data/mod-hotkey-commands.md) |
| Shipping default keys for the four mod hotkey commands | **Real wall** | Tried: the input file in a replacement `CONFIG.MEG`, the same file loose, Restore Defaults, and a fresh profile. All four were ignored. Players bind the keys themselves, in Options > Controls. |
| Maps larger than 128×128 | **Server code-patch lever** | Not a launcher limit: the instance server copies two fixed 128×128 export arrays, and two patched instructions point it at bigger ones. Up to 255 a side; built, not yet released. [Bigger maps](../maps-and-lobby/bigger-maps.md) |
| New terrain template names | **Real wall** | A new template name with loose art crashes the launcher when a tile renders; the DDS format, a replacement `CONFIG.MEG` and the load path were ruled out. Existing names take loose art (a reskin). [Adding a theatre of your own](../maps-and-lobby/custom-theatres.md) |
| The launcher knowing any faction beyond Allied and Soviet | **Real wall** | The launcher knows only `ALLIED` and `SOVIET`. Faction-specific behaviour has to come from the DLL choosing names before they cross. |
| Lobby picker: row order, hiding duplicate countries | **Real wall** (observed) | Tried: reordering `FACTIONS.XML` (no effect), commenting out an entry (a blank row that still selects that country), and changing `CampaignType` (crash at boot). |
| A lobby picker emblem from an atlas region the launcher doesn't preload | **Real wall** (observed) | It crashes at boot. Repaint the preloaded slot icons in the UI atlas instead. |
| New front-end screens and buttons | **Code-patch lever** + data | A screen of your own as a new `.BUI` on a registered screen class no stock screen uses (`SplashScreen`), with buttons and rows cloned from stock widgets. A launcher patch adds the menu button that opens it, and binds every widget's clicks. Shipped in a released mod. [New screens and buttons](../front-end/new-screens-and-buttons.md) |
| The launcher's own co-op campaign mode | **Real wall** (a cut feature; finishing it is untried) | Code without content. `ClientG.exe` has a co-op campaign menu class and a hosting path (`CoordinatorMultiplayerManagerClass::Host_Coop_Campaign_Lobby`, with match-settings, ready and launch calls to EA's online coordinator), but every faction's `<CoopCampaignType>` in `FACTIONS.XML` is empty, and the screen its scene list names, `UI_CampaignMenu_CoOp`, has no `.BUI` in `CONFIG.MEG`. Hosting goes through the online service, and mods play over LAN only (see [LAN games](lan-games.md)), so even a working button would start an unmodded match. |
| New widgets on the in-match HUD | **Open** | The `.BUI` alone can only reshape or hide existing widgets. The front-end route (a new scene and a patch that binds it) hasn't been tried on the in-match HUD. |
| A new superweapon's sidebar cameo showing "Cost: $0" | **Open** | Observed: the stock superweapons' cameos show no cost line, and a new one shows "Cost: $0". EA's DLL sends a cost of 0 for every superweapon, so the launcher hides the line by some other test, not yet found. It isn't an asset-name list: `ClientG.exe`'s `SW_` names sit only in its build-command tables, beside command numbers. Not tried with a code patch. |
| The build hotkeys for new buildings and units | **Open** | Each build command names one stock object. Not tried since code patching became possible. |

"Real wall" means the routes tried so far failed. "Observed" marks a row resting on fewer than three independent
sources. "Open" means nobody has tried the code route yet.

## How to tell who owns a behaviour

The Remastered Collection runs the game in two places. `InstanceServerG.exe` runs the simulation through your
DLL. `ClientG.exe` draws everything, plays most sounds, and runs the menus and lobby. They talk only through EA's
DLL interface: a few dozen `CNC_*` exports the launcher calls, and one callback the DLL calls back through. Three
rules follow:

1. **The launcher knows only what crosses that interface.** If a value isn't in an interface struct or a callback
   event, the launcher can't act on it.
2. **The launcher is faction-blind.** The only identity that reaches it is the player's Red Alert country house
   (`CNCPlayerInfoStruct`), so a faction riding an Allied country is "Allied" to it. Faction-specific behaviour
   comes from the DLL choosing a name or value before it crosses: which sound to play, which EVA line, which asset.
3. **Anything the launcher does by itself needs one of the levers above.** "Owned by the launcher" means the
   simulation alone can't change it. It doesn't mean nobody can.

**The wire between them is closed.** The launcher connects to the instance server over a local socket (port base
16000, `ClientPortBase` in `CONFIG.MEG`'s `SERVERCONFIG.XML`), encrypted with CryptoPP. What crosses is EA's DLL
interface, serialized: the callback's 13 event types one way, the game-state structs the other. The launcher's
receiver (`IncomingExternalGamePluginEventClass`) is a compiled switch over those types, so a new kind of event
from the DLL has nowhere to land. The front end embeds a Lua 5.1 and a ClickScript interpreter, but no `.lua` file
ships in any of the game's 21 MEGs, and no callback event carries a script, so neither is a way in.

**Three programs.** `ClientLauncherG.exe` is the window with the game tiles. Picking a game starts the launcher,
`ClientG.exe`, and beside it the instance server, `InstanceServerG.exe`, which loads your DLL: the server's command
line (`InstanceServerG.exe GAME_INDEX=0 CLIENT_PORT=16000 RUN_AS_APP NO_AUTO_EXIT LAUNCH_FROM_CLIENT=`) is a format
string in `ClientLauncherG.exe`, not in `ClientG.exe`, and the two start in the same instant. Under Proton, Linux's
parent process IDs don't show this: all three are children of the Steam runtime.

**The tools.** `ClientG.exe`, `ClientLauncherG.exe` and `InstanceServerG.exe` are native 32-bit Windows programs
(PE32, no .NET runtime), so .NET decompilers don't apply: use a disassembler. The only .NET program in the install
is the map editor, `CnCTDRAMapEditor.exe`, whose source EA released. When searching `ClientG.exe`'s strings for
`GDI`, most hits are Windows' Graphics Device Interface ("render target is not compatible with GDI"), not the
faction.

## Search in this order

1. **The launcher's data.** Search `CONFIG.MEG` for the behaviour's name or setting first: whole walls have
   turned out to be one constant (the classic-graphics lockout). See
   [Overriding the launcher's data](../launcher-data/overriding-launcher-data.md).
2. **The DLL interface.** Read EA's `DLLInterface.h`. If the behaviour is driven by a field or event your DLL
   fills, change the value there.
3. **ClientG's memory.** If the launcher caches what it draws or plays, re-point or overwrite the cache:
   [Re-pointing launcher UI art in memory](../clientg-ram/repointing-atlas-regions.md). If it builds a name in
   code, search `ClientG.exe`'s strings for the name family first. A string is often cheaper to change than the
   records made from it.
4. **ClientG's code.** Patch it last, with every rule on
   [Patching the launcher's code from your DLL](../clientg-ram/patching-the-launchers-code.md).

A wall proven on one side is not proven on the next. Several of the rows above were declared impossible from the
DLL, and then fell to data or to a launcher patch.

## How it was verified

Each row was checked three ways where possible:

- **The game's files:** the stock `GameConstants.xml`, `FACTIONS.XML` (both scene lists per faction),
  `INPUTTRANSLATORCONFIGURATIONS.XML` (four mod commands with empty keys marked TBD) and `AUDIO_FACTIONS.XML`
  (EA's comment that its maps aren't used for TD or RA). `ClientG.exe`'s strings: both tab-icon prefixes, the
  launcher's sound and command names, only `ALLIED` and `SOVIET` as faction tokens, and no input `_Mod` overlay.
  The superweapon click test's bytes, read from the exe on disk. Every reference to its `SW_` asset names is in a
  data table of command numbers and object names, beside stock unit names such as `FTNK` and `MLRS`; EA's
  `DLLInterface.cpp` sets a superweapon's sidebar `Cost` to 0, having no type to price it from.
- **The wire and the tools:** `SERVERCONFIG.XML`'s port base and `InstanceServerG.exe`'s `CLIENT_PORT` setting;
  the CryptoPP, Lua 5.1, receiver-class and `SERVER_TO_CLIENT_EXTERNAL_GAME_PLUGIN_EVENT` strings in `ClientG.exe`;
  its event dispatcher's 14-way type switch, read from disk; every MEG in `Data/` listed for `.lua` files; and each
  executable's PE header.
- **Which program starts the server:** `ClientLauncherG.exe`'s strings hold `InstanceServerG.exe`,
  ` CLIENT_PORT=%d` and ` RUN_AS_APP NO_AUTO_EXIT LAUNCH_FROM_CLIENT= `, and `ClientG.exe` holds none of them (ASCII
  or UTF-16); a running game's server had exactly that command line, and `/proc` gave `ClientG.exe` and
  `InstanceServerG.exe` the same start time, on consecutive process IDs, just after the game tile was clicked.
- **The co-op campaign mode:** `ClientG.exe`'s strings (`CoopCampaignMenuImplementationClass`,
  `Host_Coop_Campaign_Lobby` and its coordinator messages, `Button_CoopCampaign`); `CONFIG.MEG` read for this page
  (11 empty `<CoopCampaignType>` elements, `UI_CampaignMenu_CoOp` only as a scene-list key, no such member among its
  207 `.BUI` files); and a working mod's design notes, which reached the same verdict.
- **EA's source:** the DLL interface (exports, the one callback, `CNCPlayerInfoStruct`'s house, the input handler
  that answers only Ctrl, Shift and Alt) and the 128×128 export buffer.
- **A working mod**, which ships every data, RAM and code-patch route above, tested under Proton on Linux and on
  the Steam Deck, LAN included.

Rows marked "observed" rest on a working mod's records alone.

**Credit:** DontCryJustDie pointed out the classic-graphics constant.

> [!TIP]
> **In Tiberian Factions**
>
> TF hit most of these walls while adding TD's and Tiberian Sun's factions to Red Alert. The classic-mode lockout
> took three DLL-side attempts and a memory search before anyone searched `CONFIG.MEG`, and found the constant EA
> had shipped for mods.
> That is why the search order above starts with data.
