---
title: EMP and stun
description: An EMP that disables vehicles and buildings for a time, ported from Tiberian Sun's EMPulseClass (OpenTS empulse.cpp) into Red Alert, which has no timed stun; what a pulse affects, the gates a stunned object needs, diggers, and a sensor that shows hidden enemies without decloaking them.
tags: [behaviours, emp, stun, superweapons, detection, tiberian-sun, dll]
holds_for: Steam build 21590013
status: verified
unproven: []
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# EMP and stun

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod wants a weapon that disables rather than destroys: Tiberian Sun's E.M. Pulse Cannon, a mobile EMP, or
any timed stun. Red Alert has none. EA's source has a `TechnoClass::Stun()`, but that's not a paralysis: it clears an
object's target and destination, breaks its radio contact and unselects it, as it leaves play. A mod without
disabling weapons doesn't need this page.

## How Tiberian Sun does it

From OpenTS's `empulse.cpp` (`EMPulseClass::Create`) and TS's `RULES.INI`:

- **The weapon's damage is the duration.** `[EMPulseWeapon]` has `Damage=1200`, commented "Damage is duration for EM
  Pulse". The warhead's `Spread=11` is the radius in cells.
- **Inside the circle:** grounded aircraft crash; underground units lose power and stop; buildings lose power for
  the duration; vehicles and aircraft with a locomotor are stunned. Plain infantry are untouched (only cyborgs are
  stunned), and Visceroids are immune.
- **The stun counts down** on each object (`StunDuration`). While it runs the object can't move, fire, produce or
  deploy. At zero, a building's power comes back.

## The method in Red Alert's DLL

1. **A stun timer** on `TechnoClass`, counted down in its AI.
2. **The pulse:** a function that, given a centre cell, radius and duration, walks the cells in a circle
   (`dx*dx + dy*dy <= r*r`) and applies TS's rules above. Call it from the warhead's impact instead of doing damage.
3. **Gates while stunned**, each one a place that must check the timer:
   - movement orders and events ignored, and movement finishes the current cell, then holds;
   - `Can_Fire` refuses;
   - the player can't move it;
   - deploying and taking off refused;
   - radar drops as if on low power, and gap and stealth generators stop.
4. **What TS keeps running:** a stunned power plant still produces power, a stunned construction yard still builds,
   and factories keep producing. Follow TS here, or a pulse on a base is far stronger than intended.
5. **Diggers:** a stunned unit underground is rerouted to the nearest cell it can surface on, and destroyed only if
   there's none (see [Subterranean units](subterranean-units.md)).

## Showing hidden enemies without decloaking them

TS's Mobile Sensor Array shows cloaked and buried enemies to its owner alone. One way to do it in Red Alert's
launcher: for each hidden enemy in range, export a **copy** of its draw entries to the sensor's owner, enemy-owned
(their colour and radar dot), see-through and unselectable. The real object stays hidden from everyone else. Make
cloaked ones attackable through the copy (the cell carries the attack action), and buried ones only visible, as in TS.

## Traps

- **TS's radius is for TS's cells.** `Spread=11` covered a whole Red Alert base. Size the radius to what the pulse's
  effect art covers on screen, so what the player sees stunned is what gets stunned.
- **Every gate is a separate place.** A stun that only stops movement leaves units firing, deploying or taking off.
  List every action and check each one.
- **The targeting cursor is the launcher's.** While a player aims a superweapon, the DLL is told nothing, so an
  out-of-range cursor can't be shown from the DLL (see [What the launcher owns](../engine/what-the-launcher-owns.md)).

## How it was verified

- **What stock Red Alert lacks:** `grep -a` over EA's Red Alert source finds no EMP and no timed stun. Its
  `TechnoClass::Stun()` (`TECHNO.CPP`) only clears targets, radio and selection.
- **TS's model:** OpenTS's `empulse.cpp` (the circle test, the aircraft crash, the underground layer, buildings'
  `Power_Off`, the cyborg-only infantry rule, `StunDuration`), and TS's `RULES.INI` (`[EMPulseWeapon]` `Damage=1200`,
  `[EMPuls]` `Spread=11`, `[EMPulseSpecial]`).
- **A working mod:** the E.M. Pulse Cannon, a Mobile EMP and the Mobile Sensor Array in its release, played under
  Proton on Linux and on the Steam Deck.

> [!TIP]
> **In Tiberian Factions**
>
> TS GDI's E.M. Pulse Cannon stuns for 30 seconds within 3 cells, and the Mobile EMP for 10 seconds within 3 cells.
> TF picked 3 because it's what the pulse's ring covers on screen; TS's 11 swallowed a Red Alert base. The Mobile
> Sensor Array shows cloaked and buried enemies to its owner with an EVA warning and a radar ping.
>
> ![An E.M. pulse stunning two walkers](img/emp-stun.jpg)
>
> TS GDI's E.M. Pulse Cannon fired between a Titan and a Wolverine (left); a moment later both walkers are stunned, sparking purple (right). The EMP hits its owner's own units too.
