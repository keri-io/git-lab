import {
  Badge,
  BADGE_H,
  BandLabel,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  objChainRow,
  PathEdge,
} from "./primitives.tsx";

const M = "ill-reset";

export function ResetIllustration() {
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
      title="Reset moves main backward"
      caption="reset moves the branch label; objects are not deleted. The wip commit still has its tree and NOTES.md blob, reachable from the reflog until GC."
      viewBox="0 0 640 320"
      markerId={M}
    >
      <BandLabel x={36} y={18} text="COMMITS" />
      <BandLabel x={230} y={18} text="TREES" />
      <BandLabel x={478} y={18} text="BLOBS" />

      <Badge
        x={commitX + commitW + 6}
        y={row1Y - BADGE_H - 2}
        text="reflog"
        fill="var(--lg-muted)"
      />
      {objChainRow({
        y: row1Y,
        commitX,
        treeX,
        blobX,
        markerId: M,
        commit: { hash: "c4d891", body: "wip notes", dim: true },
        tree: { hash: "5a8e22", body: "root", dim: true },
        blob: { hash: "a9c013", body: '"scratch"', dim: true },
      })}

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
      <EdgeLabel x={190} y={(row1Y + row2Y) / 2} text="reset" />

      <Edge
        x1={commitX + commitW / 2}
        y1={row1Y + objH}
        x2={commitX + commitW / 2}
        y2={row2Y}
        markerId={M}
      />
      <EdgeLabel
        x={62}
        y={(row1Y + objH + row2Y) / 2}
        text="parent"
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
