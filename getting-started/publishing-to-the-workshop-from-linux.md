---
title: Publishing to the Workshop from Linux
description: Upload a Remastered mod to the Steam Workshop from Linux with a small SteamUGC tool, using the same manifest fields as EA's own uploader; restart Steam first, keep the description under 8000 characters, upload real folders.
tags: [getting-started, workshop, steam, publishing, linux]
holds_for: Steam build 21590013
status: verified
unproven: [why a long-running Steam client makes the upload hang]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Publishing to the Workshop from Linux

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When you're ready to share your mod and you work on Linux. The Remastered Collection's Workshop (app 1213210)
takes uploads through Steam's own SteamUGC interface, which any small tool can call. No Windows machine or Wine is
needed. If you publish from Windows with EA's tools, most of this still applies: the manifest, the layout and the
traps are the same.

## The tool

[steam-workshop-uploader](https://github.com/gibbo101/steam-workshop-uploader) is a Linux-native command-line
publisher (C#, .NET 8, Steamworks.NET), written for this game and usable for any Steam app. It reads a
`workshop.json` manifest in the same format as EA's own `.workshop.json`, then calls the same SteamUGC setters in
the same order as EA's map editor: content, preview, language, title, description, visibility, tags. It needs a
running, logged-in Steam client that owns the game.

```bash
dotnet run -- workshop.json "v1.2.0: what changed"
```

The second argument is the change note, which isn't stored in the manifest. On a first publish (empty
`publishedfileid`) the tool creates the item and writes the new ID back into the manifest.

## The manifest

| Field | Notes |
|---|---|
| `publishedfileid` | Empty for a new item; the item's ID afterwards. |
| `contentfolder` | The folder that **holds** your mod folder (see the layout trap). |
| `previewfile` | A JPG or PNG under 1 MB. |
| `visibility` | `0` public, `1` friends only, `2` private, `3` unlisted. |
| `title`, `description` | The description takes Steam BBCode. |
| `tags` | The game's mods use `RedAlertMod` or `TiberianDawnMod`, some with `RA` or `TD`. |

Start a new item as private, subscribe to it yourself, check it installs and runs, then make it public from the
item's page.

## Traps

- **Restart Steam before every publish.** If the Steam client has been running a while, the upload hangs at
  "preparing config" with no error: Steam logs that the upload started, then nothing happens. Fully exit Steam
  (menu → Exit, not just closing the window), wait a few seconds, start it again, then publish. The tool gives
  up after 60 seconds with no progress. **Unproven:** why this happens.
- **Upload a named subfolder.** Point `contentfolder` at a folder that *contains* your mod folder, so subscribers
  get `<item id>/<mod folder>/ccmod.json`. See
  [The mod folder and ccmod.json](the-mod-folder-and-ccmod-json.md).
- **Upload real files, not symlinks.** SteamUGC uploads a symlink as a symlink, and a subscriber's install then
  points at a path that doesn't exist on their machine. Copy the mod into the upload folder.
- **The description is capped at 8000 characters.** Go over and the content and preview upload, then the commit
  fails with `k_EResultInvalidParam` (8), naming no field. Steam rejects the whole update rather than cutting the
  text, so check the length before you publish.
- **Accept the Workshop agreement.** If the result says you must accept the Workshop legal agreement, open the
  item's page in a browser while logged in, accept it, and publish again.
- **Follow EA's modding guidelines.** EA's disclaimer goes at the top of the description, and nothing uploaded may
  hold C&C music.

## How it was verified

- **The manifest and setters:** EA's map editor source (`SteamworksUGC.cs` calls the setters in this order), the
  tool's source and README, and the `.workshop.json` files of installed Workshop mods (their tags).
- **The limits:** `k_cchPublishedDocumentDescriptionMax = 8000` and the visibility enum in the Steamworks.NET
  copy bundled with EA's source, and a real publish that failed at 8660 characters. Steamworks' newer enum adds
  `3` for unlisted.
- **The restart:** a shipped mod's runbook, the tool's 60-second watchdog in its source, and an earlier report of
  the same hang from other C&C Remastered modders.
- **The layout:** a survey of every Workshop mod installed on one machine (each has the named subfolder).
- Observed once, in a real publish: a symlinked mod folder broke installs.

> [!TIP]
> **In Tiberian Factions**
>
> TF and its asset packs are all published with this tool from Linux. TF's packaging script builds the release DLL,
> strips it, stages the mod folder as a real copy, and checks the folder against EA's guidelines before anything
> is uploaded. A new pack goes up private, gets a self-test on the Steam Deck, and is made public afterwards.
