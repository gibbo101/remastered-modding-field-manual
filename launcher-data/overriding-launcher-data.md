---
title: Overriding the launcher's data
description: Three ways a mod changes the launcher's own data (loose files under Data/, a replacement CONFIG.MEG held to the same-size rule, and the GameConstants_Mod.xml overlay), loose members of the other archives such as the startup movie, what each can and can't reach, and why the instance server never sees any of them.
tags: [launcher, config-meg, xml, game-constants, data]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
status: verified
unproven: [which mod's copy wins when two enabled mods ship the same loose file, whether the launcher reads GameConstants_Mod.xml from a mod's root folder as well as Data/XML, a startup movie in any format but Bink (a Theora one hung once)]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Overriding the launcher's data

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

Whenever your mod changes something the launcher (`ClientG.exe`) reads from its data rather than from your DLL:
tilesets, sounds, map lists, faction names and colours, screens, text, game constants. Most of the front end is
data in the base game's `Data/CONFIG.MEG`, and a mod can override it. A mod that only changes the simulation (rules,
AI, the DLL's own behaviour) doesn't need this page.

## Three ways in

| Route | What it does | Limits |
|---|---|---|
| **A loose file** at its archive path under your mod's `Data/` | Replaces that one `CONFIG.MEG` member | Replaces the whole file, never merges. Any size. |
| **Your own `Data/CONFIG.MEG`** | Replaces the base archive | Every member must keep its exact byte size |
| **`Data/XML/GameConstants_Mod.xml`** | Merges over `GameConstants.xml` | Game constants only |

### A loose file (the default)

Put the file at its path inside the archive, under your mod's `Data/`. For example,
`DATA\XML\INSTANCES.XML` in `CONFIG.MEG` becomes `Data/XML/INSTANCES.XML` in the mod. The launcher reads your copy
instead of the archive's, at any size. Loose copies work for XML (tilesets, sound events, instances, map preview
data), for `.BUI` screens and for the `MASTERTEXTFILE_*.LOC` string tables.

The same holds for members of the other base archives: the UI atlas from `TEXTURES_SRGB.MEG` (see
[The UI atlas](../front-end/the-ui-atlas.md)), and the startup movie. A loose `Data/ART/MOVIES/RA/REDINTRO.BK2`
replaces Red Alert's intro from `MOVIES_RA.MEG`. Make it a Bink file: the game folder ships RAD's Bink 1 and Bink 2
players (`binkw32.dll`, `bink2w32.dll`), and a Bink 1 movie renamed to `.BK2` plays. **Unproven:** other formats;
a Theora file in its place hung on a black screen that couldn't be skipped, seen once.

The loose file **replaces** the member whole. Ship a patched copy of the base game's file with your changes in it,
never a file holding only your additions. The [TD sounds page](../using-what-the-player-owns/td-sounds-from-the-base-game.md)
shows what a partial file does: every stock sound points at nothing, and the launcher crashes.

### A replacement `CONFIG.MEG`

A mod can also ship a whole `Data/CONFIG.MEG`, which the launcher loads in place of the base one. The MEG format
has no checksum or signature, so a faithful repack always loads. There is one hard rule:

> [!WARNING]
> **Every member must keep its exact byte size.** The launcher reads your archive's file data at the *base*
> archive's offsets, ignoring your archive's own offset table. Grow or shrink one member and every file after it
> is read from the wrong place. The launcher then fails at boot, at a generic fatal-assert address, naming an
> innocent file further down the archive (such as `error reading xml header from .\Data\XML\GameConstants.xml`).
> Edit in place, pad back to the original size (XML comments are the usual padding), and check both the member's
> size and the archive's total against the base.
>
> **Keep the same members, too.** Adding or removing one changes the size of the archive's name and file tables,
> which come before the data, so every file's data moves. That follows from the rule above; it hasn't been tried
> on its own.

The archive is about 44 MB (44,201,888 bytes in this build), and you ship all of it for one change. Use a loose file
unless one won't do.

### `GameConstants_Mod.xml`

`ClientG.exe` looks for `\XML\GameConstants_Mod.xml` beside `\XML\GameConstants.xml` and **merges** it over the
base constants. It is the launcher's only `_Mod` overlay: no other `*_Mod.xml` name appears in the binary. Ship
only the constants you change. A list is appended to unless you mark it `overwrite="true"`:

```xml
<?xml version="1.0"?>
<GameConstants>
    <GameConstantsClass>
        <CNCDisableLegacyGraphicsOption network="client"> True </CNCDisableLegacyGraphicsOption>
        <CNCRATheaterTilesets network="client" overwrite="true">
            <Tileset></Tileset>
            ...
        </CNCRATheaterTilesets>
    </GameConstantsClass>
</GameConstants>
```

Ship it as `Data/XML/GameConstants_Mod.xml`. **Unproven:** Vanilla Conquer's TD sample places the file at the
mod's root instead. Whether the launcher also reads it there hasn't been tested.

## Example: team colours

House colours are launcher data. `Data/XML/CNCRATEAMCOLORS.XML` and `CNCTDTEAMCOLORS.XML` in `CONFIG.MEG` hold one
`TeamColorTypeClass` per house name, each a variant of `BASE_TEAM`. Red Alert's has 21: `BASE_TEAM`, the nine
countries, `GOOD`, `BAD`, `NEUTRAL`, `JP` and `MULTI1` to `MULTI8`. Tiberian Dawn's has 11, with `MULTI1` to
`MULTI6` and separate `BAD_UNIT` and `BAD_STRUCTURE` entries. Each entry gives an RGB range of the art to recolour
(`LowerBounds`, `UpperBounds`), an `HSVShift` and input and output levels.

Ship a whole edited copy loose at the same path. Published mods do: Reilsss's C&C in RA recolours a dozen of Red
Alert's houses, and CFE Patch Redux's Tiberian Dawn copy rearranges TD's multiplayer colours and adds `MULTI7` and
`MULTI8` for its eight-player games.

## What none of them reach

- **The instance server.** `InstanceServerG.exe` runs the match and resolves instances and map files from the base
  game's data, not your mod's. A new entry in a loose `INSTANCES.XML` lists in the lobby but fails at match start.
  See [New maps in the skirmish Official list](../maps-and-lobby/new-maps-in-the-skirmish-list.md).
- **Anything decided in `ClientG.exe`'s code.** The launcher's data is moddable, but its behaviour isn't. For
  those, see the pages on [re-pointing records in memory](../clientg-ram/repointing-atlas-regions.md) and
  [patching the launcher's code](../clientg-ram/patching-the-launchers-code.md).
- **Player-side settings.** For example, no file shipped in a mod sets a default key binding. There is no
  `InputTranslatorConfigurations_Mod.xml`, and the launcher ignores a mod's copy of the bindings file. The
  player's own settings, bindings included, are in `userdata/<account>/1213210/remote/Player_RA_settings_1.bin`
  (and `Player_TD_settings_1.bin`): a ChunkFile (`CH`, zlib from `0x24`) with a second ChunkFile nested inside,
  synced by Steam Cloud and kept after the mod is gone. Its header is laid out like a `.bui` file's (see
  [BUI screens](../front-end/bui-screens.md)), and its 32-bit value at `0x08` matches no CRC-32, Adler-32, MD5,
  SHA-1 or SHA-256 of the data. It's the player's file, so a mod shouldn't write it.

## Traps

- **Search the data before calling something impossible.** Before deciding a launcher behaviour can't be
  changed, list `CONFIG.MEG` and search it. The switch to lock out classic graphics was sitting in
  `GameConstants.xml` all along.
- **One copy wins across mods.** When two enabled mods ship the same loose file, the launcher reads one of them
  and never merges the two. So an add-on can't add entries to a list file its parent mod also ships: the parent
  has to own the list. **Unproven:** which mod's copy wins. Don't rely on load order for it.
- **A new file name isn't loaded.** The launcher loads only the files its index lists. For tilesets that's
  `DATA\XML\TILESETS.XML`, which names exactly 19 files: TD's, Red Alert's and the `Common_` ones. A
  `MY_UNITS.XML` beside them is never read, so put your entries into a copy of a listed file such as `RA_UNITS.XML`.
  `CONFIG.MEG` has an index like this for each kind of data (`GAMEOBJECTFILES.XML` for objects,
  `SFXEVENTFILES.XML` for sound events, and others). One published mod, DontCryJustDie's "Veterancy and more", ships
  loose copies of the object and sound-event indexes with one extra file each, and its new files load. So a loose,
  extended index looks like the way to add a file name. **Unproven** for `TILESETS.XML`, and not tested here for
  any index.
- **Only while the mod is enabled.** Every override applies only when the mod is enabled. The player's vanilla game
  is untouched, so editing shared files such as `FACTIONS.XML` is safe.

## How it was verified

- **Team colours:** the stock files extracted from `CONFIG.MEG`, compared with the copies three published Workshop
  mods ship (Reilsss's C&C in RA, CFE Patch Redux, and a veterancy mod that adds the same two TD entries); CFE's
  credits list its TD colour rearrangement and eight-player TD.
- **Loose files and the replacement archive:** a byte-identical repack of `CONFIG.MEG` with one string edited
  showed in the lobby when shipped in a mod folder. Loose `INSTANCES.XML`, `CNCMAPPREVIEWDATA.XML`, tileset, sound
  and `.BUI` files all load in Tiberian Factions. The size-rule crash and its signature were hit, then fixed by padding.
- **The startup movie:** `DATA\ART\MOVIES\RA\REDINTRO.BK2` listed in the stock `MOVIES_RA.MEG` for this page, both
  Bink DLLs in the game folder and `bink2w32.dll`'s functions imported by `ClientG.exe`; TF's intro build
  encodes Bink 1 and copies it to the `.BK2` name, and its intro plays in place of the stock one. The Theora hang is
  TF's record only.
- **`GameConstants_Mod.xml`:** the path appears in `ClientG.exe`, and it's the only `_Mod` name there. TF
  uses it to lock out classic graphics, enable the mod hotkeys and add theatre slots, all working in play.
  Vanilla Conquer's TD sample uses the same file and `overwrite="true"`.
- **The settings file:** read for this page (the nested `CH` header inside the first stream, the compressed length
  at `0x10` equal to the file's length less `0x24`) and listed in Steam's `remotecache.vdf` for the game; the value
  at `0x08` was tested against those five algorithms over the compressed stream and the uncompressed data;
  TF's notes on it match.
- **The member rule:** the stock archive's size read for this page. The MEG layout puts both tables ahead of the
  data (see [MEG and MIX archives](../formats/meg-and-mix-archives.md#meg)).
- **The server:** `InstanceServerG.exe` carries its own `\XML\Instances.xml` path and the
  `Creating instance %s` assert from `serveripcmessagehandler.cpp`, which a new instance hits at match start.

**Credit:** Kushan documented `GameConstants_Mod.xml` on the PPM forums.

> [!TIP]
> **In Tiberian Factions**
>
> TF ships its front end both ways. A replacement `CONFIG.MEG` carries some rebuilt screens (its confirmation box,
> loading screen and lobbies), and loose files carry the rest: tilesets, sound events, its map list and preview
> data, more screens and text. Its constants are in `GameConstants_Mod.xml`. Its add-on packs carry art and sound. Each pack
> also holds XML files with its entries, under names of their own (`TSHD_UNITS.XML`), but the launcher never loads
> those. They're there for other modders to merge into their own lists, and TF's build merges them into the
> files it ships.
