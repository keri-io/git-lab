import type { GitEvent, Snapshot } from "../git-vm/types.ts";
import { stashHiwFromSnapshot } from "../graph/stash_hiw.ts";

export interface StashHiwInsetProps {
  snapshot: Snapshot | null;
  events: GitEvent[];
}

export function StashHiwInset({ snapshot, events }: StashHiwInsetProps) {
  if (!snapshot) return null;
  const hiw = stashHiwFromSnapshot(snapshot);
  if (!hiw && !events.some((e) => e.type === "stash-w")) return null;
  if (!hiw) return null;

  const short = (id: string) => id.slice(0, 7);

  return (
    <aside
      class="lg-card mt-2 p-4 text-xs"
      aria-label="Stash H, I, and W commits"
    >
      <h4 class="uppercase tracking-wide mb-2 text-[var(--lg-stash)]">
        Stash graph
      </h4>
      <ul class="font-mono space-y-1 text-[var(--lg-text)]">
        <li>
          <span class="text-[var(--lg-stash)]">H</span> HEAD {short(hiw.h)}
        </li>
        <li>
          <span class="text-[var(--lg-stash)]">I</span> index {short(hiw.i)}
        </li>
        <li>
          <span class="text-[var(--lg-stash)]">W</span> worktree (stash tip)
          {" "}
          {short(hiw.w)}
        </li>
      </ul>
    </aside>
  );
}
