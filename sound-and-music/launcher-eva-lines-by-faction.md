---
title: EVA voice lines the launcher plays
description: Nine EVA voice lines (mission won and lost, battle control terminated, cannot deploy, low power and others) are played by the launcher itself, never by the DLL. Give each faction its own voice by writing its recording over the launcher's sample names at match start, and over ClientG's cached copy for a switch within one session.
tags: [audio, eva, clientg, ram-patch, factions, advanced]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
clientg_sha256: d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897
status: verified
unproven: [whether languages other than English need their own payloads (only the EN-US samples were tested), why speech the DLL sends after game over is dropped]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# EVA voice lines the launcher plays, by faction

## When you need this

When a faction needs its own EVA voice, and some of its lines never pass through your DLL. Most EVA lines are sent
by the DLL, and routing those by faction is data plus a name in the DLL (see
[TD sounds from the base game](../using-what-the-player-owns/td-sounds-from-the-base-game.md)). Nine EVA voice lines are
played by the launcher itself, in its own voice, whoever the player is. A mod with only Allies and Soviets, or one
happy for every faction to share Red Alert's EVA on those nine voice lines, doesn't need this page.

> [!WARNING]
> **Fragile: part two of this writes into the running launcher's memory.**
>
> - **Verified against:** `ClientG.exe` version 1.153 (745903), 34,797,928 bytes, SHA-256
>   `d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897` (Steam build 21590013).
> - **What it depends on:** the launcher caching each sample as the whole WAV file's bytes, in private read-write
>   heap. No addresses are hardcoded: the patch finds each copy by its content.
> - **How it fails if the client changes:** if the cache format changes, no copy matches, nothing is written, and
>   only the in-session switch is lost (part one still works). A write is only safe on a whole, exact match. A
>   partial match is how this patch once crashed the launcher (see Traps).
> - **Rules:** never write on a partial match, and keep scans few. This one runs once per match, while the match
>   loads. The fuller scanning rules are on
>   [Re-pointing launcher UI art in memory](../clientg-ram/repointing-atlas-regions.md).

**Holds for:** the client in the box above. EA has stopped patching the game and archived the source in January
2025, so the build should stay put.

## The nine EVA voice lines

| Line | Launcher sample (classic `RAC_`, remastered `RAR_`) |
|---|---|
| Cannot deploy here | `RA?_SFX_EVA_NODEPLY1_EN-US.WAV` |
| Battle control terminated | `RA?_SFX_EVA_BCT1_EN-US.WAV` |
| Mission accomplished | `RA?_SFX_EVA_MISNWON1_EN-US.WAV` |
| Mission failed | `RA?_SFX_EVA_MISNLST1_EN-US.WAV` |
| Select target | `RA?_SFX_EVA_SLCTTGT1_EN-US.WAV` |
| Insufficient power | `RA?_SFX_EVA_NOPOWR1_EN-US.WAV` |
| Repairing | `RA?_SFX_EVA_REPAIR1_EN-US.WAV` |
| Mission saved | `RA?_SFX_EVA_SAVE1_EN-US.WAV` |
| Unable to comply, building in progress | `RA?_SFX_EVA_PROGRES1_EN-US.WAV` |

The launcher has its own events for these: `ClientG.exe` names `Faction_Event_GUI_SFX_Mission_Complete`,
`_Mission_Failed`, `_NoPower` and `_Repairing` among them. They never reach the DLL's speech
callback, so the DLL can't choose their voice.

**Speech the DLL sends at the end of a match is dropped as well.** Lines the DLL sends during or after
`On_Multiplayer_Game_Over` stay silent, even through a valid route. So a faction's end-of-game EVA lines have to use
the same route as the nine. (Observed. The cause is inside the launcher.)

## Part one: write the faction's recording at match start

A loose file named after a base sample replaces that sample everywhere it plays (see the TD sounds page). So:

1. **Ship a seed file under each launcher sample name**, in your mod's `Data/AUDIO/EN-US/`. It must exist when the
   game starts. The launcher decides once, at launch, whether to read a sample from your loose file or from the
   base game's MEG. If the file isn't there at launch, it reads the base game's, all session long.
2. **At match start, copy the player's faction's recording over each seed.** The launcher reads a sample's bytes
   the first time the line plays, and caches them. So the first time each line plays in a session, it's in the
   right voice.

That alone is enough if players never change faction without restarting the game. After a line has played once,
the launcher keeps its cached copy and never rereads the file.

## Part two: overwrite the cached copy

For a faction switch within one session, overwrite the launcher's cached copy too. The cache holds the **whole WAV
file**, header included, as raw MS-ADPCM bytes in read-write memory. So:

1. **Make every faction's recording of a line the same length in bytes.** The overwrite has to fit the cached copy
   exactly. Pad the shorter files: trailing zero bytes after the `data` chunk don't play, because the chunk's size
   still bounds playback.
2. **Pick a needle for each recording:** a distinctive 20-byte slice of its audio (never the leading silence), and
   its offset in the file.
3. **Once, at match start**, scan the launcher's committed read-write memory for the needle of every *other*
   faction's recording. With several factions, group the needles by their first byte, so
   one pass over memory checks them all. A hit, minus the needle's offset, is where a cached
   copy might start.
4. **Compare the whole recording in place.** Write the wanted faction's recording over it only if every byte there
   is the other faction's recording. This compare is what keeps the write safe, since the needle alone also
   matches stale buffers (see Traps).

## Traps

- **Never write on a needle match alone.** The needle also turns up in freed and partly reused heap buffers that
  once held the file. Part one's copy leaves some when it runs inside the launcher (which loads your DLL too; see
  [Patching the launcher's code](../clientg-ram/patching-the-launchers-code.md)): under Proton, Wine's `CopyFile`
  copies through a 64 KiB buffer from the process heap and frees it without clearing it, so each copy leaves up to
  64 KiB of the recording behind. One whole-file write into such a buffer overran a live heap block header, and the launcher
  crashed on the next skirmish load. This is the crash Tiberian Factions 5.0.0 hit. Comparing the whole recording
  before writing fixed it: a typical match start skips three or four partial copies and replaces one or two whole
  ones.
- **Zero your own buffers.** The DLL also runs inside the launcher, so the files it reads to compare sit in the
  heap it scans. Zero them before freeing, or the next scan finds them as one more copy.
- **Same length or crash.** A longer recording written over a shorter cached copy overran it and crashed the
  launcher.
- **Battle control terminated needs `block_align` 70.** It plays at teardown, and the teardown loader silently
  rejects a file with a different alignment. Every base EVA sample uses 70, the classic Westwood block. `ffmpeg`'s
  MS-ADPCM encoder only writes powers of two (1024 by default), which the mid-match loader accepts but teardown
  doesn't. Keep the base file padded, or use an encoder that can write 70.
- **A line is cached only after it has played.** Battle control terminated first plays at teardown, so it isn't in
  the cache during its first match. The next match start then finds and fixes it.
- **Don't delete the seeds when you deploy.** A sync that removes the loose sample files, even briefly, leaves the
  launcher reading the base game's bytes at its next start. Your needles then match nothing.

## How it was verified

- **The nine lines:** their names in a working mod's generated table, the same lines in EA's `Speech[]` table
  (`MISNWON1`, `NODEPLY1`, `BCT1` and the rest, in `AUDIO.CPP`), and the launcher's own announcement events in
  `ClientG.exe`.
- **The sample format:** base `RA?_SFX_EVA_*` samples read from the base game's `SFX2D_EN-US.MEG`: MS-ADPCM (format
  tag 2), mono, `block_align` 70.
- **The cache and the overwrite:** a probe found each cached sample as raw file bytes in read-write memory. The
  shipped patch switched all the lines tested, in both directions within one session, with no crash. Tested under
  Proton on Linux and on the Steam Deck.
- **Where the stale copies come from:** Wine's `copy_file` (`dlls/kernelbase/file.c`, behind `CopyFileW`,
  `CopyFileExW` and `CopyFile2`) takes its 65,536-byte buffer with `HeapAlloc(GetProcessHeap(), 0, …)` and returns
  it with `HeapFree` uncleared; the working mod copies each recording with `CopyFileA` at match start from a thread inside the launcher, and
  its scans found partial copies in freed blocks.
- **The crash and its fix:** traced to a whole-file write into a freed buffer. Fixed by the whole-recording compare,
  and not seen since.
- Observed only: the dropped end-of-game speech, and the teardown loader rejecting `block_align` 1024.

> [!TIP]
> **In Tiberian Factions**
>
> TF's GDI and Nod hear TD's EVA on all nine voice lines, TS GDI hears Tiberian Sun's, and Allies and Soviets keep Red
> Alert's. Each line's three recordings are generated at the same byte length, with their needles, so adding
> another faction's voice is one more column in a build script. TF's end-of-game EVA lines ride the same route.
