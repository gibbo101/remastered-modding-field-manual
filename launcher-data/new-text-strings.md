---
title: New text strings
description: Give new units, buildings and screens their own names with a loose Data/ModText.csv (UTF-16, merged into the launcher's string table at load); the master .LOC string table can only be relabelled at its exact size, never extended.
tags: [launcher, text, strings, localisation, data]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
status: verified
unproven: [how the launcher finds ModText.csv (the name is in no game binary), whether a CSV under another name is read too, whether a loose MASTERTEXTFILE .LOC with added records loads]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# New text strings

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod shows text the base game doesn't have: a new unit's or building's sidebar name and description, a
new map's name, a label on a screen. Every name the launcher shows is a text ID looked up in its string table.
If your mod only reuses the base game's text IDs (TD's map and unit names work in Red Alert), you don't need this
page.

## Add strings: `Data/ModText.csv`

Ship a loose `Data/ModText.csv` in your mod. The launcher merges its rows into the string table at load, beside the
base game's text, so any text ID it defines can be used anywhere a text ID goes.

```
"TEXT ID","AUDIO TAG","CHARACTER","ENGLISH","UNITED_KINGDOM","GERMAN","FRENCH",...
"// This is a comment",,,"Comment rows put // in the TEXT ID field",,,...
"TEXT_UNIT_MY_TANK",,,"My Tank",,,...
"TEXT_UNIT_MY_TANK_DESC",,,"What the sidebar tooltip says about it.",,,...
```

- **Encoding:** UTF-16 little-endian with a byte-order mark, as a CSV with every field quoted or empty.
- **Columns:** `TEXT ID`, `AUDIO TAG`, `CHARACTER`, then one column per language, `ENGLISH` first. Fill the
  languages you have and leave the rest empty.
- **Comments:** a row whose `TEXT ID` starts with `//`.
- **Line endings:** CRLF in the sample below, and LF loads too.

Then point at your IDs. A buildable object's sidebar name and description come from its `ObjectNameTextID` and
`ObjectDescriptionTextID` in its `ObjectTypeClass` entry. A skirmish entry's name comes from its
`LocationNameTextID`.

## Relabel strings: the `.LOC` table, at its exact size

The base game's own strings are in `DATA\TEXT\MASTERTEXTFILE_<language>.LOC` in `CONFIG.MEG`, one file per
language. To change an existing string, such as a country's lobby name, edit that table. You can't add to it.

```
u32 count
count × { u32 hash, u32 value length (characters), u32 key length (bytes) }   sorted by hash
values  UTF-16LE, in record order, no terminators
keys    ASCII, in record order, no terminators
```

The hash is the CRC-32 of the key. There are no offsets: each value is found by adding up the lengths before it.
So a value can grow if another gives the same bytes back, and the file's total size stays the same.

- **Inside a replacement `CONFIG.MEG`,** the file must keep its exact size, like every member there (see
  [Overriding the launcher's data](overriding-launcher-data.md)). Adding records grows it and crashes the launcher
  at boot. That was tried and crashed.
- **Same size, redistributed:** an in-place overwrite, or a string grown at another's expense, loads fine.
  Trailing spaces pad a short value invisibly.
- **Unproven:** whether a loose `.LOC` with added records would load. A loose file isn't bound by the archive's
  same-size rule, but nobody has tried it, and `ModText.csv` makes it unnecessary.

## Traps

- **An ID found nowhere shows raw.** The sidebar then reads `TEXT_UNIT_MY_TANK`. Check the spelling in both files.
- **`rules.ini`'s `Name=` isn't the sidebar name.** It sets only the in-world hover tooltip. The sidebar reads
  the object's text ID. Observed in a working mod, not read from code.
- **One string per language file.** If you edit a `.LOC`, edit every language you ship for. `ModText.csv` carries
  all languages in one file.

## How it was verified

- **`ModText.csv`:** DontCryJustDie's "Nuke Tank Sample Mod" ships one (UTF-16 LE with a BOM, these columns,
  `//` comments) with no DLL, so the launcher is what reads it. A working mod ships its own for every new unit and
  building name, with LF line endings, and they show in the sidebar. `ClientG.exe`'s mod loader lists `CSV` among
  the file types it takes from a mod (beside `Loading mod: %s` in `ModManagerClass::Load_Mod`). The name
  `ModText.csv` itself appears in no game binary, so how the launcher picks this file out is unknown.
- **The `.LOC` format:** the stock English table parsed exactly as above: 6,852 records, sorted by hash, every
  hash the CRC-32 of its key, and the file ending where the keys end. Same-size relabels and a byte-neutral regrow
  were checked in game. The crash on adding records came from a repacked `CONFIG.MEG`.

**Credit:** DontCryJustDie's Nuke Tank Sample Mod is the public proof of the `ModText.csv` route.

> [!TIP]
> **In Tiberian Factions**
>
> Every TF unit and building name is a row in its `ModText.csv`, written by the same build step that adds the
> object's art, so the name can't fall out of step with the object. TF also relabelled the lobby's country names
> (Spain to GDI, Greece to Nod) in the `.LOC` table at its exact size, giving a long name room by taking bytes
> from a neighbouring tooltip.
