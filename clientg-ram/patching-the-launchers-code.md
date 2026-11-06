---
title: Patching the launcher's code from your DLL
description: ClientG loads a mod's DLL at its own start-up for a version check; DllMain runs inside the launcher there, so a pinned DLL can hook launcher functions on every machine, LAN joiners included, if every write checks the stock bytes first. A hidden message hooked in the launcher's event dispatcher tells each launcher its own player's details.
tags: [clientg, code-patch, hooks, dll, advanced]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
clientg_sha256: d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897
status: verified
unproven: [whether ClientG unloads an unpinned DLL before a hook into it would run, which is the reason for pinning; not tested by leaving the pin out]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Patching the launcher's code from your DLL

## When you need this

Only when your mod must change something the launcher does, and no data file or cached record reaches it. Examples
are launching a map list entry the game doesn't know, reacting to a launcher event, or giving each LAN player a
launcher patch of their own. Most mods never need this. Exhaust the data files first, including the launcher's
constants and screens, and then [re-pointing cached records in memory](repointing-atlas-regions.md).

> [!WARNING]
> **Fragile: this rewrites the running launcher's machine code.**
>
> - **Verified against:** `ClientG.exe` version 1.153 (745903), 34,797,928 bytes, SHA-256
>   `d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897` (Steam build 21590013).
> - **What it depends on:** every patch site's address and its exact instruction bytes, and the unused padding used
>   as code caves. All of it belongs to this one build.
> - **How it fails if the client changes:** done as described here, each patch compares the stock bytes at its site
>   and checks that its cave is still empty before writing. On any other client the comparison fails, nothing is
>   written, and the launcher behaves as stock. A patch that writes without checking will crash a different client,
>   or quietly corrupt it.
> - **Rules:**
>   - Compare the stock bytes before every write, and refuse the patch on any mismatch.
>   - Check that every byte of a cave is zero before using it.
>   - Pin the DLL before installing any hook that calls into it.
>   - Patch only when the process really is `ClientG.exe`. The game process loads the same DLL.
>   - Keep it in the launcher. The simulation never sees these patches, so they can't desync a LAN game.

**Holds for:** the client in the box above. EA has stopped patching the game and archived the source in January
2025, so the build should stay put, but check the hash before trusting any address.

## The way in: the launcher loads your DLL

The Remastered Collection runs a game in two processes. `InstanceServerG.exe` runs the simulation through the mod's
DLL. `ClientG.exe` is the launcher, which draws everything and handles the menus. ClientG also loads the mod's DLL
once at its own start-up, on every machine, to call `CNC_Version` (the version check in EA's `DLLInterface`), and
releases it a moment later. You can see the split in the executables: ClientG names only `CNC_Version` among the
DLL's exports, while the instance server names `CNC_Version` and `CNC_Advance_Instance`.

That brief load runs your `DllMain` inside the launcher, which makes it the way in:

```c
case DLL_PROCESS_ATTACH:
    // GetModuleFileNameA(NULL, ...) ends in "ClientG.exe": install the launcher patches here.
```

Because the launcher loads the DLL on every machine, each LAN player's launcher patches itself. A patch made from
the simulation instead reaches only the host's launcher: in a LAN game only the host runs the simulation.

## Keeping the DLL loaded

Every hook jumps into your DLL, so it has to stay loaded after the version check. Call `GetModuleHandleExA` with
`GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS | GET_MODULE_HANDLE_EX_FLAG_PIN` on one of your own functions *before*
installing any hook, and install nothing if the pin fails.

## Writing code

Inside the launcher's own process: `VirtualProtect` the range to `PAGE_EXECUTE_READWRITE`, copy the bytes in,
restore the old protection, then `FlushInstructionCache`. To patch from another process, use the same steps with
`VirtualProtectEx` and `WriteProcessMemory`.

## Three hook shapes

- **Redirect a call.** At a `call rel32` (`E8` + offset), first check that the existing offset points at the stock
  function, then rewrite it to point at yours. This is the smallest patch, and it affects only that one caller.
- **Detour a function.** Copy the function's first 5 to 27 bytes, which must be position-independent instructions,
  into a cave and add a jump back after them. Then write a jump to your hook over the function's start. Calling
  the cave calls the stock function.
- **Snapshot registers mid-function.** At an instruction boundary, jump to a stub in a cave. The stub runs
  `pushfd`, `pushad`, `push esp` and `call` your handler, which reads the saved registers. Then it runs `popad` and
  `popfd`, replays the displaced instructions, and jumps back. This lets you read a value the launcher holds only in
  a register.

**Where the caves are.** ClientG's `.text` section ends at `0x1BE919C`, but its last memory page runs on to the
next section at `0x1BEA000`. Windows maps that tail as zero-filled, executable memory: about 3.6 KB of room for
code, shared by every patch you write. Plan who gets which bytes, and check every byte is still zero before writing,
so that two patches never share a cave and a changed client never runs one.

## Telling each player's launcher something

Each launcher patches itself, but only the host's simulation knows each player's faction. The simulation can reach
every launcher through EA's message callback, and a hook can read the message before the launcher shows it:

1. **Send it from the DLL** with `CALLBACK_EVENT_MESSAGE`, as `On_Message` does with `MESSAGE_TYPE_DIRECT`: one
   message per human house, with a marker of your own at the start of the text and the player's GlyphX ID in it.
2. **Hook the launcher's event dispatcher**, `IncomingExternalGamePluginEventClass::Execute` (`0x783B60`), at its
   type switch, `0x783B82`. The stock bytes there are `8B 43 10 8D 48 FF 83 F9 0D 0F 87 76 27 00 00`: the event's
   type is at `+0x10`, and the switch takes 14 types. A snapshot hook (above) hands your handler the event in
   `ebx`.
3. **Pick out your messages.** In the launcher a message event is type 6. Its text is an MSVC `std::string` at
   `+0x180` (length at `+0x190`, capacity at `+0x194`; with a capacity under 16 the characters sit at `+0x180`
   itself, otherwise `+0x180` points at them).
4. **Hide it.** The kind is at `+0x19C`. EA defines four kinds (`MESSAGE_TYPE_DIRECT` to
   `MESSAGE_TYPE_PLAYER_DISCONNECTED`, 0 to 3). Set it past them, to `0x7F`, and the launcher shows nothing.
5. **Act only on your own player's.** The launcher keeps its own player's GlyphX ID at `0x1FB6D48`, valid once the
   byte at `0x1FB6D40` is non-zero. Compare it with the ID in the text, and hand the work to a thread of your own,
   off the launcher's thread.

Send it more than once (a mod sends on game frames 1, 45 and 150 after match start), since a joiner's
launcher may still be loading at the first.

## How it was verified

- **The two processes:** the exports each executable names (above), EA's `CNC_Version` in `DLLInterface.cpp`, and
  the DLL's own load seen inside ClientG.
- **The hooks:** each hook shape above runs in a shipped mod's release builds, against the client in the box, on
  Linux under Proton and on the Steam Deck. Both machines' `ClientG.exe` hash the same.
- **Every LAN player patched:** checked in a LAN game, with a Deck hosting and a desktop joining. Each launcher's
  patches followed its own player.
- **The message route:** the dispatcher's bytes at `0x783B82` read from `ClientG.exe` on disk; the four message
  kinds and `CALLBACK_EVENT_MESSAGE` in EA's `DLLInterface.h`; the class name is a `ClientG.exe` string, and
  `0x1FB6D48` is referenced from its code. In the same LAN game, every joiner's launcher acted on its own message,
  and no message text showed.
- **Unproven:** that an unpinned DLL is gone before a hook into it would run. That's why the pin is there, but
  nobody has tested what happens without it.

> [!TIP]
> **In Tiberian Factions**
>
> TF's launcher patches all install from this one load: a hook on the launcher's event dispatcher, the deploy and
> special-ability keys, and the hooks that launch new entries in the skirmish map list. At match start the host
> sends each player a hidden message naming their faction, and the hooked dispatcher has each launcher patch
> itself. That is how a LAN joiner's radar crest follows their faction.
