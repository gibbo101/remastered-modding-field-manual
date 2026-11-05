---
title: Content built from the player's own games
description: EA's guidelines bar music files from any C&C game in a mod, so a mod that wants Tiberian Sun's soundtrack converts it on the player's machine from their own copy instead of shipping it.
tags: [audio, music, guidelines, tiberian-sun]
holds_for: Steam build 21590013
status: design
unproven: [an in-game importer that converts on the player's machine (not built), whether EA's guidelines accept a mod that builds C&C music on the player's machine, where each store installs Tiberian Sun]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Content built from the player's own games

**Holds for:** C&C Remastered Collection, Steam build 21590013, and EA's Franchise Modding Guidelines, revision 2.
Reread EA's page before relying on this: EA can change the guidelines at any time.

## When you need this

When your mod wants content it isn't allowed to ship, and the player can own it anyway. The clearest case is
music. EA's [Franchise Modding Guidelines](https://www.ea.com/games/command-and-conquer/news/modding-faq) say a
mod "must not include any music files from any C&C games". That rules out shipping Tiberian Sun's soundtrack, even
though Tiberian Sun has been freeware since 2010: freeware lets anyone download the game, not redistribute its
files. If your mod uses only the Remastered Collection's own tracks, or no music at all, you don't need this page.

**Status:** the conversion below is proven, and its output has played in game. The step that would make it a
feature, converting on the player's machine from inside the mod, is a **design** and hasn't been built.

## The idea

Don't put the files in the mod. Find the player's own install of the other game, convert what you need on their
machine, and write the result into a local mod folder the launcher already knows how to load. The mod download
then holds no C&C music, only the means to build it from a copy the player already has.

## Where Tiberian Sun keeps its music

Measured on an installed Tiberian Sun with Firestorm:

| What | Where |
|---|---|
| Theme list, titles and sides | `THEME.INI`, inside `LOCAL.MIX`, inside `TIBSUN.MIX` |
| Tiberian Sun's scores | `<section>.AUD` in `SCORES.MIX` |
| Firestorm's theme list | `THEME01.INI` in `expand01.mix` |
| Firestorm's scores | `SCORES01.MIX` |

All four archives sit in the game's own folder. Each `THEME.INI` section names a score, its `Name` (the title) and
its `Side`. A section with `Normal=no` isn't played during a match: the intro, menu, map and score themes, and Ion
Storm. Leaving those out gives **26 in-game themes, 18 from Tiberian Sun and 8 from Firestorm.**

MIX members are found by a name hash: the CRC-32 of the upper-cased name, padded to a multiple of four bytes.
`TIBSUN.MIX` is encrypted, so a reader needs the Westwood MIX key handling as well.

## The conversion

| | Source | Target |
|---|---|---|
| Container | Westwood `.AUD` | `.WAV` |
| Codec | compression 99, `SCOMP_SOS` (Westwood's IMA ADPCM) | MS-ADPCM (WAV format tag 2) |
| Sample rate, channels | 22,050 Hz mono | 44,100 Hz stereo |

The target is what the Remastered Collection's own remastered tracks use: every remastered track in `MUSIC.MEG` is
MS-ADPCM at 44.1 kHz stereo, and the classic tracks are MS-ADPCM at 22,050 Hz mono. `ffmpeg` decodes Westwood
AUD (as `adpcm_ima_ws`) and writes MS-ADPCM (`-c:a adpcm_ms -ar 44100 -ac 2`).

## Getting the tracks played

A converted WAV plays only when a music event names it. The launcher's events are lists of file names
(`<Entry> RAR_MUS_Reload_Fire.WAV </Entry>`) in `DATA\XML\AUDIO\MUSICEVENTS.XML`, inside `CONFIG.MEG`, so the mod
must ship an edited copy naming the new files. Put the WAVs in a mod folder of their own, under
`Data/AUDIO/MUSIC/`, beside a `ccmod.json`. The launcher lists any folder like that under the player's
`Documents/CnCRemastered/Mods/Red_Alert/` as a local mod, and loads it once the player enables it. The mod can tell
whether the tracks are there by checking for one of the files.

## Traps

- **Stay reproducible.** Convert with fixed settings and keep a checksum of every output file. Then any converter,
  whether a script on your own machine or code in the mod, can be tested against the same list.
- **Optional, not required.** The tracks exist only on machines where the player has built them, so every choice
  that plays them needs a fallback for when they're missing.
- **Ask EA, not this page.** Converting on the player's machine is a reading of the guidelines, not a ruling. The
  guidelines bar a mod from *including* C&C music. Whether they also cover a mod that builds C&C music on the
  player's machine hasn't been put to EA, so that question is **Unproven**.

## How it was verified

- The theme list, the 26-track count and each score's format were read from an installed Tiberian Sun with
  Firestorm.
- Every music file in the Remastered Collection's `MUSIC.MEG` was read for its WAV format.
- The converted tracks played in game as a mod folder, in skirmish rotations and the jukebox, on the Steam build
  above.
- The guidelines' wording was read from EA's published page (revision 2).

**Unproven:**
- the in-game importer, which isn't built;
- EA's view of building music on the player's machine;
- where each store and the 2010 freeware release put Tiberian Sun, which a finder would need.

> [!TIP]
> **In Tiberian Factions**
>
> TF first shipped Tiberian Sun's music as a separate Workshop pack. It withdrew the pack once it was clear the
> guidelines bar C&C music files, and TF's own upload check now refuses any music file in a pack. The tracks are to
> come back as an add-on the player builds: the add-ons screen finds the player's Tiberian Sun, converts its 26
> themes into a local mod folder laid out as the old pack was, and switches it on. Until then, each faction's
> TIBERIAN SUN music choice reads "Not installed", and the faction plays the mixed rotation instead.
