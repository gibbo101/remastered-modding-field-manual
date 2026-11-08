---
title: Per-AI lobby difficulty
description: The launcher never tells the DLL each skirmish AI's difficulty, so read it from ClientG's lobby records in memory, by signature rather than fixed address; the record layout, how to tell the live array from stale copies, and the vector that points at the live one. Credit to DontCryJustDie for much of the layout.
tags: [lobby, skirmish, ai, difficulty, clientg, ram-read, advanced]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
clientg_sha256: d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897
status: verified
unproven: [the start-position field (reported, not checked here), heap behaviour on native Windows (all of TF's measurements were under Proton; the layout was replicated on Windows by DontCryJustDie), the freshness and majority tie-breaks beyond the cases recorded]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Per-AI lobby difficulty

## When you need this

When your mod's AI should play at the difficulty the player picked for each AI in the skirmish lobby. The lobby lets
the player set Easy, Medium or Hard per AI, but the launcher never passes those picks to the DLL, so every AI
plays the default. If one difficulty for all AIs is enough, you don't need this page.

A mod can set difficulty some other way, such as an INI file the player edits, and that works without touching the
launcher's memory. But reading the lobby is far friendlier for players: they pick each AI's difficulty where the game
already offers it, in the same lobby, every match, with no file to find and edit.

> [!WARNING]
> **Fragile: this reads the running launcher's memory.**
>
> - **Verified against:** `ClientG.exe` version 1.153 (745903), SHA-256
>   `d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897` (Steam build 21590013).
> - **What it depends on:** the lobby record's layout below (its 168-byte stride and field offsets), and the
>   launcher keeping the array in private read-write heap. The addresses change on every run, so nothing here uses
>   one: the scan finds the records by their content.
> - **How it fails if the client changes:** done as below, no candidate validates, the read returns nothing, and
>   the AIs fall back to your default difficulty. A changed client can make the read fail, but it can't make it
>   pick a wrong value, as long as every candidate must match facts the DLL already knows.
> - **Rules:** read only, never write. Scan a few times at match start, not every frame (see the scanning rules
>   on [Re-pointing launcher UI art in memory](../clientg-ram/repointing-atlas-regions.md)). Never take the first
>   hit. Fail closed when copies disagree.

**Holds for:** the client in the box above. EA has stopped patching the game and archived the source in January
2025, so the build should stay put, but check the hash before trusting any offset.

## Why memory is the only source

- **`CNC_Set_Difficulty`** takes one int for the whole game, and in skirmish the launcher sends the same value
  whatever the picks are: 1 in every skirmish lobby measured (mixed, all Easy, all Hard), and -1 in a LAN game. EA's
  DLL ignores it outside a campaign anyway, and gives every skirmish house the Normal handicap (see
  [The skirmish AI and its IQ levels](../ai/skirmish-ai-and-iq.md)).
- **The per-player struct** the DLL receives (`CNCPlayerInfoStruct`) carries a name, house, colour, team and an
  AI flag, but no difficulty.
- **No file holds it.** The launcher's saved settings keep the map, faction and mode, but not the AIs' difficulty,
  and after a full restart the lobby resets to one Medium AI. The settings file (its layout is on
  [Overriding launcher data](../launcher-data/overriding-launcher-data.md)) is a run of tagged records: tag, length,
  value. One record is a `CASUAL` label (tag `0x21`), but nothing in it is per AI. The record that changes at each
  launch, tag `0x31`, counts match starts (measured across launches). The Wine registry and the files the launcher writes on exit hold nothing
  about difficulty either (observed). Until the launcher restarts, the lobby comes back with the last-launched
  picks, so they live in its memory.

The picks live only in `ClientG.exe`'s memory, where they last from the lobby into the match. In a LAN game only the
host runs the simulation (see [LAN games](../engine/lan-games.md)), and the host's launcher holds the whole
lobby, so one read on the host covers every AI.

## The method

1. **Find ClientG** by its executable name, `ClientG.exe`, with `CreateToolhelp32Snapshot`, and open it with
   `PROCESS_VM_READ | PROCESS_QUERY_INFORMATION`. Nothing more, since you never write.
2. **Walk its private, committed, read-write regions** (`VirtualQueryEx`) and read them in chunks.
3. **Search for the AI names** the lobby gave you. Each AI's record starts with its slot name, `AIPLAYER1`,
   `AIPLAYER2` and so on, null-terminated, and the records are 168 (`0xA8`) bytes apart. The name numbering
   carries on across lobbies, so search for the names in this match's roster, which arrive in
   `CNC_Set_Multiplayer_Data`.
4. **Validate every candidate against what the DLL already knows.** Walk the records from the first AI and require,
   for each one: the next name in ascending order, a difficulty of 1 to 3, a team of 0 to 8, a colour equal to the
   colour the DLL was given for that AI, and a country equal to that AI's country (see the fields below). A
   candidate must cover the whole AI roster. Other `AIPLAYER` strings turn up in memory (logs, render copies, a
   message block), and validation discards them.
5. **Map each record to its AI**, by the `AIPLAYERn` name, and set that AI's difficulty: 1 Easy, 2 Medium, 3 Hard.
   Capture which house each name went to while the houses are set up: by the time `CNC_Set_Difficulty` runs, the
   name is gone from the house. EA's `GlyphX_Assign_Houses` (`DLLInterface.cpp`) copies each player's name into
   its house's `IniName`, then overwrites a computer house's with the "Computer" text, and the copy it keeps in
   `InitialName` is compiled out (`#ifdef WOLAPI_INTEGRATION`, which the build never defines). Record the slot in
   that loop, before the overwrite.

Read early in the match, and again a few times if the first read fails. The launcher rebuilds its records as a
match launches, and a scan inside that window can find nothing, or a half-written array: one read of an Easy,
Medium, Hard, Medium lobby came back Easy, Medium, Medium, Medium. Solo skirmish hits this too, from the second
match of a session. Require two reads that agree before trusting a late one.

## The record

| Offset | Field | Values |
|---|---|---|
| `0x00` | Slot name | `AIPLAYERn`, null-terminated. Human players' records come first, with an empty name and a difficulty of 0, so anchoring the search on `AIPLAYERn` skips them. |
| `0x50` | Team | 0 to 7, or 8 for a random team. Zero-based, so check its range only, never treat it as a slot number. |
| `0x54` | Country (`ActLike`) | Red Alert's `HousesType` + 2, so 2 to 9, or 42 for a random pick |
| `0x64` | **Difficulty** | 1 Easy, 2 Medium, 3 Hard |
| `0x68` | Colour | 0 to 7, the lobby colour |
| `0x70` (112) | Start position | 127 for random. **Unproven:** reported, not checked here. |

**Which fields to gate on.** Colour and country are safe, because the DLL is given both for this match in
`CNC_Set_Multiplayer_Data`. Compare the country before your mod remaps any house. Skip the country test when the
record reads 42 (a random pick, resolved before the DLL sees it), or falls outside 2 to 9. Team is only safe as
a range: a random team is resolved before the DLL sees it too.

In a default lobby, colours and teams follow slot order, so team, colour and slot number all read 1, 2, 3, 4, and
any of them looks like a slot index. Test with colours and teams shuffled.

## Stale copies of the lobby

After a match has been played, the launcher's heap can hold an old copy of the record array beside the live one. If
the player changed only the difficulty, the old copy matches on colour and country, so both pass validation and
disagree on the one value you want. It's intermittent, depending on the session's heap history.

Nothing inside the record tells them apart. What does is who points at them:

1. **A vector at the array base.** Find the array's start (the first AI record minus 168 bytes per human player),
   then look for pointers to it. The live array is held by a `std::vector`: a pointer to the start, then one to
   its end, then one to its capacity, where (end − start) / 168 equals the number of players in the match. An
   array with a valid triple is the live one.
2. **An exact pointer to the record.** Failing that, a pointer exactly on a candidate's first AI record marked the
   live copy in every recorded case, and was never on a stale one.
3. **Freshness.** A stale copy, once the active array, has many leftover pointers into its neighbourhood. A fresh
   live copy has few. Drop the heavily referenced ones.
4. **A strict majority** of the remaining candidates.
5. **Otherwise fail closed** and use your default.

Require the survivors of each step to agree before taking a value. That way the worst case is the default, never a
stale pick. The pointer signals exist only around match start, so run this on the first read. Searching for
pointers sweeps the whole address space per candidate, so do it only when candidates disagree.

**What doesn't work:**

- **Reading at another call.** A scan in `CNC_Set_Multiplayer_Data` and one in `CNC_Set_Difficulty` found the same
  candidates every time.
- **Comparing the records' bytes.** A stale and a live record differ at about 55 offsets, all heap pointers or
  uninitialised bytes. There is no counter or other field to key on.
- **Preferring the copy that differs from the last match's picks.** It inverts when the player changes a pick and
  changes it back: launch on Hard, set Easy, set Hard again, and the stale copy is the one reading Easy.
- **More fields from the roster.** Team, colour and country are all the lobby gives the DLL, and the stale copy
  matches on all three.

Changing the difficulty with no match played in between doesn't make a stale copy: the launcher overwrites the
array in place.

## How it was verified

- **That nothing passes the difficulty:** EA's `DLLInterface.h` (`CNC_Set_Difficulty(int)`, and no difficulty in
  `CNCPlayerInfoStruct`); the values the launcher sent, logged by a mod's DLL across five skirmish lobbies (mixed,
  all Easy twice, all Hard, and Hard in the campaign difficulty option) and in LAN games; DontCryJustDie's own
  finding that the per-AI setting exists only on the launcher's side.
- **The settings file:** decompressed and walked record by record for this page (the `CASUAL` record at tag `0x21`,
  the counter at tag `0x31`); a mod's own measurements diffed the file, the Wine registry and the launcher's exit-time
  writes across launches with different picks: nothing tracked the picks, and the byte that moved at each launch
  was the counter.
- **The name trap:** EA's `GlyphX_Assign_Houses` (the `IniName` copy, the `TXT_COMPUTER` overwrite for computer
  houses, `InitialName` under `#ifdef WOLAPI_INTEGRATION`), no `WOLAPI_INTEGRATION` define in `DEFINES.H` or the
  project file, the same loop in Vanilla Conquer's `dllinterface.cpp`, and a shipped mod that hit it and now records
  each house's slot inside the loop.
- **The record:** a shipped mod's reader and its field constants; live reads with colours, teams and countries
  shuffled, random picks included; and DontCryJustDie's independent identification of the colour, team and country
  fields, and of the start-position field. The first reads, of a Hard, Medium, Easy, Hard lobby, gave 3, 2, 1, 3 at
  `+0x64`, and human records read 0. Countries decode through EA's `HousesType` order: an all-Soviet lobby read
  `4, 4, 4` (`HOUSE_USSR` + 2), and a mixed lobby `2, 9, 3` (Spain, Turkey, Greece). Teams read the lobby's team
  number minus 1, and a three-AI lobby with two AIs sharing a team read `0, 1, 1`.
- **The rebuild window:** a mid-launch read caught returning a half-written array, and the shipped reader's retry,
  which needs two agreeing reads; the mod's release notes record the fix for solo skirmish from the second match
  of a session on.
- **Stale copies and the resolver:** 28 ambiguous reproductions resolved with none wrong, and the compiled
  resolver run offline over 46 recorded cycles with none wrong. DontCryJustDie independently found the
  array-base target and the vector triple on Windows, about 30 samples with no failure. The routes that don't work
  come from the same measurements: about 13 change-only cycles with no stale copy, identical candidate sets at
  both scan sites, and full 168-byte dumps of stale and live records.
- **Not yet seen:** the vector-triple step deciding a live ambiguous read. Every recorded case was settled by
  the later steps.

**Credit:** **DontCryJustDie** worked out a large part of this. He pointed out that the per-AI difficulty only
exists in the launcher and suggested reading it from there. He identified the colour, team, country and
start-position fields. He reported the stale-copy problem, and independently found that the live array is held by
a `std::vector` whose start pointer sits at the array base.

> [!TIP]
> **In Tiberian Factions**
>
> TF's skirmish AIs play at the difficulty picked for each one in the lobby, in solo skirmish and in LAN games
> hosted with the mod. The read runs at match start and retries up to four times, 90 frames apart. If it still
> finds nothing, TF falls back to a difficulty file the player can set, then to Hard.
