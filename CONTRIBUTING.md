# Contributing

Corrections and new findings are welcome. The manual is only useful if it's right, so the most valuable thing you can
send is a report that something on a page is wrong.

## Reporting a mistake

Open an issue with:

- **The page and the claim:** a link to the page, and the sentence or step that's wrong.
- **What you saw instead:** what happened when you tried it.
- **How you checked:** a test in game, the game's released source, the game's own files, or another modder's
  findings. Screenshots, logs and file names all help.
- **Your setup:** the game's build (Steam's build ID, or the launcher's version on the main menu), Windows or
  Linux/Proton, and whether you play in HD or classic graphics.

A report that only says "this didn't work for me" is still welcome: say what you tried and what happened.

## Adding a fact or a page

The manual holds only what's confirmed working, or confirmed impossible.

- **Proven:** it worked in game, or the source or a measurement shows it can't. Say how it was verified and which game
  build it holds for. It can go on a page.
- **Not proven yet:** research, an idea, or something you expect to work. It goes on
  [Open questions](open-questions.md) as a short entry (what's established, what's untested, the test that would
  settle it), never as a page of its own.
- **One home per fact:** before adding something, search the manual. If a page already covers the topic, add to it
  there and link to it from anywhere else it matters.

Small additions are easiest as an issue: describe the finding and how you verified it, and it can be written up from
that. Pull requests are welcome too.

## Writing a page

Follow an existing page, such as [Publishing to the Workshop from Linux](getting-started/publishing-to-the-workshop-from-linux.md).
Every page has:

- **Frontmatter:** `title`, `description`, `tags`, `holds_for` (the game build), `status` and `unproven` (a list of
  anything on the page not yet proven, empty if none). Pages that patch the launcher's memory also carry
  `clientg_sha256`.
- **EA's disclaimer at the top,** exactly: "EA has not endorsed and does not support this product."
- **"When you need this":** the kind of mod or problem that calls for the technique, and when it can be skipped.
- **The fact or method,** written for any Remastered modder, not for one mod. Anything unproven is marked as such.
- **"How it was verified":** where each claim comes from.
- **A fragility box** after "When you need this", on pages that patch the launcher's memory: the client build and
  hash it was verified against, what breaks if the client changes, and how to scan safely.
- **A line in `llms.txt` and in the README's page list** for a new page.

Pages end with an "In Tiberian Factions" box showing the technique in a released mod. Leave it out of your page; the
maintainer adds it. Links are standard Markdown links (`[text](page.md)`), so pages read the same on GitHub, in
Obsidian and on the website.

## What can't go in

- **Nothing private:** no machine paths, IP addresses, Steam account names or IDs, emails or real names, in text or in
  screenshots. Check your screenshots for a Steam name in the lobby or on the score screen.
- **Nothing of EA's that their modding guidelines exclude:** no EA logos and no music files from any C&C game.
- **No one mod's design:** a mod's own plans and balance belong in that mod's docs. The manual takes the game-level
  fact underneath.

## Credit and licence

Contributors are credited by their public alias, on the pages that use their findings. By contributing, you agree
that your contribution is published under the manual's licence, [CC BY 4.0](LICENSE).

## How changes are reviewed

The maintainer, Gibbo101, reviews every change. The manual is written and kept up to date with an AI assistant
(Anthropic's Claude), which helps check each claim against the game's source and Tiberian Factions before it goes in.
A claim that can't be checked goes in as unproven, or onto Open questions.
