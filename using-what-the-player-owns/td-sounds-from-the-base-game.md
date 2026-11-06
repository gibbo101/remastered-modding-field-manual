---
title: TD sounds from the base game
description: Play Tiberian Dawn's sound effects and EVA lines in a Red Alert mod from the base game's own sound MEGs, by naming the sound in the DLL and adding RAC_/RAR_ alias events to the sound XML; plus the sample format your own sounds must use.
tags: [audio, sfx, eva, red-alert, tiberian-dawn, dll]
holds_for: Steam build 21590013
status: verified
unproven: [what silenced a routed TD sound in one early test until its sample was copied into the mod, whether a merged XML with mixed line endings loads, whether whitespace inside an entry tag matters]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Tiberian Dawn sounds from the base game

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When a Red Alert mod wants Tiberian Dawn's sounds: TD weapon reports, building sounds, EVA voice lines. Every player
already owns them in the base game's sound MEGs, so the mod ships no audio for them, only a name in the DLL and a
few lines of XML. The same route plays new sounds of your own. A mod that only uses Red Alert's own sounds, under
their own names, doesn't need this page.

## How a sound gets from the DLL to the speakers

1. **The DLL sends a name, not a sound.** For each sound event the DLL copies the sound's name out of its
   `SoundEffectName[]` table into a 16-byte field (`SoundEffectEvent::SoundEffectName` in `DLLInterface.h`), so
   15 characters at most. EVA works the same way from the `Speech[]` table, into a 16-byte `SpeechName`.
2. **The launcher adds a prefix:** `RAC_SFX_` when the player uses classic sound effects, `RAR_SFX_` when they use
   remastered ones. `OBELRAY1` becomes `RAC_SFX_OBELRAY1` or `RAR_SFX_OBELRAY1`.
3. **It looks the prefixed name up as an event** in `Data/XML/AUDIO/SFXEVENTSNONLOCALIZED.XML` (sound effects) or
   `SFXEVENTSLOCALIZED.XML` (EVA and other voices, as `<LocalizedSFXEvent>`).
4. **The event's `<SampleNamesList>` names the sample to play.** It can name *any* sample: nothing ties an
   `RAR_SFX_` event to a Red Alert file. EA's own data does this: Red Alert's beacon and map-reveal sounds,
   `RAR_SFX_BEACON` and `RAR_SFX_MAPWIPE2`, play TD's `TDR_SFX_BEACON01.WAV` and `TDC_SFX_appear1.WAV`.

So a TD sound in Red Alert is an **alias event**: a Red Alert-prefixed event whose sample is TD's.

## The method

**1. Name the sound in the DLL.** Add a `VocType` entry before `VOC_COUNT`, and add the TD sound's bare name to
`SoundEffectName[]` *at the same position*. The table is indexed by the enum.

```cpp
VOC_TD_LASER,                       // defines.h, before VOC_COUNT
{"OBELRAY1", 1, IN_NOVAR},          // audio.cpp, SoundEffectName[], same position
```

`rules.ini` can then name it: `Report=OBELRAY1`. The INI reader finds a sound by comparing the name, ignoring
case, with every entry in `SoundEffectName[]`, so a name that isn't in the table plays nothing.

**2. Add both alias events.** Take `SFXEVENTSNONLOCALIZED.XML` out of the base game's `CONFIG.MEG`, add a classic and
a remastered event, and ship the whole file in your mod as `Data/XML/AUDIO/SFXEVENTSNONLOCALIZED.XML`:

```xml
<SFXEvent Name="RAC_SFX_OBELRAY1" Preset="_PRESET_MD_MOBIUS_2D">
    <IsPreset> False </IsPreset>
    <MinPitch>100</MinPitch>
    <MaxPitch>100</MaxPitch>
    <SampleNamesList>
        <entry> TDC_SFX_OBELRAY1.WAV </entry>
    </SampleNamesList>
</SFXEvent>
<SFXEvent Name="RAR_SFX_OBELRAY1" Preset="_PRESET_MD_MOBIUS_2D">
    <IsPreset> False </IsPreset>
    <MinPitch>100</MinPitch>
    <MaxPitch>100</MaxPitch>
    <SampleNamesList>
        <entry> TDR_SFX_OBELRAY1.WAV </entry>
    </SampleNamesList>
</SFXEvent>
```

**3. Ship nothing else.** TD's classic (`TDC_`) and remastered (`TDR_`) samples are already in the base game:
sound effects in `Data/SFX3D.MEG` (221 TD samples), EVA lines in `Data/SFX2D_EN-US.MEG` and its German and French
twins.

**EVA lines** work the same way, in `SFXEVENTSLOCALIZED.XML`. Name the line in the DLL's `Speech[]` table (say
`TDACCOM1`), and add `RAC_SFX_TDACCOM1` and `RAR_SFX_TDACCOM1` as `<LocalizedSFXEvent>` entries pointing at TD's
`TDC_SFX_EVA_ACCOM1_EN-US.MP3` and `TDR_SFX_EVA_ACCOM1_EN-US.MP3`.

## Samples of your own

New sounds ship loose in the mod, under names of their own: `Data/AUDIO/` for sound effects, and a locale folder
such as `Data/AUDIO/EN-US/` for voices. Route them with alias events exactly as above.

- **MS-ADPCM only** (WAV format tag 2). Every sample in the base game is MS-ADPCM. A plain PCM WAV (tag 1) with sound
  in it crashes the launcher: its ADPCM decoder divides by zero. A header-only 44-byte PCM WAV with no samples is
  accepted, and plays silence.
- **Match the base rates.** Classic samples are mono at about 22 kHz, remastered ones mono at about 44 kHz, and TD's
  remastered EVA lines are stereo at about 44 kHz. `ffmpeg -i in.wav -c:a adpcm_ms -ar 22050 -ac 1 out.wav` makes a
  sample that plays on both settings.
- **The XML says `.MP3`, and the file is a WAV.** Localized entries name `..._EN-US.MP3`, and the file that plays
  is `EN-US\..._EN-US.WAV`, an ADPCM WAV.
- **Sample names ignore case.** EA's own data names `TDC_SFX_appear1.WAV` for the file `TDC_SFX_APPEAR1.WAV`.
- **A loose file named like a base sample replaces it everywhere it plays**, GUI sounds included. The interface's
  "can't do that" buzz (`SFX_GUI_Generic_Bad_Sound`) plays TD's `SCOLD1`, so a loose `TDR_SFX_SCOLD1.WAV` changes it
  too. Give a new sound a new name, unless replacing is the point.

## Traps

- **Merge, never replace.** The loose XML replaces the base file whole. The base file holds 578 events and the 37
  presets they use (`_PRESET_MD_MOBIUS_2D` among them). A file holding only your additions leaves every stock sound
  pointing at nothing, and the launcher crashes. Start from the base file and add to it.
- **Keep the XML well formed.** XML forbids `--` inside a comment, and the launcher crashes on a file it can't
  parse, between choosing the game and the main menu. Check your file with any XML parser before shipping it.
- **Keep the BOM.** The base file starts with a UTF-8 byte-order mark, so keep it. Its line endings are CRLF, but a
  merged file that's LF throughout loads fine. **Unproven:** a file mixing the two.
- **Write both prefixes.** Every Red Alert event in the base file comes as a classic and remastered pair (135 of
  each). With only one, the sound is silent for players on the other setting.
- **The enum and the table must stay in step.** An entry added out of order in `SoundEffectName[]` plays its
  neighbour's sound.
- **A silent sound may be its preset's fault.** If a routed sound plays but can't be heard, check the event's
  preset and mixer volume before re-encoding the sample. One preset pinned its sound at 5 of 100.
- **Whitespace inside `<entry>`:** the base file pads names with spaces (`<entry> NAME.WAV </entry>`). Copy that
  form. **Unproven:** whether the launcher cares.

## How it was verified

The DLL side was read in EA's released Red Alert source (the `SoundEffectName[]` and `Speech[]` tables, the
16-byte fields, and the INI's lookup by name). The data side was read from the base game's `CONFIG.MEG` and sound
MEGs: event counts, prefix pairs, presets, EA's own Red Alert events that play TD samples, and the format of every
sample measured. In a shipped mod, the TD credit tick and around a hundred TD EVA lines play in game from the base
game's samples, none of them shipped, and the mod routes its TD weapon reports the same way. The PCM crash was
taken from two identical crash records. Tested under Proton on Linux and on the Steam Deck.

**Unproven:** in one early test a routed TD sound stayed silent until its sample was copied into the mod, and the
cause was never found. Every later route to a base sample played. If a routed TD sound is silent, shipping a copy
of its two samples is a known workaround.

**Credit:** [Reilsss's Command & Conquer in Red Alert](https://steamcommunity.com/sharedfiles/filedetails/?id=2853520457)
first routed TD sounds into Red Alert with `RAC_`/`RAR_` alias events, the Obelisk's laser among them.

> [!TIP]
> **In Tiberian Factions**
>
> TF's GDI and Nod sound like Tiberian Dawn: their weapons, their credit tick and their EVA all play from the base
> game's own samples, routed by name from the DLL. The DLL chooses a TD EVA line or Red Alert's for each
> announcement by the local player's faction, so Allied and Soviet players still hear Red Alert's EVA. TF's own new
> sounds, such as its C&C3 units' weapons, ship as MS-ADPCM WAVs under names of their own.
