---
related_files:
  - CONTRACT.md
  - public/help/reference/installation/ANATOMY.md
  - package.json
  - astro.config.mjs
  - wrangler.jsonc
  - src/pages/[lang]/index.astro
  - src/pages/[lang]/releases/index.astro
  - src/pages/[lang]/releases/[id].astro
  - src/components/ReleaseIndex.astro
  - src/components/ReleaseDetail.astro
  - src/data/releases.ts
  - src/lib/posts.ts
  - src/i18n/translations.ts
  - public/skill.md
  - public/help/skill.md
  - public/_headers
maintenance: |
  This file is both the repository-root Anatomy and the normative
  anatomy-of-anatomy for lingtai-web. Keep related_files repo-relative,
  duplicate-free, and linked to real files. Keep root CONTRACT.md reciprocal and
  every governed child Anatomy linked in both parent and child directions. Code
  is the structural source of truth: update this map with file, symbol,
  connection, composition, or state changes. Preserve the child template and
  validate the distributed graph before merge.
---
# LingTai Web Distributed Code Navigation Convention

## Purpose

**ANATOMY is the distributed code navigation system.** Each governed component
keeps an `ANATOMY.md` beside the surface it maps: files, symbols,
responsibilities, connections, composition, and state. Those maps form a graph
from this repository root to the code or public bytes that answer a structural
question.

This file is both the top-level lingtai-web map and the **anatomy of anatomy**.
[`CONTRACT.md`](CONTRACT.md) is its normative twin: Anatomy describes where code
is and how it composes; Contract defines how a layer may be used and what it
promises.

## Navigation model

For structural questions, start here, choose the owning component, descend to
its Anatomy, then read the cited file and lines. For enumeration questions such
as every route or callsite, use repository search. Do not copy every local fact
into the root.

A component earns a local Anatomy when it can be reasoned about as an
architectural unit. A component becomes Contract-governed only when the root
Contract lists its paired child Contract. The first such child is public
installation.

## Frontmatter convention

The root and governed-child Anatomy frontmatter has exactly two keys in order:

1. `related_files`: non-empty, duplicate-free, safe repo-relative regular files;
2. `maintenance`: non-empty maintenance statement.

A child lists its paired Contract, parent/root Anatomy, files it maps, public
manual/skill, and directly relevant owners. Paths use `/`, contain no `.` or `..`
segments, and resolve from repository root.

## Body convention

A governed child begins with one paragraph naming its boundary, then carries
these five sections once and in order:

1. `## Components` with verified `file:line` or `file:start-end` citations;
2. `## Connections`;
3. `## Composition`;
4. `## State`;
5. `## Notes`.

The root is the sole exception because it also owns this convention and the
repository-wide map. Citations name repository-relative files; symbols are
included when a line range alone is ambiguous. Code is the structural source of
truth, so verify citations in the exact final candidate.

## Link and pairing semantics

Root Anatomy and root Contract list each other exactly once. Root Anatomy lists
each direct child Anatomy; each child lists the root Anatomy. A child Anatomy
lists its paired child Contract, and that Contract lists the Anatomy. The child
Contract points to `root_contract: CONTRACT.md`; root Contract lists that child
exactly once.

These reciprocal edges are the distributed graph. Missing, stale, duplicate,
unsafe, one-way, or orphaned links are defects. Do not introduce a second
registry or create empty documents solely for filename symmetry.

## Components

- **Route composition** `src/pages/[lang]/index.astro:1-245` assembles the localized
  home experience. Release archive/detail routes are thin adapters at
  `src/pages/[lang]/releases/index.astro:1-13` and
  `src/pages/[lang]/releases/[id].astro:1-15`.
- **Presentation components** `src/components/ReleaseIndex.astro` and
  `src/components/ReleaseDetail.astro` render release data without owning the
  archive itself.
- **Product data and content** `src/data/releases.ts:1-3828` is the canonical release
  archive; `src/lib/posts.ts:1-74` loads public blog content.
- **Localization** `src/i18n/translations.ts:1-142` owns shared locale vocabulary used
  by routes and components.
- **Public agent/help surface** `public/skill.md:1-17` routes into
  `public/help/skill.md:1-20` and progressively disclosed references.
- **Public installation component** is mapped by
  [`public/help/reference/installation/ANATOMY.md`](public/help/reference/installation/ANATOMY.md)
  and governed by its paired Contract. It owns the deployed shell entrypoints,
  operation selection, receipts, runtime provenance, and real behavior evidence.
- **Build/deploy composition** `package.json:6-12` exposes local build, preview,
  and deploy commands; `astro.config.mjs:5-8` declares a static
  site with the Cloudflare adapter; `wrangler.jsonc:1-12` owns Cloudflare runtime
  configuration.

## Root files

- `README.md` is human orientation.
- `CONTRACT.md` and this file are the two distributed-system roots.
- `package.json` / `package-lock.json` lock Node commands and dependencies.
- `astro.config.mjs`, `wrangler.jsonc`, and `tsconfig.json` compose the static
  Astro/Cloudflare build.
- `src/` owns routes, layouts, components, data, content, styles, and i18n.
- `public/` owns bytes served without source transformation, including public
  shell entrypoints and agent manuals.
- `reports/` contains local review evidence and is not a deployed product input.

## Composition

Astro route files select locale and data, then compose layouts/components.
Data modules and content loaders provide product content; translations provide
locale text. Astro emits static output; the Cloudflare adapter and Wrangler own
preview/deploy mechanics. Public files bypass Astro component transformation and
are copied as exact origin bytes.

The public installation component is deliberately standalone: `install.sh` is
the fresh ordinary entrypoint plus one explicit `--latest` delegation to the
TUI repository's pinned current-main installer, while arbitrary-ref development,
update, repair, and verification are separate executable assets explained by one
installation skill and governed by
one child Contract.

## State

Most website state is repository-owned static source. Release/tutorial/project
records are TypeScript data; blog posts are content files; translations are
source maps. Build output is generated and is not the source of truth.

The installation executables act on external machine state: target binaries,
`$HOME/.lingtai-tui/runtime`, and a strict install receipt. That state model and
its mutation boundaries live only in the installation child Contract; this root
Anatomy maps the component but does not duplicate its promises.

## Maintenance

Coding agents update the relevant Anatomy with structural change and the paired
Contract with normative behavior change in the same PR. Verify every changed
citation against the exact final head, run each changed executable as its real
declared operation, and report any mismatch instead of silently weakening or
auto-fixing the graph.

A real file move repairs Anatomy from code. A behavior disagreement does not
rewrite Contract from accidental implementation; it fails until code conforms or
an authorized product decision changes the promise.

## Template

```markdown
---
related_files:
  - <repo-relative paired CONTRACT.md>
  - <repo-relative parent ANATOMY.md>
  - <repo-relative implementation or public file>
maintenance: |
  Keep related_files complete and reciprocal. Update this Anatomy with structural
  changes, verify citations, and follow the root pairing convention.
---
# <Component name> Anatomy

<One paragraph naming the boundary.>

## Components
## Connections
## Composition
## State
## Notes
```
