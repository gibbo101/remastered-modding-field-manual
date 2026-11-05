---
title: Porting Tiberian Dawn units
description: The lessons for bringing Tiberian Dawn's units into Red Alert's engine, now that their HD art comes from the base game. Reading TD's constructors, converting speed exactly, filling the geometry Red Alert needs, renamed animations, the shared cloak and sensor system, and the special cases (dual weapons, flame jets, wheels, transports, stealth).
tags: [units, tiberian-dawn, porting, dll, rules-ini]
holds_for: Steam build 21590013
status: verified
unproven: []
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Porting Tiberian Dawn units

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your Red Alert mod brings a Tiberian Dawn unit across with its TD behaviour: its stats, weapons, speed and
quirks. The art is the easy part. TD's HD art is in the base game, and
[TD art from the base game](../using-what-the-player-owns/td-art-from-the-base-game.md) draws it without shipping
it. This page is the rest. The steps for any new unit are on [Adding a unit](adding-a-unit.md).

## Read TD's own source first

Both games' source is released. A TD unit's facts are in TD's code, not in a wiki:

- **`TIBERIANDAWN/UDATA.CPP`**: the `UnitTypeClass` constructor, with strength, armor, speed, turret, crusher and
  the rest. TD sets in its constructor what Red Alert moved into `rules.ini`, such as build level, prerequisite and
  owner.
- **`TIBERIANDAWN/CONST.CPP`**: its weapons and warheads.
- **`TIBERIANDAWN/BBDATA.CPP`** and **`ADATA.CPP`**: its projectiles and animations.

Then follow each weapon down its chain (weapon → projectile → warhead → impact animation), and reuse anything an
earlier port already brought across.

## Speed: `Speed = round(MPH × 100 / 256)`

Red Alert reads `Speed=` as a percentage and scales it up to its internal 0–255 value
(`MaxSpeed = MPHType(_Scale_To_256(Speed))`). TD's `MPHType` values use the same 0–255 scale (`MPH_MEDIUM` is 18 in
both games). So a TD unit's `rules.ini` speed is:

```
Speed = round(TD's MPH value × 100 / 256)       # MPH_FAST (40) → Speed=16
```

Don't copy the speed of Red Alert's nearest equivalent, and don't halve TD's value (halving runs about 28% fast).

**Tracks or wheels too.** TD's constructor gives each unit a locomotion type, `SPEED_TRACK` or `SPEED_WHEEL`. In
Red Alert that's `Tracked=yes` or not. Stock `rules.ini` moves tracks at 80% on clear ground and 70% on rough, and
wheels at 60% and 40%. So a TD tank left wheeled crawls off-road. Tracked also decides whether a turretless unit
turns to aim: see [Turrets](turrets.md).

## Fill in what Red Alert needs and TD never had

Red Alert's `UnitTypeClass` constructor has geometry TD's lacks: a vertical offset, and offsets and lateral offsets
for each weapon, all in leptons. TD placed its muzzle flashes differently. Start from a Red Alert unit of the same
size, then tune against TD's art in game, by screenshot.

## Traps

- **An animation's data name isn't its enum name.** TD's `ANIM_FRAG2` loads the shapes named `"FRAG3"`
  (`TIBERIANDAWN/ADATA.CPP`). Port the shapes the constructor names, not the enum's name.
- **Text IDs don't carry over.** TD's text IDs, such as `TXT_STANK` (in TD's `CONQUER.H`), don't exist in Red
  Alert's DLL. Use any Red Alert ID as a placeholder in the constructor, and give the real name with `Name=` in
  `rules.ini` and with the launcher's text.
- **Some animations and sounds aren't in Red Alert at all.** A distinctive one (TD's medium-tank death
  explosion) is worth porting. Generic ones (muzzle flash, small hits) can use Red Alert's.
- **The crew that climbs out is Red Alert's.** A destroyed vehicle's survivor comes from `Crew_Type`, which gives
  Red Alert's rifleman (`INFANTRY_E1`). Add a case for your TD units, or a GDI tank's crew climbs out as Red Alert's
  rifleman.

## Cloak and stealth detection: one system in both games

Red Alert inherited TD's cloak system almost unchanged. Both games have the same `CloakType` states (uncloaked,
cloaking, cloaked, uncloaking), and both reveal a cloaked unit the same way. In each game's `FOOT.CPP`, a cloaked
unit that moves next to an enemy whose type is a scanner shimmers into view. In Red Alert, `rules.ini`'s
`Sensors=yes` makes a type a scanner, so stealth detection is pure data.

- **In TD, only defences detect.** Only TD's buildings take a scanner flag. Infantry and vehicles can't reveal a
  stealth tank there. Red Alert can make any type a scanner, if you want active stealth hunters.
- **The cloak sound differs.** TD's units cloak with `VOC_CLOAK`. Red Alert's play `VOC_IRON1`, the Iron Curtain's
  sound. A TD cloaker needs its own sound routed.

## Special cases, at method level

- **Two weapons, one anti-air.** `Primary=` and `Secondary=` in `rules.ini`, with separate offsets in the
  constructor. If the secondary's projectile can hit aircraft, the unit uses it on aircraft, with no unit-level
  flag. Model the offsets on Red Alert's Mammoth tank.
- **"Fires two shots in quick succession."** TD's constructor flag has no Red Alert equivalent. Use `Burst=2` on
  the weapon instead.
- **A building prerequisite Red Alert doesn't have.** Satisfying a TD building's role, such as a repair bay, can
  take a per-type remap in the DLL's build check.
- **Flame jets** are animation-driven: the jet is an animation attached to the firer, not a projectile. TD's flame
  shapes exist only as HD art, so the animation needs another animation's `ImageData`, or it draws a green
  placeholder.
- **Wheeled light units** keep TD's wheels, can't crush infantry, and have zero weapon offsets.
- **Stealth units** need their own weapon when they share a base weapon with another unit, so that one unit's
  changes don't move the other's.

## How it was verified

- **Both games' source:** TD's and Red Alert's `UnitTypeClass` constructors (`UDATA.CPP`), the speed reading in Red
  Alert's `TECHNO.CPP` (`_Scale_To_256`) and both games' `MPH_*` values (`DEFINES.H`), `Tracked=` (`UDATA.CPP`),
  TD's `"FRAG3"` (`ADATA.CPP`), `TXT_STANK` (TD's `CONQUER.H`, absent from Red Alert), `CloakType` and the scanner
  check in both games' `FOOT.CPP`, `Sensors=` (`TECHNO.CPP`), and `VOC_CLOAK` against `VOC_IRON1`
  (`TECHNO.CPP`). Burst is Red Alert's `WEAPON.CPP`.
- **The game's files:** stock `rules.ini`'s track and wheel speeds.
- **A working mod:** every TD vehicle ported this way, and each trap above hit and fixed in play.

> [!TIP]
> **In Tiberian Factions**
>
> TF ports all of TD's GDI and Nod vehicles this way. Their behaviour comes from TD's source and their art from the
> base game. TF's GDI and Nod defences carry `Sensors=yes`, matching TD's detectors. Allied and Soviet defences
> already had it in stock Red Alert.
