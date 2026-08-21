import {
  Badge,
  Dot,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  badgeW,
} from "./primitives.tsx";

const M = "ill-rebase-onto";

export function RebaseOntoIllustration() {
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
      title="Rebase --onto drops a middle commit, replays the rest"
      caption="Commits reachable from topic but not wip (only B) replay onto main work. Commit A on wip is excluded by the upstream cutoff and stays behind as a dangling patch."
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

      <Badge x={178} y={48} text="topic" />
      <Dot x={150} y={92} />
      <Dot x={230} y={92} />
      <Edge x1={219} y1={92} x2={161} y2={92} markerId={M} />
      <EdgeLabel x={178} y={78} text="A → B" />

      <Dot x={70} y={200} fill="var(--lg-muted)" />
      <Dot x={150} y={200} />
      <Badge x={126} y={220} text="main" />
      <Edge x1={139} y1={200} x2={81} y2={200} markerId={M} />
      <Edge x1={142} y1={104} x2={78} y2={190} markerId={M} />

      <Obj
        x={70}
        y={dimY}
        kind="commit"
        hash="a4c011"
        body="only A"
        dim
        w={objW}
        h={objH}
      />
      <Badge x={98} y={dimY + objH + 8} text="wip" fill="var(--lg-muted)" />
      <EdgeLabel x={118} y={dimY - 10} text="drop" />

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
        hash="c8b302"
        body="only B"
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
      <EdgeLabel x={(x1 + x2) / 2 + objW / 2} y={afterY - 12} text="replay B" />

      <Obj
        x={x3}
        y={dimY}
        kind="commit"
        hash="a4c011"
        body="only A"
        dim
        w={objW}
        h={objH}
      />
      <Edge
        x1={x3}
        y1={dimY + objH / 2}
        x2={x2 + objW}
        y2={afterY + objH / 2}
        dashed
        markerId={M}
      />

      <Badge x={x1} y={afterY + objH + 10} text="main" />
      <Badge
        x={x2 + objW - badgeW("topic")}
        y={afterY + objH + 10}
        text="topic"
      />
    </IllustrationFrame>
  );
}
