---
title: A map editor for Linux and mods
description: cnc-map-editor is a Linux-native map editor for Red Alert and Tiberian Dawn maps, built on Nyerguds' Mobius editor's core. Its saves match Mobius's byte for byte on all 230 official RA maps, it learns a mod's buildings, units, infantry and terrain from a mapeditor.json the mod ships, and a headless command line drives it. Still in progress; 128 × 128 cap for now.
tags: [maps, tools, linux, editor, mods]
holds_for: Steam build 21590013
status: verified
unproven: [maps the editor makes or generates being played in the game (its saves match Mobius's output, which the game plays, but no editor-made map has been played and recorded), Windows and macOS builds (only Linux and the Steam Deck have run it), maps bigger than 128 × 128 (the editor stops there for now)]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# A map editor for Linux and mods

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When you want to make or edit Red Alert or Tiberian Dawn maps on Linux or a Steam Deck, or your mod adds buildings,
units or terrain that a map editor should offer. EA's map editor and Nyerguds' Mobius editor are Windows programs, and
both know only the types compiled into them, so a mod's new types show up there as unknown, or are lost on save.

If you edit stock maps on Windows, Mobius is the mature choice and you can skip this page. The editor described here
is a work in progress: it's usable, but not finished.

## The editor

[cnc-map-editor](https://github.com/gibbo101/cnc-map-editor), by this manual's author, keeps Mobius's core (the MIX
and MEG readers, the LCW codec, tileset resolution, the map model and its placement rules, the renderer) and
replaces the Windows interface with one that runs natively on Linux. It's written in C# for .NET 8, with an Avalonia
window over the core. It's GPL v3 with EA's Section 7 terms, as Mobius is.

It finds the game in your Steam library, and your mods both in the `Mods` folder and in the Workshop cache, by
reading each one's `ccmod.json`. Mods load in order, last wins, as the game loads them.

It does today:

- **Red Alert and Tiberian Dawn maps,** opened, edited and saved; Tiberian Dawn's with their `.bin` file.
- **Terrain, overlay, buildings, units, infantry, smudges, cell triggers and waypoints,** each a brush, with undo.
  A click with no brush selects an object for its properties panel.
- **Triggers and teams,** in their own dialogs: edits go to a working copy, a Check run tests them, and OK commits
  them as one undo step.
- **Map settings and briefings,** and new maps in any of the game's real theatres.
- **Random skirmish maps:** a seeded generator lays out start points, ore and gem fields, trees, lakes, rivers,
  islands, coasts, villages and roads. The same seed always makes the same map.
- **The Steam Deck:** a self-contained build runs in desktop mode, or from game mode as a non-Steam game.

### Faithful to Mobius

The editor is tested against Mobius itself. Loading a map and saving it gives the same file Mobius saves, byte for
byte, on all 230 official Red Alert skirmish maps and on a 31-map Tiberian Factions map pack. The map layers render
the same as Mobius's, pixel for pixel, apart from a rounding difference of at most 5 under partly transparent sprite
pixels, where it blends the source art directly. Anything it doesn't know, it keeps: unknown structures, units and
other objects survive a load and save, and it lists them rather than dropping them.

## Teaching it your mod: `mapeditor.json`

A mod that adds types ships a `mapeditor.json` beside its `ccmod.json`. The editor reads it for every loaded mod and
builds the mod's types from it at runtime, so nothing about any mod is compiled into the editor. A format-1 manifest
holds:

- `buildings`: each with its engine `StructType` id, INI name, text ID or display name, footprint and occupancy mask,
  power, storage, owner, art name and flags such as `Factory`, `Bib` or `Wall`.
- `units`: vehicles, aircraft and vessels, with their art frame layout, turrets and flags. Each kind has its own id
  range, as in the engine.
- `infantry`: id, name, owner and flags.
- `templates`: terrain templates by `TemplateType` id, with size, land types and an icon mask. A template appears in
  exactly the theatres where the mod ships art for it.
- `resources`: harvestable resources beyond ore and gems, for the random map generator.

The editor never fails on a bad manifest. A file in an unknown format is skipped whole, a malformed entry or an unknown
flag skips that entry, and each skip is a warning that `validate` reports. On an id or name clash the stock game's
type wins, then the earlier mod's. The full format, with every field and its default, is in the editor's
[`docs/mapeditor-json.md`](https://github.com/gibbo101/cnc-map-editor/blob/main/docs/mapeditor-json.md).

A mod can write its manifest by hand or generate it with a script. Either way, regenerate or edit it whenever a type
is added or changes, or the editor offers the old one.

## The command line

The same core runs without a window, so scripts and AI assistants can work with maps:

```bash
cncmap info <map> [--mod <dir>]...   # game, theatre, bounds, counts, unknown entries
cncmap validate <map>                # exit 0 when nothing would be lost
cncmap render <map> out.png --scale 0.25 --bounds-only
cncmap save <map> <out>              # never overwrites the input
cncmap edit <map> --out <path> --place <tile>@<x>,<y> --erase <x>,<y>
cncmap new <out> [--theater <name>]
cncmap generate <out> [--seed <n>] [--players <n>] [--water-style lakes|river|ocean|islands] ...
cncmap expand-mission <map> <spec.json> --out <path>
cncmap mods                          # the installed mods it can see
```

`expand-mission` turns a short JSON list of patterns (win, lose, reinforcements, attack waves, or literal trigger and
team rows) into the map's triggers and teams, for Red Alert maps. `--mod` repeats and applies in order, as the game
does. `cncmap` with no arguments prints every option. Until there's a release, run it as
`dotnet run --project MobiusCli -- <command>`.

## What it can't do yet

- **Maps over 128 × 128.** It keeps Mobius's caps: 128 × 128 for Red Alert, 64 × 64 for Tiberian Dawn (128 × 128
  for its megamaps). The game can be made to run bigger maps (see [Bigger maps](bigger-maps.md)), but no editor writes
  them yet.
- **A finished release.** There are no prebuilt downloads: you build it with the .NET 8 SDK and run it with
  `dotnet run`, as its README shows.

## How it was verified

- **The round trips:** the editor's test suite (`SaveRoundTripTests` compares each save with Mobius's output for the
  same map, byte for byte), re-run for this page: all 230 official maps passed, byte for byte. The 31-map pack passed when the tests
  were written; that pack has since left Tiberian Factions, so it can't be re-run from the current build.
- **The render:** `MapRenderOracleTests`, an official map and a Tiberian Factions map at full scale against Mobius's
  own render; the bound of 5 and its cause are in the test. It passed when it was written; its two input maps are no
  longer on the test machine, so it wasn't re-run for this page.
- **The features:** each one in the list has tests in the editor's suites (lossless load, manifest parsing, mod
  discovery, new maps, the generator, undo, the trigger and team dialogs), its README, and its source.
- **The manifest:** the format document, the parser's tests (malformed entries, unknown flags, unsupported formats),
  and Tiberian Factions' generated manifest (62 buildings, 57 units, 14 infantry, 210 templates, 1 resource) loading
  through it.
- **The caps:** `MaxSize` in the editor's `RedAlert/Constants.cs` and `TiberianDawn/Constants.cs`, the same values
  as Mobius's; EA's editor source has the same 128 and 64 (it has no megamap size).
- **The Deck:** a build deployed and run there in desktop and game mode.

> [!TIP]
> **In Tiberian Factions**
>
> TF's `mapeditor.json` comes from a script: its buildings, units and infantry from tables kept beside the DLL's
> type lists, and its 210 TD terrain templates derived from the same tile map the DLL's TD theatres use. With it the
> editor offers every TF type, and its random map generator can lay Tiberium instead of ore, with a blossom tree
> seeding each field.
