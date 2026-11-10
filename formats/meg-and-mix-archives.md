---
title: MEG and MIX archives
description: The Remastered Collection's MEG bundles (named entries, no checksum, EA's own reader and builder in the map editor source) and the classic MIX archives inside them (entries keyed by a filename hash, Red Alert's outer MIXes encrypted), with what a modder needs to read, extract and repack each, and which archive holds Red Alert's rules.ini and expansion INIs.
tags: [formats, meg, mix, config-meg, tools]
holds_for: Steam build 21590013
status: verified
unproven: []
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# MEG and MIX archives

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

Whenever you need a file out of the game: a stock XML to patch, a tileset, a sound, an atlas, or the classic data
of the original games. The Remastered Collection's own files are in **MEG** bundles under `Data/`. The original
games' files are in **MIX** archives under `Data/CNCDATA/`. If you only ship new files and never start from a stock
one, you don't need this page.

| | MEG | Classic MIX | Red Alert's outer MIX |
|---|---|---|---|
| Holds | the Remastered files: `CONFIG.MEG`, `TEXTURES_*.MEG`, `SFX*.MEG`, `MUSIC.MEG` | Tiberian Dawn's data, and the MIXes nested inside Red Alert's | Red Alert's data (`REDALERT.MIX`, `MAIN.MIX`, `EXPAND*.MIX`) |
| Finds a file by | its full path, stored as text | a hash of its name (the name isn't stored) | a hash of its name |
| Encryption | none | none | the index, in most of them |
| Checksum | none | none | in some (a SHA-1 trailer) |

## MEG

EA's own reader and builder are in the released source, in the map editor (`CnCTDRAMapEditor/Utility/Megafile.cs`
and `MegafileBuilder.cs`). The layout, little-endian:

```
u32  0xFFFFFFFF             magic (0x8FFFFFFF is also accepted)   } optional: EA's reader skips these
f32  0.99                   version (0x3F7D70A4)                 } 8 bytes only when the magic is there
u32  header size            where the file data starts
u32  file count
u32  string count
u32  string table size
     strings                each a u16 length + characters: the files' paths, upper case
     file table             20 bytes per file, sorted by a CRC of the name:
                              u16 flags, u32 CRC, i32 index, u32 size, u32 data offset, u16 name index
     file data              at the absolute offsets in the table
```

- **Paths are full and upper case**, such as `DATA\XML\TILESETS\RA_VFX.XML`. To find a file, match the end of its
  path.
- **Nothing is checked.** There's no checksum, signature or encryption, so a faithful repack loads. EA's builder
  writes exactly this layout, and a no-change repack of `CONFIG.MEG` is byte-identical to the original.
- **Shipping a changed `CONFIG.MEG` in a mod has a hard rule:** every file inside must keep its exact size. Most
  of the time a loose file is the better route. See
  [Overriding the launcher's data](../launcher-data/overriding-launcher-data.md).
- **Don't ship a texture MEG.** A mod's own `TEXTURES_SRGB.MEG` would replace the base one whole, all of its
  thousands of textures. Ship loose texture files instead.

## Classic MIX

Tiberian Dawn's archives, and the MIXes nested inside Red Alert's. Little-endian:

```
i16  file count
i32  data size
     index                  12 bytes per file, sorted by signed CRC (the game binary-searches it):
                              i32 CRC of the name, i32 offset (from the data start), i32 size
     data
```

There's no magic number: a classic MIX's first two bytes are its (non-zero) file count.

### The filename hash

A MIX stores a hash of each file's name, not the name. Upper-case the name, pad it with zeros to a multiple of
4 bytes, then for each 4-byte little-endian word: rotate the running value left by 1 bit and add the word, keeping
32 bits.

```python
def ww_crc(name):
    data = name.upper().encode() + b"\0" * (-len(name) % 4)
    crc = 0
    for i in range(0, len(data), 4):
        crc = ((crc << 1) | (crc >> 31)) & 0xFFFFFFFF
        crc = (crc + int.from_bytes(data[i:i+4], "little")) & 0xFFFFFFFF
    return crc          # ww_crc("00-0000.aud") == 0x1D597662
```

Tiberian Dawn and Red Alert both use this hash. Tiberian Sun and Red Alert 2 use a different one. Because names
aren't stored, a listing shows only hashes until you match them against a list of known names. The community's
XCC name database is the usual source.

## Red Alert's outer MIX

Red Alert's top-level archives add a 4-byte header and encrypt their index:

1. **Flags.** Read two `i16`s. A first value of 0 marks this format (a classic MIX would start with its file
   count). The second holds the flags: `0x0001` (in the full 32-bit word, `0x00010000`) means a 20-byte SHA-1
   checksum is appended, and `0x0002` (`0x00020000`) means the index is encrypted. The Remastered Collection's Red
   Alert archives use all three combinations:

   | Flags | Archives (in `CNCDATA/RED_ALERT/`) |
   |---|---|
   | `0x2`: encrypted | `REDALERT.MIX`, `EXPAND.MIX`, `EXPAND2.MIX` in every folder, and `CD1/MAIN.MIX` |
   | `0x3`: encrypted, with checksum | `HIRES1.MIX`, `LORES1.MIX` in every folder |
   | `0x0`: neither | `AFTERMATH/MAIN.MIX`, `COUNTERSTRIKE/MAIN.MIX` |

   With the encrypted bit clear, skip steps 2 and 3: the classic index follows the flags header in plain.
2. **The key block.** The next 80 bytes are two 40-byte blocks encrypted with Westwood's public key (exponent
   65537, a 320-bit modulus, in `CONST.CPP`'s `Keys[]`). They decrypt to 39 bytes each. The first 56 of the 78
   are a Blowfish key.
3. **The index.** Blowfish-ECB decrypts the index: `u16` count, `u32` data size, then 12-byte entries as in a
   classic MIX. It spans whole 8-byte blocks, `roundup8(6 + 12 × count)` bytes, so decrypt one block first to learn
   the count. It's standard Blowfish, with each 8-byte block read as two big-endian 32-bit words, so any stock
   Blowfish library decrypts it with the key from step 2.
4. **The data** follows the encrypted index, and is not encrypted.

Archives nest. `MAIN.MIX` and `REDALERT.MIX` hold other MIXes as ordinary entries, usually classic and
unencrypted, so a search for a file has to recurse into them.

### Where Red Alert's files are

In `Data/CNCDATA/RED_ALERT/CD1/`:

| Archive | Holds |
|---|---|
| `REDALERT.MIX` | 6 nested MIXes, about 25 MB (the archive is 25,046,328 bytes). `LOCAL.MIX` among them holds `rules.ini` (59,867 bytes) and 48 `.lut` colour tables. |
| `EXPAND2.MIX` | Aftermath's new units' art (the Chrono, Tesla and MAD tanks and others), `aftrmath.ini`, `mplayer.ini`, `mission.ini` and `tutorial.ini`. 32 entries, no nested MIX. |
| `MAIN.MIX` | 12 nested MIXes, about 454 MB: `MOVIES1.MIX` (369 MB), `SCORES.MIX`, `GENERAL.MIX` (the scenarios), the theatre MIXes (`TEMPERAT`, `SNOW`, `INTERIOR`), `CONQUER.MIX`, `SOUNDS.MIX`, `ALLIES.MIX`, `RUSSIAN.MIX` and the editor's two. |

These are the files EA's code loads by name: `RULES.INI` and `AFTRMATH.INI` in `INIT.CPP`, after `EXPAND2.MIX` is
registered there.

## Traps

- **Matching a name needs the right hash.** A MIX listing that resolves almost nothing is usually being matched
  with Tiberian Sun's hash, or against names in the wrong case.
- **Handle every flag combination.** A reader written for the encrypted archives fails on Aftermath's and
  Counterstrike's `MAIN.MIX`, which have the flags header but no encryption. A classic reader fails on them too: it
  reads the zero as a file count and reports an empty archive. Neither result means the archive is broken.
  Those two archives hold the expansion campaigns' scenarios, two levels down (`MAIN.MIX` → `GENERAL.MIX` →
  `SCG43EA.INI`).
- **Skip the checksum.** On a `0x3` archive the last 20 bytes are the SHA-1, not file data.

## How it was verified

- **MEG:** EA's `Megafile.cs` and `MegafileBuilder.cs` (layout, version 0.99, upper-case paths, entries sorted by
  CRC), the first words of the base game's `CONFIG.MEG` read for this page (`0xFFFFFFFF`, `0x3F7D70A4`, then the
  header), and a byte-identical repack of `CONFIG.MEG` with Tiberian Factions' tool.
- **Classic MIX:** the base game's `CONQUER.MIX`, read for this page (266 files, index sorted by signed CRC), EA's
  `MIXFILE.H`, and Vanilla Conquer's MIX tool, whose `pack` writes the same layout.
- **The hash:** computed for this page, `ww_crc("00-0000.aud") = 0x1D597662`, matching the XCC database's Red Alert
  CRC for that name. Every entry in `CONQUER.MIX` resolves with it.
- **Red Alert's outer MIX:** the flags of every MIX in the install's `CNCDATA/RED_ALERT/` folders, read for this
  page (the table above). The key chain mirrors
  EA's `PK.CPP`, `BLOWFISH.CPP` and `MIXFILE.H`, and TF's reader extracts Red Alert's `PALETTE.CPS`
  with it. The word order is EA's `BLOWFISH.CPP` (its `Int` union puts byte 0 in the most significant place) and
  Vanilla Conquer's copy; that reader uses a stock Blowfish library, and `REDALERT.MIX`'s index decrypts with it
  (its six nested MIXes add up to 25,046,164 bytes).
- **Where Red Alert's files are:** `REDALERT.MIX`, `LOCAL.MIX`, `EXPAND2.MIX` and `MAIN.MIX` listed for this page
  with TF's reader (every name resolved), and `rules.ini` extracted and read; the same layout in TF's
  MIX notes; EA's `INIT.CPP` for the names it loads.

> [!TIP]
> **In Tiberian Factions**
>
> TF reads all three formats from Python. It extracts stock XMLs from `CONFIG.MEG` to patch, pulls TD's classic
> templates and Red Alert's palette out of MIXes, and packs its own classic data into a MIX of its own. Every
> fact-check in this manual that reads a game file used these readers.
