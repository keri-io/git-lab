import {
  Badge,
  Box,
  EdgeLabel,
  IllustrationFrame,
  objChainRow,
  PathEdge,
} from "./primitives.tsx";

const C = "ill-stash-conflicts";

export function StashConflictsIllustration() {
  return (
    <IllustrationFrame
      title="Stash apply can leave conflict stages"
      caption="Apply merges W onto the current tree. Conflicting README.md blobs fill index stages 1/2/3; drop the stash only after you resolve and git add."
      viewBox="0 0 640 320"
      markerId={C}
    >
      <Badge x={24} y={12} text="stash" fill="var(--lg-stash)" />

      {objChainRow({
        y: 40,
        commitX: 24,
        treeX: 200,
        blobX: 392,
        markerId: C,
        commit: { hash: "s0w001", body: "W" },
        tree: { hash: "s0t003", body: "root" },
        blob: { hash: "s0b004", body: '"from stash"' },
      })}
      {objChainRow({
        y: 160,
        commitX: 24,
        treeX: 200,
        blobX: 392,
        markerId: C,
        commit: { hash: "c1a009", body: "HEAD" },
        tree: { hash: "c1t010", body: "root" },
        blob: { hash: "c1b011", body: '"from main"' },
      })}
      <EdgeLabel x={350} y={52} text="README.md" />
      <EdgeLabel x={350} y={172} text="README.md" />

      <PathEdge
        d="M 452 90 C 400 130, 280 180, 240 248"
        dashed
        markerId={C}
      />
      <PathEdge
        d="M 452 210 C 400 230, 360 244, 320 248"
        dashed
        markerId={C}
      />
      <EdgeLabel x={390} y={118} text="apply" />

      <Box
        x={160}
        y={248}
        w={240}
        h={56}
        label="stages 1/2/3"
        sub="drop after resolve"
        warn
      />
    </IllustrationFrame>
  );
}
