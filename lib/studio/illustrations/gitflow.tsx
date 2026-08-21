import {
  Badge,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  badgeW,
} from "./primitives.tsx";

const G = "ill-gitflow";

export function GitflowIllustration() {
  const objW = 108;
  const objH = 50;
  const feat1X = 180;
  const feat2X = 340;
  const featY = 40;
  const devX = 64;
  const mergeX = 460;
  const baseY = 176;
  const bubbleX = 168;
  const bubbleW = 288;
  const featText = "feature";

  return (
    <IllustrationFrame
      title="GitFlow feature bubble merged with --no-ff"
      caption="GitFlow is naming plus merge --no-ff. develop gets a two-parent merge so the feature stays a bubble instead of fast-forwarding into a straight line."
      viewBox="0 0 640 280"
      markerId={G}
    >
      <rect
        x={bubbleX}
        y={32}
        width={bubbleW}
        height={66}
        rx="12"
        fill="color-mix(in srgb, var(--lg-sky) 14%, var(--lg-surface))"
        stroke="var(--lg-sky)"
        stroke-width="1.5"
      />
      <Badge
        x={bubbleX + bubbleW / 2 - badgeW(featText) / 2}
        y={8}
        text={featText}
        fill="var(--lg-sky)"
      />

      <Obj x={feat1X} y={featY} kind="commit" hash="f1a001" body="feat" />
      <Obj x={feat2X} y={featY} kind="commit" hash="f1a002" body="login" />
      <Edge
        x1={feat2X}
        y1={featY + objH / 2}
        x2={feat1X + objW}
        y2={featY + objH / 2}
        markerId={G}
      />

      <Obj x={devX} y={baseY} kind="commit" hash="d0e001" body="develop" />
      <Obj x={mergeX} y={baseY} kind="commit" hash="m0e003" body="merge" />
      <Edge
        x1={mergeX}
        y1={baseY + objH / 2}
        x2={devX + objW}
        y2={baseY + objH / 2}
        markerId={G}
      />
      <EdgeLabel
        x={(devX + objW + mergeX) / 2}
        y={baseY + objH / 2 - 14}
        text="parent"
      />

      <Edge
        x1={feat1X + objW / 2}
        y1={featY + objH}
        x2={devX + objW / 2}
        y2={baseY}
        markerId={G}
      />
      <Edge
        x1={mergeX + objW / 2}
        y1={baseY}
        x2={feat2X + objW / 2}
        y2={featY + objH}
        markerId={G}
      />
      <EdgeLabel x={148} y={124} text="parent" />
      <EdgeLabel x={468} y={124} text="parent" />

      <Badge
        x={mergeX + objW / 2 - badgeW("develop") / 2}
        y={baseY + objH + 10}
        text="develop"
      />
    </IllustrationFrame>
  );
}
