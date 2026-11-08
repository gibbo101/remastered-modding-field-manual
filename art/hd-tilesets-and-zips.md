---
title: HD tilesets and ZIPs
description: "Ship HD art for a new unit, building or effect: a ZIP of frames with .meta files, one tile per shape in a patched copy of a listed tileset XML, a buildables entry named RA_ plus the type's INI name, an on-screen size set by the classic shape drawn (HD canvas = classic frame x 5.33 in EA's art; build-ups by BuildupData, overlays by their own shape), theatre art in the RA_TERRAIN tilesets, and names that can't clash with stock tiles."
tags: [art, tilesets, zip, buildables, hd]
holds_for: Steam build 21590013
status: verified
unproven: [why a tile named like a stock tile resolves to the stock one (observed, not traced), why the launcher skips house colour on smudges (observed, not traced)]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# HD tilesets and ZIPs

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When your mod adds a unit, building, projectile or effect with HD art of its own. The art has to be in a ZIP, named
in a tileset, sized by a classic shape, and tied to the type through a buildables entry. A mod that only changes
stats, or reuses stock art under stock names, doesn't need this page. How each frame is drawn (the canvas, the
crop, alpha, shadows) is on [How the launcher draws sprites](how-the-launcher-draws-sprites.md).

## The pieces, by example

EA's own Medium Tank, `2TNK`, as the base game ships it:

| Piece | Where | What it holds |
|---|---|---|
| ZIP | `Data/ART/TEXTURES/SRGB/RED_ALERT/UNITS/2TNK.ZIP` (in `TEXTURES_RA_SRGB.MEG`) | `2tnk-0000.tga` … plus a `.meta` per frame |
| Tileset | `DATA\XML\TILESETS\RA_UNITS.XML` (`CONFIG.MEG`), root `Red_Alert\Units` | 64 tiles, `2TNK` shapes 0 to 63, each naming one frame |
| Buildable | `DATA\XML\OBJECTS\UNITS\RABUILDABLES.XML` | `<ObjectTypeClass Name="RA_2TNK">`, its name and description text IDs, and its `<BuildIcon>` |

One tile, from the stock tileset:

```xml
<Tile>
  <Key><Name>2TNK</Name><Shape>0</Shape></Key>
  <Value><Frames><Frame>2tnk\2tnk-0000.tga</Frame></Frames></Value>
</Tile>
```

The frame path is relative to the tileset's root, and its first folder is the ZIP: `2tnk\` opens `2TNK.ZIP`.

## Two names, two lookups

The DLL sends each object to the launcher with two names (`CNCObjectStruct`, filled in EA's `DLLInterface.cpp`):

- **`TypeName`**, the type's INI name (`IniName`). The launcher finds the type's buildables entry as `RA_` plus
  this name: `2TNK` is `RA_2TNK`. A type with no entry shows as `<Missing> RA_<name>` on hover.
- **`AssetName`**, the type's graphic name (`Graphic_Name()`). This is the tile name the art is drawn from. It
  defaults to the INI name, and the rules key `Image=` changes it.

So two types can share one set of art: give the second `Image=` naming the first. Red Alert reads `Image=` for
units, buildings and projectiles, and shared art costs its video memory once.

## Registering new art

1. **Patch a copy of a listed tileset.** Take `RA_UNITS.XML`, `RA_STRUCTURES.XML` or `RA_VFX.XML` out of
   `CONFIG.MEG`, add your tiles, and ship the whole file in your mod's `Data/XML/TILESETS/`. Infantry go in
   `RA_UNITS.XML` too: there is no infantry tileset (the Rifle Infantry, `E1`, has 532 tiles there).
   A file with only your tiles, or one under a new name, isn't loaded. See
   [Overriding the launcher's data](../launcher-data/overriding-launcher-data.md).
2. **One tile per shape the code draws.** Count the shape numbers your type uses: body facings, turret frames,
   damage states, building animation stages. A shape with no tile draws as a white box. EA's Medium Tank uses 64.
   How a turreted unit lays its shapes out is on [Turrets](../units/turrets.md).
3. **Add a buildables entry** named `RA_` plus the INI name, in a patched copy of `RABUILDABLES.XML` (in
   `Data/XML/OBJECTS/UNITS/`). It carries the type's name and description text IDs (see
   [New text strings](../launcher-data/new-text-strings.md)) and its cameo (see
   [Sidebar cameos](sidebar-cameos.md)).

## Size comes from the classic shape

The launcher fits HD art to the box of the type's **classic** shape, the `ImageData` the DLL loads, so the classic
shape decides how big the art is on screen. EA's HD canvases are the classic frame size × 5.33 (128 HD pixels per
cell against classic's 24):

| Stock type | Classic frame | HD canvas (`.meta` `size`) |
|---|---|---|
| Medium Tank `2TNK` | 36 × 36 | 192 × 192 |
| Power Plant `POWR` | 48 × 48 | 256 × 256 |
| War Factory `WEAP` | 72 × 48 | 384 × 256 |

A canvas with a different shape from its classic frame is squashed to fit: a square canvas on a 72 × 48 building
draws flattened. A finer canvas (×8, say) draws at the same size with more detail.

**Every draw sends the size of the shape it draws.** EA's `CC_Draw_Shape` exports the width and height of the
classic frame it was handed (`Get_Build_Frame_Width` and `Get_Build_Frame_Height`, `CONQUER.CPP`), and the map
export does the same for each overlay and smudge from its own `ImageData` (`DLLInterface.cpp`). So:

- **A building's build-up is sized by `BuildupData`.** While it's under construction, `BuildingClass::Get_Image_Data`
  returns the build-up shape, so the build-up's classic frame must match the footprint too, or the build-up draws
  squashed while the finished building looks right.
- **A new overlay needs a classic shape of its own**, sized for its art.
- **A donor sets the size as well.** An HD-only type drawn with another type's shape draws at that shape's size,
  whatever its own canvas.

A draw scale passed to `Techno_Draw_Object` also resizes a unit, but it shears the turret and leaves the selection
box alone: see [How the launcher draws sprites](how-the-launcher-draws-sprites.md#rules).

**Converting canvas pixels to leptons.** A cell is 256 leptons and 24 classic pixels (`ICON_LEPTON_W` and
`ICON_PIXEL_W` in EA's `DISPLAY.H`), so one canvas pixel is 256 / (24 × the canvas's scale) leptons: 2 on EA's ×5.33
canvases, 4/3 on a ×8 one. Convert fire points and muzzle offsets measured off the art at that rate, for the
scale that art was packed at.

**An HD-only object still needs a classic shape.** With no classic image, a projectile isn't drawn at all (EA's
`BulletClass::Draw_It` returns early: "If there is no shape loaded for this object, then it obviously can't be
rendered") and an animation draws a green placeholder. A transparent classic shape of the size you want, or another
type's `ImageData` as a donor, fixes it. The DLL side is on [Adding a unit](../units/adding-a-unit.md).

## Traps

- **Don't reuse a stock tile name.** The launcher finds a tile by name across every world tileset, and a name the
  base game already has (the flame tiles `FLAME-N` to `FLAME-NW`, say) draws the base game's art, not yours.
  Prefix your names. The `TD` prefix for Tiberian Dawn art in Red Alert comes from DontCryJustDie's TD-Assets.
  (Observed; the lookup order isn't traced.)
- **Theatre art lives in the terrain tilesets.** Theatre-specific art (every smudge, bibs included, and overlays
  with `IsTheater` set, such as ore) is exported with `IsTheaterShape` set, and its tiles are looked up in
  `RA_TERRAIN_<THEATRE>.XML`, not in the object tilesets. The stock files agree: `GOLD01` and `BIB1` are only in
  the terrain tilesets, the sandbag wall `SBAG` (not theatre-specific) only in `RA_STRUCTURES.XML`. Register such
  art in a patched copy of each theatre's terrain tileset (how the launcher picks one is on
  [TD theatres in Red Alert](../using-what-the-player-owns/td-theatres-in-red-alert.md#how-the-launcher-picks-a-terrain-tileset)).
- **Ground art gets no house colour.** The launcher recolours team green on a unit's or building's sprite, but not
  on a smudge such as a bib or apron, although EA's export sends each smudge with its cell's owner
  (`smudge_entry.Owner` in `DLLInterface.cpp`). Paint ground art in its final colours. (Observed; the launcher's
  side isn't traced.)
- **Crop the frames, and describe them in `.meta`.** A frame's TGA is cropped to its visible pixels, and its
  `.meta` gives the canvas `size` and the `crop` box. A full-canvas TGA with a smaller `crop` is squeezed into
  the crop box.
- **Match the frame count to the shape count.** A building's construction animation draws as many stages as the
  code asks for. Resample a source animation to that count, or add tiles for every stage.

## How it was verified

- **Infantry in the units tileset:** the 19 files in `CONFIG.MEG`'s `DATA\XML\TILESETS\` (none for infantry), the
  532 `E1` tiles counted in `RA_UNITS.XML`, and a working mod's infantry ports, registered there by its build tool.
- **The pieces and the names:** the base game's `2TNK.ZIP`, `POWR.ZIP` and `WEAP.ZIP` (`TEXTURES_RA_SRGB.MEG`),
  `RA_UNITS.XML` and `RABUILDABLES.XML` (`CONFIG.MEG`), all read for this page. `TypeName` from `IniName` and
  `AssetName` from `Graphic_Name()` in EA's `DLLInterface.cpp`, and `Image=` read in EA's `TECHNO.CPP`
  (`TechnoTypeClass::Read_INI`) and `BBDATA.CPP`.
- **The × 5.33 sizes:** the classic `2TNK.SHP`, `POWR.SHP` and `WEAP.SHP` from Red Alert's MIXes, against the HD
  `.meta` files, all read for this page. A working mod's squashed buildings, fixed by matching the canvas to the
  classic frame, showed the same rule.
- **Leptons per canvas pixel:** the constants in EA's `DISPLAY.H` (`PIXEL_LEPTON_W` is their ratio). A working
  mod packs its units at ×8 and derives its muzzle tables at 4/3 leptons a pixel; an earlier fire point built on
  a quarter of the real rate fired shells from near the hull's centre, a cell and a half out at long range.
- **Sizes sent per draw:** EA's `CC_Draw_Shape` (`CONQUER.CPP`), the overlay and smudge entries in
  `DLLInterface.cpp`, and `BuildingClass::Get_Image_Data` (`BUILDING.CPP`). A working mod's building whose
  build-up donor didn't match its footprint drew a squashed build-up, fixed by a donor of the right size; its
  Disc Thrower's disc, on another bullet's shape, flew at that bullet's size until it got a classic shape of its
  own; and its build gives every new overlay its own classic shape.
- **No house colour on ground art:** EA's `DLLInterface.cpp` (the smudge entry's `Owner` set from the cell), and a
  working mod's building aprons, whose hazard stripes it bakes in gold because the launcher never remapped them.
- **Theatre art:** `IsTheaterShape` set from the type's `IsTheater` in EA's `CELL.CPP`, `BUILDING.CPP` and the
  overlay export, and always for smudges (`SDATA.CPP`, and the smudge export: "Smudges are always
  theater-specific"); `GOLD01` (theatre art) and `SBAG` (not) in `ODATA.CPP`; `GOLD01`, `BIB1` and `SBAG` counted in
  the stock tilesets for this page. A working mod's building aprons, theatre-specific smudges, draw only from
  the copies of their tiles in each theatre's terrain tileset.
- **Registration and the white boxes:** a working mod's tileset and buildables files (970 `RA_` entries), its
  port notes, and the base game's tileset index.
- **Observed only:** the `<Missing>` hover text and the stock-name clash, both from a working mod's early ports.

**Credit:** DontCryJustDie suggested sharing art with `Image=`, and his TD-Assets set the `TD` naming.

> [!TIP]
> **In Tiberian Factions**
>
> TF's TD, Tiberian Sun, Red Alert 2 and C&C3 types ship as `TD`, `TS`, `R2` and `C3`-prefixed tiles in patched copies of Red
> Alert's three object tilesets. Its build merges every unit's tiles and buildables entries into those files, and
> packs its art at 8 canvas pixels per classic pixel for the zoomed-in view. Its HD-only types are sized by a
> transparent classic shape of the right size, or by a stock type's shape as a donor. A Tiberian Sun power plant's
> 20 build-up frames were resampled to the 13 stages Red Alert's power plant uses.
