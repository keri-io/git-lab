import {
  BADGE_H,
  Badge,
  Box,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  ObjCard,
  PathEdge,
  objCardH,
  objColor,
} from "./primitives.tsx";

const M = "ill-merge";

export function MergeIllustration() {
  const commitW = 260;
  const commitX = 190;
  const commitY = 36;
  const commitH = objCardH(4);
  const cx = commitX + commitW / 2;
  const busY = commitY + commitH + 14;
  const parentY = busY + 28;
  const objW = 108;
  const objH = 50;
  const mainX = 16;
  const featX = 516;
  const mainC = mainX + objW / 2;
  const featC = featX + objW / 2;
  const treeY = parentY + objH + 32;
  const treeW = 184;
  const featTreeX = 440;
  const boxX = 236;
  const boxW = 168;
  const commitStroke = objColor("commit");
  const treeStroke = objColor("tree");

  return (
    <IllustrationFrame
      title="A merge commit with two parents"
      caption="A merge commit records two parent hashes. Each parent has its own tree; when both edited README.md, the index holds stages 1/2/3 until you add a resolution and commit."
      viewBox="0 0 640 400"
      markerId={M}
    >
      <Badge x={16} y={10} text="MERGE" fill="var(--lg-success)" />
      <Badge x={16} y={10 + BADGE_H + 4} text="HEAD → main" />

      <ObjCard
        x={commitX}
        y={commitY}
        w={commitW}
        kind="commit"
        hash="e9f001a2"
        rows={[
          "tree     4d5e6f70",
          "parent   a2c014e1",
          "parent   c7d552a0",
          "Merge feature",
        ]}
      />
      <PathEdge
        d={`M ${cx} ${commitY + commitH} L ${cx} ${busY} L ${mainC} ${busY} L ${mainC} ${parentY}`}
        markerId={M}
        stroke={commitStroke}
      />
      <PathEdge
        d={`M ${cx} ${busY} L ${featC} ${busY} L ${featC} ${parentY}`}
        markerId={M}
        stroke={commitStroke}
      />
      <Badge x={mainX} y={parentY - BADGE_H - 2} text="main" />
      <Badge x={featX} y={parentY - BADGE_H - 2} text="feature" />
      <Obj
        x={mainX}
        y={parentY}
        kind="commit"
        hash="a2c014e1"
        body="notes"
      />
      <Obj
        x={featX}
        y={parentY}
        kind="commit"
        hash="c7d552a0"
        body="app"
      />

      <Edge
        x1={mainC}
        y1={parentY + objH}
        x2={mainX + treeW / 2}
        y2={treeY}
        markerId={M}
        stroke={commitStroke}
      />
      <Edge
        x1={featC}
        y1={parentY + objH}
        x2={featTreeX + treeW / 2}
        y2={treeY}
        markerId={M}
        stroke={commitStroke}
      />

      <ObjCard
        x={mainX}
        y={treeY}
        w={treeW}
        kind="tree"
        hash="3c4e9c01"
        rows={[
          "blob  d8a1b2c3  README.md",
          "blob  b90e11a2  NOTES.md",
        ]}
        port={false}
      />
      <ObjCard
        x={featTreeX}
        y={treeY}
        w={treeW}
        kind="tree"
        hash="9ab210d4"
        rows={[
          "blob  e4f5a6b7  README.md",
          "blob  5d6e7f18  app.ts",
        ]}
        port={false}
      />

      <Box
        x={boxX}
        y={treeY + 8}
        w={boxW}
        h={58}
        label="README.md"
        sub="stages 1/2/3"
        warn
      />
      <Edge
        x1={mainX + treeW}
        y1={treeY + 28}
        x2={boxX}
        y2={treeY + 28}
        markerId={M}
        stroke={treeStroke}
      />
      <Edge
        x1={featTreeX}
        y1={treeY + 28}
        x2={boxX + boxW}
        y2={treeY + 28}
        markerId={M}
        stroke={treeStroke}
      />
      <EdgeLabel
        x={(mainX + treeW + boxX) / 2}
        y={treeY - 12}
        text="ours"
      />
      <EdgeLabel
        x={(boxX + boxW + featTreeX) / 2}
        y={treeY - 12}
        text="theirs"
      />
    </IllustrationFrame>
  );
}
