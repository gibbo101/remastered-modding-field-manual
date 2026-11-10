---
title: A new resource on the official skirmish maps
description: Put a mod's own resource (Tiberium, say) on Red Alert's official skirmish maps without new lobby entries. Read each stock map from MAIN.MIX, rewrite its OverlayPack, mines and structures at build time, shadow it from CCDATA, repaint its lobby thumbnail, and give every theatre the resource's art.
tags: [maps, skirmish, resources, tiberium, overlays, ccdata, thumbnails]
holds_for: Steam build 21590013
status: verified
unproven: [whether the ten SCM..EQ.INI files in general.mix are ever loaded]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# A new resource on the official skirmish maps

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod adds a resource of its own, such as Tiberium beside Red Alert's ore, and you want it on the maps
players already pick: Red Alert's official skirmish maps, under their own names, lobby entries and start
positions. Everything here is data, built from the stock maps. If your resource only appears on maps you ship as
new entries, see [New maps in the skirmish Official list](new-maps-in-the-skirmish-list.md) instead. The resource
itself, as an overlay of its own, is on [The Tiberium ecosystem](../behaviours/tiberium-ecosystem.md).

## Where the maps are

Red Alert's official skirmish maps are 230 scenario files named `SCM<n>EA.INI` (`SCM05EA.INI`, `SCM111EA.INI`,
`SCMD2EA.INI`), inside `general.mix`, which is itself inside `Data/CNCDATA/RED_ALERT/AFTERMATH/MAIN.MIX`. That
`MAIN.MIX` is the unencrypted kind: see [MEG and MIX archives](../formats/meg-and-mix-archives.md). A MIX stores no
file names, only their CRCs, so look each map up by its name's CRC.

A file of the same name in your mod's `CCDATA/` folder loads instead of the stock map, the same shadowing that
replaces a campaign mission. Every official map carries a `[Digest]`, and an edited map fails that check; remove the
section, which skips the check. The rule and its one exception are on
[Custom campaigns: replacing the official ones](custom-campaigns.md).

Build each map from the stock file every time, with a script, rather than editing copies by hand. Every line you
don't mean to change is then carried over byte for byte.

## What to change in the map

**`[OverlayPack]`: the resource cells.** A map's overlays are one block, read by `OverlayClass::Read_INI`
(`OVERLAY.CPP`): UU-encoded, LCW-compressed, and one byte per cell for all 128 × 128 cells, each the cell's
`OverlayType` number (`OVERLAY_NONE` is -1, ore is `OVERLAY_GOLD1` to `OVERLAY_GOLD4`, 5 to 8, and gems
`OVERLAY_GEMS1` to `OVERLAY_GEMS4`, 9 to 12). Decode it, set the cells you are converting to your resource's
overlay number, encode it again, and decode your own output once as a check.

- **Don't work out density.** Before play the map runs `MapClass::Overpass`, which sets each resource cell's density
  from its neighbours (`CellClass::Tiberium_Adjust`). Any variant of the overlay will do.
- **The top and bottom rows take no overlay.** `Read_INI` skips them.
- **Find whole fields.** Start from a cell in a field and grow through every 8-connected ore or gem neighbour, so a
  field turns over whole, not in patches.

**`[TERRAIN]`: the ore mines.** A mine is a line `<cell>=MINE`. Every `GrowthRate` minutes (`rules.ini`), a mine
spreads ore into a neighbouring cell (`TerrainClass::AI`). A field you convert keeps growing ore from its mine
unless you remove the line. Some maps hide extra mines, so list them all before choosing.

**`[STRUCTURES]`: your resource's source.** If your resource grows from a building, such as a Tiberium blossom tree
owned by the neutral house, add one line per source in Red Alert's format, `<n>=<house>,<type>,<strength>,<cell>,<facing>,<trigger>`.
For example, `0=Neutral,TDBLOSSOM,256,5714,0,None` (256 is full strength). The type is found by
`BuildingTypeClass::From_Name`, which searches only below `STRUCT_COUNT`: see
[Porting Tiberian Dawn buildings and defences](../units/porting-td-buildings-and-defences.md). Almost no stock map has a
`[STRUCTURES]` section (229 of the 230 don't), so add one.

## Choosing fields fairly

- **Keep each start's deal even.** Your resource and ore can be worth the same; what must stay fair is each start's
  access. On a mirrored map, convert fields in mirrored pairs.
- **Leave mixed fields alone, or convert them knowingly.** Gems pay more than ore. A field that holds gems, or
  joins one, changes a start's income if you convert it.
- **No map has to be even.** Some maps can be mostly your resource and others mostly ore. A spread across the pool
  is more interesting than every map at half and half.
- **Starts are waypoints 0 to 7.** Some maps list the same cell more than once: `SCMD2EA.INI` gives waypoints 2 and
  4 the same cell, and 1, 5 and 3, 6 the same pairs. Count each start once.

## The lobby thumbnail

The lobby doesn't draw a map's thumbnail from the map file, so a shadowed map still shows its stock layout. Each
official map's thumbnail is a pre-rendered texture in `TEXTURES_SRGB.MEG`,
`MOBIUS_RED_ALERT_MULTIPLAYER_<N>_MAP.DDS`: 512 × 512, DXT5, ten mip levels, 349,680 bytes.

- **Find the key from the preview data.** `CNCMAPPREVIEWDATA.XML` in `CONFIG.MEG` has one
  `<INIData Name="MOBIUS_RED_ALERT_MULTIPLAYER_<N>_MAP">` per map, holding its bounds, theatre and start waypoints,
  and naming no file. Match a map's `[Map]` bounds and its starts against those entries to find its `<N>`. Keep
  off the Grass, `SCM05EA.INI`, is `_5_`: bounds 39, 35, 48 × 48 and starts 5295 and 9678 in both. An entry
  lists each start once, in the order the map first names it, so drop a map's repeated starts before comparing:
  `SCMD2EA.INI`'s seven starts are the four of `MOBIUS_RED_ALERT_MULTIPLAYER_D2_MAP` (4773, 11846, 6234, 11558). The
  entries' format is on [New maps in the skirmish Official list](new-maps-in-the-skirmish-list.md).
- **The map is letterboxed.** The playable area is scaled by its longer side and centred. Docklands
  (`_111_`, 126 × 64 cells) fills rows 126 to 385 of the 512, with black above and below.
- **Repaint only the converted cells.** Map each converted cell to its pixels with that rule, recolour the ore there,
  and leave the rest of the image alone.
- **Trees and mines aren't drawn.** The thumbnail shows terrain and overlays only, so a resource source you add
  as a building or tree needs no paint (observed: none of Keep off the Grass's 14 trees shows).
- **Write it back the same shape.** Same size, format and mip count as the stock file. The 349,680 bytes are the
  128-byte DDS header (the `DDS ` magic and its 124-byte header) and 349,552 bytes of DXT5 blocks for the ten mips,
  512 × 512 down to 1 × 1. Reuse the stock file's header and write only new blocks. A DDS of the same name loose
  under your mod's `Data/ART/TEXTURES/SRGB/` replaces the stock one (see
  [Overriding the launcher's data](../launcher-data/overriding-launcher-data.md)).

## Every theatre needs the resource's art

The launcher draws an overlay by looking its name up in the current theatre's terrain tileset. A new overlay is
the same overlay on every map, so a theatre whose tileset lacks its tiles draws nothing there. The official maps
are temperate (152) and snow (78), and neither of those stock terrain tilesets has a Tiberium tile. Add your
resource's tiles to the tileset of every theatre your converted maps use: for snow, a winter-coloured set.

## Once the map is playing

- **Two resources hold a border.** Spreading only lands on an empty cell (`CellClass::Can_Tiberium_Germinate`), so
  neither field overgrows the other.
- **Stock spreading always plants ore.** Red Alert's `CellClass::Spread_Tiberium` puts down `OVERLAY_GOLD1` to
  `GOLD4`, whatever the source cell holds. Make it spread the source cell's own type, or your fields grow ore at
  their edges.

## Traps

- **Build from the MIX, never from an editor save.** A map saved by an editor may not round-trip: in one case the
  save flattened every ore and gem variant to the first and dropped cells and a mine. Observed once, with one editor.
- **Don't parse `MAIN.MIX` as an encrypted MIX.** A reader written for Red Alert's encrypted MIXes fails on it.
  Check the header's flags first.
- **Don't load the texture MEG whole.** `TEXTURES_SRGB.MEG` is about 2.6 GB. Read its index, then seek to the one
  member you need.

## How it was verified

- **EA's source:** `OverlayClass::Read_INI` (`OVERLAY.CPP`), `OverlayType` (`DEFINES.H`), `MapClass::Overpass`
  (`MAP.CPP`) and `CellClass::Tiberium_Adjust`, `Can_Tiberium_Germinate` and `Spread_Tiberium` (`CELL.CPP`), the
  mine's spread in `TerrainClass::AI` (`TERRAIN.CPP`), the `[STRUCTURES]` format in `BuildingClass::Read_INI` and
  `From_Name`, and the digest check (`CCINI.CPP`, `SCENARIO.CPP`).
- **The game's files, measured for this page:** 230 `SCM…EA.INI` names found by CRC in `general.mix`, which also
  holds ten `SCM…EQ.INI` files; the theatre, `[STRUCTURES]` and `[Digest]` of all 230; `MAIN.MIX`'s header flags
  (0); `SCM05EA.INI`'s sections, its three mines and its bounds and starts, matching its preview entry; the
  repeated starts in `SCMD2EA.INI`, and its preview entry's four in first-seen order (Tiberian Factions' key lookup
  drops the repeats the same way); the stock thumbnails' size, format and mip count, and that size worked out from
  the DDS layout (a 16-byte block per 4 × 4 pixels, at least one block a mip); the Keep off the Grass thumbnail
  beside its map's `[TERRAIN]` trees; Docklands' thumbnail rows; and no `TIB01` tile in Red Alert's stock snow and
  temperate tilesets.
- **TF:** 151 official maps rebuilt this way, each with its repainted thumbnail, shipped as data. Keep off
  the Grass was played on the Steam Deck with its East field as Tiberium and its blossom tree standing in it, and the
  repainted thumbnail showed in the lobby. Middle Mayhem, a snow map, drew winter Tiberium with no missing art on
  the Linux desktop.

> [!TIP]
> **In Tiberian Factions**
>
> TF turns 151 of Red Alert's official maps into Tiberium and ore hybrids. A planner picks the fields for each map,
> keeping every start's share of Tiberium within reach close to the others', and rotates the maps' targets between
> about half and half, Tiberium-heavy and ore-heavy. Gem fields stay as they are. Each converted mine becomes a TD
> blossom tree that seeds Tiberium, and Tiberium pays what ore pays.
