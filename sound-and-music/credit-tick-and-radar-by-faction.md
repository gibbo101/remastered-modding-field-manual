---
title: Credit tick and radar sounds by faction
description: The launcher plays the credit tick and the radar on/off sounds itself, the same for every faction. Silence its copies with data, then play each faction's own sound from the DLL under new event names, addressed to the house it belongs to.
tags: [audio, sfx, factions, launcher, dll]
holds_for: Steam build 21590013
status: verified
unproven: [whether a LAN joiner hears their own faction's credit tick (the DLL addresses it to their house, but nobody has listened yet)]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Credit tick and radar sounds by faction

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When a faction should have its own credit tick (the sound of the money counter rolling) or its own radar on/off
sound, such as Tiberian Dawn's for GDI and Nod. The launcher plays both itself, the same for every player, and no
data file can tell it which faction is playing. A mod where every faction shares Red Alert's sounds doesn't need
this page.

## Who plays them

- **Radar on/off:** the launcher. EA's own source says so. Where the DLL would play `VOC_RADAR_ON`, `RADAR.CPP`
  carries the call commented out: "These are never being sent to the client, so handled there". `ClientG.exe`
  holds the sample names `_SFX_RADARON2` and `_SFX_RADARDN1`.
- **The credit tick:** the launcher too. In EA's code the tick sound is in `CreditClass::Graphic_Logic`, but the
  Remastered DLL runs the credit roll logic-only (`HouseClass::AI` calls `VisibleCredits.AI(false, this, true)`),
  so the DLL never plays it. `ClientG.exe` has its own `GUI_Credits_Up_Tick` and the sample name
  `RAR_SFX_CASHUP1`, and plays `RA?_SFX_cashup1` and `cashdn1` as the counter moves.

Neither knows the player's faction, so the method is: **silence the launcher's copy, and have the DLL play the
faction's sound instead.**

## Silencing the launcher's copy

There are two ways, and both are data:

- **Point the stock event at a silent sample.** In your merged `SFXEVENTSNONLOCALIZED.XML`, change the
  `<SampleNamesList>` of `RAC_SFX_cashup1`, `RAC_SFX_cashdn1`, `RAR_SFX_cashup1` and `RAR_SFX_cashdn1` to a short
  silent MS-ADPCM file. Only the event changes, and the stock sample still exists for anything else to use.
- **Replace the stock sample itself.** Ship a header-only WAV under the stock sample's name, such as
  `RAR_SFX_RADARON2.WAV`: 44 bytes, PCM, no sample data. The launcher accepts it and plays silence. A loose file
  under a base sample's name replaces that sample **everywhere** it plays, so use this only for a sample nothing
  else needs.

## Playing the faction's sound from the DLL

Fire the faction's sound from the DLL under a **new event name**, since the stock names are the silenced ones.
Every faction needs one, Red Alert's sides included:

| Faction | Credit tick (event → sample) | Radar on |
|---|---|---|
| Red Alert sides | `RA?_SFX_CASHUPD` → the stock `RA?_SFX_cashup1.WAV` | `RA?_SFX_RAORADON` → a copy of Red Alert's own sample under the new name |
| A TD faction | `RA?_SFX_TONE15` → TD's `TD?_SFX_TONE15.WAV`, from the base game | TD's sound under a name of its own |

Red Alert's credit tick can point straight at the stock sample, because only the event was silenced. Its radar
sound needs a copy under a new name, because the stock *sample* is the one replaced by silence. How to add the
`VocType`, the name and both prefixed events is on
[TD sounds from the base game](../using-what-the-player-owns/td-sounds-from-the-base-game.md).

- **The credit tick:** fire it from `CreditClass::AI`, at the exact step that moves the credits the launcher
  displays. The DLL exports that same value as the sidebar counter (`sidebar->CreditsCounter =
  PlayerPtr->VisibleCredits.Current` in EA's `DLLInterface.cpp`), so the sound and the number stay in step.
  Choose the sound by the house's faction, and send it with `DLLExportClass::On_Sound_Effect(house, ...)`, to the
  house whose credits moved.
- **Radar on/off:** where the DLL sends `VOC_RADAR_ON` or `VOC_RADAR_OFF` to the launcher, swap in the faction's
  event name before it goes out.

## Traps

- **Never re-point a silenced event at a real sample.** That un-silences the launcher's copy, and the sound then
  plays twice, once from the launcher and once from the DLL. A new faction gets new event names of its own.
- **Don't test audio changes through the credit tick.** Any loose override can silence it, so a silent tick
  doesn't prove the change you're testing is broken.
- **To find out who plays a sound,** put a log line that appends to a file at the DLL's call site. If the file
  stays empty while you hear the sound, the launcher owns it.
- **A sound that plays but can't be heard** may be its preset's volume. See the TD sounds page.

## How it was verified

- **Who plays them:** EA's `RADAR.CPP` comment, EA's `CreditClass` (`Graphic_Logic` holds the sound, and
  `HouseClass::AI` calls the roll logic-only), and the sample and event names in `ClientG.exe`.
- **Silencing:** the stock events and samples read from `CONFIG.MEG` and `SFX3D.MEG`. A shipped mod silences the
  four credit-tick events with a silent ADPCM sample, and the two radar samples with 44-byte header-only WAVs.
- **The DLL's sounds:** in play, GDI and Nod hear TD's credit tick and radar, Tiberian Sun's GDI hears its own, and
  Allies and Soviets keep Red Alert's, with no doubled sound. Tested under Proton on Linux and on the Steam Deck.
- **Unproven:** a LAN joiner's own credit tick. In LAN only the host runs the DLL (see
  [LAN games](../engine/lan-games.md)). The tick is addressed to the joiner's house, the way EA's beacon sound is,
  but nobody has listened for it on a joiner's machine yet.

> [!TIP]
> **In Tiberian Factions**
>
> TF found the credit tick was the launcher's by the empty-log test: the DLL's call site logged nothing while the
> tick played. GDI and
> Nod tick with TD's `TONE15` and `TONE16`, and TS GDI with Tiberian Sun's own `CREDUP1` and `CREDDWN1`. Each era
> also has its own radar pair: TD's Comm Center sound for GDI and Nod, and Tiberian Sun's for TS GDI.
