---
title: Adding a theatre of your own
description: A custom terrain theatre for Red Alert. The slot and DLL steps are proven with TD's theatres, but a new terrain template name with loose art crashes the launcher, so custom terrain is drawn by reskinning existing template names.
tags: [maps, terrain, theatres, tilesets, dll]
holds_for: Steam build 21590013
status: verified
unproven: [any route to new terrain template names (new names with loose art crash the launcher), a stock tileset copied under a new name and root folder with loose art, TILEPATCHES as a whole-theatre route, whether a terrain tileset costs video memory whole or per tile drawn, theatre slots past 5]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Adding a theatre of your own

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

**Status:** partly proven, with one hard wall. Adding a theatre works, with TD's three as the proof. But the
launcher can't draw terrain art under a template name it doesn't already have: **a new template name with loose
art crashes it.** Custom terrain has to be drawn under existing names. This page says which part is which.

## When you need this

When your mod wants terrain the base game doesn't have: Tiberian Sun's temperate or snow, or a world of your own.
If TD's desert, temperate or winter will do, use [TD theatres in Red Alert](../using-what-the-player-owns/td-theatres-in-red-alert.md)
instead, which is proven and draws its art from the base game.

## The wall: no new terrain template names

The launcher draws terrain templates only from the base game's own art. Give a template a new name, ship its art
loose, and register it in a tileset: the tileset loads, but the launcher crashes the moment a placed tile renders
(`0xC0000005`, its fatal-assert address `0x56A539`; see [Crash triage](../troubleshooting/crash-triage.md)). The
DDS format, a replacement `CONFIG.MEG` and the file's load path were each ruled out as the cause. Your DLL can't
fix this: it only hands the launcher each cell's template name, and the art behind the name is the launcher's.

TD's theatres work because every TD template name is already in the base game. New *object* names (units,
effects, trees with art of their own) are a different system, and they do render.

**The wall is specific to templates.** Other new entries in a terrain tileset draw. A working mod's Red Alert
temperate tileset adds one new name, its Tiberium overlay `TIB01`, which renders from a ZIP under the tileset's
root. In Tiberian Dawn, new bib tiles draw from loose folders, though not from a ZIP. Only a new *template*, the
ground a map is painted with, hits the crash.

## What works: new art under existing names

**A loose file at an existing template's path replaces its art.** For example,
`Data/ART/TEXTURES/SRGB/RED_ALERT/TERRAIN/TEMPERATE/<NAME>.TEM/<NAME>.TEM-0000.DDS` shadows the base game's frame,
with no DLL needed. The radar samples the new art too, so the minimap matches.

- **It reskins, it doesn't add.** The names, shapes, sizes and land types stay the stock template's. Only the
  pixels change.
- **It changes that theatre everywhere.** The path is per theatre, so every map in that theatre gets the new look.
  A custom look in its own theatre slot means giving up a stock theatre you don't use, or reskinning one only your
  mod's maps use.
- **The capacity is the stock tileset's.** Red Alert's temperate tileset has 331 template names in 2,053 tiles
  (8,213 frames), and TD's are about 200 names each. A set of pieces that tile together fits; tens of thousands of
  unique pieces don't.
- **Frames can ship as loose DDS** at the same path, which keeps a reskin's video memory down: see
  [Sprite memory and DDS](../art/sprite-memory-and-dds.md).

**Per-map art without new names:** `Data/XML/TILEPATCHES/` holds per-map cell placements
(`MAPS/<game>/<MAP>_MAPPATCHES.XML`) and animated multi-cell texture blocks (`PATCHES/<name>_PATCH.XML`, with a
frame rate). Loose copies override them, with no size rule. **Unproven** as a route for a whole custom theatre.

## Can there be a seventh theatre?

**As a theatre, yes.** A slot is one more entry in the launcher's list, plus a matching `TheaterType` in your DLL
(below). A working mod uses six slots, and nothing found so far caps the list there. Slots past 5 haven't been
tried, so that part is unproven.

**What limits it is the art.** A seventh theatre has to draw with terrain the launcher can render:

| Route | Result |
|---|---|
| Point the slot at a stock tileset | Works, but it looks like that stock theatre. |
| Reskin a stock tileset's names | Works, but the reskin replaces that stock theatre everywhere. In effect you trade a theatre you don't use for your own. |
| New art under new template names | Crashes the launcher (the wall above). |
| A copy of a stock tileset under a new file name, keeping its template names but with a new root folder holding your art | **Untested.** It works if the launcher's crash is about unknown template names, and fails if the art must come from the base game's archives. It also needs the loose `TILESETS.XML` route (below). |

The last route is the one that could give a seventh look beside all six stock ones, and it's a cheap test to run.

## The theatre itself

The slot and DLL steps are the same as for a TD theatre, and each is proven by TD's three, in slots 3 to 5:

1. **A launcher slot.** Add an entry to `CNCRATheaterTilesets` in `GameConstants_Mod.xml` naming the terrain
   tileset. The slot's position is its theatre number.
2. **A DLL theatre.** Add a `TheaterType` value after the existing ones, with the same number as the slot, and a
   row in `Theaters[]` naming it for maps' `Theater=` key.
3. **Templates.** Every terrain piece is a DLL template, flagged for the theatres that draw it, with classic data
   giving its size and the land type of each cell. `TemplateType` is an `unsigned short`, so there's room past 255
   templates, but every name has to be one the launcher can draw (above).
4. **Names on the wire.** On your theatre, export each cell's template under its tileset name, and anything the
   tileset can't draw as `CLEAR1`.

**A new tileset file** only matters once you have names the launcher can draw. The launcher loads only the files
its index, `DATA\XML\TILESETS.XML`, lists (19 files). A published mod adds files through two of `CONFIG.MEG`'s other
indexes with loose copies, so a loose `TILESETS.XML` may work. **Unproven**, and under the wall above it wouldn't
open new art anyway.

## What's open: video memory

The launcher keeps every texture it draws in video memory. Whether a terrain tileset costs memory as a whole, or
only for the tiles a map draws, isn't settled. One desktop reading, one match each, saw 4,796 MiB on an interior
map with the stock interior tileset and 4,812 MiB with 163 tiles added to it that the map never draws: too small a
sample to tell a cost from noise. That decides how big a custom tileset can be:

- **Per tile drawn:** a large tileset is fine, and each map pays only for what it uses.
- **Whole:** a large tileset costs every map that uses the theatre. Keep it small: a set of pieces that tile
  together (ground textures, transitions by corner, cliffs, ramps) rather than every unique piece.

**A test that settles it:** a data-only mod that ships one stock terrain tileset plus a few thousand extra tiles no
map uses, with video memory read in the same match with the mod off and then on. If memory rises by roughly the
size of the extra tiles, tilesets load whole. If it doesn't rise, only drawn tiles load.

## How it was verified

- **The theatre steps:** TD's three theatres, proven in a shipped mod; see
  [TD theatres in Red Alert](../using-what-the-player-owns/td-theatres-in-red-alert.md) for their three-way
  checks. `TemplateType`'s width is in the mod's source.
- **The wall:** a working mod's investigation, which hit the crash with several new template names and ruled out
  the DDS format, a replacement `CONFIG.MEG` and the load path; the crash address disassembled from `ClientG.exe`
  on disk (a deliberate write after an assert flag test); and no published mod adding new terrain template names.
- **Templates only:** a shipped Red Alert temperate tileset whose single new name, `TIB01`, draws; and a working
  mod's Tiberian Dawn asset packs, whose new bib tiles draw from loose folders but not from ZIPs.
- **Reskinning existing names:** Reilsss's Desert mod (Workshop 2833233740) ships 8,305 loose `.DDS` frames at
  stock template paths and per-map `TILEPATCHES`, with no DLL. A shipped mod's tileset XML names `.tga` frames that
  ship only as `.DDS`, and they draw. The tile and name counts were read from the stock tilesets for this page.
- **The tileset index:** the stock `TILESETS.XML` in `CONFIG.MEG`, read for this page.

**Credit:** Reilsss's Desert mod is the public proof that terrain reskins need only data.

> [!TIP]
> **In Tiberian Factions**
>
> TF plays Red Alert maps in TD's three theatres, slots 3 to 5, through the steps above. Tiberian Sun theatres
> are a parked design in TF's own docs: the template wall means their art would have to be drawn under existing
> template names.
>
> The memory test is built as a data-only mod and ready to run, but it hasn't been run yet.
