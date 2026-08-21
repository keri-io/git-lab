import {
  Box,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  PathEdge,
} from "./primitives.tsx";

const M = "ill-index";

export function IndexIllustration() {
  const boxW = 168;
  const boxH = 76;
  const gap = 28;
  const x1 = 24;
  const x2 = x1 + boxW + gap;
  const x3 = x2 + boxW + gap;
  const y = 56;
  const midY = y + boxH / 2;
  const wRight = x1 + boxW;
  const iLeft = x2;
  const iRight = x2 + boxW;
  const hLeft = x3;
  const hRight = x3 + boxW;

  return (
    <IllustrationFrame
      title="Three trees: worktree, index, HEAD"
      caption="Edit files in the worktree. git add copies bytes into a blob and updates the index — the next commit’s snapshot. HEAD is the last commit; git diff is worktree vs index, git diff --cached is index vs HEAD."
      viewBox="0 0 620 220"
      markerId={M}
    >
      <Box
        x={x1}
        y={y}
        w={boxW}
        h={boxH}
        label="worktree"
        sub="README: staged later"
        warn
      />
      <Box
        x={x2}
        y={y}
        w={boxW}
        h={boxH}
        label="index"
        sub="README: staged later"
        accent
      />
      <Box
        x={x3}
        y={y}
        w={boxW}
        h={boxH}
        label="HEAD"
        sub="README: # demo"
      />

      <Edge
        x1={wRight}
        y1={midY}
        x2={iLeft}
        y2={midY}
        markerId={M}
        stroke="var(--lg-warn)"
      />
      <EdgeLabel
        x={(wRight + iLeft) / 2}
        y={midY - 18}
        text="git diff"
      />

      <Edge
        x1={iRight}
        y1={midY}
        x2={hLeft}
        y2={midY}
        markerId={M}
        stroke="var(--lg-accent)"
      />
      <EdgeLabel
        x={(iRight + hLeft) / 2}
        y={midY - 18}
        text="git diff --cached"
      />

      <PathEdge
        d={`M ${x1 + boxW / 2} ${y + boxH} L ${x1 + boxW / 2} ${y + boxH + 18} L ${x2 + boxW / 2} ${y + boxH + 18} L ${x2 + boxW / 2} ${y + boxH}`}
        markerId={M}
        stroke="var(--lg-muted)"
        dashed
      />
      <EdgeLabel
        x={(x1 + x2 + boxW) / 2}
        y={y + boxH + 18}
        text="git add"
      />
    </IllustrationFrame>
  );
}
