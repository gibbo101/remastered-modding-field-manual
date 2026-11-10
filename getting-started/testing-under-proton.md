---
title: Testing under Proton and on the Steam Deck
description: Run a Remastered mod build under Proton on Linux or a Steam Deck by copying the mod folder into the game's Proton prefix, synced by checksum rather than by size and time, with the game closed. A DLL's logs go under USERPROFILE; with no one at the screen, the placement grid follows only relative pointer motion and sound is checked by matched filter.
tags: [getting-started, testing, proton, steam-deck, linux, rsync]
holds_for: Steam build 21590013
status: verified
unproven: [where the game saves screenshots on every setup (observed on the Steam Deck only), the headless pointer and sound findings on other setups (one run)]
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

## Your DLL's own logs

Build a log file's path from `getenv("USERPROFILE")`, never a written-out `C:/users/steamuser/...`. Under Proton
`USERPROFILE` is `C:\users\steamuser`, so a hard-coded path works there and nowhere else: on Windows or another
Wine prefix the `fopen` fails silently and the log never appears. Add `\Documents\CnCRemastered\`, the game's own
documents folder, which exists wherever the game has run. A log opened at `USERPROFILE` itself lands one folder
up, in the prefix's `users/steamuser/`, so look there too.

## Testing with no one at the screen

A game can be driven with no monitor, under Xvfb with `xdotool` and screenshots. Two things were found that way,
in one setup (**unproven** elsewhere):

- **The building-placement grid follows only relative pointer motion.** `xdotool mousemove` works for the HUD and
  for orders, but doesn't move the placement grid. Steer it with `xdotool mousemove_relative`, and take a
  screenshot to check the grid before clicking.
- **Sound can be checked without listening.** Record the audio sink's monitor (`pw-record`), and correlate the
  recording against the sound files you expect (a matched filter). Lines that played scored 0.5 to 0.9 normalised;
  lines that never played stayed at 0.24 or below.

## How it was verified

- **The prefix path:** a Proton prefix on a Linux desktop, the target Tiberian Factions' deploy script writes to on both
  a desktop and a Steam Deck, and the `Mods\Red_Alert` folder name in `ClientG.exe`.
- **Sync by checksum:** rsync's manual (its default "quick check" compares size and modification time only), a
  deploy script that uses `-ac --delete`, and a case where rebuilt sound files matched the old ones in size and
  time but not in content, so plain `-a` skipped them.
- **Reading files at launch:** the DLL's load at start-up, the mods screen's restart to apply a change, and a UI
  atlas edit that showed only after a relaunch.
- **Crash records:** TF's runbook, and `log/CrashLog.txt` in an install, whose lines name the crashing
  process.
- **Log paths:** the prefix's `user.reg`, whose documents folder is `%USERPROFILE%\Documents` and
  `C:\users\steamuser\Documents`; TF's logging code, which opens its files under `getenv("USERPROFILE")`
  plus `/Documents/CnCRemastered/`, and its porting notes; and TF's logs in a prefix, under
  `Documents/CnCRemastered/`, with the one log opened at `USERPROFILE` itself in `users/steamuser/`.
- **Testing with no one at the screen:** one headless run of TF, recorded in its design notes and its
  session notes. **Unproven:** whether the pointer behaviour and the scores hold on other setups.

> [!TIP]
> **In Tiberian Factions**
>
> TF is built on a Linux desktop and played on a Steam Deck. Its deploy script builds, then refuses to sync while
> the game is running on the target, or when a gitignored file the build needs is missing or stale. It backs up
> what it will replace, mirrors with `rsync -ac --delete`, and checks the copy by checksum afterwards. The same
> script deploys to the desktop's own prefix for a quick local test.
