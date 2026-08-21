import {
  BADGE_H,
  Badge,
  BandLabel,
  Box,
  Edge,
  IllustrationFrame,
  Obj,
  ObjCard,
  PathEdge,
  objCardH,
  objColor,
} from "./primitives.tsx";

const M = "ill-pull";

export function PullIllustration() {
  const snapX = 200;
  const snapW = 248;
  const commitY = 36;
  const commitH = objCardH(4);
  const treeY = commitY + commitH + 24;
  const treeH = objCardH(2);
  const blobY = treeY + treeH + 24;
  const blobW = 172;
  const cx = snapX + snapW / 2;
  const b1x = 188;
  const b2x = 396;
  const b1c = b1x + blobW / 2;
  const b2c = b2x + blobW / 2;
  const busY = treeY + treeH + 12;
  const commitStroke = objColor("commit");
  const treeStroke = objColor("tree");
  const objH = 50;
  const tipY = 80;
  const parentY = 160;
  const objCx = 16 + 108 / 2;
  const originY = 28;
  const mainY = originY + BADGE_H + 4;

  return (
    <IllustrationFrame
      title="Pull fetches, then fast-forwards main"
      caption="Pull is fetch plus integrate. After a fast-forward, origin/main and main both sit on the new commit and checkout updates the worktree — unlike fetch, which would leave main and the files behind."
      viewBox="0 0 640 430"
      markerId={M}
    >
      <BandLabel x={16} y={18} text="REFS" />
      <Badge
        x={16}
        y={originY}
        text="origin/main"
        fill="var(--lg-stash)"
      />
      <Badge x={16} y={mainY} text="main" />
      <Obj
        x={16}
        y={tipY}
        kind="commit"
        hash="b4e821c0"
        body="docs"
      />
      <Edge
        x1={objCx}
        y1={tipY + objH}
        x2={objCx}
        y2={parentY}
        markerId={M}
        stroke={commitStroke}
      />
      <Obj
        x={16}
        y={parentY}
        kind="commit"
        hash="a1b003e4"
        body="init"
        dim
      />
      <Box
        x={16}
        y={parentY + objH + 16}
        w={148}
        h={52}
        label="worktree"
        sub="NOTES.md added"
        accent
      />

      <ObjCard
        x={snapX}
        y={commitY}
        w={snapW}
        kind="commit"
        hash="b4e821c0"
        rows={[
          "tree     8f3a12b8",
          "parent   a1b003e4",
          "author   you",
          "origin moved",
        ]}
      />
      <Edge
        x1={cx}
        y1={commitY + commitH}
        x2={cx}
        y2={treeY}
        markerId={M}
        stroke={commitStroke}
      />

      <ObjCard
        x={snapX}
        y={treeY}
        w={snapW}
        kind="tree"
        hash="8f3a12b8"
        rows={[
          "blob  d670460b  README.md",
          "blob  7c91aa01  NOTES.md",
        ]}
      />
      <PathEdge
        d={`M ${cx} ${treeY + treeH} L ${cx} ${busY} L ${b1c} ${busY} L ${b1c} ${blobY}`}
        markerId={M}
        stroke={treeStroke}
      />
      <PathEdge
        d={`M ${cx} ${busY} L ${b2c} ${busY} L ${b2c} ${blobY}`}
        markerId={M}
        stroke={treeStroke}
      />

      <ObjCard
        x={b1x}
        y={blobY}
        w={blobW}
        kind="blob"
        hash="d670460b"
        rows={['"# demo"', "(no filename)"]}
        port={false}
      />
      <ObjCard
        x={b2x}
        y={blobY}
        w={blobW}
        kind="blob"
        hash="7c91aa01"
        rows={['"from origin"', "(no filename)"]}
        port={false}
      />
    </IllustrationFrame>
  );
}
