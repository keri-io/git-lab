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

const M = "ill-fetch";

export function FetchIllustration() {
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
  const newObjY = 56;
  const oldObjY = 174;
  const objCx = 16 + 108 / 2;

  return (
    <IllustrationFrame
      title="Fetch moves origin/main, not the worktree"
      caption="Fetch downloads the new commit’s objects and slides origin/main forward. Local main and the worktree stay on the old tip; README.md’s blob is reused, NOTES.md is new."
      viewBox="0 0 640 430"
      markerId={M}
    >
      <BandLabel x={16} y={18} text="REFS" />
      <Badge
        x={16}
        y={newObjY - BADGE_H - 2}
        text="origin/main"
        fill="var(--lg-stash)"
      />
      <Obj
        x={16}
        y={newObjY}
        kind="commit"
        hash="b4e821c0"
        body="docs"
      />
      <Edge
        x1={objCx}
        y1={newObjY + objH}
        x2={objCx}
        y2={oldObjY}
        markerId={M}
        stroke={commitStroke}
      />
      <Badge x={16} y={oldObjY - BADGE_H - 2} text="main" />
      <Obj
        x={16}
        y={oldObjY}
        kind="commit"
        hash="a1b003e4"
        body="init"
      />
      <Box
        x={16}
        y={oldObjY + objH + 16}
        w={148}
        h={48}
        label="worktree"
        sub="unchanged"
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
          "upstream docs",
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
