---
title: Porting CFE Patch Redux into your DLL
description: CFE Patch Redux ships its own RedAlert.dll, so it can't run beside another DLL mod; a Vanilla Conquer mod can port its features and fixes instead. What's already upstream in Vanilla Conquer, how to find and transplant each change, why ported fields change your save version (Vanilla Conquer removed EA's save padding), and the features one mod ported, from pixel-perfect zoom to attack-move and rally points.
tags: [engine, dll, cfe, porting, multiplayer, saves]
holds_for: Steam build 21590013
status: verified
unproven: [that every zoom factor shows on small maps (CFE's README says not all do), the ported features in LAN play (CFE says they work; tested here in skirmish), CFE's unported bug fixes in a Vanilla Conquer build]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Porting CFE Patch Redux into your DLL

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod has its own DLL and you want CFE Patch Redux's quality-of-life features or bug fixes in it:
attack-move, rally points, A\* pathfinding, smarter harvesters and repair bays, more zoom levels. CFE ships its own
DLL, so your players can't run it beside your mod, and porting is the only way they get both. A mod with no DLL of
its own can still take the zoom levels, which are data only. If you don't want CFE's changes, skip this page.

## CFE Patch Redux in brief

- **Whose it is:** ChthonVII's update of **cfehunter**'s original CFE Patch, by way of Root-Core's Red Alert port.
  ChthonVII brought it up to EA's last official patch and wrote most of the features below.
- **The source:** [ChthonVII/CnC_Remastered_Collection](https://github.com/ChthonVII/CnC_Remastered_Collection) on
  GitHub. The last release is 1.8. The repo also has unreleased 1.9 test builds (tags `v1.9-RA_testbuild0x`), so
  it's newer than the Workshop item. Its changelogs are in `Documentation/Changelogs/`.
- **One DLL at a time.** The Workshop item ships `Data/RedAlert.dll`, so it replaces the game DLL as your mod does.
  Only one mod's DLL runs (see [New units without a DLL of your own](../structuring/units-without-a-dll.md)), and a
  player who enables both gets one or the other, not both.
- **The licence:** GPL v3, like EA's source and Vanilla Conquer. CFE's README invites reuse on the GPL's terms: your
  mod is GPL, and you publish its source. It also says plainly that it will act against reuse that doesn't follow
  them. Credit the authors (see Credits below).

## Already in Vanilla Conquer

Check here before porting anything:

- **Many of CFE's "vanilla bugfixes" came from Vanilla Conquer.** Their commit messages say so ("as per
  vanilla-conquer commit ..."): 36 commits in CFE's history cite Vanilla Conquer. A mod built on Vanilla Conquer
  has them already.
- **Some went the other way.** ChthonVII's own commits are on Vanilla Conquer's `vanilla` branch: helipads counted
  towards the airstrip limit (which let you build extra planes), a reshroud hiding allies despite `IsAllyReveal`, a
  reveal crate refused after a darkness crate, and the single-player AI failing to rebuild on normal-sized maps.
- **Two fixes disagree.** CFE's own commits say Vanilla Conquer's versions are wrong: `Base_Is_Attacked`
  choosing defenders by strength ("Vanilla-Conquer commit c608b48 has this totally wrong"), and `MISSION_NONE`
  used as an array index ("I think they have the logic wrong in places"). Compare both versions before trusting
  either.

## How to port a change

1. **Find it.** CFE marks its changes in the source with `Chthon CFE Note` comments (about 380 of them in 75 Red
   Alert files), and gates each feature on a field of `ActiveCFEPatchConfig`. The keys in
   `DEFAULT.CFEPATCHREDUX_RA.INI` (`ATTACK_MOVE`, `RALLY_POINTS`, `HARVY_OPTIMIZE` and so on) name the features:
   grep the key, then the field, and you have every site. Grep with `grep -a`: some of the source files hold
   non-ASCII bytes, and a plain grep skips them as binary without saying so.
2. **Transplant it by hand.** CFE is a fork of EA's source tree (`REDALERT/`, upper-case files). Vanilla Conquer
   lower-cased the files and refactored many of them, so a CFE commit won't cherry-pick. Expect drift in exactly
   the files Vanilla Conquer changed.
3. **Take the LAN-safe version.** CFE 1.7 reworked its features for LAN play ("All mod features should now work
   perfectly in LAN multiplayer", except the wall-building preview). Port code from 1.7 or later, not earlier, and
   the A\* from 1.8 or later (see [Pathfinding](../ai/pathfinding.md)).
4. **Decide on the switches.** Every CFE feature reads an on/off key from CFE's own INI. You can keep that, or
   switch features on in code and drop the INI.
5. **Expect your save version to change.** EA's saved classes end in a `SaveLoadPadding` byte array (32 bytes in
   `BuildingClass`), so a patch could add fields without changing the class's size. CFE takes new fields out of that
   padding, as with its rally point (a commit corrects it to take 4 bytes, because Red Alert's `TARGET`
   is 4 bytes). Vanilla Conquer removed the padding from every class. On a Vanilla Conquer base, each field you port
   grows its class, which changes the save version: see [Save versions](save-versions.md).

## What ports

| Feature | CFE key | What it takes |
|---|---|---|
| **Pixel-perfect zoom** | none: data only | One list in `GameConstants_Mod.xml` (below). |
| **Attack-move** (Shift+click) | `ATTACK_MOVE` | Two new missions and their names, the order through the event queue, special cases per unit kind (below). |
| **Rally points** | `RALLY_POINTS` | A saved `RallyPoint` on `BuildingClass`, the click handling, and the line drawn in the building's draw code (below). |
| **A\* pathfinding** | `ASTAR_PATHING` | The search and its hooks: see [Pathfinding](../ai/pathfinding.md). |
| **Infantry Tiberium aversion** | `INFANTRY_TIBERIUM_AVERSION` (TD only) | A cost per Tiberium cell in the A\* search, for infantry. Needs the A\* port. |
| **Harvester queue-jumping and optimisation** | `HARVY_QUEUE_JUMP`, `HARVY_OPTIMIZE` | Refinery choice by distance plus a weight per inbound harvester: see [Harvesters](../ai/harvesters.md). CFE's older `HARVY_LOAD_BALANCING` is switched off whenever optimisation is on, so it needn't be ported. |
| **Smarter repair bay** | `SMARTER_REPAIRBAY` | Queueing for a busy bay, a working rally point on the bay, and a better exit for repaired units (`DoSmarterRunAway`). |
| **Smarter SAMs** | `SMARTER_SAMS` (TD only) | A SAM that loses its target with ammo left looks for another before lowering. Tiberium Dawn's SAM state machine only. |
| **Harvester self-repair** | `HARVY_SELF_REPAIR` (TD only) | Nothing in Red Alert: the stock `SelfHealing=yes` key does it (below). |

### Pixel-perfect zoom

Stock Red Alert has eight zoom factors, 1.0 to 2.0, in the `CNCZoomFactors` list of `GameConstants.xml`. CFE
replaces them with eleven, from 0.246875 to 1.975, which zoom out further. The odd steps are meant to be
pixel-perfect at 1080p and 4K, the even ones on 2K monitors. The values are bleid's "Pixel-Perfect Zoom Levels",
with extra steps CFE added between 1x and 2x. CFE ships a whole copy of `GAMECONSTANTS.XML` loose. The overlay
file carries only the list (see [Overriding the launcher's data](../launcher-data/overriding-launcher-data.md)):

```xml
<GameConstants>
    <GameConstantsClass>
        <CNCZoomFactors network="client" overwrite="true">
            <ZoomFactor>0.246875</ZoomFactor>
            <ZoomFactor>0.37</ZoomFactor>
            <ZoomFactor>0.49375</ZoomFactor>
            <ZoomFactor>0.74</ZoomFactor>
            <ZoomFactor>0.9875</ZoomFactor>
            <ZoomFactor>1.11</ZoomFactor>
            <ZoomFactor>1.234375</ZoomFactor>
            <ZoomFactor>1.48</ZoomFactor>
            <ZoomFactor>1.728125</ZoomFactor>
            <ZoomFactor>1.85</ZoomFactor>
            <ZoomFactor>1.975</ZoomFactor>
        </CNCZoomFactors>
    </GameConstantsClass>
</GameConstants>
```

Without `overwrite="true"` the eleven are appended to the stock eight. CFE's README notes that not every factor is
offered on smaller maps (not tested here).

### Attack-move

- **Two new missions.** CFE adds `MISSION_ATTACKMOVE` and `MISSION_QATTACKMOVE` (attack-move with the queued-move
  toggle) after EA's missions. As its own comment says, a mission of its own is what lets the attack-move travel in
  the multiplayer event queue. On arrival the unit gets a plain move, a flag that it's attack-moving, and a
  remembered destination to return to after each fight.
- **Name every new mission.** `Missions[]` (`CONST.CPP`) is sized `MISSION_COUNT`, and `Mission_From_Name`
  `stricmp`s every entry. A new mission without a name leaves a `NULL` there, and the next name lookup crashes.
- **Shift comes from the launcher.** Every input the launcher sends (`CNC_Handle_Input`) carries that player's
  Shift, Ctrl and Alt flags, and the DLL keeps them per player. `DLL_Export_Get_Input_Key_State(KN_LSHIFT)` reads
  them for the player whose input is being handled. In a LAN game that works for every player, unlike a keyboard
  read in the DLL (see [LAN games](lan-games.md)).
- **Weaponless buildings.** EA's `TechnoClass::Evaluate_Object` stops a human player's units from picking an
  enemy building with no weapon as a target. CFE keeps that filter, so its attack-move fights units and defences
  and drives past power plants and factories. Changing that is a design choice of your own.
- **Special cases.** CFE's README lists them: aircraft return to base when out of ammo or at the destination;
  boats (except the plain submarine) attack briefly and move on, and surface boats don't chase; minelayers lay all
  their mines near the destination and return to the repair bay. Each is code in that unit kind's class. A boat's
  "briefly" is a 180-frame clock set when it engages, and for the last 90 frames it's forced back to moving.
- **The minelayer sees hidden mines.** `MinelayerFindSpot` skips any cell holding a building, and mines are
  buildings, so it steers round enemy mines its owner can't see. CFE's own comment calls it a small cheat.
- **Aircraft flags are private.** EA's `AircraftClass` keeps `IsLanding` and `IsTakingOff` private, and attack-move
  reads them from `TechnoClass`. CFE comments out the `private:`; on a Vanilla Conquer base, make the two public.

### Rally points

- **Drawn by the DLL.** The line and its end marker are shapes drawn from `BuildingClass`'s draw code through
  `DLL_Draw_Intercept`, and only while the building's owner has it selected, so only the owner sees them. CFE 1.7
  changed the rally artwork to make that owner-only drawing work in LAN games.
- **Long lines skip dots.** A very long rally line draws so many dot shapes that the launcher crashes. CFE's 1.9
  fix draws fewer dots once a line is long. Port that with the feature.
- **Repair bays** get their rally point from the smarter repair bay, which handles where a repaired unit leaves to.

### Tiberium aversion in Red Alert

CFE's aversion is Tiberian Dawn's, keyed on the cell's land type, `LAND_TIBERIUM`. In Red Alert, ore and gems
(`GOLD01`, `GEM01` and so on) are `LAND_TIBERIUM` too (`ODATA.CPP`), so the same test would steer infantry around
harmless ore. A Red Alert mod with Tiberium has to test the overlay type instead. CFE also exempts the chemical
warrior, which TD's Tiberium never hurts (`INFANTRY.CPP` skips `INFANTRY_E5`). Keep the exemption only for
infantry your Tiberium doesn't hurt.

### Harvester self-repair

Red Alert doesn't need CFE's code for this. Red Alert's `[HARV]` sets `SelfHealing=yes` in the base game's
`rules.ini`: `TechnoClass::AI` adds a point of strength every `RepairRate` minutes until the unit is at
`ConditionYellow` (50%). A harvester of your own gets the same by setting the key in its section.

## The rest: candidates

CFE's 1.7 and 1.8 changelogs list many more fixes: crashes, sounds and unit flashes played to the wrong player in
multiplayer, crate and ore-growth bugs, and planes firing one extra shot after their ammo runs out. Several are
gated behind INI keys because they change play: the inaccuracy fix (it reads the `Inaccurate` key in place of the
misspelt `Inaccuate`, see [Known engine traps](../troubleshooting/known-engine-traps.md), and puts back the
commented-out `ROT != 0` test in `BULLET.CPP`, so homing projectiles scatter too), the timequake fix, the ore index fix (harvesters scooping without gaining a bale) and the gem
overload fix. The MIG ammo fudge gives certain planes one more round, to keep the balance they had with the
extra-shot bug, so port it with that fix. CFE's balance options (veterancy, OpenRA-style
superweapons, instant capture) are design choices, not fixes.

## Traps

- **Check upstream first.** A fix Vanilla Conquer already has, ported again from CFE, gets applied twice or
  conflicts.
- **Grep CFE's source with `-a`.** A plain grep can report a feature as missing when it's in a file grep took for
  binary.
- **Ported fields change your saves.** There is no padding to take them from on a Vanilla Conquer base.
- **A new mission needs a name.** See Attack-move above.
- **Long rally lines crash the launcher** without the 1.9 dot skip.

## How it was verified

- **CFE:** its README (features, credits, the GPL reminder, the zoom notes), its 1.7 changelog (the LAN rework and
  the rally artwork), its default INIs (the feature keys), its git history (the commits citing Vanilla Conquer, the
  two disputed fixes, the padding correction, the 1.9 rally-line fix, the zoom commit), and its source: the
  `MISSION_ATTACKMOVE` comment, the `Missions[]` names, `DLL_Export_Get_Input_Key_State` in `AIRCRAFT.CPP`, the
  owner-only rally drawing, the Smarter SAMs code in TD's `BUILDING.CPP`, `AttackMoveBoatClock` (`TECHNO.CPP`),
  `MinelayerFindSpot` and its comment (`UNIT.CPP`), the commented-out `private:` in `AIRCRAFT.H`, and
  `Find_Best_Refinery` taking the optimised choice whenever `HARVY_OPTIMIZE` is on (its README says the same), and
  the inaccuracy fix's two changes in `BBDATA.CPP` and `BULLET.CPP`, each gated on `INACCURACY_BUGFIX`. Its
  Workshop item (2268301299) ships
  `Data/RedAlert.dll` and a whole `GAMECONSTANTS.XML`.
- **Vanilla Conquer:** ChthonVII's four commits on its `vanilla` branch, and its commit removing `SaveLoadPadding`
  from every class.
- **EA's source and the base game:** `IsLanding` and `IsTakingOff` under `private:` in `AIRCRAFT.H` (and in Vanilla
  Conquer's); mines as buildings (`STRUCT_AVMINE`, `STRUCT_APMINE`); `SaveLoadPadding` in the saved classes'
  headers; `Missions[]` and
  `Mission_From_Name`; `CNC_Handle_Input` and the per-player `SpecialKeyFlags`; the weaponless-building filter in
  `Evaluate_Object`; no attack-move or rally point anywhere in EA's Red Alert; ore's `LAND_TIBERIUM`; `IsSelfHealing`
  in `TechnoClass::AI`. Each was read with `grep -a`. The stock zoom list is in `CONFIG.MEG`'s `GameConstants.xml`,
  and `[HARV]` with `SelfHealing=yes` is in the base game's `rules.ini`.
- **A working mod** ported each feature in the table into a Vanilla Conquer DLL and played it in skirmish under
  Proton on Linux. Its port notes record the boat clock, the minelayer leak and the build fix for the aircraft
  flags. LAN play of the ported features rests on CFE's own statement, not a test here.

**Credits:** cfehunter (the original CFE Patch, and its A\*), Root-Core (the first Red Alert port), ChthonVII (CFE
Patch Redux: attack-move, harvester optimisation, Tiberium aversion, smarter repair bays, LAN play and most of the
rest), bleid (the zoom levels), screaming_chicken (the idea behind smarter SAMs), and the Vanilla Conquer developers.

> [!TIP]
> **In Tiberian Factions**
>
> TF ports CFE's zoom levels, attack-move, rally points, A\*, both harvester features, the smarter repair bay and
> Tiberium aversion, all switched on in code with no CFE INI. It changes some on purpose. An attack-move shells
> passive buildings once no armed target is in range. Tiberium aversion tests the overlay, so ore is ignored, and
> it covers every infantry type, because TF's Tiberium hurts them all. Its Smarter SAMs is its own code, written
> for its own TD SAM. Self-repair is `SelfHealing=yes` on its TD harvester. Its wall line-fill is TF's own build,
> not CFE's.
