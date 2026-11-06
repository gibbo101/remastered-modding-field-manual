---
title: Save files (.sav)
description: A Remastered save game is one of the launcher's ChunkFiles, a zlib stream of metadata and screenshot, a small zlib chunk index, then an instance chunk whose raw deflate stream holds the DLL's own save data. How to reach the DLL's data without the launcher, for a save check of your own.
tags: [formats, saves, chunkfile, zlib]
holds_for: Steam build 21590013
status: verified
unproven: [what the chunk index's entries and the trailing chunk after the instance data mean, the first stream's full layout]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Save files (.sav)

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When something outside the game has to read a save: a front-end patch that greys out Load for a save your build
can't load, or a tool that checks which version of your mod wrote it. The DLL itself never needs this: it gets its
own data back through EA's save interface. How to mark that data with your mod's own version is on
[Save versions](../engine/save-versions.md).

## Where saves live

Saves are in Steam Cloud storage, in `userdata/<account>/1213210/remote/save_game/`, named after the map and the
time (`MOBIUS_ALLIED_CAMPAIGN_1_MAP_<date>-<time>.sav`). From inside the launcher, read them through Steam's remote
storage rather than by path.

## The layout

```
offset  size  field
0x00    2     'CH' (the launcher's ChunkFile magic, as in .BUI files)
0x02    2     version 02 01
0x10    4     the first stream's compressed size
0x24    ...   stream 1: zlib (78 9C ...), ending in a sync flush 00 00 FF FF
              the save's metadata and its screenshot
then    ...   stream 2: zlib, a chunk index of about 70 bytes, also ending in 00 00 FF FF
then    20    the instance chunk's header: its compressed size at +8
then    ...   raw deflate (no zlib header): the DLL's save data
then    ...   a short trailing chunk (about 1 KB)
```

To reach the DLL's data:

1. Skip `0x24` plus the size at `0x10`.
2. Search the next few KB for the sync flush `00 00 FF FF`. The 20-byte header starts just after it.
3. Read the compressed size at `+8` of that header, and inflate that many bytes after the header as **raw**
   deflate (window bits -15 in zlib, or zlib's reference inflater `puff.c`).

The DLL's data starts the inflated stream, so a check needs only its first few KB. A mod that writes a marker and
version first in its save data can find them there.

## Traps

- **Raw deflate, not zlib.** The instance data has no zlib header. A zlib reader fails on it with "invalid stored
  block lengths".
- **Don't inflate stream 1 to the end of the file.** It ends in a sync flush, not an end-of-stream block. Inflate
  only the size at `0x10`.

## How it was verified

- **The layout:** four saves read for this page (two skirmishes, a custom map and an Allied mission), each parsed
  exactly as above: stream 1 inflated from its stored size, the index inflated (68 to 75 bytes, to 120 or 136), and
  the instance chunk inflated as raw deflate to 270 to 400 KB, with about 1.2 KB after it.
- **The header:** the same `CH` and 2.1 version as the launcher's `.BUI` screens (see [BUI screens](../front-end/bui-screens.md)).
- **In play:** a released mod's launcher patch reads saves this way, finds its marker and version in the DLL's data,
  and greys Load for saves it can't load.

> [!TIP]
> **In Tiberian Factions**
>
> TF writes a marker, its save version and a flag for its Tiberian Sun asset pack first in its save data. Its Load
> Game screen greys **Load**, with the reason, for a save from another version of the mod or one that needs a pack
> that isn't loaded.
