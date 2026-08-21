import {
  BandLabel,
  Box,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  objChainRow,
} from "./primitives.tsx";

const WT = "ill-worktrees";

export function WorktreesIllustration() {
  const objH = 50;
  const commitW = 108;
  const blobW = 120;
  const commitX = 200;
  const treeX = 360;
  const blobX = 512;
  const row1Y = 80;
  const row2Y = 168;
  const wtX = 16;
  const wtW = 156;

  return (
    <IllustrationFrame
      title="Two worktree checkouts, one object store"
      caption="Each worktree has its own HEAD, index, and files. Both point into the same object store: hotfix's commit parents the first commit already on main."
      viewBox="0 0 640 300"
      markerId={WT}
    >
      <Box
        x={190}
        y={8}
        w={444}
        h={44}
        label="object store"
        sub=".git/objects"
        accent
      />
      <BandLabel x={200} y={68} text="COMMITS" />
      <BandLabel x={360} y={68} text="TREES" />
      <BandLabel x={512} y={68} text="BLOBS" />

      <Box x={wtX} y={row1Y} w={wtW} h={52} label="." sub="HEAD → main" />
      <Box
        x={wtX}
        y={row2Y}
        w={wtW}
        h={52}
        label="../hotfix"
        sub="HEAD → hotfix"
      />

      {objChainRow({
        y: row1Y,
        commitX,
        treeX,
        blobX,
        markerId: WT,
        commit: { hash: "a1b003", body: "first" },
        tree: { hash: "d8329f", body: "root" },
        blob: { hash: "d67046", body: '"# demo"' },
      })}
      {objChainRow({
        y: row2Y,
        commitX,
        treeX,
        blobX,
        markerId: WT,
        commit: { hash: "h0f011", body: "hotfix" },
        tree: { hash: "h0t012", body: "root" },
        blob: { hash: "h0b013", body: '"hotfix"' },
      })}
      <Edge
        x1={wtX + wtW}
        y1={row1Y + 26}
        x2={commitX}
        y2={row1Y + objH / 2}
        markerId={WT}
      />
      <Edge
        x1={wtX + wtW}
        y1={row2Y + 26}
        x2={commitX}
        y2={row2Y + objH / 2}
        markerId={WT}
      />
      <Edge
        x1={commitX + commitW / 2}
        y1={row2Y}
        x2={commitX + commitW / 2}
        y2={row1Y + objH}
        markerId={WT}
      />
      <EdgeLabel
        x={commitX + commitW / 2 - 22}
        y={(row1Y + objH + row2Y) / 2}
        text="parent"
      />

      <EdgeLabel
        x={blobX + blobW / 2}
        y={row1Y + objH + 12}
        text="README.md"
      />
      <EdgeLabel
        x={blobX + blobW / 2}
        y={row2Y + objH + 12}
        text="README.md"
      />
    </IllustrationFrame>
  );
}
