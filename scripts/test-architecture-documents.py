#!/usr/bin/env python3
"""Focused graph/citation smoke test for lingtai-web Contract/Anatomy documents."""

from __future__ import annotations

import re
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
ROOT_CONTRACT = "CONTRACT.md"
ROOT_ANATOMY = "ANATOMY.md"
CHILD_CONTRACT = "public/help/reference/installation/CONTRACT.md"
CHILD_ANATOMY = "public/help/reference/installation/ANATOMY.md"
SHELL_ENTRYPOINTS = (
    "public/install.sh",
    "public/help/reference/installation/assets/update.sh",
    "public/help/reference/installation/assets/dev.sh",
    "public/help/reference/installation/assets/fix.sh",
    "public/help/reference/installation/assets/verify.sh",
)


class CheckError(RuntimeError):
    pass


def fail(message: str) -> None:
    raise CheckError(message)


def parse_frontmatter(rel: str) -> tuple[list[str], dict[str, str], list[str], str]:
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        fail(f"{rel}: missing opening frontmatter delimiter")
    try:
        end = lines.index("---", 1)
    except ValueError:
        fail(f"{rel}: missing closing frontmatter delimiter")

    keys: list[str] = []
    scalars: dict[str, str] = {}
    related: list[str] = []
    current = ""
    for line in lines[1:end]:
        match = re.fullmatch(r"([a-z_]+):(?:\s*(.*))?", line)
        if match:
            current = match.group(1)
            keys.append(current)
            scalars[current] = match.group(2) or ""
            continue
        if current == "related_files" and line.startswith("  - "):
            related.append(line[4:])
    return keys, scalars, related, text


def check_related(owner: str, related: list[str]) -> None:
    if not related:
        fail(f"{owner}: related_files is empty")
    if len(related) != len(set(related)):
        fail(f"{owner}: related_files contains a duplicate")
    for rel in related:
        posix = PurePosixPath(rel)
        if posix.is_absolute() or "\\" in rel or any(part in {"", ".", ".."} for part in posix.parts):
            fail(f"{owner}: unsafe related_files path: {rel}")
        path = ROOT / rel
        if not path.is_file() or path.is_symlink():
            fail(f"{owner}: related file is absent, non-regular, or a symlink: {rel}")


def without_fenced_code(text: str) -> str:
    return re.sub(r"^```.*?^```[ \t]*$", "", text, flags=re.MULTILINE | re.DOTALL)


def check_headings(rel: str, text: str, expected: list[str]) -> None:
    actual = re.findall(r"^## (.+)$", without_fenced_code(text), flags=re.MULTILINE)
    if actual != expected:
        fail(f"{rel}: ## heading sequence mismatch: {actual!r}")


def check_citations(rel: str, text: str) -> None:
    pattern = re.compile(
        r"`([A-Za-z0-9_./\[\]-]+\.(?:astro|ts|md|sh|json|py)):(\d+)(?:-(\d+))?`"
    )
    citations = pattern.findall(without_fenced_code(text))
    if not citations:
        fail(f"{rel}: no source citations found")
    for target, start_raw, end_raw in citations:
        path = ROOT / target
        if not path.is_file():
            fail(f"{rel}: citation target does not exist: {target}")
        start = int(start_raw)
        end = int(end_raw or start_raw)
        line_count = len(path.read_text(encoding="utf-8").splitlines())
        if start < 1 or end < start or end > line_count:
            fail(f"{rel}: citation out of bounds: {target}:{start}-{end} ({line_count} lines)")


def exactly_once(items: list[str], value: str, owner: str) -> None:
    if items.count(value) != 1:
        fail(f"{owner}: expected exactly one related_files entry for {value}")


def main() -> None:
    docs: dict[str, tuple[list[str], dict[str, str], list[str], str]] = {}
    for rel in (ROOT_CONTRACT, ROOT_ANATOMY, CHILD_CONTRACT, CHILD_ANATOMY):
        docs[rel] = parse_frontmatter(rel)
        check_related(rel, docs[rel][2])

    root_contract = docs[ROOT_CONTRACT]
    root_anatomy = docs[ROOT_ANATOMY]
    child_contract = docs[CHILD_CONTRACT]
    child_anatomy = docs[CHILD_ANATOMY]

    if root_contract[0] != ["name", "contract_version", "related_files", "maintenance"]:
        fail(f"{ROOT_CONTRACT}: root key order mismatch")
    if root_contract[1].get("name") != "component-contract-convention":
        fail(f"{ROOT_CONTRACT}: wrong root name")
    if not root_contract[1].get("contract_version", "").isdigit():
        fail(f"{ROOT_CONTRACT}: contract_version is not a positive integer")
    if root_anatomy[0] != ["related_files", "maintenance"]:
        fail(f"{ROOT_ANATOMY}: root Anatomy key order mismatch")
    if child_contract[0] != ["name", "contract_version", "root_contract", "related_files", "maintenance"]:
        fail(f"{CHILD_CONTRACT}: child key order mismatch")
    if child_contract[1].get("root_contract") != ROOT_CONTRACT:
        fail(f"{CHILD_CONTRACT}: root_contract must be literal {ROOT_CONTRACT}")
    if child_anatomy[0] != ["related_files", "maintenance"]:
        fail(f"{CHILD_ANATOMY}: child Anatomy key order mismatch")

    exactly_once(root_contract[2], ROOT_ANATOMY, ROOT_CONTRACT)
    exactly_once(root_contract[2], CHILD_CONTRACT, ROOT_CONTRACT)
    exactly_once(root_anatomy[2], ROOT_CONTRACT, ROOT_ANATOMY)
    exactly_once(root_anatomy[2], CHILD_ANATOMY, ROOT_ANATOMY)
    exactly_once(child_contract[2], CHILD_ANATOMY, CHILD_CONTRACT)
    exactly_once(child_contract[2], ROOT_ANATOMY, CHILD_CONTRACT)
    exactly_once(child_anatomy[2], CHILD_CONTRACT, CHILD_ANATOMY)
    exactly_once(child_anatomy[2], ROOT_ANATOMY, CHILD_ANATOMY)

    check_headings(
        ROOT_CONTRACT,
        root_contract[3],
        ["Design principles", "Purpose", "Architecture foundation", "Behavior", "Frontmatter contract", "Body contract", "Link semantics", "Maintenance contract", "Validation", "Template"],
    )
    check_headings(
        CHILD_CONTRACT,
        child_contract[3],
        ["Purpose", "Behavior", "Port", "Adapters", "Contract rules", "Contract tests", "Maintenance"],
    )
    check_headings(
        CHILD_ANATOMY,
        child_anatomy[3],
        ["Components", "Connections", "Composition", "State", "Notes"],
    )
    check_citations(ROOT_ANATOMY, root_anatomy[3])
    check_citations(CHILD_ANATOMY, child_anatomy[3])

    for rel in SHELL_ENTRYPOINTS:
        text = (ROOT / rel).read_text(encoding="utf-8")
        if text.count("# For coding-agent maintainers:") != 1:
            fail(f"{rel}: missing or duplicate maintainer block")
        for required in ("repository-root CONTRACT.md", "public/help/reference/installation/CONTRACT.md", "final-head real critical-path acceptance", "grant no merge, release, deploy"):
            if required not in text:
                fail(f"{rel}: maintainer block missing requirement: {required}")

    print("PASS: root/child Contract-Anatomy graph, citations, and five maintainer blocks")


if __name__ == "__main__":
    try:
        main()
    except CheckError as exc:
        raise SystemExit(f"architecture-documents: {exc}")
