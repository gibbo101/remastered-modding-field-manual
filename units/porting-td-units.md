---
title: Porting Tiberian Dawn units
description: The lessons for bringing Tiberian Dawn's units into Red Alert's engine, now that their HD art comes from the base game. Reading TD's constructors (and the branch that compiles), converting unit and projectile speed exactly, filling the geometry Red Alert needs, rate of fire, homing, scatter and Points=, renamed animations, the shared cloak and sensor system, the special cases (dual weapons, flame jets, wheels, transports, stealth), and infantry's animation tables and C4.
tags: [units, tiberian-dawn, porting, dll, rules-ini]
holds_for: Steam build 21590013
status: verified
unproven: [the re-cloak wait and the damaged-cloaker chances (read from code in both games, not timed in play)]
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

**Read the branch the game compiles.** TD's source keeps some values under `#ifdef ADVANCED`, and `ADVANCED` is
commented out (`//#define ADVANCED` in TD's `DEFINES.H`). The `#else` value is the one TD shipped: the Recon Bike's
strength is 160, not the 90 above it in `UDATA.CPP`.

## Speed: `Speed = round(MPH × 100 / 256)`

Red Alert reads `Speed=` as a percentage and scales it up to its internal 0–255 value
(`MaxSpeed = MPHType(_Scale_To_256(Speed))`). TD's `MPHType` values use the same 0–255 scale (`MPH_MEDIUM` is 18 in
both games). So a TD unit's `rules.ini` speed is:

```
Speed = round(TD's MPH value × 100 / 256)       # MPH_FAST (40) → Speed=16
```

Don't copy the speed of Red Alert's nearest equivalent, and don't halve TD's value (halving runs about 28% fast).

**Projectile speed too.** TD gives the speed to the projectile (`BBDATA.CPP`). Red Alert reads it from the
weapon's `Speed=`, through the same percentage (`Get_MPHType` in `WEAPON.CPP`); a `rules.ini` projectile has no
speed key. Convert it the same way. Written raw, TD's missile speed of 60 (`MPH_ROCKET`) is read as 60% and flies
at 153 instead of 60: a proximity-fused missile then overshoots its target before it arms.

**Tracks or wheels too.** TD's constructor gives each unit a locomotion type, `SPEED_TRACK` or `SPEED_WHEEL`. In
Red Alert that's `Tracked=yes` or not. Stock `rules.ini` moves tracks at 80% on clear ground and 70% on rough, and
wheels at 60% and 40%. So a TD tank left wheeled crawls off-road. Tracked also decides whether a turretless unit
turns to aim: see [Turrets](turrets.md).

## Fill in what Red Alert needs and TD never had

Red Alert's `UnitTypeClass` constructor has geometry TD's lacks: a vertical offset, and offsets and lateral offsets
for each weapon, all in leptons. TD placed its muzzle flashes differently. Start from a Red Alert unit of the same
size, then tune against TD's art in game, by screenshot. For TD's Medium Tank, Red Alert's `2TNK` values (vertical
`0x0030`, primary `0x00C0`) put the flash on TD's barrel.

## Rate of fire, scatter and AI value

The same numbers don't give the same results in the two engines. Port these by meaning, not by value.

- **Rate of fire.** A unit with one shot per volley rearms in `ROF × bias` in Red Alert and `ROF × bias + 3` in TD
  (`TechnoClass::Rearm_Delay` in each game's `TECHNO.CPP`). A volley's first shot waits 3 ticks for the second in Red
  Alert and 9 in TD. So TD's `ROF` fires 3 ticks a shot faster under Red Alert's code; add the 3 to the weapon's
  `ROF=`, or add it in code for your ported weapons.
- **Homing.** TD has a homing flag on the projectile. Red Alert has no `Homing=` key: a projectile with any `ROT=`
  other than 0 homes, turning toward its target every other frame (`BULLET.CPP`).
- **Inaccurate shots scatter far less in Red Alert.** TD scatters a homing or arcing shot up to a third of the
  distance flown, capped at two cells (a grenade a quarter, capped at half a cell), and overshoots a straight one by
  up to a cell at any range. Red Alert scatters both by a sixteenth of the distance less a quarter cell, capped by
  `[General]` `HomingScatter` (arcing shots) and `BallisticScatter` (the rest). At five cells, a TD missile can land
  more than a cell and a half off; Red Alert's lands within a sixteenth of a cell. Port TD's scatter in code for
  weapons that should miss like TD's.
- **`Points=` is TD's reward.** TD's constructors take a risk and a reward (`80,62`), but TD ignores the risk and
  works it out from the weapon (`TechnoTypeClass` in TD's `TECHNO.CPP`). Red Alert's `Points=` sets both
  (`Risk = Reward = Points`). Use the second number.

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
- **`Cloakable=yes` is the whole unit.** A cloaker cloaks when idle, uncloaks to fire, and shimmers when hit or
  next to a scanner, with no code of your own. Red Alert waits before it re-cloaks, for `[General]` `SubmergeDelay`
  minutes (stock `.02`), the submarines' key, which every cloaker shares. Badly damaged cloakers cloak only now and
  then: in Red Alert, below `ConditionRed` there's a 4% chance a tick; in TD, below a quarter health, 1 in 26.

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
- **Transports.** `Passengers=` in `rules.ini` is the only switch: loading, the entry cursor and the player's
  unload order all follow from it. Four things are keyed on `UNIT_APC` in Red Alert's code, and a new transport
  needs adding to each: the unload state machine in `Mission_Unload` (without it, passengers never get out), the
  doors opening for passengers, the AI loading an idle transport, and the mechanic's force-move cursor. EA added
  Aftermath's Phase Transport to the same four places. An APC's art is 38 frames: 32 hull facings, then 6 door
  frames shown only while it faces north-east or north-west with the door open. It has no turret, and flagged as
  turreted it draws the door frames as one.

## Infantry

Infantry take `InfantryTypeClass` and two animation tables, `DoControls` for the classic shapes and
`DoControlsVirtual` for the HD art. Each row is a start frame, a frame count and a jump between facings.

- **The rows don't match TD's.** Red Alert's `DoType` has 21 actions; TD's has 34, in a different order (TD's
  `DEFINES.H`). TD's extra rows are its hand-to-hand fighting and its civilians' pleading. The fighting is
  compiled out (`#ifdef BOXING`, never defined) and no code ever starts the pleading actions, so nothing is lost.
  Build the table in Red Alert's order from TD's frame numbers.
- **Red Alert's HD rifleman is TD's minigunner.** Red Alert's `E1DoControlsVirtual` uses TD's minigunner frame
  numbers, hand-to-hand gap included, and both games' HD `E1.ZIP` hold 532 frames. Its classic table is the same
  less 94 frames. For a TD infantryman of the same layout, Red Alert's `E1` table and `E1`'s image as a donor both
  fit.
- **C4 is a flag.** TD gives its commando's building demolition to `INFANTRY_RAMBO` in code. Red Alert has
  `C4=yes` (`IsBomber`, which also sets `IsCapture`), and its `What_Action` turns an attack on a repairable building
  into sabotage. Non-repairable buildings, such as barrels, are shot instead.

## How it was verified

- **Both games' source:** TD's and Red Alert's `UnitTypeClass` constructors (`UDATA.CPP`), the speed reading in Red
  Alert's `TECHNO.CPP` (`_Scale_To_256`) and both games' `MPH_*` values (`DEFINES.H`), `Tracked=` (`UDATA.CPP`),
  TD's `"FRAG3"` (`ADATA.CPP`), `TXT_STANK` (TD's `CONQUER.H`, absent from Red Alert), `CloakType` and the scanner
  check in both games' `FOOT.CPP`, `Sensors=` (`TECHNO.CPP`), and `VOC_CLOAK` against `VOC_IRON1`
  (`TECHNO.CPP`). Burst is Red Alert's `WEAPON.CPP`. Also
  `ADVANCED` commented out in TD's `DEFINES.H` (in both EA source releases of TD); weapon `Speed=` through
  `Get_MPHType` (`WEAPON.CPP`, `CCINI.CPP`) and Red Alert's `MPH_ROCKET=60 // 24` (`DEFINES.H`); `Rearm_Delay`,
  `Is_Two_Shooter` and the shot toggle in `Fire_At` (both `TECHNO.CPP`); homing on `ROT != 0` and both games'
  scatter (`BULLET.CPP`), `HomingScatter` and `BallisticScatter` (`RULES.CPP`); TD's discarded risk and Red Alert's
  `Points=` (`TECHNO.CPP`); `Cloaking_AI` and `SubmergeDelay` (`TECHNO.CPP`, `RULES.CPP`) against TD's cloak in
  `TechnoClass::AI`; the `UNIT_APC` and `UNIT_PHASE` tests and the door frames (`UNIT.CPP`), `Passengers=`
  (`TECHNO.CPP`); both `DoType` enums (`DEFINES.H`), `BOXING` and the action table (TD's `INFANTRY.CPP`), both games'
  minigunner tables (`IDATA.CPP`), `C4=` (`IDATA.CPP`) and `What_Action` (both `INFANTRY.CPP`).
- **The game's files:** stock `rules.ini`'s track and wheel speeds, `HomingScatter=2.0`, `BallisticScatter=1.0`,
  `SubmergeDelay=.02`, `ROT=5` on its homing projectiles and `C4=yes` on Tanya; the HD frame counts in
  `TEXTURES_TD_SRGB.MEG` and `TEXTURES_RA_SRGB.MEG`: `E1.ZIP` 532 in both, `APC.ZIP` 38 in both, TD's `STNK.ZIP` 32.
- **A working mod:** every TD vehicle and infantryman ported this way, and each trap above hit and fixed in play:
  a missile that overshot its arming window with TD's speed written raw, TD's cadence and scatter ported in code, a
  transport added to the four `UNIT_APC` tests, and a C4 commando whose demolition needed no code.

> [!TIP]
> **In Tiberian Factions**
>
> TF ports all of TD's GDI and Nod vehicles and infantry this way. Their behaviour comes from TD's source and their
> art from the base game. TF's GDI and Nod defences carry `Sensors=yes`, matching TD's detectors. Allied and Soviet
> defences already had it in stock Red Alert. TF's ported weapons carry a flag of its own that reads `Speed=` as TD's
> raw value and adds TD's 3 ticks to each shot, so its `rules.ini` keeps TD's numbers.
