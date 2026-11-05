---
title: LAN games
description: In a Remastered LAN game only the host runs the simulation and the mod's DLL; every player's launcher only draws. What that means for per-player state, sounds, keyboard reads and launcher patches, and why every player needs the same enabled mods.
tags: [engine, multiplayer, lan, dll, launcher]
holds_for: Steam build 21590013
status: verified
unproven: [which of EA's PlayerPtr and IsPlayerControl tests in the game loop still assume a single local player and skip the others]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# LAN games

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod is meant to be played over LAN, and does anything per player: sounds or EVA chosen by faction, key
handling in the DLL, launcher patches, or optional add-ons. A mod that only changes rules and art works in LAN as
it does in skirmish.

## One simulation, on the host

The original Red Alert ran a copy of the game on every machine, in lockstep: each machine ran the same frames from
the same orders, and compared a checksum of the game state to catch any machine falling out of sync. The
Remastered Collection doesn't. In a LAN game
**only the host runs the simulation**: one instance server, one copy of your DLL, simulating every player's house.
A joiner simulates nothing: their launcher (`ClientG.exe`) draws what the host's simulation exports, and sends its
player's input back.

EA's DLL says so in its own comment: "Historically, in a peer-to-peer multiplayer game, each player's PlayerPtr
pointed to their own local player." The Remastered DLL instead switches `PlayerPtr` to whichever player generated
the input, or needs the output (`Logic_Switch_Player_Context`).

## What that means for a mod

- **"The local player" is whoever the code is running for.** `PlayerPtr` changes as the simulation works through
  each player's input and output. Between those switches, the game loop runs as the lobby's first player. Code that
  tests `PlayerPtr` or `IsPlayerControl` to mean "the person at this machine" is only right for that first player.
  Test the house you mean: `IsHuman`, or the house the event belongs to.
- **Address sounds to a player.** The DLL can send a sound or EVA line to one player's launcher:
  `DLLExportClass::On_Sound_Effect(house, ...)` takes the house it's for. EA's own beacon code loops over the
  human allied houses and sends the beacon sound to each. A sound chosen by faction should go to the house whose
  faction chose it.
- **Keyboard reads in the DLL see only the host's keyboard.** The DLL runs on the host, so `GetAsyncKeyState`
  there reads the host's keys and acts for the host's player. Anything a joiner should trigger by key has to come
  through the launcher: the four mod hotkey commands, or a patched launcher command (see
  [What the launcher owns](what-the-launcher-owns.md)).
- **A launcher patch made from the simulation reaches only the host's launcher.** Joiners' launchers never see
  the simulation's process. To patch every player's launcher, patch it from the copy of your DLL that each launcher
  loads at start-up: [Patching the launcher's code from your DLL](../clientg-ram/patching-the-launchers-code.md).
  That copy doesn't know its player's faction until the host tells it. A message from the host, hidden from the
  screen, is one way.

## Every player needs the same mods

The launcher's join check needs every player on the same enabled mods, add-ons included. A joiner with a mod the
host doesn't have is shown **MODS REQUIRED**, with **Must Disable** on that mod. The counterpart message, **Must
Enable**, is for a mod the host has and the joiner lacks. So an optional add-on is a per-player choice only in
single player. In multiplayer it's on for everyone or for no one.

## How it was verified

- **The original's lockstep:** EA's `QUEUE.CPP`, whose frame-sync logic keeps every system within
  `Session.MaxAhead` frames of the others, and whose `Compute_Game_CRC` records a checksum of the whole game for each
  of the last 32 frames.
- **One simulation on the host:** EA's own comment and context switching in `DLLInterface.cpp`; the executables'
  imports (the instance server names `CNC_Advance_Instance`, the launcher only `CNC_Version`); and a working mod
  whose LAN joiners needed launcher-side patches for anything per player.
- **Per-player sounds:** EA's `On_Sound_Effect` with a house argument, and its beacon loop. A working mod plays
  its deploy, placement and build-up sounds to their owner this way in LAN. Whether a joiner hears their own
  faction's credit tick is still untested.
- **The join check:** the strings `MODS REQUIRED`, `Must Disable` and `Must Enable` in the base game's
  `MASTERTEXTFILE_EN-US.LOC`, and a working mod's add-on behaviour in LAN. That "Must Enable" is shown for a
  missing mod is read from the string's presence, not seen.
- **Tested** in LAN games with a Steam Deck hosting and a Linux desktop joining.
- **Unproven:** EA's code tests `PlayerPtr` or `IsPlayerControl` in about 80 other places. Any of them that runs in
  the game loop and plays a sound may still skip every player but the first.

> [!TIP]
> **In Tiberian Factions**
>
> At match start the host's DLL sends each human player a hidden message naming their faction. The hook that each
> launcher installed at start-up reads it, and patches that player's own crest, tab icons and launcher-played EVA
> lines. Deploy, select-all and camera-to-yard keys reach the host as mod commands from every player's launcher.
> TF's optional add-on packs are on for everyone or no one in LAN.
