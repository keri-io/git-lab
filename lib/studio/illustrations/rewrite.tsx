import {
  BADGE_H,
  Badge,
  BandLabel,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  PathEdge,
} from "./primitives.tsx";

const R = "ill-rewrite";

export function RewriteIllustration() {
  const objH = 50;
  const commitW = 108;
  const treeW = 108;
  const commitX = 24;
  const treeX = 280;
  const blobX = 500;
  const squashY = 56;
  const firstY = 148;
  const wipY = 248;

  return (
    <IllustrationFrame
      title="Squash rewrite: dangling wips and reused blobs"
      caption="Soft-reset keeps the index, then one new commit records it. Old wip commits dangle, but their a.ts and b.ts blobs are reused by the squash commit's tree."
      viewBox="0 0 640 328"
      markerId={R}
    >
      <BandLabel x={36} y={14} text="COMMITS" />
      <BandLabel x={280} y={14} text="TREES" />
      <BandLabel x={500} y={14} text="BLOBS" />

      <Badge x={commitX} y={squashY - BADGE_H - 2} text="HEAD → main" />
      <Badge x={148} y={wipY - BADGE_H - 2} text="dangling" fill="var(--lg-muted)" />

      <Obj x={commitX} y={squashY} kind="commit" hash="c9a011" body="squash" />
      <Obj x={commitX} y={firstY} kind="commit" hash="a1b003" body="first" />
      <Edge
        x1={commitX + commitW / 2}
        y1={squashY + objH}
        x2={commitX + commitW / 2}
        y2={firstY}
        markerId={R}
      />
      <EdgeLabel
        x={56}
        y={(squashY + objH + firstY) / 2}
        text="parent"
      />

      <Obj
        x={commitX}
        y={wipY}
        kind="commit"
        hash="b2e014"
        body="wip one"
        dim
      />
      <Obj
        x={148}
        y={wipY}
        kind="commit"
        hash="b3f025"
        body="wip two"
        dim
      />
      <Edge
        x1={148}
        y1={wipY + objH / 2}
        x2={commitX + commitW}
        y2={wipY + objH / 2}
        markerId={R}
      />
      <PathEdge
        d={`M ${commitX + commitW / 2} ${wipY} C 78 230, 78 210, ${
          commitX + commitW / 2
        } ${firstY + objH}`}
        markerId={R}
      />

      <Obj x={treeX} y={squashY} kind="tree" hash="7e2c1a" body="root" />
      <Obj x={treeX} y={firstY} kind="tree" hash="d8329f" body="root" />
      <Edge
        x1={commitX + commitW}
        y1={squashY + objH / 2}
        x2={treeX}
        y2={squashY + objH / 2}
        markerId={R}
      />
      <Edge
        x1={commitX + commitW}
        y1={firstY + objH / 2}
        x2={treeX}
        y2={firstY + objH / 2}
        markerId={R}
      />

      <Obj x={blobX} y={36} kind="blob" hash="e4a001" body="export a" />
      <Obj x={blobX} y={104} kind="blob" hash="e4b002" body="export b" />
      <Obj
        x={blobX}
        y={200}
        kind="blob"
        hash="d67046"
        body='"# demo"'
      />

      <Edge
        x1={treeX + treeW}
        y1={squashY + 14}
        x2={blobX}
        y2={61}
        markerId={R}
      />
      <EdgeLabel x={444} y={48} text="a.ts" />

      <PathEdge
        d={`M ${treeX + treeW} ${squashY + objH / 2} C 440 81, 470 120, ${blobX} 129`}
        markerId={R}
      />
      <EdgeLabel x={448} y={100} text="b.ts" />

      <PathEdge
        d={`M ${treeX + treeW} ${squashY + 41} C 430 140, 460 210, ${blobX} 225`}
        markerId={R}
      />
      <Edge
        x1={treeX + treeW}
        y1={firstY + objH / 2}
        x2={blobX}
        y2={225}
        markerId={R}
      />
      <EdgeLabel x={444} y={188} text="README.md" />

      <PathEdge
        d={`M ${commitX + commitW} ${wipY} C 400 255, 460 140, ${blobX} 61`}
        dashed
        markerId={R}
      />
      <PathEdge
        d={`M ${148 + commitW} ${wipY + objH / 2} C 400 273, 460 180, ${blobX} 129`}
        dashed
        markerId={R}
      />
    </IllustrationFrame>
  );
}
