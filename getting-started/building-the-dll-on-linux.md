---
title: Building the DLL on Linux
description: Cross-compile a Remastered Collection game DLL on Linux with 32-bit mingw-w64 and Vanilla Conquer's remaster preset, with -fpermissive for the MSVC-only code in dllinterface.h, then strip it before shipping. The build's mod folder is copied only when the DLL relinks and never loses files, so restage it.
tags: [getting-started, build, dll, linux, mingw, vanilla-conquer]
holds_for: Steam build 21590013
status: verified
unproven: []
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Building the DLL on Linux

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When your mod changes game code, not just data, and you build on Linux. The Remastered Collection runs each game
through a DLL (`RedAlert.dll` or `TiberianDawn.dll`), and a mod can ship its own. This page builds one from
[Vanilla Conquer](https://github.com/TheAssemblyArmada/Vanilla-Conquer), the maintained, CMake-based fork of EA's
released source, with no Windows machine involved. A data-only mod doesn't need a DLL at all.

## Why 32-bit

The game is 32-bit throughout. `ClientG.exe`, `InstanceServerG.exe` and the stock `RedAlert.dll` are all
`PE32 ... Intel 80386`. A 64-bit DLL can't load into a 32-bit process, so the build must use the **i686** mingw
toolchain, not the x86_64 one.

## The build

On Ubuntu 24.04 or later:

```bash
sudo apt install -y cmake g++-mingw-w64 mingw-w64-tools ninja-build
```

From the root of a Vanilla Conquer checkout (or your fork of it):

```bash
CMAKE_TOOLCHAIN_FILE=cmake/i686-mingw-w64-toolchain.cmake \
  VC_CXX_FLAGS="-w;-fpermissive" \
  cmake --workflow --preset remaster
```

- `cmake/i686-mingw-w64-toolchain.cmake` ships with Vanilla Conquer. It points CMake at
  `i686-w64-mingw32-gcc` and `-g++`. CMake reads `CMAKE_TOOLCHAIN_FILE` from the environment, which is how
  Vanilla Conquer's own mingw CI passes it.
- The `remaster` preset turns on `BUILD_REMASTERRA` and `BUILD_REMASTERTD` and turns the standalone games off. It
  builds `RelWithDebInfo` with Ninja.
- `VC_CXX_FLAGS` is read from the environment by Vanilla Conquer's `cmake/Compilers.cmake`. It's a CMake list, so
  separate the flags with `;`.

## Why `-fpermissive`

`dllinterface.h` is written for MSVC. Its constructors are declared with an extra qualification inside their own
struct, as in `EventCallbackStruct::EventCallbackStruct(void)`, which GCC rejects:

```
error: extra qualification 'E::' on member 'E' [-fpermissive]
```

`-fpermissive` turns that error into a warning, and `-w` silences the warnings. The DLL built this way runs
correctly. Vanilla Conquer's CI never builds this combination: its mingw jobs build the standalone games, and its
remaster DLLs are built with MSVC.

## What comes out

| Path under `build/remaster/` | What it is |
|---|---|
| `RelWithDebInfo/RedAlert.dll`, `RelWithDebInfo/TiberianDawn.dll` | The linked DLLs |
| `Vanilla_RA/` | A complete mod folder: `ccmod.json` plus `Data/RedAlert.dll` |
| `Vanilla_TD/` | The same for Tiberian Dawn |

A post-build step copies `resources/remaster_mods/Vanilla_RA/` (your `ccmod.json` and any data) into
`build/remaster/Vanilla_RA/`, then puts the DLL in its `Data/`. That folder is what you install or upload: see
[The mod folder and ccmod.json](the-mod-folder-and-ccmod-json.md).

## Traps

- **Strip before shipping.** The `RelWithDebInfo` build keeps its debug sections: one measured at 33 MB, against
  1.2 MB for the stock DLL. `i686-w64-mingw32-strip --strip-all` took the same DLL to 2.7 MB. Keep the unstripped
  copy for reading crash addresses.
- **No runtime DLLs to ship.** Vanilla Conquer links libstdc++ and libgcc statically for mingw
  (`-static-libstdc++ -static-libgcc`), so the DLL imports only Windows system DLLs (`KERNEL32`, `msvcrt`,
  `USER32`, `SHELL32`, `OLEAUT32`, `WINMM`).
- **The mod folder in `build/` goes stale.** The copy of `resources/remaster_mods/Vanilla_RA/` is a `POST_BUILD`
  step, so it runs only when the DLL relinks: a data-only change never reaches `build/remaster/Vanilla_RA/`. And
  `cmake -E copy_directory` only adds and overwrites, so a file you rename or delete in `resources/` stays in the
  build folder. Before you test or ship, restage that folder from scratch: delete it and copy `resources/` and the
  DLL in again.
- **No two builds are byte-identical.** The link time is written into the DLL's PE header, so its hash changes on
  every relink, even from the same source. Give every machine in a LAN test the same copy.

## How it was verified

- **32-bit:** `file` on the installed `ClientG.exe`, `InstanceServerG.exe` and stock `RedAlert.dll`, and on a
  mingw-built DLL (`pei-i386` in `objdump -f`).
- **The toolchain and preset:** Vanilla Conquer's `CMakePresets.json`, its toolchain file, its `mingw.yml` and
  `windows.yml` CI workflows, and its `Compilers.cmake`.
- **`-fpermissive`:** the extra qualification in `dllinterface.h`, reproduced in a three-line file with
  `i686-w64-mingw32-g++` 13: an error without the flag and a warning with it.
- **The output layout:** the `POST_BUILD` copy in `redalert/CMakeLists.txt`, and a real build tree.
- **The stale folder:** that `POST_BUILD` step, and a test project (CMake 3.28, Ninja) whose `POST_BUILD` command ran
  on the first build and after a source change but not on an up-to-date rebuild; `cmake -E copy_directory` run
  twice, which left a file deleted from the source in the destination; and Tiberian Factions' deploy script, which
  restages the folder from scratch for that reason.
- **The imports, size and timestamp:** `objdump -p` and `strip` on a built DLL, compared with a shipped one.
- TF is built this way, ships on the Workshop, and is played under Proton on Linux and on the Steam Deck.

> [!TIP]
> **In Tiberian Factions**
>
> TF is a Vanilla Conquer fork built only this way: on Linux, with no Windows machine. Its release script builds
> with the dev cheats compiled out, strips the DLL, and stages the mod folder from scratch, so nothing left over
> in `build/` can ship.
