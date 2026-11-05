---
title: How the launcher draws sprites
description: The rules the HD renderer applies to unit, building, effect and beam art (canvas-centre anchoring, the 128-shape limit on second draws, no rotation, an alpha cutoff near half, baked shadows, beam frames 0 to 4), each one learned from a build that drew wrong.
tags: [art, sprites, hd, tilesets, launcher]
holds_for: Steam build 21590013
status: verified
unproven: [the exact alpha cutoff (observed near 128), why second draws drop shapes from 128 up]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# How the launcher draws sprites

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

Before you ship any new HD art for a unit, building, effect or beam. Each rule here cost at least one build that
drew wrong, and most of them fail silently. Art copied straight from EA's own ZIPs already follows them.

## The frame and its `.meta`

An HD frame is a TGA in a ZIP, with a `.meta` beside it. EA's Medium Tank, frame 0:

```json
{"size":[192,192],"crop":[59,57,134,152]}
```

`size` is a virtual canvas. `crop` is the box on that canvas, left, top, right and bottom, where the TGA sits, so
the TGA is exactly 75 × 95 pixels. The launcher places the **centre of the canvas** at the object's draw position.
The crop only says where on the canvas the pixels go.

**So compose every frame with its visual centre at the canvas centre.** Art placed low on the canvas draws low on
the map. Shots then hit the real, undrawn spot, and the selection box floats above the art. Fix it by placing the
art, not by changing the crop. EA's own HD vehicles centre their hulls on the canvas to within about 1.5 classic
pixels, with turrets and barrels sticking up past the centre.

Selection boxes follow the same logic: the launcher centres a unit's box on the unit and a building's on its plot,
and takes only the size from the DLL. See [Building selection boxes](building-selection-boxes.md).

## Rules

| Rule | What goes wrong otherwise |
|---|---|
| **Second draws use shape numbers 0 to 127 only.** A turret, radar dish or overlay is a second draw on the same object, and shapes from 128 up draw nothing. | The turret silently vanishes. A body drawn in the first draw can use shapes up to 255. |
| **Sprites are never rotated.** `CNCObjectStruct::Rotation` is ignored for every export. | Anything that must follow an angle draws flat. Build it from round pieces laid along the line, or use the beam line below. |
| **Pixels below about half alpha are discarded.** | A soft, low-alpha shadow or glow draws as nothing. |
| **Every animation stage needs a tile.** Declare as many tiles as the animation has stages. | A stage with no tile draws as a white box. |
| **An effect with HD art only still needs `ImageData`.** An animation with no classic image gets a null `ImageData`. | It draws as a green placeholder. Give it another animation's `ImageData` (a donor), and its HD tile is then found by name. |
| **Write straight (unpremultiplied) alpha.** | Colour pasted through a mask onto a transparent canvas comes out darkened, and the launcher draws it darkened. |

## Shadows are baked in

The game draws a shadow only for things in the air: a bullet with `Height > 0` whose type has `Shadow` set
(`BULLET.CPP`), and aircraft in flight (`AIRCRAFT.CPP`). No ground unit, infantry or building gets one. Every ground shadow is part of the
sprite, EA's included. EA's Medium Tank frame above carries its shadow as pure black at alpha 191.

So bake the shadow into each frame as an offset copy of the object's silhouette, pure black at around alpha 191,
under the sprite. Keep it above the alpha cutoff after any resize. A shadow anchored to the bottom of a diagonal
hull's bounding box collapses into a detached blob at the diagonal facings. An offset of the whole silhouette hugs
the hull at every facing.

## Beams

A beam weapon such as the Obelisk's is drawn by the launcher as lines, not as a sprite. Each object exports at most
3 lines (`MAX_OBJECT_LINES` in `DLLInterface.h`), and each line has an animation `Frame`.

**Use frames 0 to 4 only.** From frame 5 up, the launcher draws a giant square at each end of the line, in the
line's colour. TD's Obelisk never hits this: its `LineMaxFrames` is 5. Lines can go at any angle, unlike sprites.

## How it was verified

- **The `.meta` format and the baked shadow:** read from the base game's own `MTNK.ZIP`.
- **Shadows only in the air, and three lines per object:** EA's released source. The Obelisk's 5 line frames are
  in EA's TD source.
- **Each rule:** found in a shipped mod's art, where a build drew wrong and the fix was confirmed in game. The
  canvas-centre anchor was also tested against the competing idea that the crop's centre is the anchor. A tall
  sprite placed by its content centre sank into its own platform, and placing it by the canvas centre fixed it.
- **Observed only, not read from code:** the 128-shape limit on second draws, the ignored rotation, the alpha
  cutoff, the white box, the green placeholder and the squares at frame 5. Each was seen in play and worked around.
  The cause behind each one is inside the launcher.

> [!TIP]
> **In Tiberian Factions**
>
> TF's Tiberian Sun walkers taught most of these rules. The Titan ships exactly 128 shapes: 8 facings × 12 walk
> frames, plus 32 turret frames. The railgun's beam drew giant white squares until its frame count dropped to 5.
> Every TF vehicle is centred on its canvas after packing, and given a baked shadow fitted to EA's Mammoth tanks.
>
> <!-- screenshot: a TS walker with its turret, beside an EA vehicle, both selected, showing matching boxes -->
