---
title: HD-only mods
description: Most of this manual assumes HD graphics mode. A mod whose new art exists only in HD should switch off the classic-graphics option with one launcher constant, and why bringing TD's classic art into Red Alert is a trap.
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

## Porting TD's classic art: why not support classic mode as well?

> [!CAUTION]
> **Bringing Tiberian Dawn's own classic art into Red Alert is far more work than it looks.** Shipping TD's classic
> shapes is the easy part. Each problem below has a fix, but there are many of them, and every new TD object
> raises them again. If your mod ports TD content and classic mode doesn't matter to your players, go HD-only.

This applies to porting TD's shapes. If you draw your own classic art for Red Alert's palette, with house colours
at indices 80 to 95, the palette problems below don't arise. You still need a classic shape for every object you
add, and the last three points (shared shapes, HD-only art, and the DLL not knowing the mode) still apply.

- **TD's shapes use TD's palette.** A classic shape stores palette indices, not colours, and Red Alert draws every
  classic shape through its own palette. A TD shape drawn as it is comes out in the wrong colours.
- **TD's house colours never follow the player.** TD's house-colour pixels are indices 176 to 191. Red Alert
  recolours only 80 to 95: the 16 indices in row 0 of its `PALETTE.CPS`. So a TD unit keeps one colour whoever
  owns it. The fix is to rewrite every frame of every TD shape offline. Move 176–191 onto 80–95 position for
  position, and map every other index to the nearest Red Alert colour, never to 0 or 80–95.
- **Colours in the code are TD's indices too.** TD's code draws some colours by palette index. The Obelisk's
  beam is index `0x7D`, which is red in TD's palette and green in Red Alert's. Each one has to be changed to the
  nearest Red Alert index. The DLL's lines go through Red Alert's palette in both modes, so one change fixes HD as
  well.
- **Some classic shapes are shared.** Red Alert loads a few shapes once and draws them for every building of a
  kind. The war factory's roof and door layer (`WEAP2.SHP`, in `BuildingTypeClass::WarFactoryOverlay`) is drawn
  over any war factory, so in classic mode a TD war factory wears Red Alert's roof. Each one needs a shape of its
  own, chosen by building type.
- **HD-only art has no classic shape.** An object whose art exists only in HD has nothing to draw in classic mode.
  If it borrows another object's shape to keep the engine happy, it draws that shape instead.
- **The DLL can't tell which mode is on screen.** The launcher asks the DLL for the classic page
  (`CNC_Get_Visible_Page`) every frame, whichever mode is showing. That was observed in play, not read from code. The spacebar toggle never reaches the DLL either: `Get_Input_Key_State` answers only
  for Ctrl, Shift and Alt. So a mod can't warn players who switch to classic mode, or switch them back. Locking the
  mode out is the only clean answer.

## How it was verified

- The constant and its default appear in the stock `GameConstants.xml` in `CONFIG.MEG`.
- A shipped mod sets it to `True` this way. In play, the classic option and the spacebar toggle are gone.
- DontCryJustDie gave the same setting independently, for his own mod.
- The classic-mode problems: the palette ranges in EA's TD source (the house-colour remap tables change exactly
  176–191) and in Red Alert's own `PALETTE.CPS` (row 0 is 80–95, read from the base game). The Obelisk beam index,
  the shared `WEAP2.SHP` overlay and the input handler are all in EA's source. Each problem was also hit in a working
  mod, and another TD-in-RA mod's changelog lists the same colour and laser problems.

**Credit:** DontCryJustDie pointed out the setting.

> [!TIP]
> **In Tiberian Factions**
>
> TF supported classic mode at first. It remapped every TD shape's palette at build time, fixed the Obelisk's beam
> colour, and gave the TD war factory its own overlay. That worked, but every new TD object needed the same work
> again. Once TD's terrain and Tiberian Sun's units arrived with no classic art at all, TF went HD-only. It now
> switches the classic option off in the same file that adds its TD theatre slots.
