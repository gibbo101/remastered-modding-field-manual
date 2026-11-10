---
title: Turrets
description: Giving a Red Alert unit a turret. The constructor flag, the frame layout the code expects (32 body facings, then 32 turret facings), the turret as a second draw limited to shapes 0-127 in HD, the clockwise order of a turret-seat table against anticlockwise frames, where shots leave the barrel, and why a turretless direct-fire unit needs IsLockTurret to aim.
tags: [units, turrets, dll, art]
holds_for: Steam build 21590013
status: verified
unproven: []
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Turrets

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

**HD mode only** for the art. See [HD-only mods](../getting-started/hd-only-mods.md).

## When you need this

When a unit you add has a turret that turns separately from its hull, or when a unit without one won't turn to
fire. See [Adding a unit](adding-a-unit.md) for the rest of a new unit.

## The flag

A turret is a constructor flag on `UnitTypeClass` (`is_turret_equipped`), not a `rules.ini` key. With it set, the
unit has two facings: the hull's (`PrimaryFacing`) and the turret's (`SecondaryFacing`). They turn separately, and
the turret faces its target while the hull drives.

## The frame layout

The code picks the turret's frame as the body frame for its facing **plus 32**:

```cpp
shapenum = TechnoClass::BodyShape[tfacing] + 32;   // UnitClass::Draw_It
```

So a turreted unit's shapes are 32 hull facings (0 to 31), then 32 turret facings (32 to 63): 64 in all. Lay out
the HD art the same way, with the turret frames from 32. A unit that doesn't use that layout, such as a walker with
walk frames, needs its own shape logic in `Shape_Number` and the turret draw. Keep the turret block at the end.

## The turret is a second draw

The turret is drawn as a second object on top of the hull, offset by the constructor's turret offset along the
body's facing (`Turret_Adjust`). In HD, the launcher draws nothing from a second draw whose shape number is 128 or
more. A turret's frames must stay in 0 to 127, while a hull can use up to 255. See
[How the launcher draws sprites](../art/how-the-launcher-draws-sprites.md).

**A seat table runs clockwise; the frames don't.** For a turret off the hull's centre, give the type a 32-entry
table of offsets in `UnitTypeClass::Turret_Adjust`, as EA does for the Mobile Gap Generator. `Turret_Adjust` gets
the hull's `DirType` and indexes the table with `Dir_To_32(dir)`, which counts clockwise from north (east is
entry 8). The body frames run the other way: `TechnoClass::BodyShape` maps that same east to frame 24. So a table
generated in frame order is wrong for every facing but north and south: reorder it clockwise, or index it through
`BodyShape[Dir_To_32(dir)]`. Don't go by the compass labels in the comments on EA's own table: they don't follow
its index.

## Where shots leave

`TechnoClass::Fire_Coord` places the muzzle from the unit's centre:

1. up by the constructor's vertical offset plus the unit's height;
2. east by its horizontal offset;
3. sideways by the weapon's lateral offset. A second shot uses the other side, which is how twin barrels alternate;
4. forward, along the **turret's** facing, by the weapon's offset.

The primary and secondary weapons each have their own offset and lateral offset, set only in the constructor, in
leptons (256 to a cell). Tune them against the art. Where art is hand-placed per facing, so that no single
offset tracks the barrel, a table of offsets per facing, computed from the art, is the reliable fix.

## A turretless unit that fires forward may need `IsLockTurret`

A unit without a turret has to turn its hull to aim. Stock Red Alert does that in only one case:
`UnitClass::Rotation_AI` turns a turretless unit's hull toward its target only if the unit is **tracked**, and only
while it isn't driving. EA's comment there: "Wheeled vehicles never rotate to face the target, since they aren't
maneuverable enough."

For anything else, there's the constructor's `is_lock_turret` flag. When a unit can't fire because it's facing the
wrong way, it turns its **turret**, unless the flag is set. With the flag, it turns its **hull** instead:

```cpp
case FIRE_FACING:
    if (Class->IsLockTurret) {
        PrimaryFacing.Set_Desired(Direction(TarCom));          // turn the hull
        SecondaryFacing.Set_Desired(PrimaryFacing.Desired());
    } else {
        SecondaryFacing.Set_Desired(Direction(TarCom));        // turn the turret
    }
```

So a turretless unit that fires straight ahead and isn't tracked, such as a walker or a wheeled gun, needs
`is_lock_turret`. Without it, the unit turns a turret it doesn't have, never faces its target, and never fires.
Stock Red Alert's own turretless guns, the artillery and the V2 launcher, leave the flag off and rely on the tracked
rule above.

## How it was verified

- **EA's source:** the turret flag and `is_lock_turret` in the `UnitTypeClass` constructor, off on the stock artillery and V2 (`UDATA.CPP`); the tracked-only hull turn in `Rotation_AI`; the `+32`
  turret frame and `Turret_Adjust` in `UnitClass::Draw_It`, the `FIRE_FACING` branch (`UNIT.CPP`), and
  `Fire_Coord` (`TECHNO.CPP`); the table order from `UnitTypeClass::Turret_Adjust` indexing by `Dir_To_32`
  (`UDATA.CPP`), `Facing32` (`CONST.CPP`, east = 8) and `TechnoClass::BodyShape` (`TECHNO.CPP`, 8 to frame 24).
- **Tiberian Factions:** turreted vehicles laid out hull 0–31 and turret 32–63; a turret block placed from 120 that
  vanished until it moved under 128; and a hull-fixed gun unit that wouldn't turn to fire until `is_lock_turret`
  was set. Its art packer reorders each per-frame seat table clockwise before emitting it, and one hand-written
  table of its own is indexed through `BodyShape` instead.
- **The 128-shape limit:** observed in play, not read from code. See the sprites page.

> [!TIP]
> **In Tiberian Factions**
>
> TF's Tiberian Sun Titan walks and turns its torso: 8 facings × 12 walk frames, then 32 turret frames, exactly 128
> shapes, so the turret stays drawable. Its cannon's muzzle comes from a table of offsets per facing, generated from
> the art, because no single offset tracked the hand-placed barrel.
