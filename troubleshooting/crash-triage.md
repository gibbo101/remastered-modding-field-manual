---
title: Crash triage
description: Reading a Remastered crash. CrashLog.txt names the crashing process (ClientG, the launcher, or InstanceServerG, which runs your DLL) and its EIP; a minidump gives the DLL's load base and the stack; addr2line on the unstripped DLL gives the source line; and ClientG's fatal-assert address (RVA 0x56A539) means an assert, whose text is on the crash thread's stack.
tags: [troubleshooting, crashes, minidump, debugging, dll, clientg]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
clientg_sha256: d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897
status: verified
unproven: [whether every ClientG assert goes through the same fatal-assert address]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Crash triage

**Holds for:** C&C Remastered Collection, Steam build 21590013, `ClientG.exe` 1.153 (745903). EA has stopped
patching the game and archived the source in January 2025, so this should hold.

## When you need this

When the game crashes with your mod loaded, and you need to know whether it's your code, your data, or neither.
Each step below narrows it down, and the first step takes seconds. Where the log and the minidumps live under
Proton is on [Testing under Proton and on the Steam Deck](../getting-started/testing-under-proton.md).

## 1. Which process crashed

Each crash adds one line to the game's `log/CrashLog.txt`, written by the launcher:

```
[...]:<date> <time>|ClientLauncher|Crash|0|Process: InstanceServerG.exe, Version: 1.153.745903, PID: ..., ThreadID: ..., EIP: 0x..., Hash: 0x...
```

- **`InstanceServerG.exe`** runs the simulation through your DLL. A crash here is usually in your DLL's code, or
  in EA's game code you inherited.
- **`ClientG.exe`** is the launcher: it draws, plays sound and runs the menus. Your DLL's code doesn't run there
  unless you patch the launcher. But your *data* reaches it (XML, art, sound files, a replacement `CONFIG.MEG`),
  and bad data crashes it.
- **`EIP`** is the address that faulted. **`Hash`** identifies the crash's call stack: two lines with the same hash
  are the same crash.

## 2. Is the EIP inside your DLL?

A mingw-built DLL asks to load at `0x6AA00000` (its `ImageBase`), but it's relocatable (`DYNAMIC_BASE`), so the
only sure answer comes from the minidump's module list (step 3). If the DLL loaded at its preferred base, an EIP
between `0x6AA00000` and the base plus the DLL's size is in your DLL. An EIP far away from it, such as the
`0x7B…` range where Wine keeps its own system DLLs, is in system code that your code or the launcher called.

To turn an address in your DLL into a source line, keep the **unstripped** build of exactly the DLL that crashed
(see [Building the DLL on Linux](../getting-started/building-the-dll-on-linux.md)), then:

```bash
i686-w64-mingw32-addr2line -f -C -e RedAlert.dll 0x<address>   # address as the DLL's preferred base sees it
```

If the DLL loaded somewhere else, subtract its actual base and add `0x6AA00000` first.

## 3. Read the minidump

Each crash also writes a minidump under the prefix's `AppData/Roaming/CnCRemastered/`, named after the process:
`InstanceServerG.exe_<date>_<time>_T<thread>.dmp` or `ClientG.exe_...`. A minidump holds:

- the **module list**, with each DLL's actual load base, which turns the EIP into an offset in your DLL;
- the **exception** (code and address), such as `0xC0000005` for an access violation or `0xC00000FD` for a stack
  overflow;
- the faulting thread's **stack**.

A stack walk needn't be clever. Scan the faulting thread's stack for values that fall inside your DLL's range: each
is a likely return address, and `addr2line` names the function. A stack overflow shows as one cycle of the same
few functions repeated thousands of times.

## 4. A ClientG crash at RVA `0x56A539` is an assert

In `ClientG.exe` 1.153 (745903), RVA `0x56A539` (address `0x96A539`) is `mov dword [0], 1`: a deliberate write to
address 0, reached after the launcher's assert check fails. A crash there says nothing about that address. It says
an assert failed, and the assert's message is the clue. It's still on the crashing thread's stack, so read the
strings near the top of that stack in the minidump. A message like

```
pglib\xml.cpp(1227): error reading xml header from .\Data\XML\GameConstants.xml
```

names a file, but **the file it names isn't always the culprit.** A replacement `CONFIG.MEG` with one member
the wrong size makes every member after it read from the wrong offset, and the assert names whichever of them the
launcher happened to read first. See
[Overriding the launcher's data](../launcher-data/overriding-launcher-data.md).

## Traps

- **Keep the unstripped DLL for every build you hand out.** A stripped DLL has no line information. The PE header's
  timestamp changes on every link, so you can't rebuild an identical one later.
- **A ClientG crash can still be your mod's.** Bad data reaches the launcher: a `CONFIG.MEG` member of the wrong
  size, a plain-PCM sound file with audio in it, a new terrain template drawn from loose art (which stops at the
  assert address above), and any launcher patch you install.
- **"Video Card Driver Crash Detected!"** and `DXGI_ERROR_DEVICE_REMOVED` are the launcher's own messages for a
  lost Direct3D device. They don't clear the mod on their own. A large mod uses far more video memory than the
  base game, and running out is one plausible cause (**unproven**).
- **The game DLL has no graphics imports.** EA's `RedAlert.dll` and `TiberianDawn.dll` import only `WINMM`,
  `WS2_32`, `KERNEL32`, `USER32`, `OLEAUT32` and (Red Alert) `ole32`; a mingw build's list is on
  [Building the DLL on Linux](../getting-started/building-the-dll-on-linux.md). None imports `d3d11`, `dxgi` or
  `gdi32`: the launcher does all the drawing. A DLL reaches Direct3D only through the launcher's own objects, which
  means patching the launcher. A DLL that doesn't patch the launcher can't cause a device crash through its own
  calls.

## How it was verified

- **The log line:** `CrashLog.txt` from an install, read for this page (its format only; no line is reproduced),
  a working mod's crash runbook, and the launcher's own `ClientLauncher|Crash` entries for both processes.
- **The minidumps:** dump files of both processes in a Proton prefix, named as above; a working mod's minidump
  walker, which reads the module list (stream 4), the exception and the faulting stack; and stack-overflow crashes
  diagnosed this way (`0xC00000FD`).
- **The DLL's base and lines:** `objdump -p` on a mingw-built DLL (`ImageBase 6aa00000`, `DYNAMIC_BASE`), and
  `addr2line` on the unstripped build resolving a known function's address to its source line.
- **The fatal-assert address:** the instruction at `0x96A539` disassembled from `ClientG.exe` on disk, and two
  separate crash investigations in a working mod's notes that both stopped there, one of them traced to a wrong-size
  `CONFIG.MEG` member and the assert text read from the stack.
- **The DLL's imports:** `objdump -p` on the installed `RedAlert.dll` and `TiberianDawn.dll` and on a mingw-built
  mod DLL, a shipped mod's crash runbook, and that mod's one Direct3D call, made on a texture it reads from the
  launcher's memory.
- **Unproven:** whether every launcher assert goes through that one address.

> [!TIP]
> **In Tiberian Factions**
>
> TF triages every player report this way. The `CrashLog.txt` line decides which process to look at, a minidump
> walker pulls the DLL's return addresses off the faulting stack, and the unstripped DLL of that release names
> them. Its worst launcher crash, in 5.0.0, came from its own memory patch writing over heap headers, and the
> crash surfaced on the next skirmish load.
