import { useEffect, useState } from "preact/hooks";
import type { GitEvent, IndexEntry, Snapshot } from "../git-vm/types.ts";

export interface IndexStagesProps {
  snapshot: Snapshot | null;
  events: GitEvent[];
}

function short(id: string): string {
  return id.length > 8 ? id.slice(0, 7) : id;
}

function conflictRows(index: IndexEntry[]) {
  const map = new Map<
    string,
    { path: string; base?: string; ours?: string; theirs?: string }
  >();
  for (const entry of index) {
    if (entry.stage === 0) continue;
    const row = map.get(entry.path) ?? { path: entry.path };
    if (entry.stage === 1) row.base = entry.blob;
    if (entry.stage === 2) row.ours = entry.blob;
    if (entry.stage === 3) row.theirs = entry.blob;
    map.set(entry.path, row);
  }
  return [...map.values()];
}

export function hasIndexStages(snapshot: Snapshot | null): boolean {
  return !!snapshot?.index.some((e) =>
    e.stage === 1 || e.stage === 2 ||
    e.stage === 3
  );
}

export function IndexStages({ snapshot, events }: IndexStagesProps) {
  const rows = snapshot ? conflictRows(snapshot.index) : [];
  const eventOpen = events.some((e) => e.type === "index-stages");
  const [open, setOpen] = useState(eventOpen);

  useEffect(() => {
    if (eventOpen) setOpen(true);
  }, [eventOpen]);

  if (rows.length === 0) {
    if (snapshot?.conflicted) {
      return (
        <p class="text-xs mt-2 text-[var(--lg-warn)]">
          Repository is in a conflicted state.
        </p>
      );
    }
    return null;
  }

  return (
    <div class="mt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="index-stages-table"
        onClick={() => setOpen((v) => !v)}
        class="px-3 py-1.5 rounded-full text-sm border border-[var(--lg-warn-border)] text-[var(--lg-warn)] bg-[var(--lg-surface)] hover:bg-[var(--lg-warn-bg)] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-accent)]"
      >
        {open ? "Hide Index Stages" : "Show Index Stages"}
      </button>
      {open
        ? (
          <div
            id="index-stages-table"
            class="lg-card mt-2 p-4 overflow-x-auto"
          >
            <h4 class="text-xs uppercase tracking-wide mb-2 text-[var(--lg-warn)]">
              Conflict stages
            </h4>
            <table class="w-full text-xs font-mono tabular-nums">
              <thead class="text-[var(--lg-muted)] text-left">
                <tr>
                  <th class="py-1 pr-3 font-normal">path</th>
                  <th class="py-1 pr-3 font-normal">stage 1 (base)</th>
                  <th class="py-1 pr-3 font-normal">stage 2 (ours)</th>
                  <th class="py-1 font-normal">stage 3 (theirs)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.path}
                    class="border-t border-[var(--lg-border)]"
                  >
                    <td class="py-1 pr-3 text-[var(--lg-text)]">{row.path}</td>
                    <td class="py-1 pr-3">
                      {row.base ? short(row.base) : "—"}
                    </td>
                    <td class="py-1 pr-3">
                      {row.ours ? short(row.ours) : "—"}
                    </td>
                    <td class="py-1">{row.theirs ? short(row.theirs) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        : null}
    </div>
  );
}
