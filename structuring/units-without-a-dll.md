---
title: New units without a DLL of your own
description: Stock Red Alert has no INI route to new unit types, but a mod built on another mod's DLL can add them as data; DontCryJustDie's Nuke Tank sample does it on his Veterancy and more, with a rules_mod.ini, a buildables XML, a tileset, a ZIP and ModText.csv.
tags: [structuring, units, ini, data-only, add-ons]
holds_for: Steam build 21590013
status: verified
unproven: [exactly how the host mod gets the launcher to load an add-on's tiles and objects (the sample says it merges them, keyed on a version number), running such an add-on beside another DLL mod]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# New units without a DLL of your own

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only** for the art. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When you want to add a unit without writing or building a DLL. It can't be done on stock Red Alert: its unit types
are a compiled list, and EA's source has no `[VehicleTypes]` or other INI route to new ones. It **can** be done as
an add-on to a mod whose DLL reads new types from data. DontCryJustDie's *Veterancy and more* is such a mod, and
his official *Nuke Tank Sample Mod* (Workshop 3497050142) shows how. If you build your own DLL, add types in code
instead.

## What the sample ships

The whole sample is eleven files, in a folder named `NukeTank`:

```
NukeTank/
├── ccmod.json                                   load_order 2: after the host mod (1)
├── Rules/rules_mod.ini                          the unit, its weapon, warhead and projectile
├── Rules/sound_mod.ini                          its new sound name
├── CCDATA/veterancy_mod.xml                     which of the files below the host should merge
└── Data/
    ├── ModText.csv                              the unit's name and description
    ├── Audio/NukeTank_Firing.wav                its weapon sound
    ├── XML/Audio/NukeTankSFXEvents.xml          the sound event
    ├── XML/Objects/Units/NukeTankBuildables.xml the sidebar entry (RA_NTNK)
    ├── XML/Tilesets/UNITS.XML                   the unit's tiles, NTNK shapes 0 and up
    ├── Art/Textures/SRGB/BuildIcon_Nuke_Tank.tga its cameo
    └── Art/Textures/SRGB/Red_Alert/Units/NTNK.ZIP its HD frames
```

- **`rules_mod.ini`** adds types by name, in sections the host mod's DLL reads: `[ProjectileTypes] 1=BallisticNuke`,
  `[WarheadTypes] 1=NukeHE`, `[WeaponTypes] 1=NukeLob` and `[VehicleTypes] 1=NTNK`, each followed by its own
  section of the usual Red Alert keys (`Strength=`, `Primary=`, `Prerequisite=`, `Owner=` and so on). The file's
  own comment asks for a blank line at its end, or it won't load.
- **`sound_mod.ini`** adds a sound name the same way (`[VocTypes] 1=NukeLobSFX`), which `Report=` then names.
- **`veterancy_mod.xml`** tells the host which XML files to take in: the sound events (`<SFXEvents>`), the
  buildables (`<GameObjects>`) and the unit tileset (`<TileSets><Units>`). Each file needs a unique name. The
  tileset's first entry carries a `version` that must go up whenever the tileset changes, "to trigger an XML
  update".
- **The buildables entry** registers the type for the sidebar: `<ObjectTypeClass Name="RA_NTNK"
  Classification="CNCBuildableObject">`, with its name and description text IDs and its `BuildIcon`. The type's
  launcher name is `RA_` plus its INI name. Its name and description come from `ModText.csv`: see
  [New text strings](../launcher-data/new-text-strings.md).

## What this ties you to

- **The host mod has to be enabled,** loaded before your add-on. The add-on is data for its DLL.
- **One DLL at a time.** Only one mod's game DLL runs. An add-on for one DLL mod won't work beside another DLL
  mod, such as a total conversion with its own DLL (observed).
- **The host's rules come with it.** *Veterancy and more* changes the game in its own ways, and an add-on plays
  under them.

## How it was verified

- **The sample's files:** read directly from the Workshop download, all eleven listed above.
- **The host:** *Veterancy and more* (Red Alert item 2194215017, by DontCryJustDie). Its `RedAlert.dll` names
  `rules_mod.ini`, `sound_mod.ini`, `veterancy_mod.xml` and the `VehicleTypes`, `InfantryTypes`, `BuildingTypes`,
  `AircraftTypes`, `VesselTypes`, `WeaponTypes`, `ProjectileTypes`, `WarheadTypes` and `VocTypes` sections.
- **Stock Red Alert:** none of those section names, nor `rules_mod.ini`, appears in EA's released Red Alert
  source, and the base game's own `rules.ini` has no `[VehicleTypes]` section. The keys the sample's sections
  use, such as `Strength=`, `Prerequisite=`, `Owner=` and `Primary=`, are stock: the base game's `rules.ini` uses
  each of them throughout.
- **Not tested here:** the add-on in play. The merge step is the host's and isn't documented on this page.

**Credit:** the method and the sample are DontCryJustDie's. His *Nuke Tank Sample Mod* is the reference for
adding units to *Veterancy and more*, and the public proof of `ModText.csv`.

> [!TIP]
> **In Tiberian Factions**
>
> TF has its own DLL, so it adds every type in code: a new enum value, a type class and its data, with art and
> sidebar entries in its own tilesets and buildables. For the same reason TF can't host *Veterancy and more*
> add-ons, and the two mods can't run together.
