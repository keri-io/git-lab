import {
  BandLabel,
  Box,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  objColor,
} from "./primitives.tsx";

const M = "ill-packs";

export function PacksIllustration() {
  const looseX = 16;
  const looseY = 36;
  const objW = 108;
  const objH = 50;
  const gap = 14;
  const commitY = looseY;
  const treeY = commitY + objH + gap;
  const blobY = treeY + objH + gap;

  const packX = 196;
  const packY = 52;
  const packW = 200;
  const packH = 112;
  const packCx = packX + packW / 2;
  const packCy = packY + packH / 2;

  const idxX = packX;
  const idxY = packY + packH + 20;
  const idxW = packW;
  const idxH = 52;

  const midxX = 16;
  const midxY = 268;
  const midxW = 280;
  const midxH = 56;

  const bitmapX = 332;
  const bitmapY = midxY;
  const bitmapW = 292;
  const bitmapH = midxH;

  const netX = 432;
  const netY = 36;
  const netW = 192;
  const netH = 72;

  return (
    <IllustrationFrame
      title="Fetch ships a pack; real Git stores loose then packed"
      caption="Loose objects are one file per hash. Fetch streams a .pack plus .idx; MIDX and reachability bitmaps speed lookup and negotiation on large repos. This lab flashes pack-arrival but keeps objects in memory."
      viewBox="0 0 640 360"
      markerId={M}
    >
      <BandLabel x={looseX} y={18} text="LOOSE OBJECTS" />
      <Obj
        x={looseX}
        y={commitY}
        kind="commit"
        hash="a1b003e4"
        body="init"
      />
      <Obj
        x={looseX}
        y={treeY}
        kind="tree"
        hash="d8329fc1"
      />
      <Obj
        x={looseX}
        y={blobY}
        kind="blob"
        hash="d670460b"
        body="README"
      />

      <BandLabel x={packX} y={18} text="ON DISK (REAL GIT)" />
      <Box
        x={packX}
        y={packY}
        w={packW}
        h={packH}
        label="objects.pack"
        sub="zlib + deltas"
        accent
      />
      <Edge
        x1={packCx}
        y1={packY + packH}
        x2={packCx}
        y2={idxY}
        markerId={M}
        stroke="var(--lg-accent)"
      />
      <Box
        x={idxX}
        y={idxY}
        w={idxW}
        h={idxH}
        label="objects.idx"
        sub="hash → offset"
      />
      <Edge
        x1={looseX + objW}
        y1={treeY + objH / 2}
        x2={packX}
        y2={packCy}
        dashed
        markerId={M}
        stroke={objColor("tree")}
      />
      <EdgeLabel x={158} y={treeY + 6} text="git gc" />

      <BandLabel x={netX} y={18} text="FETCH" />
      <Box
        x={netX}
        y={netY}
        w={netW}
        h={netH}
        label="origin"
        sub="have / want"
        stash
      />
      <Edge
        x1={netX}
        y1={netY + netH / 2}
        x2={packX + packW}
        y2={packCy}
        markerId={M}
        stroke="var(--lg-stash)"
      />
      <EdgeLabel x={418} y={netY + 28} text="pack stream" />

      <BandLabel x={midxX} y={midxY - 14} text="SPEEDUPS" />
      <Box
        x={midxX}
        y={midxY}
        w={midxW}
        h={midxH}
        label="multi-pack-index"
        sub="MIDX · many .idx"
      />
      <Box
        x={bitmapX}
        y={bitmapY}
        w={bitmapW}
        h={bitmapH}
        label="reachability bitmap"
        sub="fast have / want"
        warn
      />
      <Edge
        x1={packCx}
        y1={idxY + idxH}
        x2={midxX + midxW / 2}
        y2={midxY}
        dashed
        markerId={M}
      />
      <Edge
        x1={netX + netW / 2}
        y1={netY + netH}
        x2={bitmapX + bitmapW / 2}
        y2={bitmapY}
        dashed
        markerId={M}
        stroke="var(--lg-stash)"
      />
    </IllustrationFrame>
  );
}
