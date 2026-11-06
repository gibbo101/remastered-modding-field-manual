---
title: Air delivery, fleets and support powers
description: Delivering vehicles by cargo plane as Tiberian Dawn's airstrip does, which Red Alert has no cargo plane for; giving a new faction its own ships, aircraft and support powers without opening Red Alert's types to it; the traps of bringing a TD aircraft into Red Alert's engine.
tags: [behaviours, aircraft, naval, superweapons, reinforcements, tiberian-dawn, dll]
holds_for: Steam build 21590013
status: verified
unproven: []
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Air delivery, fleets and support powers

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When a new faction needs Tiberian Dawn's airstrip delivery, its own navy or air force, or support powers of its own.
A mod that keeps Red Alert's sides and their production doesn't need this page.

## Cargo-plane delivery

**In Tiberian Dawn,** a vehicle built at the Nod airstrip isn't driven out. The airstrip's `Exit_Object` calls
`Create_Special_Reinforcement` with the cargo plane (`AIRCRAFT_CARGO`) and an unload mission. The plane flies in from
the map edge, sets the vehicle down beside the strip, and leaves (TD's `BUILDING.CPP` and `REINF.CPP`).

**Red Alert has no cargo plane type:** its aircraft list has no `AIRCRAFT_CARGO`. Porting the delivery means:

1. **An aircraft type** added to Red Alert's enum and constructor list, with a `rules.ini` section. Without one, its
   speed defaults to nothing and it sits frozen at the map edge.
2. **A classic image,** so `ImageData` isn't null, or `AircraftClass::Draw_It` returns before drawing and the plane is
   invisible. Borrow another aircraft's image; the launcher still finds the plane's own HD tiles by name. See
   [Adding a unit](../units/adding-a-unit.md).
3. **Its own size.** Red Alert's `Dimensions()` gives an unknown aircraft a small default box. A large plane leaves
   ghost trails on the map unless it gets its own.
4. **The airstrip's exit** calling the reinforcement with the cargo plane, as TD's does.
5. **Several deliveries in a row:** a second plane can arrive while the first is still in radio contact with the
   strip. Placement has to retry instead of giving up, planes should come in from a fixed edge with a fallback when
   the strip is busy, and the approach should fly straight in rather than circle.

## A faction's own fleet and air force

**Give a new faction its own types; never open Red Alert's to it.** Opening a stock building to another owner (the
Allied naval yard, the Soviet sub pen or airfield) brings its whole roster and its superweapon grants with it.
Clone what you need as new types owned by the new faction instead. Shared transports are the exception that works:
a transport with no roster behind it can be owned by every side.

## Support powers

Grant each support power from a host building, the way Red Alert grants its own superweapons in `HouseClass`: enable
it while the house has the building active, and remove it when the building goes. The power that fires decides what
it delivers, so a captured building of another era gives its own era's version.

## Traps

- **An aircraft with no `rules.ini` section** gets a speed of zero and never moves.
- **A null `ImageData`** makes an aircraft invisible, as for any unit.
- **Opening a stock building to a new owner** leaks its roster and superweapons.

## How it was verified

- **TD's delivery and what Red Alert lacks:** EA's TD `BUILDING.CPP` (the airstrip calling
  `Create_Special_Reinforcement` with `AIRCRAFT_CARGO`) and `REINF.CPP` (`SOURCE_AIR`), and Red Alert's `DEFINES.H`, with
  no cargo plane in its aircraft list.
- **A working mod:** cargo-plane delivery at its Nod airstrip, its GDI and Nod navies and airfield, and its Nod
  paratroops and recon flight, shipped and played under Proton on Linux and on the Steam Deck. The roster leak was hit
  in its first navy and A-10 builds and reverted.

> [!TIP]
> **In Tiberian Factions**
>
> TF's Nod airstrip delivers vehicles by TD's cargo plane. GDI has its own naval yard (a gunboat, a destroyer) and an
> airfield with TD's A-10, and Nod a sub pen with two submarines. Every side shares Red Alert's transport. Nod gets TD
> paratroops and a recon flight as support powers of its own.
>
> <!-- screenshot: a cargo plane setting a vehicle down beside the Nod airstrip -->
