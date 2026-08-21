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

const M = "ill-amend";

export function AmendIllustration() {
  const objH = 50;
  const commitW = 108;
  const treeW = 108;
  const commitX = 36;
  const treeX = 230;
  const blobX = 478;
  const row1Y = 62;
  const row2Y = 154;
  const row3Y = 256;

  return (
    <IllustrationFrame
      title="Amend writes a new commit object"
      caption="Amend writes a new commit and tree with the same parent; objects never change. main moves to the new hash; origin/main may still name the old (dim) commit."
      viewBox="0 0 640 336"
      markerId={M}
    >
      <BandLabel x={36} y={18} text="COMMITS" />
      <BandLabel x={230} y={18} text="TREES" />
      <BandLabel x={478} y={18} text="BLOBS" />

      <Badge x={36} y={row1Y - BADGE_H - 2} text="main" />
      {objChainRow({
        y: row1Y,
        commitX,
        treeX,
        blobX,
        markerId: M,
        commit: { hash: "b8f21a", body: "amended" },
        tree: { hash: "9e3c10", body: "root" },
        blob: { hash: "e11a02", body: '"forgot"' },
      })}

      <Badge
        x={36}
        y={row2Y - BADGE_H - 2}
        text="origin/main"
        fill="var(--lg-muted)"
      />
      <Obj
        x={commitX}
        y={row2Y}
        kind="commit"
        hash="a2c014"
        body="old HEAD"
        dim
      />
      <Obj x={treeX} y={row2Y} kind="tree" hash="3c4e9c" body="root" dim />

      <Obj x={commitX} y={row3Y} kind="commit" hash="a1b003" body="first" />
      <Obj x={blobX} y={row3Y} kind="blob" hash="d67046" body='"# demo"' />

      <PathEdge
        d={`M ${commitX + commitW / 2} ${row1Y + objH} C 8 140, 8 248, ${
          commitX + commitW / 2
        } ${row3Y}`}
        markerId={M}
      />
      <Edge
        x1={commitX + commitW / 2}
        y1={row2Y + objH}
        x2={commitX + commitW / 2}
        y2={row3Y}
        markerId={M}
      />
      <EdgeLabel x={52} y={(row2Y + objH + row3Y) / 2} text="parent" />

      <Edge
        x1={commitX + commitW}
        y1={row2Y + objH / 2}
        x2={treeX}
        y2={row2Y + objH / 2}
        markerId={M}
      />

      <EdgeLabel
        x={(treeX + treeW + blobX) / 2}
        y={row1Y + objH / 2 - 14}
        text="extra.md"
      />

      <PathEdge
        d={`M ${treeX + treeW} ${row1Y + 38} C 400 110, 440 248, ${blobX} ${
          row3Y + objH / 2
        }`}
        markerId={M}
      />
      <PathEdge
        d={`M ${treeX + treeW} ${
          row2Y + objH / 2
        } C 400 210, 440 270, ${blobX} ${row3Y + objH / 2}`}
        markerId={M}
      />
      <EdgeLabel
        x={(treeX + treeW + blobX) / 2}
        y={row3Y + objH / 2 - 14}
        text="README.md"
      />
    </IllustrationFrame>
  );
}
