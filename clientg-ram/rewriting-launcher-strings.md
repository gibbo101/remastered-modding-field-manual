---
title: Rewriting launcher strings in memory
description: When ClientG builds a name in code from a fixed string (the sidebar tab icons' per-game prefix), rewrite that string in the running launcher's image, in place and never longer; leave the old tail behind the terminator so a patched string can be found again and told from a genuine one.
tags: [clientg, ram-patch, strings, sidebar, advanced]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
clientg_sha256: d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897
status: verified
unproven: []
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Rewriting launcher strings in memory

## When you need this

When the launcher picks art or data by a name it **builds in its own code**, and you need it to pick something
else. Most names the launcher uses come from data (the `.bui` scenes, the XML), so change the data first. A name
built in code is the exception: no data file reaches it. The example here is the sidebar's tab icons, which kept
showing Red Alert's art on TD's sidebar scene after every other piece had switched. If what you want to change is
named in data, you don't need this page.

> [!WARNING]
> **Fragile: this rewrites read-only data in the running launcher.**
>
> - **Verified against:** `ClientG.exe` version 1.153 (745903), SHA-256
>   `d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897` (Steam build 21590013).
> - **What it depends on:** the strings existing in ClientG's image with exactly this text, and the launcher
>   reading them each time it builds a name rather than caching the result.
> - **How it fails if the client changes:** done as below, the search finds no string matching the whole text,
>   writes nothing, and the stock art draws.
> - **Rules:** match the whole string, terminator included. Never write a longer string than the one you replace.
>   Search only the executable's image. Restore the original when it no longer applies.
> - **Keep it cosmetic.** It changes only what one launcher draws, so it can't desync a LAN game.

**Holds for:** the client in the box above. EA has stopped patching the game and archived the source in January
2025, so the build should stay put, but check the hash before relying on it.

## The example: sidebar tab icons

The four build tabs (structures, infantry, vehicles, superweapons) draw atlas regions whose names the launcher
builds in code: a per-game prefix with the tab's state appended (`..._OFF` and so on). Both games' prefixes sit in
`ClientG.exe`'s read-only data:

| TD's prefix | Red Alert's prefix |
|---|---|
| `UI_Sidebar_TabIcon_Structure_` (`0x1C216F0`) | `UI_RA_Sidebar_TabIcon_Structure_` (`0x1C2176C`) |
| `UI_Sidebar_TabIcon_Infantry_` (`0x1C21710`) | `UI_RA_Sidebar_TabIcon_Infantry_` (`0x1C21790`) |
| `UI_Sidebar_TabIcon_Vehicles_` (`0x1C21730`) | `UI_RA_Sidebar_TabIcon_Vehicles_` (`0x1C217B0`) |
| `UI_Sidebar_TabIcon_Supers_` (`0x1C21750`) | `UI_RA_Sidebar_TabIcon_Supers_` (`0x1C217D0`) |

Red Alert always uses its own prefix, whichever HUD scene is showing. So a faction on TD's scene got TD's sidebar
with Red Alert's tab icons, squashed into TD's smaller tabs. Rewriting the four Red Alert strings to TD's makes
every tab state come out with TD's names.

## The method

1. **Find the strings.** Scan the launcher's image regions (`MEM_IMAGE`) for each string, matching the whole
   text plus its terminator. Search every time: the addresses are fixed in this build, but searching costs
   little, and a changed client then fails safe.
2. **Unprotect, write, reprotect.** The strings are in `.rdata`, which is read-only. `VirtualProtect` (or
   `VirtualProtectEx` from another process) to `PAGE_READWRITE`, write the new string with its terminator, and
   restore the old protection.
3. **Only ever shorter or equal.** TD's prefix is three characters shorter than Red Alert's, so it fits inside it.
   A longer string would overwrite whatever follows in `.rdata`.
4. **Write it back** when it stops applying, for example for a player on a Red Alert side in the next match.

## Telling a patched string from a genuine one

After a write, the slot is still 33 bytes. It holds TD's 29-character string and its terminator, then the last
two characters of Red Alert's string and Red Alert's own terminator. For the structures tab:

```
UI_Sidebar_TabIcon_Structure_ \0 e_ \0
```

Leave that tail there. It's what makes the patched slot findable again: it matches neither string alone, so look
for either the original Red Alert string or this exact patched form, at the full original length. Never search for
the bare TD string. That finds TD's genuine prefix a few bytes away, and overwriting it would break TD's own tabs.

## Two routes that didn't work

- **Re-pointing the drawn records** (as on [Re-pointing launcher UI art in memory](repointing-atlas-regions.md))
  works for the moment it runs. But each tab state's record is only created when that state first draws (first
  hover, first "ready", placement), so each state shows the wrong art until the next heap scan. Scanning often
  enough to hide that slows the game.
- **Patching the atlas lookup table** fixes records made afterwards, but still misses states created before the
  patch, and needs the same heap scan.

Changing the name at its source is cheaper than chasing everything made from it. **Before patching records,
search `ClientG.exe`'s strings for the name family.**

## How it was verified

- **The strings and their places:** read from `ClientG.exe` on disk. All eight prefixes are in `.rdata`, a
  read-only section, at the addresses above. Both prefixes' tab regions are in the stock atlas map
  (`MT_COMMANDBAR_COMMON.MTD`).
- **The method:** a shipped mod rewrites the four prefixes at each match start, and was checked both ways in one
  launch: TD's tab art in every state on TD's scene, including placement, and Red Alert's art back again for an
  Allied player. Its doc records the two failed routes.
- **LAN:** each player's launcher runs the rewrite for itself. See
  [Patching the launcher's code from your DLL](patching-the-launchers-code.md).

> [!TIP]
> **In Tiberian Factions**
>
> GDI, Nod and Tiberian Sun's GDI play on TD's sidebar scene. At each match start TF rewrites the four tab
> prefixes to TD's for those factions and back to Red Alert's for Allied and Soviet players, in the same pass that
> sets the radar crest.
>
> <!-- screenshot: a GDI player's TD sidebar with TD's green tab icons -->
