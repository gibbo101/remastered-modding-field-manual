---
title: New screens and buttons
description: A mod can add front-end buttons and whole screens of its own. Clone a stock widget into a loose .BUI, build a new screen on ClientG's registered but unused SplashScreen class, and bind every click from a launcher patch, with each launcher function checked by its opening bytes first.
tags: [front-end, ui, bui, screens, clientg, code-patch, advanced]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
clientg_sha256: d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897
status: verified
unproven: [new widgets on the in-match HUD by the same route, other unused screen classes besides SplashScreen]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# New screens and buttons

## When you need this

When your mod needs a button or a whole screen that the launcher doesn't have, such as a settings page, an add-ons
manager or an encyclopedia, reached from the main menu. Restyling, moving or hiding existing widgets is data only:
see [BUI screens](bui-screens.md). This page is for behaviour the launcher has no code for.

> [!WARNING]
> **Fragile: this patches the launcher's code and calls its internal functions.** Read
> [Patching the launcher's code from your DLL](../clientg-ram/patching-the-launchers-code.md) first. Its rules
> apply to every call and hook here.
>
> - **Verified against:** `ClientG.exe` version 1.153 (745903), 34,797,928 bytes, SHA-256
>   `d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897` (Steam build 21590013).
> - **What it depends on:** the addresses and calling conventions of the launcher functions below, the main
>   menu's event-binding site, and the screen object's layout (`+0x330`, vtable `+0x2CC`).
> - **How it fails if the client changes:** check the opening bytes of every function you'll call, and the hook
>   site's, before installing anything, and install nothing if one differs. The cloned buttons then draw and do
>   nothing, and your screens never open. Calling an internal function at a guessed address crashes the launcher.
> - **Keep it in the front end.** Everything here runs in the launcher's UI, and the simulation never sees it.

**HD mode only.** This page describes the HD renderer. See [HD-only mods](../getting-started/hd-only-mods.md).

**Holds for:** the client in the box above. EA has stopped patching the game and archived the source in January
2025, so the build should stay put, but check the hash before trusting any address.

## Why data alone isn't enough

A `.BUI` can clone a button, and the clone draws. But the launcher wires up behaviour in its own code, by looking
up the widget names it expects, so a clone it has never heard of does nothing when clicked. A new screen is the
same. Each stock screen's `.BUI` names the C++ class that runs it, and that class binds the widgets *it* knows. So
your patch has to do the binding.

## A new main-menu button

1. **Clone a stock button** in a loose copy of `RA_MAIN_MENU.BUI`, as on [BUI screens](bui-screens.md): copy Exit
   Game's widget, rename it (say `MyMod_Settings`), give it a new rect and label, and make room for it by moving
   the rows below.
2. **Hook the moment the menu binds its own buttons.** A register-snapshot hook at the menu's event-binding site
   hands your handler the menu object.
3. **Find your widget and bind its click.** Look the widget up by name through the launcher's own find function,
   cast it to a text button, then call the launcher's event binder with the click event (`0x21`) and your handler.

The main menu lives for the whole session, so anything on it that should change (a notice, a counter) needs its
own refresh, such as a timer on the UI thread.

## A new screen

1. **Write the screen as a `.BUI` of your own**, loose at `Data/ART/GUI/RA/<NAME>.BUI`. The easiest start is a
   copy of a stock screen with its widgets restyled, hidden or cloned.
2. **Run it on a class that binds nothing.** Set the scene's class to `SplashScreen`. `ClientG.exe` registers it,
   but no stock screen uses it, so it brings no handlers of its own. If you kept the stock screen's class, it
   would try to bind the stock widgets it expects.
3. **Open it from your button's handler:** get the GUI manager, create a scene instance named `RA/<Name>` (the same
   form `FACTIONS.XML` uses for screen names), and focus it. The new scene draws over the main menu, and the menu
   carries on underneath.
4. **Bind its widgets.** The scene's behaviour object, at `+0x330`, owns its widgets and events. Find each widget
   and bind it as for the menu button. A handler bound with data `n` receives the behaviour object and `n`, so one
   handler can serve a whole row of buttons or tabs.
5. **Close it** through the scene's own close (its vtable, `+0x2CC`), then release it.

### Addresses in this client

| What | Address | Opening bytes on disk |
|---|---|---|
| GUI manager (returns it) | `0x5ED5D0` | `A1 B8 3F FA 01 85` |
| Create scene instance | `0xF2CB70` | `55 8B EC 83 EC 1C` |
| Focus a scene | `0xF0E1D0` | `53 56 57 8B F9 E8` |
| Release a scene | `0x55FE10` | `53 8B D9 83 7B 04` |
| Find a widget by name | `0xF0D980` | `55 8B EC 51 83 3D` |
| Cast to text button | `0x5EF8A0` | `55 8B EC 83 EC 64` |
| Cast to button | `0x606990` | `55 8B EC 83 EC 4C` |
| Set a widget's text | `0xF1D270` | `55 8B EC 83 EC 1C` |
| Bind an event | `0x6A9F50` | `55 8B EC 51 53 8B` |
| Main menu's binding site (hook) | `0x6B185B` | `6A 15 68 F0 7E C1 01` |

## Traps

- **Check everything before installing anything.** One mismatched function means a different client. Install
  none of the screen, not just the part that failed.
- **Hidden widgets should shrink in place.** A widget moved off screen widens the screen's fit, which stretches
  the menu and its clicks on ultrawide displays (observed).
- **A Workshop download doesn't reach the mods list until a restart.** If your screen switches mods on or off, the
  launcher's own list only rescans on a restart or Mods > Refresh (observed).

## How it was verified

- **The class:** `SplashScreen` is in `ClientG.exe`'s strings beside `Create_Scene_Instance`. None of the 207 stock
  `.BUI` files uses it, and a shipped screen that does draws and works.
- **The calls:** every address above was read from `ClientG.exe` on disk, and matched the opening bytes a working
  patch checks before installing.
- **In play:** a released mod adds three main-menu buttons and three screens of its own this way (an add-ons
  manager, a faction encyclopedia and a settings page), on Linux under Proton and on the Steam Deck.

> [!TIP]
> **In Tiberian Factions**
>
> TF's main menu has TIBERIAN FACTIONS ADD-ONS, FACTION ENCYCLOPEDIA and TIBERIAN FACTIONS SETTINGS, each a
> clone of Exit Game. The ADD-ONS screen is a restyled copy of TF's campaign page, run on `SplashScreen`. It has
> tabs and rows cloned from stock widgets, checkboxes from the Bonus Gallery, and a download bar, and it subscribes,
> downloads and switches the mod's asset packs on and off.
>
> <!-- screenshot: the ADD-ONS screen open over the main menu -->
