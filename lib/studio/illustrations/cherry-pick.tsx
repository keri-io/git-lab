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

const M = "ill-cherry-pick";

export function CherryPickIllustration() {
  const objH = 50;
  const commitW = 108;
  const treeW = 108;
  const leftX = 24;
  const midX = 160;
  const treeX = 310;
  const blobX = 500;
  const row1Y = 58;
  const row2Y = 144;
  const row3Y = 228;

  return (
    <IllustrationFrame
      title="Cherry-pick copies a patch as a new commit"
      caption="The hotfix patch is replayed onto main as a new hash; the parent is main, not the source. Both trees can reuse the same patched README blob; the commits are still different objects."
      viewBox="0 0 640 336"
      markerId={M}
    >
      <BandLabel x={24} y={18} text="COMMITS" />
      <BandLabel x={310} y={18} text="TREES" />
      <BandLabel x={500} y={18} text="BLOBS" />

      <Badge
        x={midX}
        y={row1Y - BADGE_H - 2}
        text="hotfix"
        fill="var(--lg-warn)"
      />
      <Obj
        x={midX}
        y={row1Y}
        kind="commit"
        hash="d4e881"
        body="urgent fix"
      />
      <Obj x={treeX} y={row1Y} kind="tree" hash="8c2a10" body="root" />

      <Obj
        x={leftX}
        y={row2Y}
        kind="commit"
        hash="a1b003"
        body="initial"
      />
      <Obj
        x={blobX}
        y={row2Y}
        kind="blob"
        hash="b90e11"
        body='"patched"'
      />

      <Badge x={midX} y={row3Y + objH + 6} text="main" />
      <Obj
        x={leftX}
        y={row3Y}
        kind="commit"
        hash="a2c014"
        body="add notes"
      />
      <Obj
        x={midX}
        y={row3Y}
        kind="commit"
        hash="f7b210"
        body="urgent fix"
      />
      <Obj x={treeX} y={row3Y} kind="tree" hash="1d9e44" body="root" />
      <Obj
        x={blobX}
        y={row3Y}
        kind="blob"
        hash="c4f022"
        body='"notes"'
      />

      <Edge
        x1={midX}
        y1={row1Y + objH / 2}
        x2={leftX + commitW}
        y2={row2Y + objH / 2}
        markerId={M}
      />
      <Edge
        x1={leftX + commitW / 2}
        y1={row3Y}
        x2={leftX + commitW / 2}
        y2={row2Y + objH}
        markerId={M}
      />
      <Edge
        x1={midX}
        y1={row3Y + objH / 2}
        x2={leftX + commitW}
        y2={row3Y + objH / 2}
        markerId={M}
      />
      <EdgeLabel x={78} y={(row2Y + objH + row3Y) / 2} text="parent" />

      <PathEdge
        d={`M ${midX + commitW / 2} ${row1Y + objH} L ${
          midX + commitW / 2
        } ${row3Y}`}
        dashed
        markerId={M}
      />
      <EdgeLabel x={248} y={(row1Y + objH + row3Y) / 2} text="cherry-pick" />

      <Edge
        x1={midX + commitW}
        y1={row1Y + objH / 2}
        x2={treeX}
        y2={row1Y + objH / 2}
        markerId={M}
      />
      <Edge
        x1={midX + commitW}
        y1={row3Y + objH / 2}
        x2={treeX}
        y2={row3Y + objH / 2}
        markerId={M}
      />

      <PathEdge
        d={`M ${treeX + treeW} ${row1Y + 18} C 450 ${row1Y + 18}, 470 ${
          row2Y + 10
        }, ${blobX} ${row2Y + 18}`}
        markerId={M}
      />
      <PathEdge
        d={`M ${treeX + treeW} ${row3Y + 12} C 450 ${row3Y + 12}, 470 ${
          row2Y + objH - 8
        }, ${blobX} ${row2Y + objH - 8}`}
        markerId={M}
      />
      <EdgeLabel
        x={(treeX + treeW + blobX) / 2}
        y={row2Y - 12}
        text="README.md"
      />

      <Edge
        x1={treeX + treeW}
        y1={row3Y + objH / 2}
        x2={blobX}
        y2={row3Y + objH / 2}
        markerId={M}
      />
      <EdgeLabel
        x={(treeX + treeW + blobX) / 2}
        y={row3Y + objH / 2 - 14}
        text="NOTES.md"
      />
    </IllustrationFrame>
  );
}
