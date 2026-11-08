---
title: Porting Tiberian Dawn units
description: The lessons for bringing Tiberian Dawn's units into Red Alert's engine, now that their HD art comes from the base game. Reading TD's constructors (and the branch that compiles), converting unit and projectile speed exactly (and why Speed=100 stops a shot), filling the geometry Red Alert needs, rate of fire, homing, scatter and Points=, TD's projectile flags as rules.ini keys, impact animations on the warhead, projectile frames, TD's integer ratios against Red Alert's fixed, renamed animations, the shared cloak and sensor system and who detects, the special cases (dual weapons, flame jets, wheels, transports, stealth), and infantry's animation tables, sight, engineers and C4.
tags: [units, tiberian-dawn, porting, dll, rules-ini]
holds_for: Steam build 21590013
status: verified
unproven: [the re-cloak wait and the damaged-cloaker chances (read from code in both games, not timed in play), that infantry reveal cloaked units in play in both games (read from code, not seen)]
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

**`Speed=100` stops a visible projectile dead.** 100% scales to 255, `MPH_LIGHT_SPEED`. `BulletClass::Unlimbo`
treats that speed as instant: an invisible projectile (`Inviso=yes`) is put straight at its target, and any other
gets a flight speed of zero (`if (speed == MPH_LIGHT_SPEED) speed = MPH_IMMOBILE;`, `BULLET.CPP`). It sits at the
launcher until its fuse runs out (a few frames) and bursts there. TD's `MPH_VERY_FAST` is 100 on TD's 0–255
scale, so its `Speed=` is 39, not 100.

**Tracks or wheels too.** TD's constructor gives each unit a locomotion type, `SPEED_TRACK` or `SPEED_WHEEL`. In
Red Alert that's `Tracked=yes` or not. Stock `rules.ini` moves tracks at 80% on clear ground and 70% on rough, and
wheels at 60% and 40%. So a TD tank left wheeled crawls off-road. Tracked also decides whether a turretless unit
turns to aim: see [Turrets](turrets.md).

## Fill in what Red Alert needs and TD never had

Red Alert's `UnitTypeClass` constructor has geometry TD's lacks: a vertical offset, and offsets and lateral offsets
for each weapon, all in leptons. TD placed its muzzle flashes differently. Start from a Red Alert unit of the same
size, then tune against TD's art in game, by screenshot. For TD's Medium Tank, Red Alert's `2TNK` values (vertical
`0x0030`, primary `0x00C0`) put the flash on TD's barrel.

One geometry field is in both constructors: the turret centre's offset along the body. TD's is 0 for every unit
but the gunboat (14), so a TD vehicle keeps 0.

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

## Projectiles and their impacts

TD sets each projectile's flags in its constructor (`TIBERIANDAWN/BBDATA.CPP`, one commented line each). Red Alert
reads them from the projectile's `rules.ini` section (`BulletTypeClass::Read_INI` in `BBDATA.CPP`), and moves the
rest to the weapon and the warhead:

| TD's constructor field | Red Alert |
|---|---|
| Flies over tall walls? | `High=` |
| Homes in on target? | no key: any `ROT=` other than 0 homes |
| Projectile arcs to the target? | `Arcing=` |
| Is this a dropping bomb-like object? | `Dropping=` |
| Is this projectile invisible? | `Inviso=` |
| Will it blow up even if it gets just near to target? | `Proximity=` |
| Does it have flickering flame animation? | `Animates=` |
| Can it run out of fuel? | `Ranged=` |
| Is there no visual difference between projectile facings? | `Rotates=`, the other way round |
| Is projectile inherently inaccurate? | `Inaccuate=`, spelt so (see [Known engine traps](../troubleshooting/known-engine-traps.md)) |
| Translucent colors are used? | `Translucent=` |
| Good against aircraft? | `AA=` |
| Arming time, rate of turn | `Arm=`, `ROT=` |
| Speed | the weapon's `Speed=` (see Speed, above) |
| Warhead | the weapon's `Warhead=` |
| Explosion on impact | the warhead's `Explosion=` (below) |

Red Alert adds `Shadow=`, `AG=`, `ASW=`, `Degenerates=`, `UnderWater=`, `Parachuted=`, `Gigundo=`, `Frames=` and
`Image=`.

- **The impact animation moves to the warhead.** TD names it on the projectile, and a flamethrower's or chemical
  sprayer's projectile names none. Red Alert picks it from the warhead's `Explosion=` (`Combat_Anim` in
  `COMBAT.CPP`): sets 1 to 6 each give an animation, and any other value gives none. A spray weapon whose warhead
  has an `Explosion=` from 1 to 6 bursts on every hit, which TD's doesn't: give it a warhead of its own with
  `Explosion=0`.
- **No warhead, no damage.** `Explosion_Damage` returns at once for `WARHEAD_NONE` (`COMBAT.CPP`). A shot that
  lands and plays its impact but does nothing has lost its warhead somewhere in the port.
- **A projectile's frame is its facing plus its tumble.** `BulletClass::Shape_Number` takes the 32-facing frame
  (0 to 31) when the projectile has `Rotates=yes`, then adds `Frame % Frames` when `Frames=` is set. So a rotating
  missile needs 32 frames, and an 8-frame tumbling bomb must not rotate: flagged to rotate, it asks for frames past
  its eighth, which draw as white boxes. TD's grenade is the 8-frame, non-rotating `BOMB`, which Red Alert's
  `Lobbed` projectile draws too.

## Traps

- **TD's integer ratios and Red Alert's `fixed`.** TD's `Health_Ratio()` and `Tiberium_Load()` return integers,
  with 256 (`0x0100`) as full. Red Alert's return `fixed` (`FIXED.H`), with 1 as full, and TD's tests copied as they
  are change meaning. `fixed`'s comparison with an integer multiplies the integer up to `fixed`'s scale, so
  `Health_Ratio() < 0x0080` asks "below 128 times full health": always true. And a bare `if (Tiberium_Load())`
  converts through `fixed`'s `operator unsigned`, which rounds to the nearest whole number: a harvester under half
  full counts as empty (13 of 28 bails rounds to 0). Rewrite each test in Red Alert's terms: `<= Rule.ConditionYellow`
  for TD's `< 0x0080`, `> 0` for a bare load test, as Red Alert's own refinery code does.
- **An animation's data name isn't its enum name.** TD's `ANIM_FRAG2` loads the shapes named `"FRAG3"`
  (`TIBERIANDAWN/ADATA.CPP`). Port the shapes the constructor names, not the enum's name. Its constructor also gives
  it 29 virtual stages, the HD art's frame count. Red Alert's `AnimTypeClass` constructor ends in the same optional
  field: with a virtual stage count above the classic stage count, the animation keeps running for the HD frames
  after the classic ones end (`ANIM.CPP`).
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
`Sensors=` sets whether a type is a scanner, so stealth detection is data.

- **Who detects, in TD.** Every infantry type: TD's `InfantryTypeClass` constructor passes the scanner flag as
  true for all of them (`IDATA.CPP`). Of the buildings, the guard tower, Advanced Guard Tower, Obelisk, gun turret,
  communications centre and the civilian mission (`BDATA.CPP`). Vehicles and aircraft never.
- **Who detects, in Red Alert.** Every infantry type and every ship, by constructor (`IsScanner = true` in
  `IDATA.CPP` and `VDATA.CPP`), and `rules.ini`'s comment that `Sensors=` defaults to no holds only for the rest.
  Stock `rules.ini` turns it on for the radar jammer, the radar dome and most defences, and never turns it off for
  infantry. `Sensors=` works on any type, so a TD vehicle can be made a stealth hunter, and `Sensors=no` takes it
  away from infantry.
- **The cloak sound differs.** TD's units cloak with `VOC_CLOAK`, the sample `TRANS1`. Red Alert's play
  `VOC_IRON1`, the Iron Curtain's sound, except ships, which play `VOC_SUBSHOW` (`TechnoClass::Do_Cloak` and
  `Do_Uncloak`). A TD cloaker needs its own sound routed.
- **`Cloakable=yes` is the whole unit.** A cloaker cloaks when idle, uncloaks to fire, and shimmers when hit or
  next to a scanner, with no code of your own. Red Alert waits before it re-cloaks, for `[General]` `SubmergeDelay`
  minutes (stock `.02`), the submarines' key, which every cloaker shares. Badly damaged cloakers cloak only now and
  then: in Red Alert, below `ConditionRed` there's a 4% chance a tick; in TD, below a quarter health, 1 in 26.

## Special cases, at method level

- **Two weapons, one anti-air.** `Primary=` and `Secondary=` in `rules.ini`, with separate offsets in the
  constructor. If the secondary's projectile can hit aircraft, the unit uses it on aircraft, with no unit-level
  flag. Model the offsets on Red Alert's Mammoth tank (`4TNK`: vertical `0x0020`, primary `0x00C0` with lateral
  `0x0028`, secondary `0x0008` with lateral `0x0040`).
- **"Fires two shots in quick succession."** TD's constructor flag has no Red Alert equivalent. Use `Burst=2` on
  the weapon instead.
- **A building prerequisite Red Alert doesn't have.** Satisfying a TD building's role, such as a repair bay, can
  take a per-type remap in the DLL's build check.
- **Flame jets** are animation-driven: the jet is an animation attached to the firer, not a projectile. TD's
  flamethrower and chemical sprayer fire an invisible projectile, and the jet is one of eight animations
  (`FLAME-N` to `FLAME-NW`, `CHEM-N` to `CHEM-NW`). TD's `TechnoClass::Fire_At` picks it as the base animation plus
  `Dir_Facing(Fire_Direction())`, the direction of fire, and attaches it to the firer (`Attach_To`). Red Alert has
  neither set of animations, and its `Fire_At` turns only `MINIGUN` and `SAMFIRE`. So port the eight as contiguous
  enum entries in facing order, name the first in the weapon's `Anim=`, and add a case to Red Alert's `Fire_At` that
  turns them by the direction of fire, not by `PrimaryFacing` as `SAMFIRE` does. Red Alert's own flamethrower is a
  different thing (`[Flamer]` fires a visible `Fireball` projectile), so don't model a TD jet on it. TD's flame
  shapes exist only as HD art, so the animation needs another animation's `ImageData`, or it draws a green
  placeholder.
- **Wheeled light units** keep TD's wheels, can't crush infantry, and have zero weapon offsets.
- **Stealth units** need their own weapon when they share a base weapon with another unit, so that one unit's
  changes don't move the other's.
- **Transports.** `Passengers=` in `rules.ini` is the only switch: loading, the entry cursor and the player's
  unload order all follow from it. Four things are keyed on `UNIT_APC` in Red Alert's code, and a new transport
  needs adding to each: the unload state machine in `Mission_Unload` (without it, passengers never get out), the
  doors opening for passengers, the AI loading an idle transport, and the mechanic's force-move cursor. EA added
  Aftermath's Phase Transport to the same four places, under `#ifdef FIXIT_PHASETRANSPORT`, in places keeping the
  old APC-only line under `#else`. The macro is on (`DEFINES.H`), so the `#ifdef` lines are the live ones: add your
  transport there. The generic transport code tests `Max_Passengers() > 0`, which `Passengers=` sets. An APC's art
  is 38 frames: 32 hull facings, then 6 door
  frames shown only while it faces north-east or north-west with the door open. It has no turret, and flagged as
  turreted it draws the door frames as one.

## Infantry

Infantry take `InfantryTypeClass` and two animation tables, `DoControls` for the classic shapes and
`DoControlsVirtual` for the HD art. Each row is a start frame, a frame count and a jump between facings.

- **The rows don't match TD's.** Red Alert's `DoType` has 21 actions; TD's has 34, in a different order (TD's
  `DEFINES.H`). TD's extra rows are its hand-to-hand fighting and its civilians' pleading. The fighting is
  compiled out (`#ifdef BOXING`, never defined) and no code ever starts the pleading actions, so nothing is lost.
  Build the table in Red Alert's order from TD's frame numbers. TD has 14 actions Red Alert lacks: eleven for
  fighting (`DO_ON_GUARD`, `DO_FIGHT_READY`, `DO_PUNCH`, `DO_KICK`, their two hits and death each, and
  `DO_READY_WEAPON`) and three for civilians (`DO_PULL_GUN`, `DO_PLEAD`, `DO_PLEAD_DEATH`). Red Alert has one TD
  lacks, `DO_DOG_MAUL`, for its dogs.
- **TD's infantry see less.** TD's minigunner has a sight of 1 (TD's `IDATA.CPP`); Red Alert's rifleman has
  `Sight=4` in stock `rules.ini`. Port TD's own value if the unit should play as in TD.
- **Engineers are a type, not a flag.** Red Alert's engineer behaviour is keyed on `INFANTRY_RENOVATOR`, on 20
  lines of its source: the capture itself in `InfantryClass::Per_Cell_Process`, the capture cursor in
  `InfantryClass::What_Action`, and an engineer on a hunt switching to capture in `FootClass::Mission_Hunt`, among
  others. `Infiltrate=yes`
  (`IsCapture`) alone gives a new engineer type the walk to the building and nothing when it gets there. Add your
  type to those tests. The rules differ too: TD's engineer always captures and never repairs; Red Alert's captures
  only a building at or below `EngineerCaptureLevel` (`ConditionRed`, a quarter, by default), otherwise damages it by
  `EngineerDamage` (a third of its strength) and is used up, and repairs an allied building in full.
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
- **More of both games' source:** the light-speed branch in Red Alert's `BulletClass::Unlimbo` and its fuse
  (`BULLET.CPP`, `FUSE.CPP`), TD's `MPH_VERY_FAST=100` (`DEFINES.H`); the turret-centre offset in both `UDATA.CPP`
  files; both `BulletTypeClass` sources (`BBDATA.CPP`); `Combat_Anim`'s explosion sets and `Explosion_Damage`'s
  early return (`COMBAT.CPP`), with the warhead's `Explosion=` (`WARHEAD.CPP`); `BulletClass::Shape_Number`;
  `fixed`'s integer comparisons and `operator unsigned` (`FIXED.H`, also Vanilla Conquer's `common/fixed.h`)
  against TD's integer `Health_Ratio` (`OBJECT.CPP`) and `Tiberium_Load` (`DRIVE.CPP`), and Red Alert's
  `Tiberium_Load() > 0` where TD's refinery has a bare test (both `BUILDING.CPP`); `FRAG3`'s 29 virtual stages and
  Red Alert's `AnimTypeClass` constructor and stage end (`TYPE.H`, `ANIM.CPP`); the scanner flag in TD's infantry,
  unit, aircraft and building constructors and in Red Alert's infantry and vessel constructors (also so in Vanilla
  Conquer's `idata.cpp`, `vdata.cpp` and TD `idata.cpp`); `Do_Cloak` and `Do_Uncloak`'s sounds under the active
  `FIXIT_CSII`, and `TRANS1` in TD's `AUDIO.CPP`; the Mammoth's offsets (`UDATA.CPP`); TD's flame and chemical
  animations and their turn by `Fire_Direction` in TD's `Fire_At`, against Red Alert's two turned animations
  (`TECHNO.CPP`); the `FIXIT_PHASETRANSPORT` branches and `Max_Passengers` tests (`UNIT.CPP`, `DEFINES.H`); both
  `DoType` enums diffed; TD's minigunner sight (`IDATA.CPP`); and the `INFANTRY_RENOVATOR` tests counted with
  `grep -aw`, the capture, damage and repair branches (`INFANTRY.CPP`), `EngineerCaptureLevel` and `EngineerDamage`
  (`RULES.CPP`), and TD's always-successful capture (TD's `INFANTRY.CPP`).
- **More of the game's files:** stock `rules.ini`'s `Sensors=` keys (none on infantry), `[Flamer]` with
  `Projectile=Fireball`, `[Lobbed]` with `Image=BOMB` and `Frames=8`, and `Sight=4` on `E1`, read in two copies.
- **The game's files:** stock `rules.ini`'s track and wheel speeds, `HomingScatter=2.0`, `BallisticScatter=1.0`,
  `SubmergeDelay=.02`, `ROT=5` on its homing projectiles and `C4=yes` on Tanya; the HD frame counts in
  `TEXTURES_TD_SRGB.MEG` and `TEXTURES_RA_SRGB.MEG`: `E1.ZIP` 532 in both, `APC.ZIP` 38 in both, TD's `STNK.ZIP` 32.
- **A working mod:** every TD vehicle and infantryman ported this way, and each trap above hit and fixed in play:
  a missile that overshot its arming window with TD's speed written raw, TD's cadence and scatter ported in code, a
  transport added to the four `UNIT_APC` tests, and a C4 commando whose demolition needed no code. Also an
  anti-aircraft missile with `Speed=100` that never left its launcher, spray weapons that burst on every hit until
  their warheads had `Explosion=0`, a tumbling bomb drawn as white boxes until it used `Lobbed`, a refinery that
  stopped unloading a harvester with 13 of its 28 bails aboard, from a bare `Tiberium_Load()` test, TD's flame jets
  turned by the direction of fire, and a new engineer that walked into a building and did nothing until it joined
  the `INFANTRY_RENOVATOR` tests.

> [!TIP]
> **In Tiberian Factions**
>
> TF ports all of TD's GDI and Nod vehicles and infantry this way. Their behaviour comes from TD's source and their
> art from the base game. TF's GDI and Nod defences carry `Sensors=yes`, matching TD's detectors. Allied and Soviet
> defences already had it in stock Red Alert. TF's ported weapons carry a flag of its own that reads `Speed=` as TD's
> raw value and adds TD's 3 ticks to each shot, so its `rules.ini` keeps TD's numbers.
