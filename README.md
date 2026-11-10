---
title: Red Alert Remastered Modding Field Manual
---

> [!NOTE]
> EA has not endorsed and does not support this product.

# Red Alert Remastered Modding Field Manual

*Modding Command & Conquer Remastered, as learned building Tiberian Factions.*

**Read it online:** https://gibbo101.github.io/remastered-modding-field-manual/

Techniques and facts about modding the Command & Conquer Remastered Collection, written so any modder can use
them. Each page covers one fact or technique: what's true, how it was verified, and which build of the game it holds
for. Most of what's here was found the hard way, one build and one test at a time.

By Gibbo101, author of [Tiberian Factions](https://steamcommunity.com/sharedfiles/filedetails/?id=3729834253)
([ModDB](https://www.moddb.com/mods/tiberian-factions-for-red-alert)), which adds TD's GDI and Nod and Tiberian
Sun's GDI to Red Alert Remastered. Tiberian Factions is the worked example, not the subject: each page ends with
what it does with the technique.

> [!IMPORTANT]
> **AI tooling, and using what's here**
>
> This manual is written and kept up to date with an AI assistant (Anthropic's Claude). It drafts each page from
> Tiberian Factions' own notes and code. As work on the mod turns up new lessons, it adds them here and revises the
> pages they affect. Gibbo101 reviews every change, and every claim is checked against Tiberian Factions or the game's
> source before it goes in. Even so, mistakes can get through. If something here is wrong, please
> [open an issue](https://github.com/gibbo101/remastered-modding-field-manual/issues); [CONTRIBUTING.md](https://github.com/gibbo101/remastered-modding-field-manual/blob/main/CONTRIBUTING.md) says what helps, and how to add a
> finding of your own.
>
> Everything here is provided as-is, with no warranty. Back up your game and saves before you try anything,
> especially the pages that patch the launcher's memory. You use these techniques at your own risk.

## Pages

### Getting started
- [The mod folder and ccmod.json](getting-started/the-mod-folder-and-ccmod-json.md): where the launcher finds
  mods, and what each `ccmod.json` field does.
- [Building the DLL on Linux](getting-started/building-the-dll-on-linux.md): a Remastered game DLL built on
  Linux with mingw, no Windows needed.
- [Testing under Proton and on the Steam Deck](getting-started/testing-under-proton.md): playing your Linux
  build without Windows.
- [Publishing to the Workshop from Linux](getting-started/publishing-to-the-workshop-from-linux.md): uploading
  and updating a Workshop item without Windows.
- [HD-only mods](getting-started/hd-only-mods.md): this manual assumes HD graphics mode, and how to switch off the
  classic option when your new art exists only in HD.

### File formats
- [MEG and MIX archives](formats/meg-and-mix-archives.md): reading, extracting and repacking the game's archives.
- [Save files (.sav)](formats/save-files.md): the save game's chunk layout, and how to reach the DLL's own save
  data.

### Launcher data
- [Overriding the launcher's data](launcher-data/overriding-launcher-data.md): loose files, a replacement
  `CONFIG.MEG` and `GameConstants_Mod.xml`, and what none of them reach.
- [New text strings](launcher-data/new-text-strings.md): names for new units, buildings and maps with
  `ModText.csv`, and relabelling the base game's strings.
- [Mod hotkey commands](launcher-data/mod-hotkey-commands.md): the four keys EA left for modders, and why players
  have to bind them.

### Front end
- [The UI atlas](front-end/the-ui-atlas.md): repainting the launcher's UI images, picking the right region, and
  shipping the atlas small.
- [BUI screens](front-end/bui-screens.md): reshaping, hiding and restyling the launcher's screens, and swapping
  whole screens.
- [New screens and buttons](front-end/new-screens-and-buttons.md): adding main-menu buttons and whole screens the
  launcher doesn't have.
- [A faction encyclopedia screen](front-end/faction-encyclopedia.md): an in-game reference for your factions' units,
  with pictures and live stats.

### Using what the player already owns
- [TD art from the base game](using-what-the-player-owns/td-art-from-the-base-game.md): drawing Tiberian Dawn's
  HD art in a Red Alert mod without shipping it.
- [TD theatres in Red Alert](using-what-the-player-owns/td-theatres-in-red-alert.md): Red Alert maps in TD's
  desert, temperate and winter terrain, drawn from the base game.
- [TD sounds from the base game](using-what-the-player-owns/td-sounds-from-the-base-game.md): TD weapon,
  building and EVA sounds in a Red Alert mod, with no audio shipped, and the format your own samples need.

### Maps and the lobby
- [New maps in the skirmish Official list](maps-and-lobby/new-maps-in-the-skirmish-list.md): listing maps
  with data, and launching them under an entry the game already knows.
- [Bigger maps](maps-and-lobby/bigger-maps.md): Red Alert maps up to 255×255, and what caps them there.
- [A map editor for Linux and mods](maps-and-lobby/a-map-editor-for-linux-and-mods.md): editing Red Alert and
  Tiberian Dawn maps on Linux, with a mod's own types learned from a manifest it ships.
- [Adding a theatre of your own](maps-and-lobby/custom-theatres.md): custom terrain, and the wall that limits
  it to reskinning existing template names.
- [Custom campaigns: replacing the official ones](maps-and-lobby/custom-campaigns.md): replacing or adding to the official campaigns, and
  what launches.
- [Per-AI lobby difficulty](maps-and-lobby/per-ai-lobby-difficulty.md): honouring each AI's lobby difficulty by
  reading the launcher's memory.
- [A new resource on the official skirmish maps](maps-and-lobby/official-maps-with-tiberium.md): Tiberium (or any
  new resource) on Red Alert's own skirmish maps, thumbnails included.

### Sound and music
- [EVA voice lines the launcher plays](sound-and-music/launcher-eva-lines-by-faction.md): giving each faction its
  own EVA voice on announcements the launcher plays itself, such as "Mission accomplished" and "Low power".
- [Credit tick and radar sounds by faction](sound-and-music/credit-tick-and-radar-by-faction.md): faction sounds
  for the money counter and the radar.
- [Music by faction, and the jukebox](sound-and-music/music-by-faction-and-the-jukebox.md): skirmish music per
  faction, and optional jukebox tracks.

### Engine
- [What the launcher owns: the modding walls](engine/what-the-launcher-owns.md): what the community calls
  impossible, and which of it isn't.
- [Adding a faction](engine/adding-a-faction.md): a new playable side on Red Alert's eight country rows.
- [LAN games](engine/lan-games.md): one simulation on the host, and what that means for per-player code.
- [Save versions](engine/save-versions.md): keeping players' saves safe as your classes grow.
- [Porting CFE Patch Redux](engine/cfe-patch-ports.md): bringing CFE's features and fixes into a Vanilla Conquer DLL.

### Units and buildings
- [Adding a unit](units/adding-a-unit.md): a new vehicle type in the DLL, end to end.
- [Raising the limits](units/raising-the-limits.md): how many types and objects the engine allows, and how to raise
  each.
- [Turrets](units/turrets.md): giving a unit a turret, and making turretless guns aim.
- [Units leaving buildings: exits and rails](units/exits-and-rails.md): how a unit drives out of a factory, and the
  traps of giving a new building its own exit path.
- [Porting Tiberian Dawn units](units/porting-td-units.md): bringing TD units' behaviour into Red Alert's engine.
- [Porting Tiberian Dawn buildings and defences](units/porting-td-buildings-and-defences.md): bringing TD's buildings
  and defences, with their behaviour, into Red Alert's engine.

### AI and pathfinding
- [The skirmish AI and its IQ levels](ai/skirmish-ai-and-iq.md): how the computer player builds and scales with
  difficulty, and the stock gaps every DLL mod inherits.
- [Pathfinding](ai/pathfinding.md): the stock pathfinder's limits, and A*, give-way and give-up fixes that work.
- [Harvesters](ai/harvesters.md): why harvesters get stuck or crowd one refinery, and the fixes.

### New unit behaviours
- [Gates](behaviours/gates.md): wall sections that open for their owner and allies, and why they need a zone
  rebuild.
- [Subterranean units](behaviours/subterranean-units.md): units that dig, travel underground and surface, from TS's
  tunnel locomotion.
- [Firestorm Defense](behaviours/firestorm-defense.md): a toggled, charge-draining defensive field, and line fill
  for every wall.
- [A stealth generator](behaviours/stealth-generator.md): cloaking a base through Red Alert's own cloak system.
- [EMP and stun](behaviours/emp-and-stun.md): disabling vehicles and buildings for a time, and showing hidden
  enemies.
- [The Tiberium ecosystem](behaviours/tiberium-ecosystem.md): Tiberium beside ore, with blossom trees, infantry
  damage and Visceroids.
- [Air delivery, fleets and support powers](behaviours/air-delivery-and-fleets.md): TD's cargo-plane delivery,
  faction navies and air forces.
- [Jumpjets, deployers, mines and bouncing discs](behaviours/jumpjets-deployers-and-more.md): smaller TS behaviours
  and the engine checks they hit.
- [Hover and amphibious units](behaviours/hover-and-amphibious-units.md): units that cross land and water; restoring
  the SPEED_HOVER that Red Alert dropped, with a movement zone that spans the shore.

### Art
- [How the launcher draws sprites](art/how-the-launcher-draws-sprites.md): canvas-centre anchoring, shape and
  frame limits, the alpha cutoff, baked shadows and beams.
- [HD tilesets and ZIPs](art/hd-tilesets-and-zips.md): shipping HD art for a new unit, building or effect, and
  tying it to its type.
- [Sprite memory and DDS](art/sprite-memory-and-dds.md): keeping a big mod's art inside video memory.
- [Sidebar cameos](art/sidebar-cameos.md): new build icons, and icons that change with the player.
- [Porting art from other C&C games](art/porting-art-from-other-games.md): Tiberian Sun, Red Alert 2 and C&C3 units as HD
  Remastered sprites.
- [Building selection boxes](art/building-selection-boxes.md): the launcher places the box, and your DLL only sizes
  it.

### Structuring a big mod
- [Asset packs](structuring/asset-packs.md): splitting a big mod's art and sound into Workshop items other mods
  can use too.
- [A player settings page](structuring/player-settings-page.md): letting players switch each change back to
  vanilla.
- [New units without a DLL of your own](structuring/units-without-a-dll.md): adding a unit as data, on top of
  another mod's DLL.

### Troubleshooting
- [Crash triage](troubleshooting/crash-triage.md): finding out whether a crash is your code, your data, or
  neither.
- [Known engine traps](troubleshooting/known-engine-traps.md): crashes in EA's own code that a growing mod runs
  into, and their fixes.

### Patching the launcher in memory (advanced)
- [Re-pointing launcher UI art in memory](clientg-ram/repointing-atlas-regions.md): swapping which atlas region a HUD
  widget draws, with the radar crest as the example.
- [Patching the launcher's code from your DLL](clientg-ram/patching-the-launchers-code.md): hooking launcher
  functions from the start-up load, safely, on every player's machine.
- [Rewriting launcher strings in memory](clientg-ram/rewriting-launcher-strings.md): changing a name the
  launcher builds in code, with the sidebar tab icons as the example.
- [Launcher key commands and superweapon clicks](clientg-ram/launcher-key-commands-and-clicks.md): making the
  deploy, select-all and camera keys act on a mod's own types, and a superweapon fire on one click.

### Open questions
- [Open questions](open-questions.md): research not yet proven in game, what's established, and the test that
  would settle each one, with links to Tiberian Factions' design docs.

## Using this with an AI assistant

The pages are laid out so an AI assistant can gather what it needs to implement a technique in your own mod. Each
page stands on its own and is laid out the same way: when you need it, the fact or method, how it was verified, the
game build it holds for, and what's still unproven. The frontmatter repeats the build and status (`holds_for`,
`status`, `unproven`) so a tool can check them without reading the prose. [`llms.txt`](llms.txt) indexes every page
with a one-line summary.

Point your assistant at a page's raw Markdown, or at `llms.txt` for the whole manual, and ask it to apply the
technique to your mod. **On the pages that patch the launcher's memory, have it check your `ClientG.exe` hash
against the page's `clientg_sha256` before it uses any offset.** A different client means the offsets can't be
trusted.

## How the pages are written

- **Each page opens with when you need it:** the kind of mod or problem that calls for the technique, and when you
  can skip it.
- **Game-level facts only:** true for any Remastered mod, not just one.
- **Written for HD graphics mode.** Pages about art and drawing describe the HD renderer, not classic mode.
- **Each fact has one home.** It lives on one page, and other pages link to it.
- **Every claim was checked** against Tiberian Factions or the game's source, and anything unproven is marked
  **Unproven**.
- **Pages that patch the launcher's memory open with a fragility box:** the client build and hash they were
  verified against, what breaks if the client changes, and how to scan safely. Method first, offsets second.
- Following EA's modding guidelines, every page opens with EA's disclaimer, and nothing here ships EA logos or music
  files.

## Credits

**DontCryJustDie**, author of [TD-Assets](https://steamcommunity.com/sharedfiles/filedetails/?id=3003163891) and
[RA-Assets](https://steamcommunity.com/sharedfiles/filedetails/?id=3005684594), has contributed a good share of what's
here. TD-Assets first showed Tiberian Dawn's HD art and audio running in Red Alert. In Tiberian Factions' Workshop
comments and discussions he:

- decoded the launcher's skirmish lobby records (the colour, team, house and start-position fields, and the vectors
  that hold them), which is how per-AI difficulty can be read at all;
- found the crash with more than four mods enabled, and the case where a player's own `rules.ini` is loaded in
  place of the mod's;
- showed that art should be centred in the image rather than moved with a draw offset, which leaves the selection
  box behind;
- suggested sharing one set of shapes between types to save video memory, and splitting a big mod's assets into
  packs other mods can depend on.

Each page that uses his findings says so.

## License

Text is licensed [CC BY 4.0](LICENSE). Use it however you like, as long as you credit the Red Alert
Remastered Modding Field Manual. Command & Conquer is a trademark of Electronic Arts.
