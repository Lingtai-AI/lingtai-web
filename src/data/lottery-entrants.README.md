# Lottery entrants

Source of truth for the entrants shown on https://lingtai.ai/lottery/.

## How to add or update an entrant

1. Edit `lottery-entrants.json` in this directory.
2. In the `entrants` array, replace a placeholder slot or append a new object:

   ```json
   { "handle": "their-github-handle", "note": "optional human note (not shown)" }
   ```

   - `handle` must be a valid GitHub username (letters, digits, hyphens). The
     page uses it to fetch `https://github.com/<handle>.png` for the avatar.
   - `note` is optional and is never rendered on the page; it's a maintainer
     comment for your own bookkeeping.
3. Commit the change. Astro rebuilds `/lottery/entrants.json` at deploy time
   from this same file, so the page and the public JSON stay in sync.

## Other tunable fields

- `title`, `subtitle` — page headings.
- `drawingDate` — ISO-8601 string or `null` (no date shown).
- `prize` — short prize description displayed on the page.

## Why JSON (no comments)

JSON cannot carry inline comments, so the schema notes live here instead. The
`_instructions` key in the JSON file is ignored at runtime and only points humans
back to this README.
