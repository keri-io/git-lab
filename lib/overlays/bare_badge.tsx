import type { Snapshot } from "../git-vm/types.ts";

export function BareBadge({ snapshot }: { snapshot: Snapshot | null }) {
  if (!snapshot?.bare) return null;
  return (
    <p
      class="lg-chip"
      translate={false}
    >
      bare
    </p>
  );
}
