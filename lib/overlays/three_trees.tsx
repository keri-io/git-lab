import type { Snapshot } from "../git-vm/types.ts";
import { BareBadge } from "./bare_badge.tsx";

export interface ThreeTreesProps {
  snapshot: Snapshot | null;
  pulse?: boolean;
}

export const BARE_NO_WORK_TREE = "no work tree (bare)";

/** Bare repo with no linked files and no active checkout. */
export function isBareWithoutCheckout(snapshot: Snapshot): boolean {
  return !!snapshot.bare &&
    snapshot.threeTrees.worktree.length === 0 &&
    snapshot.worktrees.length === 0;
}

function FileList(
  {
    title,
    files,
    hint,
    emptyLabel = "empty",
  }: {
    title: string;
    files: string[];
    hint: string;
    emptyLabel?: string | null;
  },
) {
  return (
    <div class="lg-card p-4 min-h-[4.5rem]">
      <h4 class="text-xs uppercase tracking-wide text-[var(--lg-muted)] mb-2">
        {title}
      </h4>
      <p class="text-[11px] text-[var(--lg-muted)] mb-2">{hint}</p>
      {files.length === 0
        ? (
          emptyLabel
            ? <p class="text-xs text-[var(--lg-muted)]">{emptyLabel}</p>
            : null
        )
        : (
          <ul class="font-mono text-xs space-y-0.5 text-[var(--lg-text)]">
            {files.map((f) => <li key={f}>{f}</li>)}
          </ul>
        )}
    </div>
  );
}

export function ThreeTrees({ snapshot, pulse = false }: ThreeTreesProps) {
  if (!snapshot) return null;
  const bareEmpty = isBareWithoutCheckout(snapshot);
  const bareHint = bareEmpty ? BARE_NO_WORK_TREE : null;

  return (
    <div class={`three-trees mt-3 space-y-3${pulse ? " viz-pulse" : ""}`}>
      <BareBadge snapshot={snapshot} />
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <FileList
          title="HEAD"
          hint="last commit"
          files={snapshot.threeTrees.head}
        />
        <FileList
          title="Index"
          hint={bareHint ?? "staging area"}
          files={snapshot.threeTrees.index}
          emptyLabel={bareEmpty ? null : "empty"}
        />
        <FileList
          title="Worktree"
          hint={bareHint ?? "files on disk"}
          files={snapshot.threeTrees.worktree}
          emptyLabel={bareEmpty ? null : "empty"}
        />
      </div>
    </div>
  );
}
