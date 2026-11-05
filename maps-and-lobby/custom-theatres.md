---
title: Adding a theatre of your own
description: A brand-new terrain theatre for Red Alert, beyond its own three and TD's three. The slot, DLL and template steps are proven with TD's theatres; a tileset file of your own, its video-memory cost, and converting isometric (Tiberian Sun) terrain onto Red Alert's square grid are still open.
tags: [maps, terrain, theatres, tilesets, dll, tiberian-sun]
holds_for: Steam build 21590013
status: partly proven
unproven: [whether the launcher loads a terrain tileset file not named in TILESETS.XML, whether a terrain tileset costs video memory whole or per tile drawn, theatre slots past 5, two slots naming one tileset, a converted Tiberian Sun theatre playing end to end]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Adding a theatre of your own

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

**Status:** partly proven. Adding a theatre works, with TD's three as the proof. A theatre with a terrain tileset
of your own hasn't been played end to end yet. This page says which part is which.

## When you need this

When your mod wants terrain the base game doesn't have: Tiberian Sun's temperate or snow, or a world of your own.
If TD's desert, temperate or winter will do, use [TD theatres in Red Alert](../using-what-the-player-owns/td-theatres-in-red-alert.md)
instead, which is proven and draws its art from the base game.

## What's proven: the theatre itself

A new theatre takes the same steps as a TD one. Each step below is proven by TD's three theatres, in slots 3 to 5:

1. **A launcher slot.** Add an entry to `CNCRATheaterTilesets` in `GameConstants_Mod.xml` naming your terrain
   tileset. The slot's position is its theatre number.
2. **A DLL theatre.** Add a `TheaterType` value after the existing ones, with the same number as the slot, and a
   row in `Theaters[]` naming it for maps' `Theater=` key.
3. **Templates.** Every terrain piece is a DLL template, flagged for the theatres that draw it, with classic data
   giving its size and the land type of each cell. `TemplateType` is an `unsigned short`, so there's room past 255
   templates.
4. **Names on the wire.** On your theatre, export each cell's template under the name your tileset uses, and
   anything the tileset can't draw as `CLEAR1`. Make sure your tileset has a `CLEAR1`.

**Terrain frames can be loose DDS.** A tileset XML can name a frame `t17.tem\t17.tem-0000.tga` while the mod ships
`T17.TEM/T17.TEM-0000.DDS` in its place, and the launcher draws the DDS. That's proven by a shipped terrain object.
Compressed DDS frames take far less video memory than TGA, which matters for a large tileset.

## What's open: the tileset file

The launcher loads only the tileset files its index, `DATA\XML\TILESETS.XML`, names. That's 19 files: TD's, Red
Alert's and the `Common_` ones (see [Overriding the launcher's data](../launcher-data/overriding-launcher-data.md)).
TD's theatres work because `TD_Terrain_Desert`, `_Temperate` and `_Winter` are already on the list. A new file such
as `TS_Terrain_Temperate.xml` isn't. Three routes, none tested yet:

- **Ship a loose `TILESETS.XML`** naming your file as well. The most promising route: a published mod adds files
  this way through two of `CONFIG.MEG`'s other indexes (objects and sound events). **Unproven** for the tileset
  index.
- **Add your tiles to a listed terrain tileset**, under template names of your own, and point your slot at that
  tileset. **Unproven** whether two slots can name one tileset. Tile names must not clash with the stock theatre's.
- **Replace a listed tileset you don't use** with your own contents under its name. It works as file overriding,
  but you lose that theatre.

Find out which route works before building any art.

## What's open: video memory

The launcher keeps every texture it draws in video memory. Whether a terrain tileset costs memory as a whole, or
only for the tiles a map draws, hasn't been measured. That decides how big a custom tileset can be:

- **Per tile drawn:** a large tileset is fine, and each map pays only for what it uses.
- **Whole:** a large tileset costs every map that uses the theatre. Keep it small: a set of pieces that tile
  together (ground textures, transitions by corner, cliffs, ramps) rather than every unique piece.

**A test that settles it:** a data-only mod that ships one stock terrain tileset plus a few thousand extra tiles no
map uses, with video memory read in the same match with the mod off and then on. If memory rises by roughly the
size of the extra tiles, tilesets load whole. If it doesn't rise, only drawn tiles load.

## Isometric terrain on a square grid

Tiberian Sun's terrain is isometric, but its cells are squares like Red Alert's: the isometric look is TS's
camera, rotated 45° and squashed 2:1. So a TS map can be laid on Red Alert's grid:

- **Orientation and scale:** rotate so TS's screen-up stays up, which makes TS's cell axes Red Alert's diagonals.
  At one Red Alert cell per TS screen diamond, each Red Alert cell holds two TS cells, and distances shrink to
  71%.
- **Land:** take each Red Alert cell's land type from the TS cell at its centre, through TS's land types (clear,
  rough, road, water, beach, rock).
- **Diagonal leaks:** Red Alert's pathfinding cuts corners, and a TS cliff along a TS axis crosses the grid
  diagonally. Where two blocked cells touch only at a corner, block one of the open cells beside them, so the
  cliff becomes a staircase units can't slip through.
- **Height is a rule, not just art.** TS refuses a step between cells unless they're level, or one level apart
  with the lower cell a ramp. To keep plateaus, the DLL has to apply the same rule on these maps.
- **Cliffs as objects:** draw TS's cliff pieces as objects over flat ground, with their faces hanging south,
  rather than as ground tiles.

**Unproven end to end:** a converter written this way lays TS's multiplayer maps on the grid. The shortest routes
between start points come out at 0.93 to 1.04 times TS's own on 33 of 39 maps, and the art probes draw them with
TS's tiles. No converted map has been played as a theatre yet. Red Alert 2 uses the same map and tile formats, so
the same method would apply to its theatres.

## How it was verified

- **The theatre steps:** TD's three theatres, proven in a shipped mod; see
  [TD theatres in Red Alert](../using-what-the-player-owns/td-theatres-in-red-alert.md) for their three-way
  checks. `TemplateType`'s width is in the mod's source.
- **Loose DDS frames:** a shipped mod's tileset XML names `.tga` frames that ship only as `.DDS`, and they draw.
- **The tileset index:** the stock `TILESETS.XML` in `CONFIG.MEG`, read for this page.
- **The TS method:** a converter and art probes in a working mod's development branch, with the route measurements
  above. Nothing past that is proven.

> [!TIP]
> **In Tiberian Factions**
>
> TF plans Tiberian Sun's Temperate and Snow as theatres 6 and 7, with TS's own multiplayer maps converted onto them
> and drawn with TS's art. The converter and art probes exist on a development branch. The work is parked until the
> video-memory test picks the art route: TS's own tiles, one piece per cell, or a smaller square tile set made from
> TS's art.
>
> <!-- screenshot: a converted TS map preview beside TS's own view of the same map -->
