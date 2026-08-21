import {
  BADGE_H,
  Badge,
  BandLabel,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  PathEdge,
} from "./primitives.tsx";

const M = "ill-tags";

export function TagsIllustration() {
  const objH = 50;
  const tagW = 108;
  const commitW = 108;
  const tagX = 72;
  const commitX = 420;
  const row1Y = 72;
  const row2Y = 208;

  return (
    <IllustrationFrame
      title="Annotated tag object vs lightweight pointer"
      caption="git tag -a writes a tag object (object, type, tag, tagger, message); refs/tags/v1.0 points at that hash. A lightweight tag stores the commit hash directly in refs/tags/beta—no tag object."
      viewBox="0 0 640 320"
      markerId={M}
    >
      <BandLabel x={72} y={18} text="ANNOTATED (ref → tag → commit)" />
      <BandLabel x={72} y={154} text="LIGHTWEIGHT (ref → commit)" />

      <Badge
        x={tagX}
        y={row1Y - BADGE_H - 2}
        text="refs/tags/v1.0"
      />
      <Obj
        x={tagX}
        y={row1Y}
        kind="tag"
        hash="9ae4c0"
        body="v1.0"
      />
      <Badge
        x={commitX}
        y={row1Y - BADGE_H - 2}
        text="main"
        fill="var(--lg-muted)"
      />
      <Obj
        x={commitX}
        y={row1Y}
        kind="commit"
        hash="a1b003"
        body="initial"
      />

      <Edge
        x1={tagX + tagW}
        y1={row1Y + objH / 2}
        x2={commitX}
        y2={row1Y + objH / 2}
        markerId={M}
      />
      <EdgeLabel
        x={(tagX + tagW + commitX) / 2}
        y={row1Y + objH / 2 - 14}
        text="object"
      />

      <Badge
        x={commitX}
        y={row2Y - BADGE_H - 2}
        text="refs/tags/beta"
        fill="var(--lg-muted)"
      />
      <Obj
        x={commitX}
        y={row2Y}
        kind="commit"
        hash="a1b003"
        body="initial"
      />

      <PathEdge
        d={`M ${commitX + commitW / 2} ${row2Y - BADGE_H - 4} C ${
          commitX + commitW / 2
        } ${row2Y - 18}, ${commitX + commitW / 2} ${row2Y - 6}, ${
          commitX + commitW / 2
        } ${row2Y}`}
        dashed
        markerId={M}
      />
      <EdgeLabel
        x={commitX + commitW + 36}
        y={row2Y + objH / 2}
        text="direct"
      />
    </IllustrationFrame>
  );
}
