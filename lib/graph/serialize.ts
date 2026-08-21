import type { Snapshot } from "../git-vm/types.ts";

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(rec).sort().map((key) => [key, sortKeys(rec[key])]),
    );
  }
  return value;
}

/** Graph-facing snapshot fields only — stable key order for golden JSON. */
export function graphSnapshot(snapshot: Snapshot) {
  const commits = [...snapshot.commits].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const refs = [...snapshot.refs].sort((a, b) => a.name.localeCompare(b.name));
  const index = [...snapshot.index].sort((a, b) =>
    a.path === b.path ? a.stage - b.stage : a.path.localeCompare(b.path)
  );
  return sortKeys({
    branch: snapshot.branch,
    commits,
    conflicted: snapshot.conflicted,
    files: snapshot.files,
    head: snapshot.head,
    index,
    refs,
    threeTrees: snapshot.threeTrees,
    worktrees: [...snapshot.worktrees].sort((a, b) => a.id.localeCompare(b.id)),
  });
}

export function stringifySnapshot(snapshot: Snapshot): string {
  return JSON.stringify(graphSnapshot(snapshot), null, 2) + "\n";
}
