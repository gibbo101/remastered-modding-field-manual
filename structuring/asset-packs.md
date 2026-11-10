---
title: Asset packs
description: "Split a big mod's art and sound into separate Workshop items (asset packs) that the mod depends on or can use: what a pack holds, how the mod's DLL tells a pack is enabled, why a pack's own XML files never load, and how to keep packs small."
tags: [structuring, workshop, asset-packs, art, audio]
holds_for: Steam build 21590013
status: verified
unproven: [Workshop-side "required items" links, which weren't checked here]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Asset packs

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only** for the art. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When a mod's art and sound grow large enough to split: hundreds of MB of HD units, voices in several languages, or
art other modders would like to use without your rules. A pack is a separate Workshop item that holds art and sound
only, and the mod depends on it or uses it when it's there. A small mod doesn't need packs.

## What a pack is

A pack is an ordinary mod folder (see [The mod folder and ccmod.json](../getting-started/the-mod-folder-and-ccmod-json.md)),
uploaded as its own Workshop item and enabled beside the mod:

```
<Pack>/
├── ccmod.json
├── CCDATA/<PACK>.INI                  a marker, so the mod's DLL knows the pack is on
└── Data/
    ├── ART/TEXTURES/SRGB/RED_ALERT/UNITS|STRUCTURES|VFX/<NAME>.ZIP
    ├── ART/TEXTURES/SRGB/BuildIcon_<name>.tga
    ├── AUDIO/<NAME>.WAV, AUDIO/EN-US/<NAME>_EN-US.WAV
    └── XML/...                         the pack's entries, for modders to merge (never loaded; see below)
```

Split by kind and by language, so a player or another modder takes only what they need: graphics, sound
effects, then voices and EVA one pack per language. The base game keeps its spoken audio per language too
(`SFX2D_EN-US.MEG`, `SFX2D_DE-DE.MEG`, `SFX2D_FR-FR.MEG`).

## A pack's XML is never loaded

The launcher loads only the tileset files its index (`TILESETS.XML`) names, and a pack can't add to that list. So
a pack's own `Data/XML/TILESETS/<PACK>_UNITS.XML` and buildables and sound-event files do nothing in game. The
**mod** carries every entry the pack's art and sound need, merged into its own copies of the listed files. See
[Overriding the launcher's data](../launcher-data/overriding-launcher-data.md).

Ship the pack's XML files anyway, under names of their own: they are what another modder copies into their mod to
use the pack.

## Telling whether a pack is on

The launcher hands the DLL the path of every enabled mod's `CCDATA` folder, one call to `CNC_Add_Mod_Path` each,
and EA's DLL adds each to the folders its file search looks in (`ModSearchPaths`). So a pack can carry a small
marker file in its `CCDATA/`, such as `CCDATA/MYPACK.INI` with `Version=1.0` in it. The DLL looks for it under
each path it was given, and knows whether the pack is on, and which version.

- **A required pack:** when it's missing, fall back to something that still plays, and tell the player. Never
  draw art that isn't there.
- **An optional pack:** use its content only when its marker is found.
- **Version the marker.** When the mod's XML names art a newer pack added, check the pack's version too.

## Keeping packs small

- **One copy of each frame.** Within an object's ZIP, a shape whose image matches an earlier one can name that
  frame in the tileset XML, and the copy leaves the ZIP. Not for terrain: the launcher draws a terrain cell only
  from the frame its own shape names, and shows its placeholder for a shared one (observed).
- **One copy of each ZIP.** A type whose art is identical to another's can draw its frames from the other's ZIP:
  a frame named `<folder>\<file>.tga` reads from the ZIP opened as `<folder>`. That relies on the other ZIP being
  open, which the launcher's start-up preload of every mod texture guarantees. Its `NOSPLASHPRELOAD` launch
  option breaks it.
- **Run-length encode cameos.** A `BuildIcon_*.tga` saved RLE-compressed is the same pixels at about four
  fifths of the size.
- **Don't ship what the player already has.** Art from the base game can be drawn from the base game:
  [TD art from the base game](../using-what-the-player-owns/td-art-from-the-base-game.md).

## In LAN games

Every player needs the same enabled mods, packs included, so an optional pack is on for everyone or no one. See
[LAN games](../engine/lan-games.md).

## How it was verified

- **The layout and markers:** Tiberian Factions' packs on the Workshop and their source folders. The marker reader in
  TF's DLL, called from `CNC_Add_Mod_Path`. EA's `Add_Mod_Path`, which adds each path to `ModSearchPaths`.
  The instance server names `CNC_Add_Mod_Path`.
- **XML never loaded:** the stock `TILESETS.XML` in `CONFIG.MEG`, the packs' own files, and TF's merged
  copies working in play.
- **Sharing:** TF's build tooling and its shipped tilesets. The terrain placeholder and the preload trap were
  observed in play.
- **Per-language audio:** the base game's `SFX2D_*` MEGs.
- **Not checked:** Steam's own "required items" links on a Workshop page.

**Credit:** DontCryJustDie suggested publishing separate packs per kind and per language, so other mods can use
them.

> [!TIP]
> **In Tiberian Factions**
>
> TF's Tiberian Sun, Red Alert 2 and C&C3 art and sound ship as asset packs, each split into graphics, sound
> effects and English voices, for Red Alert and for Tiberian Dawn. TS-HD-Assets is required: without its marker
> the DLL plays a TS GDI pick as another side. A build script sorts every file into its pack by name, and merges
> each pack's entries into the mod's own XML at staging.
