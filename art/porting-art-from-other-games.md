---
title: "Porting art from other C&C games"
description: "Turning Tiberian Sun voxels and SHPs, and Command & Conquer 3 models, into HD Remastered sprites; the target every port must hit (canvas, centring, team-colour green, baked shadow), the 32-degree camera and facing order that match EA's HD vehicles, ships' 16 facings, where each game keeps its art (Firestorm's expand01.mix, one-theatre buildings), and TS's SHP layout (shadow half, damaged frame, Rate= in frames per minute)."
tags: [art, pipelines, tiberian-sun, cnc3, voxels, hd]
holds_for: Steam build 21590013
status: verified
unproven: [Red Alert 2's own archives and models, beyond its voxel tanks rendered as TS voxels, the camera angle EA's HD ships are drawn at]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Porting art from other C&C games

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When your mod brings units or buildings from Tiberian Sun, Red Alert 2 or Command & Conquer 3 into Red Alert. Their
art is in other formats (voxels, isometric sprites, 3D models), and none of it matches Remastered's camera, scale
or team colour. A mod porting Tiberian Dawn's art doesn't need this page, because that's already in the base game:
see [TD art from the base game](../using-what-the-player-owns/td-art-from-the-base-game.md).

**The licence:** EA's modding guidelines license other C&C games' art and sound to mods, revocably, but never
their music. Take the files from your own install.

## The target every port has to hit

Whatever the source, the output is a ZIP of frames in Remastered's form (see
[HD tilesets and ZIPs](hd-tilesets-and-zips.md) and [How the launcher draws sprites](how-the-launcher-draws-sprites.md)):

- **The canvas** is the classic shape's size times a fixed factor: 5.33 matches EA's art, and 8 keeps more detail
  for zooming in.
- **Centred on the canvas**, since the launcher anchors there. Centre a vehicle's hull, not the whole model,
  barrels included.
- **Team colour painted pure green.** EA's own HD frames paint their team-colour areas in pure green (red and blue
  near 0), and the launcher recolours green to the player's colour, keeping its brightness. Paint the remap areas
  green that follows the surface's own brightness, or they read flat.
- **The shadow baked in:** the silhouette offset down and right, black at alpha 191.
- **Straight alpha, frames cropped, a `.meta` per frame.**

## The camera and facings

EA's HD ground vehicles are drawn from about **32° above the horizon**, orthographic. A render at a steeper angle
(54°, say) reads as top-down beside them. Render **32 facings, counter-clockwise, frame 0 facing north**, which is
the order Red Alert's HD vehicle frames use (frame 0 north, frame 8 west). Render at two or three times the final
size, then scale down with a good filter.

**Ships are different.** Red Alert picks a ship's body from **16 facings** (`VesselClass::Shape_Number`,
`VESSEL.CPP`), and EA's HD ship tilesets match: `DD`, `CA`, `PT`, `SS` and `MSUB` each have shapes 0 to 15, and each
shape is a loop of 8 frames played at 5 frames a second, 128 frames in all. **Unproven:** the camera angle EA's ships
are drawn at. One working mod renders its ships at 54°, matched to the destroyer's proportions (bow-on, its drawn
extent is about 0.81 of its side-on length), but a hull's height inflates that ratio, so it doesn't fix the angle.

## Tiberian Sun

- **The archives.** Tiberian Sun's files are in MIX archives encrypted like Red Alert's (`TIBSUN.MIX` reads
  `0, 0x3`: encrypted, with a checksum), but its filename hash is a padded CRC-32, not Red Alert's. See
  [MEG and MIX archives](../formats/meg-and-mix-archives.md). Voxel models and the rules INIs are in `LOCAL.MIX`,
  unit SHPs and most cameos in `CONQUER.MIX` (the rest in the per-side sidebar archives, `SIDEC01.MIX` for GDI and
  `SIDEC02.MIX` for Nod), building SHPs in the theatre MIXes, palettes in `CACHE.MIX`. The Firestorm expansion's
  own files are in `expand01.mix`: its voxels and build-up SHPs at the top level, its other SHPs in the inner
  `ECACHE01.MIX`, its cameos in `E01SC01.MIX`, and its rules in `FIRESTRM.INI`.
- **One-theatre buildings.** Some building art exists in one theatre only: the E.M. Pulse Cannon (`NAPULS.SHP`,
  with `NAPULSMK.SHP`) is only in the snow archives, `SNOW.MIX` and `ISOSNOW.MIX`. Decode such art with that
  theatre's unit palette (`UNITSNO.PAL` for snow, `UNITTEM.PAL` for temperate; both in `CACHE.MIX`).
- **Voxels (vehicles).** A VXL is a voxel model, so render it from Remastered's camera. TS lights voxels with one
  fixed light and a table of 32 brightness steps, indexed by each voxel's own normal, which the VXL stores. Use
  those normals rather than ones worked out from the shape: on flat decks, worked-out normals come out blotchy.
  The full lighting model, measured from TS's own tables, is in Tiberian Factions'
  [render contracts](https://github.com/gibbo101/cnc-ra-tiberian-factions/blob/main/docs/launcher-render-contracts.md).
- **SHPs (infantry, buildings).** Decode with the right palette: `UNITTEM.PAL` for units and buildings,
  `CAMEO.PAL` for cameos. The terrain palettes give noise. Remap indices 16 to 31 are the team colour; paint them
  green. Upscale with a pixel-art scaler (hq4x) before any smooth resize.
- **The second half of an SHP is shadows.** An SHP that TS draws with a shadow (infantry, buildings, build-ups)
  holds its image frames first, then a shadow for each: frame n's shadow is frame n + count/2, which TS draws darkened under it. Decoded as art, those
  frames come out as flat purple silhouettes. Drop them, since a Remastered frame bakes its own shadow.
- **Frame 1 is the damaged look.** A building below the yellow health threshold draws its next frame, so an idle
  building's base SHP has its healthy art at frame 0 and its damaged art at frame 1.
- **Animation speed:** an anim's `Rate=` in TS's `ART.INI` is frames per minute (the delay is ticks per minute ÷
  `Rate`), so a higher `Rate` is faster.
- **Buildings are isometric.** TS's building sprites are drawn for TS's isometric camera, and no re-render can
  change that, so they look tilted beside Red Alert's near-top-down buildings. Rebuilding them from 3D models in
  Remastered's camera fixes it.

## Command & Conquer 3

C&C3 has no loose model files: everything is compiled into asset streams inside `.big` archives. The route:

1. **Read the BIGs.** Magic `BIGF` or `BIG4`, then a little-endian total size and big-endian entry fields. Payloads
   are RefPack-compressed.
2. **Parse the streams.** Each stream is a manifest plus instance data, with patches layered as a chain. Read every
   patch in order, or you get stale meshes and stats.
3. **Find the unit's parts:** its skeleton, its container (which mesh hangs off which bone), its meshes (hull,
   turret, barrel, treads) and their textures, including the house-colour mask and normal maps.
4. **Render** each part with your own rasteriser at the camera above, applying the normal maps. Render hull frames
   around the hull's own centre, and turret frames around the turret's pivot.
5. **Paint house colour** from C&C3's mask: pure green that follows each texel's brightness, normalised per model,
   leaving near-white markings white.

The step-by-step recipe, written for an AI coding assistant to follow, is Tiberian Factions'
[C&C3 to Remastered sprites](https://github.com/gibbo101/cnc-ra-tiberian-factions/blob/main/docs/cnc3-to-remastered-sprites.md).

## How it was verified

- **The target:** EA's own HD Medium Tank frame, read for this page (canvas, crop, pure-green team colour, black
  shadow at alpha 191), and the classic-to-HD sizes on [HD tilesets and ZIPs](hd-tilesets-and-zips.md).
- **The camera and facings:** compared with Red Alert's HD vehicle frames (frame 0 north, 8 west), and checked by
  eye beside them in a working mod at 32° and 54°.
- **Ships' facings:** EA's `DD.ZIP`, `CA.ZIP`, `PT.ZIP` and `SS.ZIP` (128 frames each, named shape then frame) and
  their entries in `RA_UNITS.XML` from `CONFIG.MEG` (16 shapes for each of these and `MSUB`, `FPS` 5), read for this
  page, against `Dir_To_16` in EA's `VesselClass::Shape_Number`. The destroyer's 0.81 is its frame-0 crop height
  over its west-facing crop width.
- **Tiberian Sun:** `TIBSUN.MIX`'s header read for this page, and a working mod's extractor and renderer, which ship
  Tiberian Sun units built this way. The lighting tables come from TS's own `VOXELS.VPL`, cross-checked with
  OpenTS's source.
- **Where TS keeps it:** `expand01.mix` and `TIBSUN.MIX` probed for this page with a working mod's extractor
  (`M_EMP.VXL`, `MWARMK.SHP` at the top of `expand01.mix`, `MWAR.SHP` and `MEMPFX.SHP` in `ECACHE01.MIX`,
  `MWARICON.SHP` in `E01SC01.MIX`; `NAPULS.SHP` in `SNOW.MIX` and not `TEMPERAT.MIX`, `NAPULSMK.SHP` in `ISOSNOW.MIX`
  and not `ISOTEMP.MIX`; both palettes in `CACHE.MIX`), OpenTS's theatre table (`_theater.cpp`: snow's archives and
  its `SNO` suffix), and the working mod's extraction script and EMP Cannon port.
- **SHP layout and timing:** OpenTS's `techno.cpp`, `building.cpp` and `anim.cpp` (shadows drawn at
  `shapenum + Get_Count() / 2` with `SHAPE_DARKEN`), `building.cpp` `Shape_Number` (one frame on below
  `ConditionYellow`), and `animtype.cpp` (`Delay = TICKS_PER_MINUTE / Rate`); TS's `ART.INI` (`[GAFIRE_B]`
  `Rate=500` against `[GAFIRE_C]` `Rate=220`); and a working mod, whose extracted build-ups showed the purple second
  half (frames 20 to 39 of `GTPOWRMK.SHP`'s 40), whose buildings use frame 1 when damaged, and whose Firestorm
  Generator plays `GAFIRE_B` about twice as fast as `GAFIRE_C`.
- **Command & Conquer 3:** `StaticStream.big`'s header read for this page (`BIG4`), and a working mod that ships over
  fifteen C&C3 units built this way.

> [!TIP]
> **In Tiberian Factions**
>
> TF's Tiberian Sun GDI and Nod, its Red Alert 2 tanks and its C&C3 units all came through these pipelines. Its
> Tiberian Sun units and its Red Alert 2 tanks are now HD rebuilds from 3D models, drawn in Remastered's camera.
> Every port is packed at 8 canvas pixels per classic pixel, centred, and given a baked shadow fitted to EA's
> Mammoth tanks.
>
> <!-- screenshot: a TS Titan, a C&C3 Predator and an EA Medium Tank side by side -->
