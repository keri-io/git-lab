import {
  Badge,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  badgeW,
} from "./primitives.tsx";

const T = "ill-trunk";

export function TrunkIllustration() {
  const objW = 92;
  const objH = 44;
  const trunkY = 188;
  const trunkX0 = 24;
  const trunkStep = 108;
  const bubbleX = 368;
  const bubbleW = 248;
  const featY = 52;
  const devY = 188;
  const feat1X = 404;
  const feat2X = 524;

  return (
    <IllustrationFrame
      title="Trunk-based linear main vs GitFlow merge bubble"
      caption="Trunk-based teams rebase short features onto main and merge --ff-only for a straight line. GitFlow keeps a visible --no-ff bubble on develop instead."
      viewBox="0 0 640 280"
      markerId={T}
    >
      <line
        x1="320"
        y1="16"
        x2="320"
        y2="264"
        stroke="var(--lg-border)"
        stroke-width="1"
      />

      <Badge x={24} y={16} text="trunk-based" fill="var(--lg-accent)" />
      <Badge x={336} y={16} text="GitFlow" fill="var(--lg-sky)" />

      <Obj
        x={trunkX0}
        y={trunkY}
        kind="commit"
        hash="a1c001"
        body="init"
        w={objW}
        h={objH}
      />
      <Obj
        x={trunkX0 + trunkStep}
        y={trunkY}
        kind="commit"
        hash="b2d002"
        body="core"
        w={objW}
        h={objH}
      />
      <Obj
        x={trunkX0 + trunkStep * 2}
        y={trunkY}
        kind="commit"
        hash="c3e003"
        body="login"
        w={objW}
        h={objH}
      />
      <Edge
        x1={trunkX0 + trunkStep}
        y1={trunkY + objH / 2}
        x2={trunkX0 + objW}
        y2={trunkY + objH / 2}
        markerId={T}
      />
      <Edge
        x1={trunkX0 + trunkStep * 2}
        y1={trunkY + objH / 2}
        x2={trunkX0 + trunkStep + objW}
        y2={trunkY + objH / 2}
        markerId={T}
      />
      <EdgeLabel
        x={trunkX0 + trunkStep + objW / 2}
        y={trunkY - 12}
        text="--ff-only"
      />
      <Badge
        x={trunkX0 + trunkStep - badgeW("main") / 2}
        y={trunkY + objH + 10}
        text="main"
      />

      <rect
        x={bubbleX}
        y={36}
        width={bubbleW}
        height={66}
        rx="12"
        fill="color-mix(in srgb, var(--lg-sky) 14%, var(--lg-surface))"
        stroke="var(--lg-sky)"
        stroke-width="1.5"
      />
      <Badge
        x={bubbleX + bubbleW / 2 - badgeW("feature") / 2}
        y={12}
        text="feature"
        fill="var(--lg-sky)"
      />

      <Obj
        x={feat1X}
        y={featY}
        kind="commit"
        hash="f1a001"
        body="feat"
        w={objW}
        h={objH}
      />
      <Obj
        x={feat2X}
        y={featY}
        kind="commit"
        hash="f1a002"
        body="login"
        w={objW}
        h={objH}
      />
      <Edge
        x1={feat2X}
        y1={featY + objH / 2}
        x2={feat1X + objW}
        y2={featY + objH / 2}
        markerId={T}
      />

      <Obj
        x={bubbleX}
        y={devY}
        kind="commit"
        hash="d0e001"
        body="develop"
        w={objW}
        h={objH}
      />
      <Obj
        x={bubbleX + 168}
        y={devY}
        kind="commit"
        hash="m0e003"
        body="merge"
        w={objW}
        h={objH}
      />
      <Edge
        x1={bubbleX + 168}
        y1={devY + objH / 2}
        x2={bubbleX + objW}
        y2={devY + objH / 2}
        markerId={T}
      />

      <Edge
        x1={feat1X + objW / 2}
        y1={featY + objH}
        x2={bubbleX + objW / 2}
        y2={devY}
        markerId={T}
      />
      <Edge
        x1={bubbleX + 168 + objW / 2}
        y1={devY}
        x2={feat2X + objW / 2}
        y2={featY + objH}
        markerId={T}
      />
      <EdgeLabel x={428} y={124} text="parent" />
      <EdgeLabel x={548} y={124} text="parent" />
      <EdgeLabel
        x={bubbleX + 84}
        y={devY - 12}
        text="--no-ff"
      />

      <Badge
        x={bubbleX + 168 + objW / 2 - badgeW("develop") / 2}
        y={devY + objH + 10}
        text="develop"
      />
    </IllustrationFrame>
  );
}
