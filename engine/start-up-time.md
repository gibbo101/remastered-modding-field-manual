---
title: Start-up time
description: "Where the wait between clicking a game in the launcher and its front end goes: a fixed 4 s sleep before any mod loads, about 4 s of graphics start-up, a 1.2 s GPU benchmark every launch, save previews unzipped every launch, then the art load, which is the only large part a mod controls."
tags: [engine, performance, start-up]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
status: verified
unproven: [the stretch times on Windows, how far a launcher patch could shorten the GPU benchmark safely]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Start-up time

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod makes the game slow to start, or you want to know which part of the wait a mod can change at all.
A mod with little art of its own adds almost nothing to start-up and can skip this page.

## Where the time goes

From clicking a game in the launcher to its front end, measured on one desktop under Proton with a mod carrying a
large HD asset pack, four runs within 0.4 s of each other:

| Stretch | Time | What it is | Can a mod change it? |
|---|---|---|---|
| Before mods load | 4.0 s | A fixed `Sleep(4000)` at the top of the launcher's mod loader, every launch, modded or not | No: a mod's DLL loads after it |
| Graphics start-up | about 4 s | Finding the adapter and creating the device | No |
| `Measure_Fill_Vertex_Rates` | 1.2 s | A GPU benchmark the launcher runs every launch | Only by a launcher patch, not tried |
| Save previews | about 0.05 s a save | Every launch opens every save and writes its preview image to the temp folder (67 saves: 3.2 s) | No: it grows with the player's saves |
| Art load | most of the rest | Mounting every art ZIP and creating every sprite texture (see [Sprite memory and DDS](../art/sprite-memory-and-dds.md)) | Yes: less art, or art that unzips less |

The art load is the one large stretch a mod owns. Everything before it is the same for every mod, and the save
previews belong to the player.

## How it was verified

- **The stretches:** timestamps in the game's own `LogFile_0.txt`, from the click to the first frame of the front
  end, four runs each.
- **The 4 s sleep:** an outside sampler of the process showed it idle through that stretch (no CPU, no disk), and
  the launcher's code at the matching log line is a `Sleep(4000)`.
- **The benchmark and the save previews:** the launcher's code at their log lines; the cost a save is the save
  stretch's timestamps divided by the 67 saves it read.

> [!TIP]
> **In Tiberian Factions**
>
> TF with its Tiberian Sun asset pack reaches its front end in about 28 s on the desktop measured and about 40 s on
> a Steam Deck, and the art load is most of the difference from the base game. TF's work on shrinking the art load
> is on [Open questions](../open-questions.md).
