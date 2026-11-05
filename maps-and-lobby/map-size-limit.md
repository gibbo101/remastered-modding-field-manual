---
title: Map size limit
description: Remastered maps can't exceed 128x128 cells, because the launcher's export buffer is fixed at that size; neither a bigger constant nor a bigger map in the DLL gets round it, and CNCTDSupportMegamaps only lifts Tiberian Dawn to Red Alert's size.
tags: [maps, limits, dll, launcher]
holds_for: Steam build 21590013
status: verified
unproven: []
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Map size limit: 128×128

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When you're planning maps bigger than Red Alert's. This is a wall worth knowing before you start: no route past it
has been found.

## 128×128 is the ceiling

Red Alert's map is 128 cells wide and high (`MAP_CELL_W`), and that is as large as a Remastered map can be. The
limit isn't in the DLL. It's the size of the launcher's buffer:

- EA's interface header defines `MAX_EXPORT_CELLS` as `128 * 128`, in **both** games' `DLLInterface.h`, although
  Tiberian Dawn's normal map is 64 wide. The number is the launcher's buffer size, sized for the largest map.
- Two fixed arrays use it: `StaticCells[MAX_EXPORT_CELLS]` in `CNCMapDataStruct`, and
  `ActionWithSelected[MAX_EXPORT_CELLS]` in `CNCPlayerInfoStruct`. The launcher allocates both. The DLL only
  fills them: `CNC_Get_Game_State` receives a buffer and its size.
- **Raising the constant** makes the struct bigger than the buffer the launcher passes. EA's own guard
  (`buffer_size < sizeof(CNCMapDataStruct)`) then refuses the static map state, and no terrain draws.
- **Raising only the map size** overruns the launcher's arrays. The loop that fills `ActionWithSelected` doesn't
  check its index against `MAX_EXPORT_CELLS`.
- There's no way to negotiate a bigger buffer. The launcher's only use of the DLL itself is the `CNC_Version`
  check, and several exported cell fields are single bytes (`CellX`, `HomeCellX`), which tops out at 256 anyway.

`CNCTDSupportMegamaps` in `GameConstants.xml` looks like a way round, but it isn't. It lets *Tiberian Dawn* use
128×128 maps, the size Red Alert already has.

## How it was verified

- **Maps:** `MAX_EXPORT_CELLS`, the two arrays, the single-byte cell fields and both games' map widths in EA's
  `DLLInterface.h`; the size guard and the unchecked loop in EA's `DLLInterface.cpp`; `CNCTDSupportMegamaps` in
  the stock `GameConstants.xml`; and a working mod's investigation, which reached the same verdict.

> [!TIP]
> **In Tiberian Factions**
>
> TF looked into bigger maps and stopped at this ceiling. Its Tiberian Dawn maps, built for TD's 64-wide grid,
> sit centred inside Red Alert's 128-wide one. See
> [New maps in the skirmish Official list](new-maps-in-the-skirmish-list.md).
