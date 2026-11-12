---
title: "Rebuilding art as 3D models"
description: "Rebuilding Tiberian Sun's buildings and units as 3D models fitted to TS's own sprites and voxels, then rendering them in Remastered's camera: why a re-render of TS's sprites can't fix their isometric tilt; TS's camera as maths (the 48 x 24 diamond, 0.2297 px per unit of height, the view-ray slide, the foundation's north corner at the frame's centre); reading a building's shape from its pixels and its build-up SHP; a heightfield plus slabs as the model; a shape check at about 0.9 silhouette overlap before any materials; one light for every object, and the normal-detail cap that keeps panels from going black; voxel units built straight from the VXL; overlays cut against the frame they sit on; glTF export by marching cubes with a house-colour vertex mask; and the modelling traps already hit."
tags: [art, pipelines, tiberian-sun, voxels, hd, 3d]
holds_for: Steam build 21590013
status: verified
unproven: [Red Alert 2's buildings and infantry rebuilt this way (its voxel tanks are proven), Command & Conquer 3's buildings]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Rebuilding art as 3D models

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When your mod brings Tiberian Sun's buildings into Red Alert and they must sit beside EA's HD art, or when TS's
voxel vehicles rendered straight from the VXL look too blocky. TS draws its buildings for its isometric camera, so
an upscaled TS building always looks tilted beside Red Alert's near-top-down ones, and no re-render of a sprite
can change its camera. A 3D model fitted to TS's own art can be drawn from any camera, at any size.

You can skip it for voxel vehicles if a straight voxel render is good enough for you: see
[Porting art from other C&C games](porting-art-from-other-games.md), which also sets the target every port must hit
(canvas, centring, team-colour green, baked shadow) and the 32° camera. This page assumes that one.

The rule that makes it work: **match TS frame by frame.** Every detail TS shows is expected, and nothing TS
doesn't have. Read shapes from TS's pixels, voxels or a Westwood render; never invent a detail or its place.

## Tiberian Sun's camera, as maths

To fit a model to TS's sprites, render it in TS's own camera and compare. Work in units of 128 to a cell, every
way. TS's camera is orthographic, 30° above the ground, looking north-west, at 0.265 px per unit. A cell is a
48 × 24 px diamond, and a point (X east, Y south, Z up, in units) lands at:

```
x = gx + 24 (X - Y) / 128
y = gy + 12 (X + Y) / 128 - 0.2297 Z
```

- **Depth is invisible.** Sliding a point along TS's view ray (X + 1.225t, Y + 1.225t, Z + t) keeps its pixel, so
  a single sprite can't tell height from depth. Fix depth from what touches the ground (feet, base edges at Z = 0)
  and work up from there.
- **Where the building sits in its frame.** TS puts the foundation's north corner at the frame's centre: a 2×2 in a
  96 × 96 frame has its ground centre at (48, 72), a 3×3 in 144 × 144 at (72, 108), a 3×2 in 192 × 120 at
  (108, 90), a 4×3 in 192 × 168 at (108, 126).
- **Remastered's camera** (for the output) is orthographic at 32° above the ground, looking north, at 128 px a
  cell: ground depth reaches the screen times sin 32° (0.530), heights times cos 32° (0.848).

## Reading a building's shape

1. **Inventory every frame first**, at 6 to 10 times size with a pixel grid: the building, its damaged frame, the
   build-up and every overlay. Count real frames by the non-empty ones: overlay SHPs carry an empty shadow half,
   and many have a healthy then a damaged half (`GTSILO_A` is 4 + 4, `GTTECH_A` 8 + 8). Diff each overlay frame
   against the base, and print the pixel values of small parts (fins, claws, lamps) to read their real shape and
   shading. A smaller anim SHP is drawn centred on the building's frame.
2. **The build-up shows the plan.** The first frames of a building's `..MK` SHP often draw its foundation outline
   (the Tech Center's is a triangle, not the rectangle its finished sprite suggests), and the build-up shows how
   parts attach (fins raised from lying flat are slabs facing the camera).
3. **Heights from ground contacts and lamps.** A circle fitted to a ring of lamps gives its radius at any height,
   so the centre's offset sets the height.
4. **Colour classes to plan view.** Unproject TS's colour classes (roof tan, house green, red) to the ground,
   then render the model in TS's camera and look up TS's class per pixel to place hatches and panels.
5. **Prefer square readings.** TS's camera can't tell a skewed part from a square one: a line TS draws straight
   up can run diagonally in 3D (the Upgrade Center's east end is a hip skewed out to the deck's corner, its pipes
   lying on it). Build parts square and grid-aligned, keep TS's silhouette with pieces Remastered's camera can't
   see, and check every fitted part from Remastered's camera too.

## The model

- **A heightfield plus slabs.** Most of a building is a heightfield; overhangs, masts, fins and flags are slab
  pieces on it. Give each part a component id, so materials, damage and the house-colour mask can find it.
- **Keep TS's size and footprint.** Where TS's foundation is bigger than your plot, use TS's on Red Alert's
  square grid and change the rules' foundation. A building may turn to suit the grid (a long, thin building on a
  2×3), with the entrance or production side toward the camera; keep the orientation a switch, since the bib may
  force it back.
- **Two states.** Red Alert buildings draw healthy and damaged only. Build TS's damage into the shape first (holes,
  snapped parts, and only the parts TS breaks), then texture it in greys and browns, as heavy as TS's.
- **Open pipes** (chimneys, stacks): TS draws a black hole in a light rim, not a closed cap. Paint the hole on the
  flat top; a recess cut into a heightfield renders as a jagged crown.

## The shape check, before any materials

Render the model in flat colours in TS's camera over TS's sprite. Aim for a silhouette overlap of about 0.88 to
0.9, with every landmark (fins, claws, lamps, entrances, stairs) where TS has it. Then render it shaded beside
TS at 2×, in TS's camera and on Red Alert's grid. Only then add materials. A building fitted by proportions
instead of by reading TS's actual shapes comes out visibly weaker beside one that was read.

## The look

Every object must share one camera, one light and one house green, or they won't sit together.

- **Canvas:** whole cells at 128 px each, the canvas being the building's box. The game anchors the canvas centre
  on the box's centre (see [How the launcher draws sprites](how-the-launcher-draws-sprites.md)), so art drawn on
  its box needs no offsets. The foundation's south edge sits on the box's south edge. Art that rises above the
  building goes on extra rows behind the footprint.
- **One light**, from the north-west and above, camera-relative. Tiberian Factions uses L = (-0.451, -0.551,
  0.702) (x east, y south, z up) with shade = 0.20 + 0.26 (0.5 + 0.5 n_z) + 0.62 max(0, n·L) (1 - 0.8 in shadow),
  which sits well beside EA's art. Units add a soft fill from the camera: EA's HD units are front-lit, and the key
  light alone leaves a unit's near side dark.
- **Low ambient is a trap.** With this little ambient, any surface whose normal turns away from the light goes
  nearly black. A thin plate facing away renders dark where TS's is bright: give it sloping sides.
- **House colour:** one albedo, exactly (0, 214, 0), on every house part of every object, with no grime, dust or
  soot tint on it (detail only as thin seams). The light shades it. TS's remap greens are the house areas; natural
  Tiberium green and lit green lamps are not.
- **Shadow and outline:** the shadow baked in at about 75% black, blurred about 1.5 px, plus a soft contact shadow
  within 5 to 7 px; a 0.9 px dark ring round every silhouette; supersample 4×. Aircraft carry no shadow: the game
  draws theirs from the frame.
- **Flags** fly east, face-on to the camera, as on EA's barracks. A flag flown north-east looks tilted and squashed.

## Voxel units

Build voxel vehicles straight from the VXL rather than modelling them by hand: a hand model fitted by silhouette
alone came out squat and plain next to the voxel render.

- **Read the VXL voxel by voxel.** Merge each section's voxels into boxes, bevel only the convex exposed edges, and
  sample TS's colours across each face from the palette (the remap range is house colour). Voxel index i spans i
  to i + 1, so a top voxel at z 16 is a surface at 17.
- **TS's normals as detail, capped.** Blend TS's stored normals in as a detail layer, and cap how far they may tilt
  the shading normal at about 25°. Uncapped, voxels whose TS normal points far from their face (the bottom rows of
  side skirts, seams) render black in this light where TS shows them mid-tone. Red Alert 2's voxels use normal
  mode 4, a 244-normal table.
- **Turrets and racks** are separate frame sets drawn at the hull's canvas centre.
- **Sprite-only units** (walkers, infantry): build convex parts fitted to TS's frames in TS's camera by silhouette
  and colour classes, pose by pose. A Westwood render, where one exists, beats a 95 px sprite for detail.

## Frames, build-ups and overlays

- **Build-up** in TS's own order (its `..MK` SHP) at no fewer than TS's real frame count, 24 being a good default.
  Its last frame is exactly the healthy frame, or the healthy frame plus any overlay TS bakes into its build-up,
  so nothing pops. A bib is its own layer under the building.
- **Read an overlay numerically before animating it.** Per-frame mean and spread of the changed pixels, and their
  correlation with x and y, tell a uniform pulse from a sweep. Never invent a motion TS doesn't have.
- **Cut overlays against the frame they're drawn over.** Render the full frame with the effect on, copy its solid
  pixels, and solve its see-through ones (outline, shadow) so base + overlay = frame. Leave unchanged see-through
  pixels out: copying them doubles the shadow.
- **Add-ons that fill in a fixed order** (power pods) are cut in that order, each against the frame with the ones
  before it.
- **Fire TS draws in its fire palette** reads dark and blobby when upscaled. Build it procedurally at TS's size and
  timing, frame by frame.

## Exporting the model

The model is worth shipping on its own: anyone can render new angles from it, or use it in another engine.

- **Buildings:** sample the scene on a grid (1.5 to 2 units, finer where thin masts would vanish), turn it into a
  truncated distance field, mesh it by marching cubes, and colour every vertex with the building's own materials.
- **Voxel units:** export the exact boxes, subdivided with shared vertices so the vertex colours carry TS's colours,
  one node per section. Keep sections in the unit's frame: improper matrices flip a walker's legs.
- **In the file:** glTF 2.0 binary, x east, y up, z south, 1.0 a cell, origin at the foundation's centre on the
  ground (a unit's position for a unit). COLOR_0 is the albedo with no light baked in, COLOR_1 a house-colour mask.
  Healthy and damaged nodes, marker nodes (a dock, a flame's mouth, lamps) and orthographic camera nodes that
  frame the delivered canvas exactly. Check that camera by rendering the mesh through it over a delivered frame,
  and run the file through Khronos's glTF validator.

## Traps already hit

- **A heightfield can't undercut.** A dome more than a hemisphere grows a vertical drum below its equator: keep the
  sphere's centre close above its base ring.
- **Smoothing a heightfield spreads faces about 1 px** past their footprint. Give skirt cells the taller
  neighbour's component. A part meeting a slab leaves a crease: run it to the ground as one slab.
- **Noise projected from the ground stretches** on vertical faces. Use fields in world space.
- **Shadows past the canvas edge:** fade them over the last 14 px or so, and keep parts inside the canvas.
- **Build-up parts must not float**, unless TS's do; remove whole parts with everything attached.
- **Icosahedron faces built from vertex triples have mixed winding.** Orient each face's normal outward.
- **Geometry passes are the cost.** A frame that changes only materials can reuse one geometry pass; a waving flag
  or a rising pod needs its own. At 4× on two cores, a 256 × 256 pass took 30 to 40 s and a whole building's
  package 30 to 50 minutes, so run renders in a resumable queue that skips frames already on disk.

## How it was verified

- **TS's camera:** the formulas are one orthographic projection: 0.265 × cos 30° = 0.2297 px per unit of height,
  and the view-ray slide leaves x unchanged and y too (12 × 2.45 / 128 = 0.2297). Tiberian Factions fitted
  every rebuilt TS building to TS's own frames in this camera, at the overlaps above, and the foundation corners
  were read off those frames.
- **The look:** Tiberian Factions' TS GDI buildings, units, infantry, walls and gates, its TS Nod units and its
  Red Alert 2 tanks are all rebuilt this way, packed as HD ZIPs and played in game beside EA's units and
  buildings, with the published TS-HD-Assets add-on carrying them.
- **The normal cap:** found on TS's Mammoth Mk. I, whose side skirts rendered with wiggly black lines uncapped, and
  a dark band over its tracks, where TS's own voxel render shows them mid-tone.
- **Voxel units by VXL against by hand:** both built for TS's MCV and compared.
- **The models:** Tiberian Factions'
  [TS-HD models](https://github.com/gibbo101/cnc-ra-tiberian-factions/tree/main/asset-packs/TS-HD-Graphics-Pack/3d)
  (50 glTF files, with a README of their conventions) and
  [RA2 models](https://github.com/gibbo101/cnc-ra-tiberian-factions/tree/main/asset-packs/RA2-Graphics-Pack/3d).

The full working method, written for an AI coding assistant to follow, is Tiberian Factions'
[ts-to-ra-hd-art skill](https://github.com/gibbo101/cnc-ra-tiberian-factions/blob/main/.claude/skills/ts-to-ra-hd-art/SKILL.md).

> [!TIP]
> **In Tiberian Factions**
>
> TF's Tiberian Sun GDI buildings and its TS units are HD rebuilds from 3D models fitted to TS's own art, drawn in
> Remastered's 32° camera at 128 px a cell. The models ship in the TS-HD pack's `3d/` folder, and TF's
> `glb_to_stl.py` turns them into print-ready STL files.
