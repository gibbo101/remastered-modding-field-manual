# Remastered Modding Field Manual: rules for writing it

A public, openly licensed knowledge base on modding the C&C Remastered Collection, written as an Obsidian vault.
Tagline: *What we learned modding C&C Remastered, building Tiberian Factions*. `HANDOFF.md` (local, gitignored) holds
the scope and the open decisions.

## Nothing private, ever
This repo is public. No IPs, hostnames, Steam accounts or IDs, machine paths, emails, real names or notes on
contacts, and none of Tiberian Factions' internal history or dated decisions. Public aliases are fine: the maintainer
is Gibbo101, and community modders are credited by their alias (DontCryJustDie). TF's docs and the private notes behind
them are source material: read them, distil them, never copy them.

## Every page
- EA's disclaimer at the top (exact wording in TF's `docs/ea-modding-guidelines.md`). No EA logos, no music files.
- Opens with "When you need this": the kind of mod or problem that calls for the technique, and when it can be
  skipped. On ClientG RAM-patch pages it sits under the title, before the fragility box.
- The fact, how it was verified, and the game patch it holds for. Anything unproven is marked as unproven.
- Written for strangers: game-level facts true for any Remastered mod. TF-only design stays out.
- Ends with an "In Tiberian Factions" box: what TF does with the technique, with a screenshot where it helps.
- ClientG RAM-patch pages carry a fragility box right after "When you need this": the client build and hash verified
  against, what breaks if the client changes and how it fails, and the safe-scanning rules. Method first, offsets
  second.
- Frontmatter carries `title`, `description`, `tags`, `holds_for`, `status` and `unproven`, plus `clientg_sha256` on
  RAM-patch pages. Every new page gets a line in `llms.txt` and the README's page list.
- One home per fact. Each fact lives on one page, and other pages link to it.

## Working
- Verify every claim against TF's docs or code before writing it.
- Creating the GitHub repo, turning on Pages and making anything public are the maintainer's actions, after they have read the pages.
