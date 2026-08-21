import {
  Badge,
  Dot,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  badgeW,
} from "./primitives.tsx";

const M = "ill-rebase";

export function RebaseIllustration() {
  const objW = 92;
  const objH = 44;
  const afterX0 = 308;
  const step = 114;
  const afterY = 198;
  const dimY = 48;
  const x1 = afterX0;
  const x2 = afterX0 + step;
  const x3 = afterX0 + step * 2;

  return (
    <IllustrationFrame
      title="Rebase replays commits onto a new base"
      caption="Rebase resets feature onto main, then cherry-picks each commit as a new object. Old hashes dangle (dim) until GC; the reflog still names them."
      viewBox="0 0 640 300"
      markerId={M}
    >
      <Badge x={24} y={16} text="before" fill="var(--lg-muted)" />
      <Badge x={afterX0} y={16} text="after" fill="var(--lg-muted)" />

      <line
        x1="286"
        y1="16"
        x2="286"
        y2="284"
        stroke="var(--lg-border)"
        stroke-width="1"
      />

      <Badge x={178} y={48} text="feature" />
      <Dot x={150} y={92} />
      <Dot x={230} y={92} />
      <Edge x1={219} y1={92} x2={161} y2={92} markerId={M} />

      <Dot x={70} y={200} fill="var(--lg-muted)" />
      <Dot x={150} y={200} />
      <Badge x={126} y={220} text="main" />
      <Edge x1={139} y1={200} x2={81} y2={200} markerId={M} />
      <Edge x1={142} y1={104} x2={78} y2={190} markerId={M} />

      <Obj
        x={x2}
        y={dimY}
        kind="commit"
        hash="e4f011"
        body="feat one"
        dim
        w={objW}
        h={objH}
      />
      <Obj
        x={x3}
        y={dimY}
        kind="commit"
        hash="e4f012"
        body="feat two"
        dim
        w={objW}
        h={objH}
      />
      <Edge
        x1={x3}
        y1={dimY + objH / 2}
        x2={x2 + objW}
        y2={dimY + objH / 2}
        dashed
        markerId={M}
      />

      <Obj
        x={x1}
        y={afterY}
        kind="commit"
        hash="a8c100"
        body="main work"
        w={objW}
        h={objH}
      />
      <Obj
        x={x2}
        y={afterY}
        kind="commit"
        hash="b7a201"
        body="feat one"
        w={objW}
        h={objH}
      />
      <Obj
        x={x3}
        y={afterY}
        kind="commit"
        hash="c8b302"
        body="feat two"
        w={objW}
        h={objH}
      />
      <Edge
        x1={x2}
        y1={afterY + objH / 2}
        x2={x1 + objW}
        y2={afterY + objH / 2}
        markerId={M}
      />
      <Edge
        x1={x3}
        y1={afterY + objH / 2}
        x2={x2 + objW}
        y2={afterY + objH / 2}
        markerId={M}
      />
      <EdgeLabel x={(x2 + x3) / 2 + objW / 2} y={afterY - 12} text="replay" />

      <Badge x={x1} y={afterY + objH + 10} text="main" />
      <Badge
        x={x3 + objW - badgeW("feature")}
        y={afterY + objH + 10}
        text="feature"
      />
    </IllustrationFrame>
  );
}
