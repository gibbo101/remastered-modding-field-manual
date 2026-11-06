---
title: Sprite memory and DDS
description: "The launcher keeps every texture of every enabled mod in video memory from start-up, uncompressed for ZIP frames; DDS cuts that by about three quarters but has rules (loose files only, whole canvas, no crop) and DXT rounds greys toward green, so ship terrain, the UI atlas and cameos as DDS and sprites as ZIPs."
tags: [art, video-memory, dds, zip, performance, hd]
holds_for: Steam build 21590013
status: verified
unproven: [whether a terrain tileset costs memory whole or per tile drawn, the numbers on cards other than the one measured]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Sprite memory and DDS

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When your mod carries a lot of art: many new units and buildings, asset packs, or HD art at a finer canvas than
EA's. The launcher keeps everything it might draw in video memory, so a big mod can outgrow a 4 GB card, and the
Steam Deck shares its memory with the system. A mod with a handful of new types doesn't need this page.

## Everything loads at start-up

At start-up the launcher uploads every texture of every enabled mod (the "splash preload"), whatever a match will
use. It never unloads unit, building or effect art within a session. Measured on one desktop with a large mod and
one of its asset packs:

| Build | Main menu | In play |
|---|---|---|
| Base game, no mods | | 2,258 MB |
| The mod, frames in ZIPs | 4,758 MB | 4,796 MB |
| The same art, whole-canvas DDS frames | 4,246 MB | 4,284 MB |
| DDS frames, preload off | 534 MB | 700 MB |

The launch option `NOSPLASHPRELOAD` turns the preload off, and each tile then loads when it's first drawn. **But a
tile then opens only the ZIP that carries its own name.** A tile whose frames sit in another tile's ZIP draws as
the missing-texture frog: shared art, and the opener tiles that draw
[TD art from the base game](../using-what-the-player-owns/td-art-from-the-base-game.md). A mod that relies on
either needs the preload.

## What a ZIP frame costs

The launcher holds a ZIP's frames uncompressed: four bytes a pixel of each frame's crop. Cropping each frame to its
visible pixels (its `.meta` `crop`, see [How the launcher draws sprites](how-the-launcher-draws-sprites.md)) is the
first saving. A finer canvas costs the square: art packed at 8 canvas pixels per classic pixel holds about 2.25
times the pixels of EA's 5.33.

**Share art where you can.** Two types with `Image=` naming the same art hold it once. Identical frames in one
ZIP, or identical ZIPs, can name one copy in the tileset. See [HD tilesets and ZIPs](hd-tilesets-and-zips.md).

## DDS frames, and their rules

A sprite's frames can also ship as loose files in a folder named like its ZIP, and a `.dds` there answers to the
`.tga` name the tileset uses. DXT5 with mips costs about one byte a pixel of the canvas, roughly a quarter of an
uncompressed frame, and in that test whole-canvas DDS frames saved about 250 MB in play. The rules:

- **Loose files only.** A DDS inside a ZIP never loads: named `.dds` it draws as the missing-texture frog, named
  `.tga` nothing draws.
- **Whole canvas, no crop.** A loose frame is stretched over the object's whole draw box, and its `.meta` crop is
  ignored. Save each frame on its full canvas, margins clear. A frame cut smaller is drawn stretched.
- **DXT changes colours.** DXT keeps two colours for each 4 × 4 block, in 5:6:5 bits, so it loses fine detail and
  rounds greys toward green, and green is the team colour. In one test, a third of a construction yard's grey pixels
  leaned green once encoded (1% in its TGA), and in game they drew as team-colour speckle over its concrete.

**Where DDS works well:** terrain tiles (see
[Adding a theatre of your own](../maps-and-lobby/custom-theatres.md)), the UI atlas (see
[The UI atlas](../front-end/the-ui-atlas.md)) and sidebar cameos (see [Sidebar cameos](sidebar-cameos.md)). All
of them are big, flat or drawn small, and none carries team colour. **Unit and building sprites are better left as
ZIPs.**

## How it was verified

- **The preload:** the `NOSPLASHPRELOAD` option is in `ClientG.exe`; a working mod's art dropped to the frog
  without it, and its memory fell as in the table. The test the launcher makes before the preload was read from
  `ClientG.exe` on disk.
- **The memory figures:** measured by a working mod on one desktop (an RTX 5070) on the same map and start each
  time. They show proportions; other cards and drivers will differ.
- **The DDS rules:** a working mod's frames in each form, and its shipped loose DDS terrain frames, UI atlas and
  cameos. The green shift was measured on the encoded frames before it was seen in game.

> [!TIP]
> **In Tiberian Factions**
>
> TF keeps the preload on whatever the player's launch options say, since its shared art and base-game TD art
> depend on it: a launcher patch skips the option's test (`ClientG.exe` 1.153 (745903), `cmp byte [0x1F7F455], 0` at `0x7AE14B`,
the byte the option clears). TF ships
> its UI atlas as a 62 MB DDS instead of a 176 MB TGA, and 552 cameos as DDS (about 33 MB instead of 176 MB). Its
> unit and building sprites stay in ZIPs, after the DDS trial speckled its construction yards.
