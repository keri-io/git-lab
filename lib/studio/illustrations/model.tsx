import {
  BADGE_H,
  Badge,
  Edge,
  IllustrationFrame,
  ObjCard,
  PathEdge,
  Port,
  badgeW,
  hashTabW,
  objCardH,
  objColor,
} from "./primitives.tsx";

const M = "ill-model";

export function ModelIllustration() {
  const commitW = 240;
  const commitX = 180;
  const headText = "HEAD → main";
  const headY = 8;
  const commitY = headY + BADGE_H + 12;
  const commitH = objCardH(4);
  const tagW = 152;
  const tagX = 12;
  const tagY = commitY;
  const tagH = objCardH(4);
  const tagRight = tagX + tagW;
  const tagMidY = tagY + tagH / 2;
  const treeY = commitY + commitH + 26;
  const treeH = objCardH(3);
  const childY = treeY + treeH + 26;
  const blobW = 172;
  const subH = objCardH(1);
  const nestedY = childY + subH + 22;
  const cx = commitX + commitW / 2;
  const b1x = 12;
  const b2x = 204;
  const t2x = 396;
  const b1c = b1x + blobW / 2;
  const b2c = b2x + blobW / 2;
  const t2c = t2x + blobW / 2;
  const busY = treeY + treeH + 12;
  const commitStroke = objColor("commit");
  const treeStroke = objColor("tree");
  const tagStroke = objColor("tag");
  const v1Text = "v1.0";
  const v1X = tagX + 12 + hashTabW("9ae4c017") + 6;
  const headX = commitX + commitW - badgeW(headText);

  return (
    <IllustrationFrame
      title="A commit points at a tree; trees name blobs and subtrees"
      caption="A commit stores metadata plus a root-tree hash. That tree lists names → hashes (files are blobs, folders are more trees). Blobs are bytes only — the filename lives on the tree. An annotated tag points at a commit; it is an object, not a moving branch."
      viewBox="0 0 580 520"
      markerId={M}
    >
      <ObjCard
        x={tagX}
        y={tagY}
        w={tagW}
        kind="tag"
        hash="9ae4c017"
        rows={[
          "object   a1b003e4",
          "type     commit",
          "tag      v1.0",
          "tagger   you",
        ]}
        port={false}
      />
      <Badge
        x={v1X}
        y={tagY - 10}
        text={v1Text}
        fill={tagStroke}
      />
      <Port x={tagRight} y={tagMidY} fill={tagStroke} />
      <Edge
        x1={tagRight}
        y1={tagMidY}
        x2={commitX}
        y2={commitY + commitH / 2}
        markerId={M}
        stroke={tagStroke}
      />

      <Badge x={headX} y={headY} text={headText} />

      <ObjCard
        x={commitX}
        y={commitY}
        w={commitW}
        kind="commit"
        hash="a1b003e4"
        rows={[
          "tree     d8329fc1",
          "parent   (none)",
          "author   you",
          "initial",
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
        x={commitX}
        y={treeY}
        w={commitW}
        kind="tree"
        hash="d8329fc1"
        rows={[
          "blob  d670460b  README.md",
          "blob  b90e11a2  notes.md",
          "tree  7e8f9a04  src",
        ]}
      />

      <PathEdge
        d={`M ${cx} ${treeY + treeH} L ${cx} ${busY} L ${b1c} ${busY} L ${b1c} ${childY}`}
        markerId={M}
        stroke={treeStroke}
      />
      <PathEdge
        d={`M ${cx} ${busY} L ${b2c} ${busY} L ${b2c} ${childY}`}
        markerId={M}
        stroke={treeStroke}
      />
      <PathEdge
        d={`M ${cx} ${busY} L ${t2c} ${busY} L ${t2c} ${childY}`}
        markerId={M}
        stroke={treeStroke}
      />

      <ObjCard
        x={b1x}
        y={childY}
        w={blobW}
        kind="blob"
        hash="d670460b"
        rows={['"# demo"', "(no filename)"]}
        port={false}
      />
      <ObjCard
        x={b2x}
        y={childY}
        w={blobW}
        kind="blob"
        hash="b90e11a2"
        rows={['"todo"', "(no filename)"]}
        port={false}
      />
      <ObjCard
        x={t2x}
        y={childY}
        w={blobW}
        kind="tree"
        hash="7e8f9a04"
        rows={["blob  5d6e7f18  app.ts"]}
      />
      <Edge
        x1={t2c}
        y1={childY + subH}
        x2={t2c}
        y2={nestedY}
        markerId={M}
        stroke={treeStroke}
      />
      <ObjCard
        x={t2x}
        y={nestedY}
        w={blobW}
        kind="blob"
        hash="5d6e7f18"
        rows={['"export {}"', "(no filename)"]}
        port={false}
      />
    </IllustrationFrame>
  );
}
