---
title: TD theatres in Red Alert
description: Play Red Alert maps in Tiberian Dawn's desert, temperate and winter theatres by adding theatre slots to the launcher's list and matching theatres in the DLL, with TD's terrain drawn from the base game.
tags: [maps, terrain, theatres, tilesets, red-alert, tiberian-dawn, dll]
holds_for: Steam build 21590013
status: verified
unproven: [ore and gems on a TD theatre without adding RA's ore tiles to TD's terrain tilesets]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Tiberian Dawn theatres in Red Alert

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When a Red Alert mod wants maps in Tiberian Dawn's desert, temperate or winter terrain, drawn with TD's own HD
tiles. It takes a custom DLL: the theatre a map plays in is a number the DLL reports, and stock Red Alert knows only
three. A data-only mod, or one that keeps to Red Alert's own temperate, snow and interior, doesn't need this page.

## How the launcher picks a terrain tileset

The DLL reports the map's theatre as a number in its map export (`CNCMapDataStruct::Theater`, filled from
`Scen.Theater`). The launcher uses that number as an index into a list in `GameConstants.xml`, in `CONFIG.MEG`:

```xml
<CNCRATheaterTilesets network="client">
    <Tileset></Tileset>                       <!-- 0: temperate (empty = the default) -->
    <Tileset>RA_Terrain_Snow</Tileset>        <!-- 1 -->
    <Tileset>RA_Terrain_Interior</Tileset>    <!-- 2 -->
</CNCRATheaterTilesets>
```

Tiberian Dawn has its own list, `CNCTDTheaterTilesets`: `TD_Terrain_Desert`, empty (TD's unused jungle), empty
(temperate) and `TD_Terrain_Winter`, in the order of TD's own theatre numbers.

The export field's enum is named for TD's theatres (`CNC_THEATER_DESERT`, `_JUNGLE` and so on), but Red Alert's DLL
simply casts its own theatre number into it. Only the number matters.

## The launcher side: more slots

A mod can extend Red Alert's list without repacking `CONFIG.MEG`. The launcher loads a loose
`Data/XML/GameConstants_Mod.xml` from the mod and merges it over the base constants (see
[Overriding the launcher's data](../launcher-data/overriding-launcher-data.md)). Give the list `overwrite="true"`
and write out all six slots:

```xml
<GameConstants>
    <GameConstantsClass>
        <CNCRATheaterTilesets network="client" overwrite="true">
            <Tileset></Tileset>
            <Tileset>RA_Terrain_Snow</Tileset>
            <Tileset>RA_Terrain_Interior</Tileset>
            <Tileset>TD_Terrain_Desert</Tileset>
            <Tileset>TD_Terrain_Temperate</Tileset>
            <Tileset>TD_Terrain_Winter</Tileset>
        </CNCRATheaterTilesets>
    </GameConstantsClass>
</GameConstants>
```

TD's terrain tilesets then load in Red Alert, and each one's tiles come straight from the base game's TD art.

## The DLL side: matching theatres

1. **Extend `TheaterType`.** Add the new theatres after `THEATER_INTERIOR`, in slot order, so their numbers are
   the slots above: `THEATER_DESERT` = 3, a TD temperate = 4, `THEATER_WINTER` = 5. Red Alert's own temperate keeps
   0, so the TD one needs a name of its own.
2. **Add a row per theatre to `Theaters[]`** (`CONST.CPP`). The first field is the name a map's `Theater=` key is
   matched against, without regard to case (`Theater_From_Name`). The other two pick the classic MIX and the file
   suffix used for that theatre's classic shapes and palette.
3. **Give TD's rows Red Alert temperate's classic MIX and suffix** (`"TEMPERAT"`, `"TEM"`). Red Alert's own objects
   on a TD map, such as trees, bibs and smudges, still need classic shapes to exist, and RA temperate's provide
   them. Smudges in particular are exported only when their classic image exists, and their size is read from it.
4. **Make TD's terrain into DLL templates.** The launcher draws the tiles, but the simulation still needs each
   template's classic data: its size and the land type of each cell, which decide where units can drive and
   build. TD's data is in the base game's `DESERT.MIX`, `TEMPERAT.MIX` and `WINTER.MIX`. Convert each iconset to
   Red Alert's format, keeping TD's land types (a river's water as `LAND_RIVER`). Then flag each template for the
   theatres whose tileset draws it, and load it only on those.
5. **Send TD's tile names on a TD theatre.** For each cell, the DLL exports a template name, which the launcher
   looks up in the theatre's tileset. On a TD theatre, send TD's own name (`SH17`, not whatever your DLL calls
   it). Send any cell the TD tileset can't draw as `CLEAR1`, which every terrain tileset has.

## Traps

- **A template name the tileset lacks can crash the launcher.** This is why step 5 falls back to `CLEAR1` instead of
  sending the name anyway. Observed while building this, not re-tested for this page. Every theatre tileset, in
  both games, has `CLEAR1`.
- **Ore isn't in TD's tilesets.** `GOLD01` to `GOLD04` and `GEM01` to `GEM04` exist only in Red Alert's temperate
  and snow terrain tilesets. TD's temperate and winter tilesets carry Tiberium blossom trees (`SPLIT2`, `SPLIT3`)
  instead, and TD's desert has neither. **Unproven:** a mod that wants ore on a
  TD theatre will need RA's ore tiles added to its copy of TD's terrain tileset.
- **Terrain tilesets don't use opener tiles.** Your mod's own terrain art stays a ZIP under the tileset's usual
  root. See [TD art from the base game](td-art-from-the-base-game.md).

## How it was verified

Each claim was checked three ways:

- against the game's own files: both theatre lists in `CONFIG.MEG`'s `GameConstants.xml`, the tile names in
  `TD_TERRAIN_TEMPERATE.XML`, the `GameConstants_Mod.xml` path in `ClientG.exe`, and TD's theatre MIXes in the
  base install;
- against EA's released source: the `TheaterType` enums of both games, `CnCTheaterType` and the theatre export in
  `DLLInterface`, and `Theaters[]`;
- against a working mod. For each of the six theatres it generated a map with every template placed once. All six
  drew every template and units spawned. It was played under Proton on Linux and on the Steam Deck, LAN included.

> [!TIP]
> **In Tiberian Factions**
>
> TF's Red Alert plays in six theatres: Red Alert's three and TD's three. TD's 210 drawn templates are DLL templates
> loaded only on the TD theatres, converted from TD's own iconsets by a build script. TD's skirmish maps play in
> their own terrain, beside Red Alert's.
>
> <!-- screenshot: a skirmish on a TD winter map, Allied and GDI bases on TD's own terrain -->
