import type { GraphCommit } from "../git-vm/types.ts";

/** Parents before children. Input order among independent roots. */
export function topoSortCommits(commits: GraphCommit[]): GraphCommit[] {
  const byId = new Map(commits.map((c) => [c.id, c]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const out: GraphCommit[] = [];

  const visit = (id: string) => {
    if (visited.has(id) || visiting.has(id)) return;
    const commit = byId.get(id);
    if (!commit) return;
    visiting.add(id);
    for (const parent of commit.parents) visit(parent);
    visiting.delete(id);
    visited.add(id);
    out.push(commit);
  };

  for (const commit of commits) visit(commit.id);
  return out;
}
