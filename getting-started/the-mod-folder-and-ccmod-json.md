---
title: The mod folder and ccmod.json
description: A Remastered mod is a folder holding ccmod.json and a Data/ tree; where the launcher looks for local and Workshop mods, what each ccmod.json field does, and the named-subfolder layout a Workshop upload needs.
tags: [getting-started, ccmod, mod-folder, workshop, proton]
holds_for: Steam build 21590013
status: verified
unproven: [what game_type values other than RA and TD do, which enabled mod's copy of a file wins when two ship the same file (see Overriding the launcher's data)]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# The mod folder and ccmod.json

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

For every mod. Before any other page here applies, the launcher has to find your mod, list it and load it. That
takes a folder in the right place, with a `ccmod.json` it can read.

## What a mod is

A folder holding a `ccmod.json` and a `Data/` tree that mirrors the game's own:

```
<mod folder>/
├── ccmod.json
└── Data/
    ├── RedAlert.dll          (or TiberianDawn.dll; only if the mod changes game code)
    └── ...                   (loose XML, art, audio, mirroring the game's Data/)
```

How loose files under `Data/` replace the game's own is on
[Overriding the launcher's data](../launcher-data/overriding-launcher-data.md).

## ccmod.json

```json
{
    "name": "My Mod",
    "description": "One line, shown in the mods list.",
    "author": "Your alias",
    "load_order": 1,
    "version_high": 1,
    "version_low": 0,
    "game_type": "RA"
}
```

| Field | What it does |
|---|---|
| `name`, `description`, `author` | Shown in the in-game mods list. |
| `load_order` | An integer. Every mod sets one. |
| `version_high`, `version_low` | Two integers, shown as `high.low` (the launcher formats them with `%d.%d`). There is no third part. |
| `game_type` | `"RA"` for a Red Alert mod, `"TD"` for a Tiberian Dawn one. |

Since the version is two integers, `1.10` and `1.1` are different versions but `1.1.6` can't be written. Pick a
mapping (for example `version_low = minor * 10 + patch`) and keep to it.

## Where the launcher looks

**Local mods** go in the player's documents folder, under the game's own subfolder:

```
Documents\CnCRemastered\Mods\Red_Alert\<mod folder>\ccmod.json
Documents\CnCRemastered\Mods\Tiberian_Dawn\<mod folder>\ccmod.json
```

Under Proton (Linux or the Steam Deck), that documents folder sits in the game's prefix:

```
<Steam library>/steamapps/compatdata/1213210/pfx/drive_c/users/steamuser/Documents/CnCRemastered/Mods/Red_Alert/
```

`Mods\Red_Alert` and `Mods\Tiberian_Dawn` exist once each game has been launched. A new local mod shows in that
game's mods list. Switch it on there, and restart when the launcher asks.

**Workshop mods** download to Steam's Workshop folder for the game, one folder per item:

```
<Steam library>/steamapps/workshop/content/1213210/<item id>/<mod folder>/ccmod.json
```

## Traps

- **A Workshop upload needs a named subfolder.** Upload a folder that *contains* your mod folder, so subscribers
  get `<item id>/<mod folder>/ccmod.json`. A `ccmod.json` at the item's root isn't found. Every installed Workshop
  mod surveyed here has the named subfolder, and none has `ccmod.json` at its root.
- **`CnCRemastered` appears once in the path.** Some guides, Vanilla Conquer's README among them, give
  `My Documents/CnCRemastered/CnCRemastered/Mods`. On this build the folder is `Documents/CnCRemastered/Mods`.
- **`game_type` is RA or TD.** Every installed Workshop mod surveyed here uses one of the two. **Unproven:** what
  any other value does.

## How it was verified

- **The field names, the version format and the folder names:** strings in `ClientG.exe` (`ccmod.json`, each
  field name, `%d.%d`, `Mods\Red_Alert`, `Mods\Tiberian_Dawn`), Vanilla Conquer's sample `ccmod.json` files and
  README, and a shipped mod's `ccmod.json`.
- **The local path:** the folders in a Proton prefix after launch, the path a working deploy script writes to,
  and the `Mods\Red_Alert` string in `ClientG.exe`. The doubled path in Vanilla Conquer's README exists nowhere in
  that prefix.
- **The Workshop layout and `game_type` values:** a survey of the `ccmod.json` files of every Workshop mod
  installed on one machine, a shipped mod's packaging script, and its publishing runbook.

> [!TIP]
> **In Tiberian Factions**
>
> TF's mod folder is `Vanilla_RA`, the name Vanilla Conquer's build gives it, and its Workshop upload is a folder
> holding `Vanilla_RA/`. TF maps its three-part versions onto the two integers as `version_low = minor * 10 +
> patch`, so 5.7.2 is `5` and `72` and shows as 5.72.
