import {
  BADGE_H,
  Badge,
  BandLabel,
  Box,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  PathEdge,
  badgeW,
} from "./primitives.tsx";

const M = "ill-fork";

export function ForkIllustration() {
  const objH = 50;
  const commitW = 108;
  const treeW = 108;
  const commitX = 36;
  const treeX = 230;
  const blobX = 478;
  const row1Y = 108;
  const row2Y = 226;
  const upText = "upstream/main";
  const originText = "origin/main";
  const mainText = "main";

  return (
    <IllustrationFrame
      title="Fork remotes: origin, main, and upstream"
      caption="origin is your fork; upstream is the maintainers. Objects stay shared until they add a commit, tree, and UPSTREAM.md — fetch upstream, then merge into main."
      viewBox="0 0 640 328"
      markerId={M}
    >
      <Box x={24} y={8} w={168} h={44} label="origin" sub="your fork" />
      <Box
        x={236}
        y={8}
        w={168}
        h={44}
        label="main"
        sub="your clone"
        accent
      />
      <Box x={448} y={8} w={168} h={44} label="upstream" sub="maintainers" />

      <BandLabel x={36} y={72} text="COMMITS" />
      <BandLabel x={230} y={72} text="TREES" />
      <BandLabel x={478} y={72} text="BLOBS" />

      <Badge
        x={24}
        y={row1Y - BADGE_H - 2}
        text={upText}
        fill="var(--lg-success)"
      />
      <Obj
        x={commitX}
        y={row1Y}
        kind="commit"
        hash="c9e220"
        body="maintainers"
      />
      <Obj x={treeX} y={row1Y} kind="tree" hash="7f2a11" body="root" />
      <Obj x={blobX} y={row1Y} kind="blob" hash="e4b801" body='"from up"' />

      <Badge
        x={24}
        y={row2Y + objH + 6}
        text={originText}
        fill="var(--lg-muted)"
      />
      <Badge
        x={24 + badgeW(originText) + 8}
        y={row2Y + objH + 6}
        text={mainText}
      />
      <Obj
        x={commitX}
        y={row2Y}
        kind="commit"
        hash="a1b003"
        body="initial"
      />
      <Obj x={treeX} y={row2Y} kind="tree" hash="d8329f" body="root" />
      <Obj x={blobX} y={row2Y} kind="blob" hash="d67046" body='"# demo"' />

      <Edge
        x1={commitX + commitW / 2}
        y1={row1Y + objH}
        x2={commitX + commitW / 2}
        y2={row2Y}
        markerId={M}
      />
      <EdgeLabel x={62} y={(row1Y + objH + row2Y) / 2} text="parent" />

      <Edge
        x1={commitX + commitW}
        y1={row1Y + objH / 2}
        x2={treeX}
        y2={row1Y + objH / 2}
        markerId={M}
      />
      <Edge
        x1={commitX + commitW}
        y1={row2Y + objH / 2}
        x2={treeX}
        y2={row2Y + objH / 2}
        markerId={M}
      />

      <Edge
        x1={treeX + treeW}
        y1={row1Y + objH / 2}
        x2={blobX}
        y2={row1Y + objH / 2}
        markerId={M}
      />
      <EdgeLabel
        x={(treeX + treeW + blobX) / 2}
        y={row1Y + objH / 2 - 14}
        text="UPSTREAM.md"
      />

      <PathEdge
        d={`M ${treeX + treeW} ${row1Y + 38} C 400 155, 440 240, ${blobX} ${
          row2Y + objH / 2
        }`}
        markerId={M}
      />
      <Edge
        x1={treeX + treeW}
        y1={row2Y + objH / 2}
        x2={blobX}
        y2={row2Y + objH / 2}
        markerId={M}
      />
      <EdgeLabel
        x={(treeX + treeW + blobX) / 2}
        y={row2Y + objH / 2 - 14}
        text="README.md"
      />
    </IllustrationFrame>
  );
}
