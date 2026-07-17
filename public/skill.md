---
name: lingtai-migration-router
description: Route LingTai TUI and kernel release migrations to their product-owned tag histories.
---

# LingTai migration router

This is a stable pointer, not a migration manual. It contains no product-specific
migration procedure and no release/version table. The product repositories own
those details, one stable file per repository:

- **TUI and portal** — [GitHub repository](https://github.com/Lingtai-AI/lingtai) ·
  [Gitee repository](https://gitee.com/huangzesen1997/lingtai) ·
  `migration/migration.md`
- **Kernel** — [GitHub repository](https://github.com/Lingtai-AI/lingtai-kernel) ·
  [Gitee repository](https://gitee.com/huangzesen1997/lingtai-kernel) ·
  `migration/migration.md`

## Open the history for a tag

For a product repository and a tag `TAG`, open its repository-owned file at the
same path:

```text
GitHub TUI:    https://github.com/Lingtai-AI/lingtai/blob/TAG/migration/migration.md
Gitee TUI:     https://gitee.com/huangzesen1997/lingtai/blob/TAG/migration/migration.md
GitHub kernel: https://github.com/Lingtai-AI/lingtai-kernel/blob/TAG/migration/migration.md
Gitee kernel:  https://gitee.com/huangzesen1997/lingtai-kernel/blob/TAG/migration/migration.md
```

Replace `TAG` with the exact tag from that repository. Do not use this website,
`main`, `latest`, or a different repository as a substitute for the tagged file.
A TUI/portal tag and a kernel tag are independent; a paired release does not
make their tag names interchangeable.

## Traverse a release interval

1. Identify the current and target tag separately for the TUI/portal and kernel.
2. Enumerate that repository's release tags in the open interval `(current,
   target]`. For every tag in the interval, open that tag's
   `migration/migration.md`, in order. This router deliberately does not keep a
   second copy of the tag list.
3. Follow only the migration document owned by the product repository. The TUI
   document owns TUI/portal state; the kernel document owns kernel/runtime state.
4. If any tag is missing, inaccessible, out of order, or has no exact
   `migration/migration.md`, stop. Do not skip it, infer its contents, or jump
   to the target. Configuration migration and validation precede any refresh;
   the document itself does not grant side-effect authority.

## GitHub, Gitee, and same-tag fallback

The product repository and exact tag are the source of truth; no forge URL is
the contract by itself. GitHub is the primary public access path above. The
installer in this website's `public/install.sh` is also source evidence for the
Gitee names: its defaults
are `huangzesen1997/lingtai` and `huangzesen1997/lingtai-kernel`, and it probes
those Gitee API paths before selecting or falling back between providers.

If GitHub is unavailable, use the Gitee repository for the **same product, same
tag, and same path**. If Gitee is unavailable, use GitHub under the same rule.
A provider fallback may not independently resolve `latest` or choose another
tag. Before relying on the fallback, confirm that the requested repository and
tag resolve and that `migration/migration.md` is present. If providers expose
different tag targets or different file content, treat the chain as
mismatched and stop rather than guessing which copy is authoritative.
