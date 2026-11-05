---
title: Testing under Proton and on the Steam Deck
description: Run a Remastered mod build under Proton on Linux or a Steam Deck by copying the mod folder into the game's Proton prefix, synced by checksum rather than by size and time, with the game closed.
tags: [getting-started, testing, proton, steam-deck, linux, rsync]
holds_for: Steam build 21590013
status: verified
unproven: [where the game saves screenshots on every setup (observed on the Steam Deck only)]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Testing under Proton and on the Steam Deck

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When you build on Linux and want to play your build without a Windows machine. The Remastered Collection runs
under Steam's Proton on a Linux desktop and on the Steam Deck. A mod copied into the game's Proton prefix loads
there exactly as it would on Windows.

## Where the mod goes

Each machine has the game's prefix under its Steam library, and local mods go in its documents folder:

```
<Steam library>/steamapps/compatdata/1213210/pfx/drive_c/users/steamuser/Documents/CnCRemastered/Mods/Red_Alert/<mod folder>/
```

`1213210` is the Remastered Collection's Steam app ID. The prefix exists once the game has been launched there,
so let the launcher create it rather than making the folders yourself. What belongs in the folder is on
[The mod folder and ccmod.json](the-mod-folder-and-ccmod-json.md). To reach a Deck from your desktop, copy over SSH.

## Sync by checksum

Mirror the build's mod folder into the prefix with rsync, comparing file contents:

```bash
rsync -ac --delete build/remaster/Vanilla_RA/ "<prefix>/.../Mods/Red_Alert/Vanilla_RA/"
```

- **`-c` is the important flag.** By default rsync skips any file whose size and modification time match. A
  rebuilt file can match the old one in both and still differ in content, and rsync then leaves the stale copy in
  place. You end up testing old bits without knowing it. With `-c` it compares checksums instead.
- **`--delete` removes what the build no longer has**, so a renamed or deleted file doesn't linger in the test
  copy. Run with `-n` (dry run) first to see what it would delete.
- **Check afterwards.** A second `rsync -acn` that lists nothing proves the copy matches the build.

## Close the game first

The launcher reads many of a mod's files only when it starts. It loads the DLL at start-up, and some files, such as
the UI atlas, are read once per launch. A copy made into a running game may not be what you end up testing.
Exit to the desktop, sync, then start the game.

## Screenshots

Steam's screenshot key works in game. On the Steam Deck the files land in Steam's screenshot store for the game:

```
<Steam root>/userdata/<account>/760/remote/1213210/screenshots/
```

Pulling the newest file from there over SSH is a quick way to see what the tester sees. Observed on the Deck;
check the path on your own setup.

## Crash records

The game writes `log/CrashLog.txt` in its install folder, a line per crash naming the process that crashed:
`ClientG.exe` (the launcher, which draws the game) or `InstanceServerG.exe` (the simulation, which runs your DLL).
Each line also gives the client version and the faulting address (`EIP`). The same `log/` folder holds the
launcher's other logs.

## How it was verified

- **The prefix path:** a Proton prefix on a Linux desktop, the target a working deploy script writes to on both
  a desktop and a Steam Deck, and the `Mods\Red_Alert` folder name in `ClientG.exe`.
- **Sync by checksum:** rsync's manual (its default "quick check" compares size and modification time only), a
  deploy script that uses `-ac --delete`, and a case where rebuilt sound files matched the old ones in size and
  time but not in content, so plain `-a` skipped them.
- **Reading files at launch:** the DLL's load at start-up, the mods screen's restart to apply a change, and a UI
  atlas edit that showed only after a relaunch.
- **Crash records:** a shipped mod's runbook, and `log/CrashLog.txt` in an install, whose lines name the crashing
  process.

> [!TIP]
> **In Tiberian Factions**
>
> TF is built on a Linux desktop and played on a Steam Deck. Its deploy script builds, then refuses to sync while
> the game is running on the target, or when a gitignored file the build needs is missing or stale. It backs up
> what it will replace, mirrors with `rsync -ac --delete`, and checks the copy by checksum afterwards. The same
> script deploys to the desktop's own prefix for a quick local test.
