---
title: Open questions
description: Research that hasn't been proven in game yet. For each question, what's established, what's untested, the test that would settle it, and the Tiberian Factions design doc that holds the full context.
tags: [research, open-questions]
holds_for: Steam build 21590013
status: research
unproven: [every "Untested" line on this page]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Open questions

## When you need this

When you're about to try something this manual doesn't cover as a proven technique. Check here first: someone may
already have established part of the answer, or found a wall. If your work settles one of these, it can become a
proven page.

> [!CAUTION]
> **Nothing on this page is a recipe.** The "Established" lines are verified facts, most of them with a proven page
> of their own, linked. Everything else is untested. Smaller unproven points sit on each page, in its frontmatter's
> `unproven` list.

The full context for each question is a design or research doc in Tiberian Factions' repository, linked from the
entry. Those docs record where the work stands, what was tried, and what failed.

## Scripted co-op missions

Two humans playing a mission with a pre-placed enemy, triggers, a briefing and scripted objectives.

- **Established:** co-op skirmish (humans on one team against AIs) works today: the DLL allies players who share a
  lobby team (`GlyphX_Assign_Houses`), and the game ends when every house left is allied (`MPlayer_Defeated`). The
  launcher's own co-op campaign is code with no screen or data: `ClientG.exe` has the classes and a
  `Host_Coop_Campaign_Lobby` path, but every faction's `<CoopCampaignType>` in `FACTIONS.XML` is empty and no screen
  file ships. A mod's multiplayer is LAN only (see [LAN games](engine/lan-games.md)). Red Alert lets a map's
  triggers win or lose the game only in single player (`Session.Type == GAME_NORMAL` in `HouseClass::AI`).
- **Untested:** whether opening those gates for a flagged map makes a scripted win fire in a LAN game; how a win
  reaches both humans, since the win action compares with `PlayerPtr`, which switches between players; whether a
  scenario house that isn't a lobby slot plays at all.
- **The test:** one map with a single scripted win (a timer or one building to destroy), the gates opened for that
  map, and two people in a LAN game.
- **Full context:** TF's [co-op missions design](https://github.com/gibbo101/cnc-ra-tiberian-factions/blob/main/docs/coop-missions-design.md).

## Letting players change the rules

A rules file in the player's Documents folder, read by the DLL, so players can tune values without editing the mod.

- **Established (read from EA's source):** every scenario load applies `rules.ini`, `aftrmath.ini`, the map, then
  `MPLAYER.INI` (only with the lobby's Aftermath units on), then `Fill_In_Data`, so a player pass belongs after
  `MPLAYER.INI`, and again in `Load_Game`. `Read_INI` keeps every key a file doesn't name. In a LAN game only the
  host simulates, so the host's file is everyone's rules (see [LAN games](engine/lan-games.md)). The traps:
  `Verses` resets to 100% when a section omits it; a key set only by the player's file leaks into the next match;
  weapons and warheads are shared between units.
- **Untested:** a player pass built and played; the `Verses` reset seen in play.
- **The test:** a pass that sets only `Spread` on one warhead, then that warhead's damage against each armour type.
- **Full context:** TF's [rules editor design](https://github.com/gibbo101/cnc-ra-tiberian-factions/blob/main/docs/game-rules.md).

## Tiberian Sun theatres

Tiberian Sun's terrain as Red Alert theatres, with TS's own multiplayer maps converted onto them.

- **Established:** a new theatre's slot and DLL steps work (proven with TD's three, see
  [Adding a theatre of your own](maps-and-lobby/custom-theatres.md)), and new terrain template names crash the
  launcher, so new terrain has to be drawn under existing names. TS's cells are squares like Red Alert's, seen
  through a rotated camera, so a TS map can be laid on Red Alert's grid: a converter does it, and its shortest routes
  between starts come out at 0.93 to 1.04 times TS's own.
- **Untested:** a converted map played as a theatre; TS's art drawn under existing template names.
- **The test:** one converted map, drawn under a reskinned stock tileset's names, played end to end.
- **Full context:** TF's [Tiberian Sun theatres design](https://github.com/gibbo101/cnc-ra-tiberian-factions/blob/ts-theatres/docs/ts-theatres.md)
  (on the `ts-theatres` branch).

## Music built from the player's own copy

EA's guidelines bar music from C&C games in a mod, so the tracks would be converted on the player's machine.

- **Established:** the target format is proven: converted Tiberian Sun scores play as MS-ADPCM WAVs (see
  [Music by faction, and the jukebox](sound-and-music/music-by-faction-and-the-jukebox.md)). Tiberian Sun's scores
  are `<section>.AUD` files in `SCORES.MIX`, Westwood IMA ADPCM at 22,050 Hz mono.
- **Untested:** an importer that runs on the player's machine; whether EA's guidelines accept a mod that builds C&C
  music this way; where each store installs Tiberian Sun.
- **The test:** a reread of the guidelines first, then one track converted by the DLL inside the launcher.
- **Full context:** TF's [Tiberian Sun music import design](https://github.com/gibbo101/cnc-ra-tiberian-factions/blob/main/docs/ts-music-import.md).

## Whether a terrain tileset costs video memory whole

- **Established and untested:** see "What's open: video memory" on
  [Adding a theatre of your own](maps-and-lobby/custom-theatres.md), which also describes the test.

## Which mod's loose file wins

- **Established:** when two enabled mods ship the same loose file, the launcher reads one of them, not a merge (see
  [Overriding the launcher's data](launcher-data/overriding-launcher-data.md)).
- **Untested:** which one. `load_order` may or may not decide it.
- **The test:** two mods, each shipping a different copy of the same small loose file (one string in a text file
  is enough), swapped between `load_order` values.

## Theatre slots past 5

- **Established:** six slots (0 to 5) work. Nothing found so far caps the list.
- **Untested:** a seventh slot. See [Adding a theatre of your own](maps-and-lobby/custom-theatres.md).

## Building placement on a 253×253 map

- **Established:** a 253×253 skirmish loads and plays (see [Bigger maps](maps-and-lobby/bigger-maps.md)).
- **Observed once:** in one headless run on a development build, the player's construction yard deployed but no
  building could be placed: the cameo read Ready, and no placement footprint appeared.
- **Untested:** whether that happens outside that run, and why.
- **The test:** place a building on the same map on another machine.

## How it was verified

Each "Established" line rests on the proven page it links to, or on the sources named in the linked TF doc: EA's
released source, the game's files, and `ClientG.exe` on disk. Nothing else on this page has been verified.

> [!TIP]
> **In Tiberian Factions**
>
> Each question here is open work in TF, and each linked doc is where TF tracks it. When one is settled, its
> proven part becomes a page here and the entry shrinks to a link.
