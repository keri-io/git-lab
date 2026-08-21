import {
  Badge,
  BADGE_H,
  BandLabel,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  objChainRow,
  PathEdge,
} from "./primitives.tsx";

const M = "ill-gc";

export function GcIllustration() {
  const objH = 50;
  const commitW = 108;
  const treeW = 108;
  const commitX = 36;
  const treeX = 230;
  const blobX = 478;
  const row1Y = 62;
  const row2Y = 214;

  return (
    <IllustrationFrame
      title="GC prunes unreachable commits"
      caption="After reset the wip commit dangles until prune. Expire reflog first so nothing still references it; gc --prune=now deletes the commit, tree, and blobs not reachable from refs."
      viewBox="0 0 640 320"
      markerId={M}
    >
      <BandLabel x={36} y={18} text="COMMITS" />
      <BandLabel x={230} y={18} text="TREES" />
      <BandLabel x={478} y={18} text="BLOBS" />

      <Badge
        x={commitX + commitW + 6}
        y={row1Y - BADGE_H - 2}
        text="pruned"
        fill="var(--lg-muted)"
      />
      <Obj
        x={commitX}
        y={row1Y}
        kind="commit"
        hash="c4d891"
        body="wip notes"
        dim
      />
      <Obj x={treeX} y={row1Y} kind="tree" hash="5a8e22" body="root" dim />
      <Obj
        x={blobX}
        y={row1Y}
        kind="blob"
        hash="a9c013"
        body='"scratch"'
        dim
      />

      <Badge x={commitX} y={row2Y - BADGE_H - 2} text="main" />
      {objChainRow({
        y: row2Y,
        commitX,
        treeX,
        blobX,
        markerId: M,
        commit: { hash: "a1b003", body: "initial" },
        tree: { hash: "d8329f", body: "root" },
        blob: { hash: "d67046", body: '"# demo"' },
      })}

      <PathEdge
        d={`M ${commitX + commitW} ${row1Y + objH / 2} C 190 ${
          row1Y + objH / 2
        }, 190 ${row2Y - 16}, ${commitX + commitW / 2 - 6} ${row2Y - 16}`}
        dashed
        markerId={M}
      />
      <EdgeLabel x={190} y={(row1Y + row2Y) / 2} text="gc" />

      <Edge
        x1={commitX + commitW / 2}
        y1={row1Y + objH}
        x2={commitX + commitW / 2}
        y2={row2Y}
        markerId={M}
        dashed
      />
      <EdgeLabel
        x={62}
        y={(row1Y + objH + row2Y) / 2}
        text="was parent"
      />

      <Edge
        x1={commitX + commitW}
        y1={row1Y + objH / 2}
        x2={treeX}
        y2={row1Y + objH / 2}
        markerId={M}
        dashed
      />
      <Edge
        x1={treeX + treeW}
        y1={row1Y + objH / 2}
        x2={blobX}
        y2={row1Y + objH / 2}
        markerId={M}
        dashed
      />
      <EdgeLabel
        x={(treeX + treeW + blobX) / 2}
        y={row1Y + objH / 2 - 14}
        text="NOTES.md"
      />

      <EdgeLabel
        x={(treeX + treeW + blobX) / 2}
        y={row2Y + objH / 2 - 14}
        text="README.md"
      />
    </IllustrationFrame>
  );
}
