---
title: Building selection boxes
description: The launcher centres a building's selection box on its plot and takes only the size from the DLL, so a misplaced box means the art is seated off the plot's centre.
tags: [art, buildings, launcher, dll]
holds_for: Steam build 21590013
status: verified
unproven: [whether the classic shape's stub and canvas geometry affect where the art sits relative to the box]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Building selection boxes: the launcher owns the position

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod adds a building with new art, or re-seats an existing building's art, and its selection box sits too
high or too low. Buildings drawn from EA's own art, seated as EA seated it, never show the problem.

## The rule

When you select a building, the launcher draws its selection box centred on the building's footprint (its plot). It
works out that centre itself. The only thing your DLL controls is the box's **size**. No field in the object export
moves the box.

So if a building's box looks too high or too low, the box isn't wrong. **The art is seated off the plot's centre.**
Fix the art.

## What the DLL exports

Every frame, the DLL fills one `CNCObjectStruct` per object (`DLLInterface.h`). For a building, the launcher takes
from it:

| Field | Used for the selection box? |
|---|---|
| `DimensionX`, `DimensionY` | **Yes: the box's width and height**, in classic pixels. The DLL fills them from the type's `Dimensions()`. |
| `CenterCoordX/Y` | No. |
| `CellX/Y` | No. |
| `OccupyList` | No. |
| `PositionX/Y` | No. These move the **sprite**, not the box. |

Changing the height grows the box evenly about the plot's centre. No edge stays put.

## Consequences

- **Art and box can't be separated.** `PositionY` is the art's anchor. Biasing it to slide the box only slides the
  building away from its own box, footprint and apron.
- **Seat the art on the plot centre.** The launcher anchors a sprite by the centre of its canvas (the `size` in the
  frame's `.meta`), not by the crop. Compose each building frame so that the plot's centre falls at the canvas
  centre, and the box will bracket it.
- **Size the box from the art.** Take `DimensionX/Y` from the art's visible extent around the plot centre. A box
  can't be taller on one side than the other, so a building whose art reaches much further up than down gets a box
  with empty space below.

## How it was verified

One field per build, each read off the box in game:

- a bias on `CenterCoordY` alone, tried twice: the box moved zero pixels;
- changing `DimensionY`: the box grew evenly in both directions;
- a bias on `CellY`: ignored;
- an `OccupyList` rewritten for the render export only (to test whether the box centres on the occupied cells'
  bounds): ignored;
- a bias on `PositionY`: the sprite moved and the box stayed. The building visibly came away from its own apron.

DontCryJustDie found the same independently with a unit. A runtime draw offset centred a tank's art, but left its
selection box off-centre. With the pixels moved in the image instead and the offset removed, the art and the box both looked right.

**Unproven:** whether the classic shape's stub and canvas geometry affect where the art sits relative to the box.
Two buildings built by the same pipeline on the same 3x3 plot, one boxed correctly and one a tile out, still differ
there. Comparing those two buildings is how to settle it.

> [!TIP]
> **In Tiberian Factions**
>
> TF ports Tiberian Sun's buildings to Red Alert's square grid. A TS building whose art was reseated came out with
> its box a tile high, and the box hadn't moved: the art had. TD's construction yard, on the same plot and from the
> same pipeline, boxes correctly, and TF uses the pair as its control when lining up new buildings.
>
> <!-- screenshot: the TD and TS construction yards side by side, both selected -->
