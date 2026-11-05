---
title: HD-only mods
description: Most of this manual assumes HD graphics mode. A mod whose new art exists only in HD should switch off the classic-graphics option with one launcher constant.
tags: [getting-started, graphics, launcher, game-constants]
holds_for: Steam build 21590013
status: verified
unproven: []
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# HD-only mods: switching off classic graphics

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod adds art only in HD, which covers most mods that add new units, buildings, terrain or effects. The
Remastered Collection has two renderers. In HD mode the launcher draws the game from the HD tilesets and ZIPs. In
classic (legacy) mode the game's own 1990s shapes are drawn instead. A new object with only HD art has nothing to
draw in classic mode, so it shows up broken there. A mod that ships classic shapes for everything it adds, or
changes only rules and stats, can leave both modes on.

**This manual is written for HD mode.** Pages about art, tilesets, theatres and the launcher's drawing describe
what the HD renderer does.

## The switch

One launcher constant removes the classic option from the menu, along with the spacebar toggle in game. Ship it in
your mod's `Data/XML/GameConstants_Mod.xml`, which the launcher merges over the base `GameConstants.xml`:

```xml
<GameConstants>
    <GameConstantsClass>
        <CNCDisableLegacyGraphicsOption network="client"> True </CNCDisableLegacyGraphicsOption>
    </GameConstantsClass>
</GameConstants>
```

The base game's `GameConstants.xml` (in `CONFIG.MEG`) defines the same constant, set to `False`.

## How it was verified

- The constant and its default appear in the stock `GameConstants.xml` in `CONFIG.MEG`.
- A shipped mod sets it to `True` this way. In play, the classic option and the spacebar toggle are gone.
- DontCryJustDie gave the same setting independently, for his own mod.

**Credit:** DontCryJustDie pointed out the setting.

> [!TIP]
> **In Tiberian Factions**
>
> TF is HD only. Its Tiberian Dawn and Tiberian Sun content has no classic art, so TF switches the classic option
> off in the same file that adds its TD theatre slots.
