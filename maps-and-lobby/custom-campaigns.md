---
title: "Custom campaigns: replacing the official ones"
description: Replace or add to Red Alert's official campaigns. INSTANCES.XML decides what Mission Select shows, the campaign files decide what launches, and a stock mission slot plays your own scenario INI shipped in CCDATA with its [Digest] removed; brand-new instances still need a launch route.
tags: [maps, campaigns, missions, mission-select, instances, ccdata]
holds_for: Steam build 21590013
clientg_version: 1.153 (745903)
clientg_sha256: d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897
status: verified
unproven: [a campaign map (territory movie and click areas) of your own, branches that unlock different stages instead of rejoining, launching a brand-new campaign instance outside a dev build, a hijacked stock slot moved to another tab by changing its House, where the player's campaign progress is stored]
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Custom campaigns: replacing the official ones

**Holds for:** C&C Remastered Collection, Steam build 21590013. EA has stopped patching the game and archived the
source in January 2025, so this should hold.

## When you need this

When a Red Alert mod wants its own single-player missions in Mission Select: replacing official missions, adding to
a campaign, or hiding the stock ones. Replacing a stock mission's content is data only, and proven. Adding a
mission under a name the game doesn't know also needs a launch route, the same wall that
[new skirmish maps](new-maps-in-the-skirmish-list.md) hit. A mod that only adds skirmish maps doesn't need this
page.

## Display and launch are separate

Two sets of data drive Mission Select, and they do different jobs:

| To change | Edit | Effect |
|---|---|---|
| Whether a mission **shows** | `INSTANCES.XML`, `<ShowOnMissionSelect>` | `false` hides it, even if the player has completed it |
| Whether it's **unlocked from the start** | `INSTANCES.XML`, `<IsUnlockedAtStart>` | `true` always shows it; otherwise the player's progress decides |
| **Which game's** Mission Select lists it | `INSTANCES.XML`, `<ExternalGameID>` | `RedAlert` or `TiberianDawn`. A TD instance never lists in Red Alert. |
| Its **name and briefing** | `INSTANCES.XML`, `<LocationNameTextID>`, `<MissionBriefingTextID>` | Text IDs, looked up in the game's text |
| Whether it **launches**, and what comes next | the campaign files (`RA_ALLIES.XML`, `RA_ALLIES_MISSIONS.XML` and the like, in `CONFIG.MEG`'s `DATA\XML\CAMPAIGNS\`) | A mission whose definition is removed still lists, but its Start does nothing. `MapStageUnlock` chains to the next stage. |

So **the roster shown comes from `INSTANCES.XML`**, not from the campaign files. Cutting a campaign file down to two
missions still shows all fourteen. Adding missions to a campaign's `<Stages>` doesn't make them appear.

Both kinds of file ship loose in the mod, as patched copies of the stock ones. See
[Overriding the launcher's data](../launcher-data/overriding-launcher-data.md).

## Replacing an official mission: shadow its scenario

A stock mission slot plays whatever scenario INI of the right name it finds first, and a file in your mod's
`CCDATA/` folder comes first. So, to replace the mission's content:

1. **Find the slot's file name.** It's built from the instance's `<Mission>` number:
   `SC` + the house's letter + two digits + direction + variant, `.INI`. Aftermath's first Allied mission,
   `Mobius_Allied_Aftermath_Campaign_43_Map` with `<Mission>43</Mission>`, plays `SCG43EA.INI`.
2. **Write your scenario** in Red Alert's format. Starting from the stock file is easiest.
3. **Remove the `[Digest]` section.** Red Alert checks a scenario's digest at load. A wrong digest aborts the
   load (only multiplayer scenarios numbered below 25 are exempt), but a *missing* digest skips the check. Any edit makes the old
   digest wrong, so delete it.
4. **Ship it** as `CCDATA/SCG43EA.INI` in the mod. No `CONFIG.MEG` change is needed.

The mission keeps its slot: its tab, its name and briefing (from `INSTANCES.XML` and the game's text), its movies
and its place in the campaign chain. The INI's own `[Briefing]` feeds only the in-game briefing screen. To restyle
the name, briefing or movies, edit the instance too.

## Adding a mission: data shows it, but launching is the hard part

A new `<Instance>` shows on Mission Select once it has the right `Variant`, `<ShowOnMissionSelect>true` and
`<IsUnlockedAtStart>true`. **But it won't start.** The instance server only starts instances it knows from the
base game's data, the same wall as new skirmish maps. There are two ways round:

- **Use stock slots.** Hide the stock missions you don't want, and give the ones you keep your scenarios as above.
  This is proven, and needs no launcher patch. The number of missions is limited to the stock slots.
- **A mission carrier.** Launch your instance under a stock instance's name and hand the DLL your map, as
  [the skirmish carrier](new-maps-in-the-skirmish-list.md) does. **Unproven for general use:** the only working
  version is one mod's development build, wired to one map.

Three data rules for a new instance:

- **Put it after its `Variant`.** The launcher reads `INSTANCES.XML` in one pass, so an instance placed before the
  instance it inherits from inherits nothing, and lists on no tab. The stock file always defines a variant before
  using it: append your instances at the end.
- **The `Variant` picks the tab.** `Mobius_Allied_Campaign_Base` lists on the Allies tab,
  `Mobius_USSR_Campaign_Base` on the Soviets', `Mobius_Aftermath_Allied_Map_Base` and `..._USSR_Map_Base` on the
  expansion tabs, `Mobius_Ant_Map_Base` on the Ant tab.
- **Its name needs Red Alert text.** A Tiberian Dawn text ID doesn't resolve in Red Alert's Mission Select, and
  shows a placeholder.

## Tabs and houses

The launcher sorts each Red Alert mission onto a tab by game, expansion and house. Its side tests only know Red
Alert's countries: a mission whose `<House>` is `GDI` or `NOD` lands on no Red Alert tab at all. Putting GDI or Nod
missions in Red Alert's Mission Select therefore takes a launcher code patch on the tab sort. See
[Patching the launcher's code from your DLL](../clientg-ram/patching-the-launchers-code.md) and its fragility rules.

> [!WARNING]
> **Fragile:** these addresses and bytes belong to `ClientG.exe` 1.153 (745903), SHA-256
> `d405ed389548be51c67740bb6309de10a5f02bdfc86324a10c9ad3b663c08897`. Compare the stock bytes before any write,
> and leave the launcher alone if they differ: the missions then simply don't list.

| In `ClientG.exe` 1.153 (745903) | Address | Stock code |
|---|---|---|
| Allied-side test (faction 3 to 6: Spain, Greece, England, France) | `0x118E830` | `8B 81 88 04 00 00 83 C0 FD 83 F8 03 0F 96 C0 C3` |
| Soviet-side test (faction 7 to 8: USSR, Ukraine) | `0x118E840` | `8B 81 88 04 00 00 83 C0 F9 83 F8 01 0F 96 C0 C3` |
| Expansion tabs' calls to them | `0x63382F`, `0x633878` | `E8` to the two tests |

The mission's faction is read from the instance at `+0x488`. GDI is 0 and Nod 1, which is why neither passes.

## The campaign map and branching missions (open)

> [!CAUTION]
> **Unsolved.** Nobody has made a campaign map of their own yet, or a branching campaign that doesn't rejoin. This
> section records what the stock files show, and where the trail goes cold.

Between missions, Red Alert's campaigns show a map of territories, and the player picks the next mission on it.
`RA_CAMPAIGNMAPS.XML` (in `CONFIG.MEG`'s `DATA\XML\CAMPAIGNS\`) defines it, one `CampaignMapSelectMapClass` per
tab:

```xml
<CampaignMapSelectStageClass>
    <TerritorySelectMovie>RA/AlliesMap_03.bk2</TerritorySelectMovie>
    <Maps>
        <Entry>RA_ALLIES_3A</Entry>
        <Entry>RA_ALLIES_3B</Entry>
    </Maps>
</CampaignMapSelectStageClass>
```

- **Each stage's map is a pre-rendered movie,** a Bink file in the base game's `MOVIES_RA.MEG`
  (`DATA\ART\MOVIES\RA\ALLIESMAP_03.BK2`). Stage 1 has no map at all.
- **A stage's entries are its choices.** Stage 3 offers `3A` or `3B`, and stage 5 offers three.
- **The original's branches rejoin.** In `RA_ALLIES_MISSIONS.XML`, both `RA_ALLIES_3A` and `RA_ALLIES_3B` unlock stage
  4 (`MapStageUnlock`). A branch is a choice of which version of a stage to play, and then the story converges.
- **Units can carry over.** `RA_ALLIES_4` has `<RestoreAllUnits>` naming mission 2's instance, which brings that
  mission's surviving units back.

**Where it goes cold:**

- **A map of your own.** The file names the movie and the choices, but nothing in it says where each choice sits on
  the map, or which part the player clicks. That link isn't in any data file read so far, so it's in the movie, in
  another file, or in the launcher's code. Until it's found, a custom campaign can reuse the stock maps (with the
  stock territories) but can't draw its own. **Unproven.**
- **Branches that don't rejoin.** Whether two choices in one stage can unlock *different* stages, so the story
  splits for good, hasn't been tested. The stock campaigns never do it. **Unproven.**

## Traps

- **Progress decides what shows.** A mission not yet unlocked doesn't list, even with `ShowOnMissionSelect`
  true. Only `IsUnlockedAtStart` overrides that. Where the player's progress is kept is unknown: it isn't in the
  local settings file. **Unproven.**
- **TD's campaigns can't be borrowed.** Their instances are `TiberianDawn` instances on TD's tabs, and TD's scenario
  format doesn't run in Red Alert's engine. A GDI or Nod campaign in Red Alert needs new Red Alert scenarios.

## How it was verified

- **Display and launch:** each row of the table was changed in a test build and checked in Mission Select, on a
  Linux desktop and a Steam Deck: hiding completed missions, cutting a campaign file down, adding `<Stages>` that
  didn't appear, a removed definition that wouldn't start, and a new instance that appeared. The flags and values
  are in the stock `INSTANCES.XML` (`ShowOnMissionSelect`, `IsUnlockedAtStart`, `ExternalGameID` with
  `RedAlert` and `TiberianDawn`).
- **The scenario shadow:** `SCG43EA.INI` with every enemy removed and `[Digest]` deleted, shipped in a mod's
  `CCDATA/`, won itself in about 30 seconds from the Aftermath tab, on both machines. EA's source gives the file
  name (`Set_Scenario_Name`), the digest check (`CCINIClass::Load` skips a missing digest, returns 2 for a wrong
  one) and the abort on 2 (`SCENARIO.CPP`).
- **Variant order:** observed as instances that listed nowhere until moved after their base. The stock file defines
  every one of its 456 instances' variants before use, and a shipped mod's build appends its instances at the end.
- **The campaign map:** the stock `RA_CAMPAIGNMAPS.XML` and `RA_ALLIES_MISSIONS.XML` read for this page (stages,
  movies, entries, `MapStageUnlock`, `RestoreAllUnits`), the movies listed in `MOVIES_RA.MEG`, and a working
  mod that couldn't make a map of its own or a lasting branch.
- **Tab sort:** the two side tests and their calls were read from `ClientG.exe` on disk. A shipped mod's patch on
  them lists its GDI and Nod missions.

> [!TIP]
> **In Tiberian Factions**
>
> TF rebuilt Mission Select as a CAMPAIGNS page, with a tab per faction: Red Alert's Allies and Soviets, and TD's
> GDI and Nod on the two expansion tabs, relabelled. Tiberian Sun's GDI uses the Ant tab. The stock missions are
> hidden, and each faction tab reads COMING SOON until its campaign ships. TF's proven route for mission content
> is a stock slot with a shadowed scenario. Its mission carrier is still a development-build experiment.
>
> <!-- screenshot: the CAMPAIGNS page with its faction tabs and the COMING SOON panel -->
