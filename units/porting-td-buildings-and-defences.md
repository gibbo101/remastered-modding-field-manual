---
title: Porting Tiberian Dawn buildings and defences
description: The lessons for bringing Tiberian Dawn's buildings and defences into Red Alert's engine as types of their own. Why sharing a Red Alert type fails, reading TD's constructor and its per-type code, the SAM site's rise-and-lower cycle, the Obelisk's charge (and the Tesla-only tests it needs) and laser, directional muzzle flashes and offsets, crews, build-ups, overlays, placement and the bib in its preview, Points=, the prerequisite bitfield, and the traps.
tags: [buildings, defences, tiberian-dawn, porting, dll, rules-ini]
holds_for: Steam build 21590013
status: verified
unproven: [what a prerequisite on a building type numbered 32 or higher does in a given compiler's build (the shift is undefined in C++), whether Red Alert's 15% civilian crew chance shows on a new barracks (read from code, not seen)]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Porting Tiberian Dawn buildings and defences

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When your Red Alert mod brings a Tiberian Dawn building or defence across with TD's behaviour: a SAM site that
rises out of the ground, an Obelisk that charges before it fires, a silo that fills up. The lessons hold for buildings
from any other game too. The art is the easy part: TD's HD art is in the base game, and
[TD art from the base game](../using-what-the-player-owns/td-art-from-the-base-game.md) draws it without shipping
it. If you only want a stock Red Alert building with TD's art, `Image=` on the stock type is enough and you don't
need this page. For units, see [Porting Tiberian Dawn units](porting-td-units.md).

## Give each port its own type

It is tempting to make TD's SAM site a copy of Red Alert's `STRUCT_SAM` with TD's art. It doesn't work, because
Red Alert's behaviour is keyed on type numbers in code. `STRUCT_SAM` appears on 15 lines of Red Alert's source,
`STRUCT_REFINERY` on 35, `STRUCT_AIRSTRIP` on 31. A building that is `STRUCT_SAM` runs Red Alert's two-state
launcher and Red Alert's frame layout, whatever art it draws. Give each port its own `StructType`, its own
constructor and its own `rules.ini` sections, and then add it to just the type checks whose behaviour it should
share.

The steps for a new type (the enum, the constructor, registration in heap order, a classic image so it's drawn at
all) are the same as a unit's: see [Adding a unit](adding-a-unit.md). New type numbers change the save format: see
[Save versions](../engine/save-versions.md). Three things are particular to buildings.

- **The INI name shares one namespace.** Every type reads the `rules.ini` section named after its INI name, and
  buildings, units, weapons and warheads all share the one set of section names. Red Alert has a warhead named
  `Nuke` (`RULES.CPP`), so a building with TD's INI name `NUKE` reads the warhead's section. Vanilla Conquer
  matches section names without regard to case (its `INIClass::CRC` upper-cases them), so there `NUKE` and `Nuke`
  are the same section. EA's own INI code matches exact case. Prefix every port's INI name (`TDNUKE`), and keep TD's
  art names through `Image=`.
- **A prerequisite is a 32-bit bitfield.** `Prerequisite=` is parsed into a `long` with one bit per building
  type (`1L << building`, in `CCINIClass::Get_Buildings`), and a house's `BScan` and `ActiveBScan` are the same
  width. Red Alert's 87 stock building types already run past bit 31 (its own `STRUCTF_FAKEWEAP` is `1L << 32`),
  so every new type's bit is past 31: naming it as a prerequisite doesn't work, and the shift is undefined in C++. To make a new building a
  prerequisite, replace the bitfield. One way: store a short list of type numbers on each type, and count each
  house's standing buildings per type.
- **Name lookups stop at `STRUCT_COUNT`.** `BuildingTypeClass::From_Name` searches only below `STRUCT_COUNT`, and
  it is how `Prerequisite=` and a map's `[STRUCTURES]` lines find a building. A type created past that, in spare
  heap slots, can't be named in either. Put new types in the enum, before `STRUCT_COUNT`.

## Read TD's constructor and TD's per-type code

TD's facts are in TD's source, in two places:

- **`TIBERIANDAWN/BDATA.CPP`**: the `BuildingTypeClass` constructor, with its flags (turret, simple damage, crew,
  two-shooter), size and footprint lists. Compare the size and footprint with Red Alert's nearest building before
  copying anything. TD's weapons factory is `BSIZE_33`, standing on rows 1 and 2 with row 0 as overlap; Red Alert's
  is `BSIZE_32`, on rows 0 and 1. Copied from Red Alert, TD's factory art sits a row off its footprint.
- **`TIBERIANDAWN/BUILDING.CPP`**: every `*this == STRUCT_<X>` test and `case STRUCT_<X>:` for your building. Each
  one is behaviour Red Alert either lacks or gives to a different type. Search with `grep -a`: several of EA's files
  hold extended ASCII, and plain `grep` skips them.

Then do the same in Red Alert's `BUILDING.CPP` for the stock building closest to yours. A behaviour Red Alert keys
on `STRUCT_BARRACKS` reaches your barracks only once you add your type to that test.

## The flags that decide the frames

- **`IsTurretEquipped` means 32 facings.** With the flag set, `Shape_Number` picks the frame from the turret's
  facing (`BodyShape[Dir_To_32(...)]`), and `Can_Fire` refuses to fire until the facing is within 8 steps of the
  target. TD's Advanced Guard Tower has a fixed rack and three frames (healthy, damaged, a spare): with the flag on,
  it asks for frames it doesn't have, and holds its fire while it turns a facing nobody can see. Copy the flag from
  TD's constructor, not from Red Alert's nearest defence.
- **Damaged frames follow the animations.** For an ordinary building, Red Alert's `Shape_Number` adds the largest
  `Start + Count` across the idle, active and two auxiliary animations once health drops to `ConditionYellow`. A
  static building's damaged frame is 1; a building with a four-frame idle has its damaged frames from 4. Lay the art
  out to match, healthy frames first.

## Behaviour Red Alert doesn't have

### The SAM site: rise, fire twice, lower

TD's SAM is an underground launcher with eight states (`SAMState` in TD's `BUILDING.CPP`): underground, rising,
ready, firing, ready again, firing again, locking (turning back to north) and lowering. Red Alert's SAM has two:
ready and firing. TD's cycle, in its `Mission_Attack`:

1. Underground until a legal target appears, then rise: `Set_Rate(2)` from stage 0.
2. At stage 15, face north and start tracking.
3. Fire, turn to the target again, fire a second shot, then wait three seconds.
4. Turn back to north, then lower: `Set_Rate(2)` from stage 48, underground again at stage 63.

The frames follow the state. Rising is frames 0 to 15 and lowering 48 to 63, both taken from the animation stage.
While raised, the launcher's 32 facings are frames 16 to 47 (the facing's frame plus 16). Damaged frames are 64 on.
The base game's TD `SAM.ZIP` holds 129 frames in that layout. Red Alert's SAM indexes its facings from frame 0, so
TD's art under Red Alert's code draws a half-risen launcher pointing the wrong way.

Two more TD rules: a closed SAM takes half damage, never less than one point (TD's `Take_Damage`), and TD turns
its SAM launcher at 15 a tick against 12 for its gun turret. Red Alert turns a building's turret at the type's
`ROT=` (`Rotation_Adjust(Class->ROT)`), so that one is data. Red Alert's `Can_Fire` allows `STRUCT_SAM` a firing
arc of 64 instead of 8: add your SAM to that test.

### The Obelisk: charge, then a laser

TD's Obelisk charges before every shot. In TD's `BuildingClass::AI`, a powered Obelisk with a target sets stage 0,
runs four frames at `OBELISK_ANIMATION_RATE` (15 ticks a frame), plays `VOC_LASER_POWER`, and is charged at stage
4. That is four seconds at normal speed.

Red Alert has the same idea for its Tesla Coil, in `BuildingClass::Charging_AI`. It runs for any building whose
primary weapon has `Charges=yes`, but the details are the Tesla's, hardcoded: 3 ticks a stage, charged at stage 9,
and the Tesla's power-up sound. An Obelisk on it charges in under two seconds instead of four, and its stage runs
past its four charge frames into its damaged frames. Make the rate, the last stage and the sound depend on the type.

Two more tests name only the Tesla Coil. `BuildingClass::Shape_Number` draws the charge stage as the frame only for
`STRUCT_TESLA`, and `Animation_AI` leaves a building's stage alone only if it has a turret or is `STRUCT_TESLA`.
Add your type to both, or the charge never shows and the idle animation runs over the charge stage.

`Charges=yes` does two more things in `TechnoClass::Fire_At`: it draws the Tesla's lightning to the target, and
runs the bullet's logic at once. A laser wants the second and not the first, so skip the lightning for it.

**The beam is a line.** TD draws the Obelisk's beam as coloured lines, kept on the firer (`Lines[3][5]` in TD's
`TECHNO.H`), and sends them to the launcher through `DLL_Draw_Line_Intercept` in TD's `DLLInterface.cpp`, which
fills the `Lines` and `NumLines` of the firer's exported object. Red Alert's export has the same fields
(`MAX_OBJECT_LINES` is 3 in both games' `DLLInterface.h`), but Red Alert's DLL only ever sets `NumLines` to 0. Port
TD's line intercept, and the launcher draws the beam in Red Alert.

### Silos, barracks and the rest

- **A silo's fill.** Red Alert's `Shape_Number` shows a silo's fill as one of five frames, from the house's stored
  ore against its capacity, plus 5 when damaged, only for `STRUCT_STORAGE`. TD's `SILO.ZIP` has 11 frames in the same
  layout. Add your silo to the test.
- **A barracks' exit.** `Exit_Object` finds a free exit cell for infantry only for `STRUCT_BARRACKS`, `STRUCT_TENT`
  and `STRUCT_KENNEL`. See [Units leaving buildings](exits-and-rails.md).
- **The crew.** `BuildingClass::Crew_Type` has cases by type: the silo gives a civilian, the construction yard a
  25% chance of an engineer (for a human owner, unless it was captured), the kennel a 50% chance of a dog, and the
  barracks and tent a rifleman. Anything else gets `TechnoClass::Crew_Type`: no one unless the type is crewed, a
  random civilian for a neutral house, and otherwise a rifleman, or for a building with no weapon a 15% chance of a
  civilian. A TD building whose survivors should be TD's infantry needs a case of its own.
- **Power.** TD hardcodes its Advanced Guard Tower to hold fire on low power (`Can_Fire`). Red Alert does the same
  from data: `Powered=yes` in the building's section.

## Weapons, muzzle flashes and offsets

TD's weapons are rows in a code table (`CONST.CPP`: projectile, damage, rate of fire, range, sound, animation).
Each one becomes a weapon, projectile and warhead section of your own in `rules.ini`, ported down the whole chain:
see [Porting Tiberian Dawn units](porting-td-units.md). Two things differ for buildings.

**The muzzle flash.** TD's building `Fire_At` picks the flash from the projectile: an 8-direction gun flash for
`BULLET_BULLET`, none for spread fire or a laser, and a muzzle flash for everything else. Red Alert's `Fire_At`
plays only the weapon's `Anim=`. A TD missile tower ported as it is fires with no flash: give its weapon
`Anim=GUNFIRE`.

Two `Anim=` names turn with the firer. Each names eight animations, one per direction, and `Anim=` finds the first,
north. `Fire_At` then adds the direction: `MINIGUN` by the direction of fire, `SAMFIRE` by the firer's
`PrimaryFacing` (a building's turret, a unit's hull). Any other name plays one animation whichever way the weapon
points. So `Anim=MINIGUN` is TD's 8-direction gun flash, and `Anim=SAMFIRE` a SAM site's launch flash, with no
code. Stock `rules.ini` uses them on the Vulcan, ChainGun and M60mg, and on the Nike and RedEye.

**Where shots leave.** TD places a building's muzzle in a per-type switch in its `Fire_Coord`. Red Alert takes it
from three constructor fields: the vertical offset, the primary weapon's offset and its lateral offset, all in
leptons (256 to a cell). TD's values:

| TD building | TD's `Fire_Coord` | Notes |
|---|---|---|
| Guard Tower, Advanced Guard Tower | up `0x30`, then `0x40` towards the target | The towers don't turn: the muzzle moves towards whatever they shoot at. |
| Gun Turret, SAM Site | up `0x30`, then `0x80` along the turret's facing | Turrets. |
| Obelisk | up `0xA8`, then west `0x18` | A fixed crystal tip. |

Red Alert's offset runs along the turret's facing for a building with a turret, and towards the target for one
without (`BuildingClass::Turret_Facing`), so the up-and-forward pairs above carry over as the vertical and primary
offsets. The Obelisk's sideways shift doesn't: a building's constructor passes no horizontal offset, so it takes a
`Fire_Coord` case of your own. Check each against the art in game.

## Build-ups, overlays and loading order

- **The build-up's length comes from a classic shape.** Red Alert's `BuildingTypeClass::One_Time` loads
  `<name>MAKE.SHP`, and only if it exists sets the construction animation, with as many stages as the shape has
  frames, spread over `BuildupTime`. An HD-only port with no classic `MAKE` shape has no build-up unless you ship
  one or set the construction animation yourself.
- **TD's base-game `MAKE` ZIPs start at frame 1.** `SAMMAKE.ZIP` holds `sammake-0001` to `sammake-0029`. Map your
  tileset's shape 0 to an empty frame, or the launcher shows its missing-art placeholder for a frame when the
  building is placed.
- **The war factory's door is hardcoded.** Red Alert draws its weapons factory's door as a second shape,
  `WarFactoryOverlay`, loaded from `WEAP2.SHP` and drawn by the name `WEAP2`, only for `STRUCT_WEAP` and its fake.
  A factory with a door of its own needs its own overlay shape and its own draw call under its own name.
- **`One_Time` runs after `rules.ini`.** `Init_Game` processes `rules.ini` (then `aftrmath.ini`) first, and
  `Init_Bulk_Data` runs every type's `One_Time` later. Anything `One_Time` sets, such as the `_anims` table's
  animation ranges, overrides an INI key your DLL reads for the same field.
- **`aftrmath.ini` is read after `rules.ini`,** field by field, whenever Aftermath is installed. A key it sets, such
  as `Owner=`, wins over yours in `rules.ini`. Patch both files.

## Placement and the AI

- **The footprint drives placement.** The DLL exports a building type's occupy list to the launcher, which draws
  the placement grid from it, and `Passes_Proximity_Check` scans the same list (`DLLInterface.cpp`). Copy the
  footprint and size from TD's constructor, so that placement, the art and the footprint agree.
- **The placement grid includes the bib.** The list exported for placement is `Occupy_List(true)`, which adds the
  bib's cells to the building's own (`BDATA.CPP`, the same in TD). A 2x2 building with a bib previews
  three rows tall. Size the building from its `BSIZE_*` and footprint, not from the preview.
- **Set `Points=`, or the AI ignores the building.** `rules.ini`'s `Points=` sets the type's risk and reward
  (`TechnoTypeClass::Read_INI`). A target's value is its risk plus its reward (`TechnoClass::Value`), and
  `Evaluate_Object` only scores a target whose value isn't zero. A building with no `Points=` is never picked as a
  target, by enemy units or the AI. `Points=` sets both risk and reward. TD's constructor has a pair, but TD works
  out the risk from the weapon and keeps only the reward: use the second number (see
  [Porting Tiberian Dawn units](porting-td-units.md)).

## The same pass for TD's rocket launchers and aircraft

- **TD's two rocket launchers wear each other's art.** `UNIT_MLRS`, the Rocket Launcher, draws the shapes named
  `MSAM`, and `UNIT_MSAM`, the S.S.M. Launcher, draws `MLRS` (TD's `UDATA.CPP`). Port each with the art its
  constructor names. `MSAM.ZIP` holds 96 frames, not the usual 64.
- **The Orca has no rotor.** TD's Orca is built with no rotor (TD's `AADATA.CPP`), while the Apache has one.
- **Red Alert's attack-aircraft loop is generic.** Ammunition, strafing and reloading at a helipad in Red Alert's
  `AIRCRAFT.CPP` aren't keyed on a type. Its type checks are for the Badger, the Chinook's two rotors and the cargo
  plane. A TD attack aircraft built like Red Alert's Hind gets the whole loop.

## How it was verified

- **EA's source, both games:** TD's `SAMState`, `Shape_Number` (+16 while raised, +64 damaged), half damage while
  underground, the rotation rates of 15 and 12, the SAM cycle's rates and stages in `Mission_Attack`, the Obelisk's
  charge in `BuildingClass::AI`, `OBELISK_ANIMATION_RATE`, the `Fire_At` flash by projectile and the `Fire_Coord`
  switch (TD's `BUILDING.CPP` and `DEFINES.H`); TD's weapon rows (`CONST.CPP`), constructors and footprint lists
  (`BDATA.CPP`), `Lines[3][5]` (`TECHNO.H`) and `DLL_Draw_Line_Intercept` (`DLLInterface.cpp`); the art names in
  `UDATA.CPP` and the rotor flags in `AADATA.CPP`; TD's risk worked out from the weapon (`TECHNO.CPP`) and its
  bib in `Occupy_List(true)` (`BDATA.CPP`). Red Alert's `SAMState`, `Shape_Number`, the firing arc, `Powered` in
  `Can_Fire`, `Charging_AI`, the `STRUCT_TESLA` tests in `Shape_Number` and `Animation_AI`, `Crew_Type` in both
  `BUILDING.CPP` and `TECHNO.CPP`, the `Exit_Object` cases, the `WEAP2` overlay, `Turret_Facing`, `One_Time` with
  its `MAKE` shapes, the building constructor's offsets and `Occupy_List(true)` with the bib (`BDATA.CPP`),
  `TechnoClass::Fire_Coord`, `Fire_At`'s electric branches, `Anim` and the turn it gives `MINIGUN` and `SAMFIRE`
  (`TECHNO.CPP`, `WEAPON.CPP`, the eight entries of each in `ADATA.CPP`), `Get_Buildings` and the `STRUCTF_` bits
  (`CCINI.CPP`, `DEFINES.H`), `From_Name`, the `Nuke` warhead (`RULES.CPP`), the INI section lookup (`INI.CPP`, and
  Vanilla Conquer's `common/ini.cpp`), `Points=` and `Value`, the start-up order (`INIT.CPP`), the occupy-list
  export and `NumLines` (`DLLInterface.cpp`), and the aircraft type checks (`AIRCRAFT.CPP`). The type-check counts
  were taken with `grep -aw` over Red Alert's `.CPP` files.
- **The game's files:** stock `rules.ini`'s `Anim=MINIGUN` and `Anim=SAMFIRE` weapons; the frame counts of TD's
  `SAM.ZIP` (129), `SAMMAKE.ZIP` (frames 1 to 29), `ATWR.ZIP` (3), `SILO.ZIP` (11) and `MSAM.ZIP` (96) in
  `TEXTURES_TD_SRGB.MEG`.
- **A working mod:** TD's power plants, barracks, silo, guard towers, gun turret, SAM site, Obelisk and the rest,
  each a type of its own, shipped and played under Proton on Linux and on the Steam Deck. Each trap above was hit
  there: the tower frozen on one frame with the turret flag set, the SAM drawing half-risen, the Obelisk charging far
  faster than TD's, the silo always empty, a `NUKE`-named building that never built, prerequisites on new buildings
  that didn't work until the bitfield was replaced, and buildings the AI walked past until they had `Points=`. Also
  an Obelisk added to the two Tesla tests, TD's SAM with `Anim=SAMFIRE`, crews of TD infantry from a case of their
  own, and a bib's extra row seen in the placement preview.

> [!TIP]
> **In Tiberian Factions**
>
> TF's GDI and Nod build TD's own buildings, each a `STRUCT_TD` type with `TD`-prefixed sections and weapons of its
> own that never point at Red Alert's. The SAM site rises, tracks, fires and lowers as in TD, but stays raised while
> an air target remains, so that it deals about the damage of Red Alert's SAM, a balance choice of TF's. The Obelisk
> charges for four seconds and fires TD's laser line. TF replaced the prerequisite bitfield with up to four type
> numbers per type, so `Prerequisite=TDHQ` works.
