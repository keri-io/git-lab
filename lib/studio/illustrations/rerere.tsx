import {
  Badge,
  Box,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  PathEdge,
} from "./primitives.tsx";

const M = "ill-rerere";

export function RerereIllustration() {
  const firstY = 36;
  const cacheY = 168;
  const secondY = 268;
  const leftX = 24;
  const cacheX = 220;
  const rightX = 448;
  const markerW = 280;
  const markerH = 88;
  const cacheW = 200;
  const cacheH = 56;

  return (
    <IllustrationFrame
      title="rerere records a resolution, then reuses it"
      caption="First merge: diff3 markers and stages 1/2/3 until you add. git add with rerere.enabled stores ours\\0theirs → resolved bytes. merge --abort keeps that cache; the second merge of the same sides auto-applies the recording—no unmerged stages."
      viewBox="0 0 640 380"
      markerId={M}
    >
      <Badge x={leftX} y={10} text="1st merge" fill="var(--lg-warn)" />
      <Badge x={rightX} y={10} text="2nd merge" fill="var(--lg-success)" />

      <Box
        x={leftX}
        y={firstY}
        w={markerW}
        h={markerH}
        label="README.md"
        sub="stages 1 / 2 / 3"
        warn
      />
      <text
        x={leftX + 12}
        y={firstY + 28}
        fill="var(--lg-muted)"
        font-size="9"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {"<<<<<<< HEAD"}
      </text>
      <text
        x={leftX + 12}
        y={firstY + 40}
        fill="var(--lg-text)"
        font-size="9"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        from main
      </text>
      <text
        x={leftX + 12}
        y={firstY + 52}
        fill="var(--lg-accent)"
        font-size="9"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {"||||||| base"}
      </text>
      <text
        x={leftX + 12}
        y={firstY + 64}
        fill="var(--lg-muted)"
        font-size="9"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {"=======  >>>>>>> feature"}
      </text>

      <EdgeLabel x={leftX + markerW / 2} y={firstY + markerH + 14} text="git add" />

      <PathEdge
        d={`M ${leftX + markerW / 2} ${firstY + markerH + 20} L ${leftX + markerW / 2} ${cacheY - 8} L ${cacheX + cacheW / 2} ${cacheY - 8} L ${cacheX + cacheW / 2} ${cacheY}`}
        markerId={M}
        stroke="var(--lg-accent)"
      />

      <Box
        x={cacheX}
        y={cacheY}
        w={cacheW}
        h={cacheH}
        label="recorded"
        sub="ours\\0theirs → resolved"
        accent
      />

      <EdgeLabel
        x={cacheX + cacheW / 2}
        y={cacheY + cacheH + 14}
        text="merge --abort (cache kept)"
      />

      <PathEdge
        d={`M ${cacheX + cacheW / 2} ${cacheY + cacheH + 18} L ${cacheX + cacheW / 2} ${secondY - 10} L ${rightX + 80} ${secondY - 10} L ${rightX + 80} ${secondY}`}
        markerId={M}
        dashed
        stroke="var(--lg-success)"
      />

      <Box
        x={rightX}
        y={secondY}
        w={168}
        h={52}
        label="README.md"
        sub="stage 0, no markers"
      />
      <Edge
        x1={cacheX + cacheW}
        y1={cacheY + cacheH / 2}
        x2={rightX}
        y2={secondY + 26}
        markerId={M}
        stroke="var(--lg-success)"
      />
      <EdgeLabel x={400} y={secondY - 4} text="rerere replay" />
    </IllustrationFrame>
  );
}
