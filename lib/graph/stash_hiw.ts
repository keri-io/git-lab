import type { Snapshot } from "../git-vm/types.ts";

export interface StashHiw {
  h: string;
  i: string;
  w: string;
}

/** W = stash tip; H = first parent (HEAD); I = second parent (index). */
export function stashHiwFromSnapshot(snapshot: Snapshot): StashHiw | null {
  const stashRef = snapshot.refs.find((r) => r.kind === "stash");
  if (!stashRef) return null;
  const w = snapshot.commits.find((c) => c.id === stashRef.target);
  if (!w || w.parents.length < 2) return null;
  return { w: w.id, h: w.parents[0], i: w.parents[1] };
}

export function stashRole(
  hiw: StashHiw | null,
  id: string,
): "H" | "I" | "W" | null {
  if (!hiw) return null;
  if (id === hiw.w) return "W";
  if (id === hiw.h) return "H";
  if (id === hiw.i) return "I";
  return null;
}
