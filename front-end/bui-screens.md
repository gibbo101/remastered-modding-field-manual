---
title: BUI screens
description: The launcher's screens, menus and in-match HUD, are .BUI files, a zlib-compressed ChunkFile scene graph. A mod reshapes, hides, retints and retextures existing widgets, clones widgets, and swaps whole screens through FACTIONS.XML; the format and its fixed header bytes, the tags, how names are stored, the stock effects in GUIEFFECTS.CFX, the loading spinner's sheet, and the size rule inside a CONFIG.MEG.
tags: [front-end, ui, bui, screens, config-meg, launcher]
holds_for: Steam build 21590013
status: verified
unproven: [the full per-widget property grammar (only rects, tints, strings, texture sets and cloned subtrees are mapped), whether menu images draw without mipmaps (banding observed on the Steam Deck), the loading spinner's frame rate (about 24 a second, observed)]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# BUI screens

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When your mod changes how a launcher screen is laid out: moving, resizing, hiding or recolouring buttons and
panels on the main menu, lobbies, dialogs, loading screen or in-match HUD, or swapping a screen for TD's. Changing
only the *pictures* on a screen is [the UI atlas](the-ui-atlas.md) or a loose texture. Adding a screen or a button
that does something new also needs [a launcher patch](new-screens-and-buttons.md).

## Where screens live, and which one opens

Every screen is a `.BUI` file under `DATA\ART\GUI\` in `CONFIG.MEG` (207 of them): `RA_MAIN_MENU.BUI`,
`RA_TACTICAL_UI.BUI` for Red Alert's in-match HUD, `TACTICAL_UI.BUI` for TD's, and so on.

**Which screen opens is data.** Each faction in `FACTIONS.XML` lists screens by key in `GUIFileNames`, as
`RA/<name>` (for example `DialogBox` → `RA/RA_DialogBox_Allied`), and names its HUD scenes. Pointing a key at
TD's screen name swaps in TD's whole screen. For the HUD, see [Adding a faction](../engine/adding-a-faction.md).
Red Alert's front-end screens (the lobbies, the multiplayer and quick-match screens and the rest) are listed only in
`Faction5`'s entry, the USSR's. The other Red Alert countries list just their dialog boxes, so `Faction5` is the
entry to edit for the front end.

**Ship a `.BUI` loose**, at its path under your mod's `Data/` (`Data/ART/GUI/RA_MAIN_MENU.BUI`). A loose screen may
be any size. Inside a replacement `CONFIG.MEG` it must keep the stock file's exact size: see
[Overriding the launcher's data](../launcher-data/overriding-launcher-data.md).

## The format

```
offset  size  field
0x00    2     magic 'CH' (ChunkFile)                       keep
0x02    2     version 02 01 (2.1)                          keep
0x04    1     flags: low nibble 1 = zlib                   keep
0x05    3     ff ff ff                                     keep
0x08    4     a hash                                       not checked: leave it as it was
0x0C    4     the dword 8                                  keep
0x10    4     compressed length = file length - 0x24       set it after an edit
0x14    16    zero                                         keep
0x24    ...   the zlib stream: the scene graph
```

The hash at `0x08` is never checked. A shipped, edited main menu keeps the stock file's hash over a different
payload, and loads. The uncompressed size is stored nowhere.

**The scene graph is a tree of nodes:** `[u32 id][u32 spec]`. If `spec`'s top bit is set, the node is a container,
and the low 31 bits are its number of **child nodes** (a count, not a byte size). Otherwise it's a leaf of `spec`
bytes. Every stock screen parses this way exactly, end to end. Red Alert's HUD is 6,497 nodes.

**Widgets** carry ASCII names (`Button_Exit`, `Side_Bar_Group`), texture references and text keys. The tags mapped
so far:

- `02 10`: the widget's rect, four floats `x, y, w, h` as fractions of the screen (0 to 1). Changing it moves or
  resizes the whole widget, label included.
- `03 10`: its tint, four floats RGBA. Alpha 0 hides it.
- **A widget's rect and tint come before its name**, not after. The tags following a name belong to the *next*
  widget. Editing the tint after a name changes the wrong widget.
- Texture-set names are strings inside a widget's header leaf, and can be swapped for any set the launcher knows.

**Names are length-prefixed ASCII**, with no terminator, stored three ways (integers little-endian):

- **A name leaf:** `[u32 id][u32 len+2][u16 len][name]`. The id depends on the field: the stock main menu's
  textures (`ui_ra_mainlogo`) sit under id 2, its buttons' text style (`24 Point Regular Outline Red`) under id 3,
  and some other text styles under id 2. Keep the id you find beside the stock name.
- **An effect:** `[u32 0x16][u32 len+4]`, then a `0x17` micro-chunk, `[0x17][len+2][u16 len][name]`.
- **A texture set:** the micro-chunk `[0x0f][len+2][u16 len][name]` inside the widget's header leaf.

A longer or shorter name changes its leaf's size, and the header leaf's for a texture set, so fix the sizes when a
name's length changes.

Text styles live in `FONTLIBRARY.BFD`, a flat list of named styles, and new ones can be appended. A style's colour
is its `0b 10` tag, four floats RGBA. Some text widgets
are recoloured by the launcher itself, so for those a tint won't stick: use a coloured style instead.

## What you can do

- **Reshape existing widgets:** move, resize, hide, retint, retexture, restyle text. This works on every screen,
  in the menus and in the match HUD.
- **Reorder or remove buttons** by moving and hiding them.
- **Clone a widget.** Copy a complete widget subtree, give it new names, a fresh unique ID (each widget's first
  micro-chunk, `01 04 <u32>`, is a per-instance ID) and a new rect, insert it as a sibling, and add one to its
  parent's child count. The screen then draws it. Drawn is not the same as working: the launcher binds behaviour to
  widgets it looks up by name in its own code, so a clone of a button draws but does nothing until a patch binds
  it. See [New screens and buttons](new-screens-and-buttons.md).
- **Add text styles** in `FONTLIBRARY.BFD`, and attach effects (sheens, glows) by name. The stock effects are
  defined in `DATA\ART\GUI\GUIEFFECTS.CFX`, itself a `CH` 2.1 zlib ChunkFile with the same header: `Sheen`,
  `Logo_Sheen`, `Logo_Glow`, `Power_Sheen`, `Button_Sheen`, `MouseOver`, `Scanline_Sheen`, `Scanline_Sheen_Red`
  and `Scanline_Sheen_Blue`.

What a `.BUI` can't do alone is make the launcher *use* a widget it has no code for. In Red Alert's HUD scene, for
example, every Allied country's crest is the `_Allies` widget, and an added `_GDI` widget is never asked for. That's
why per-faction crests come from [re-pointing records in memory](../clientg-ram/repointing-atlas-regions.md).

## Editing safely

1. Start from the **stock** file, extracted from `CONFIG.MEG`, every time. Check the values you expect before you
   change them.
2. Decompress from `0x24`, edit the tree, and recompress.
3. **Loose:** write the header with the new compressed length, and you're done.
4. **Inside a replacement `CONFIG.MEG`:** recompress at zlib level 9 (the stock files compress at about level 6,
   so re-saving at 6 tends to *grow* them), check the stream still fits in the stock file's size, then pad with
   zero bytes back to the exact stock size.
5. Keep the tree balanced. A broken child count or a too-deep tree makes the launcher refuse the file as corrupt.

## Traps

- **A combo box's list only takes clicks inside the group that holds the combo.** Stretch a drop-down list past
  its group and its lower rows draw, but close the list when clicked. Grow the group too, and scale its other
  widgets so nothing moves on screen (observed). The list's row height is the micro-chunk `05 04 <float>` in the
  list's property leaf (leaf id 4), a fraction of the combo's height: 0.0975 in Red Alert's faction combo, 0.1711 in TD's.
- **A cloned group keeps its source group's tint**, and places its children differently from the original
  (observed). To add a group of widgets, insert them straight into the screen's top group instead.
- **A widget moved off screen widens the screen's fit**, stretching the whole menu, and its clicks, on ultrawide
  displays. Shrink a widget you want gone, in place, instead (observed).
- **Shared sets and styles restyle more than one screen.** The stock main menu's buttons use the texture set
  `TacticalSidebarSellRepairButton`, which repainting showed is also the in-match sidebar's (observed). The text
  style `24 Point Regular Outline Red` appears in 19 stock Red Alert screens. Give your screen its own sets and
  styles rather than repainting shared ones.
- **Paint menu art at the size it's drawn.** The stock main menu background, `RA_MAINMENUBG_02.DDS`, is a 2878 ×
  1200 uncompressed 32-bit DDS with no mipmaps. Tiberian Factions' menu frame painted larger than its widget banded
  when scaled down on the Steam Deck's screen. That the launcher draws menu images without mipmaps is unproven:
  it was observed, not traced.
- **Animations only play when the launcher starts them by name.** A keyframe animation you add won't run. Effects
  such as sheens loop by themselves. The loading screen's spinner is one the launcher runs: it plays
  `ANIM_LOADTWIDDLE_RA.DDS` (TD's is `ANIM_LOADTWIDDLE.DDS`), a 1360 × 1360 uncompressed sheet holding a 4 × 4 grid
  of 340-pixel frames. Repaint the frames in place, in the same grid; its speed, about 24 frames a second, is
  observed, not traced.

## How it was verified

- **The format:** every one of the 207 stock `.BUI` files in `CONFIG.MEG` has the `CH`, 2.1, zlib header, and
  parses exactly with the node grammar above (measured). Tiberian Factions' loose main menu keeps the stock hash over an
  edited, larger payload and loads. The header and loader checks were also read from `ClientG.exe`'s ChunkFile
  reader. The fixed bytes (`ff ff ff` at `0x05`, 8 at `0x0C`, zeros from `0x14`) were measured in all 207 files
  for this page, and in `GUIEFFECTS.CFX`; TF's BUI writer keeps them.
- **Names and effects:** the stock main menu decompressed for this page (`Scanline_Sheen_Red` stored as
  `16000000 16000000 17 14 1200`, `24 Point Regular Outline Red` as `03000000 1e000000 1c00`, `ui_ra_mainlogo` under
  id 2, `TacticalSidebarSellRepairButton` as `0f 21 1f00`), and `GUIEFFECTS.CFX` decompressed (its nine effect
  names); TF's BUI tools read and rewrite names in these forms, and its menus load.
- **The spinner:** `ANIM_LOADTWIDDLE_RA.DDS` read from `TEXTURES_SRGB.MEG` and decoded for this page (no mips,
  1360 × 1360 × 4 bytes, sixteen frames of a turning Soviet crest), the stock `RA_UI_LOADINGSCREEN.BUI` naming it,
  and TF, which repaints it in the same grid; the frame rate is TF's observation.
- **The tags:** read in the stock main menu (`Button_Exit`'s rect `02 10` sits before its name, with values in 0 to
  1), and used by TF's menu, lobby, dialog, loading-screen and HUD edits.
- **Screens by `FACTIONS.XML`:** the stock file's `GUIFileNames` entries, and TF, which swaps its lobbies,
  LAN screens and HUD to TD's.
- **Cloned widgets:** TF's main menu carries cloned buttons, and a HUD test with inserted widgets drew
  normally.
- **Menu art:** the stock `RA_MAINMENUBG_02.DDS` read from `TEXTURES_SRGB.MEG` for this page (no mip count, its
  size exactly 2878 × 1200 × 4 bytes plus the header). The banding is TF's observation.
- **`Faction5`, the colour tag and the row height:** the stock `FACTIONS.XML` (only `Faction5`'s `GUIFileNames`
  holds the lobbies), the stock `FONTLIBRARY.BFD` (`0b 10` and four floats in each style), and the stock combo-box
  screens (`05 04` and 0.0975 or 0.1711), all read for this page; TF edits all three and they hold in
  game. The cloned-group tint is TF's record only.

> [!TIP]
> **In Tiberian Factions**
>
> TF restyles Red Alert's main menu in steel and green, reorders its buttons, and clones Exit Game's button three
> times for its own menu entries. Its lobbies, dialogs and loading screen are restyled the same way, and GDI, Nod
> and Tiberian Sun's GDI get TD's whole HUD scene through `FACTIONS.XML`. TF's repository also has a step-by-step
> [main-menu restyle guide](https://github.com/gibbo101/cnc-ra-tiberian-factions/blob/main/docs/main-menu-restyle-guide.md)
> with its scripts.
>
> ![TF's restyled main menu](img/main-menu.jpg)
>
> TF's restyled main menu: the stock menu box, reskinned, with the mod's own buttons added.
