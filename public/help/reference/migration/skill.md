---
name: lingtai-migration-router
description: Route LingTai TUI and kernel release migrations to their product-owned tag histories.
---

# LingTai migration router

This is a stable pointer, not a migration manual. Product repositories own the
exact migration procedure, one stable file per repository:

- **TUI and portal** — [GitHub](https://github.com/Lingtai-AI/lingtai) ·
  [Gitee](https://gitee.com/huangzesen1997/lingtai) · `migration/migration.md`
- **Kernel** — [GitHub](https://github.com/Lingtai-AI/lingtai-kernel) ·
  [Gitee](https://gitee.com/huangzesen1997/lingtai-kernel) · `migration/migration.md`

## Open a tag

For a product repository and exact tag `TAG`, open its repository-owned file:

```text
GitHub TUI:    https://github.com/Lingtai-AI/lingtai/blob/TAG/migration/migration.md
Gitee TUI:     https://gitee.com/huangzesen1997/lingtai/blob/TAG/migration/migration.md
GitHub kernel: https://github.com/Lingtai-AI/lingtai-kernel/blob/TAG/migration/migration.md
Gitee kernel:  https://gitee.com/huangzesen1997/lingtai-kernel/blob/TAG/migration/migration.md
```

Replace `TAG` with the exact tag from that repository. Do not use this website,
`main`, `latest`, or a different repository as a substitute. TUI/portal and
kernel tags are independent.

## Traverse a release interval

1. Identify current and target tags separately for TUI/portal and kernel.
2. Enumerate tags in `(current, target]`; open every exact `migration/migration.md`
   in order.
3. Follow only the product repository's document.
4. If any tag is missing, inaccessible, out of order, or lacks the exact file,
   stop. Do not skip, infer, or jump to the target; migration precedes refresh.

GitHub/Gitee fallback may use only the same product, same tag, and same path.
Confirm the repository, tag, and file before relying on a fallback. If tag targets
or file contents differ, stop rather than guessing.
