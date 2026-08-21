import {
  Badge,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  badgeW,
} from "./primitives.tsx";

const S = "ill-stash";

export function StashIllustration() {
  return (
    <IllustrationFrame
      title="Stash as a two-parent commit W"
      caption="Stash is a two-parent commit W, not a clipboard: I records the index (parent H), W records the worktree (parents H and I), and refs/stash points at W."
      viewBox="0 0 640 300"
      markerId={S}
    >
      <Badge
        x={200 + 54 - badgeW("refs/stash") / 2}
        y={8}
        text="refs/stash"
        fill="var(--lg-stash)"
      />

      <Obj x={200} y={44} kind="commit" hash="s0w001" body="W" />
      <Obj x={48} y={184} kind="commit" hash="a1b003" body="H" />
      <Obj x={256} y={184} kind="commit" hash="s0i002" body="I" />

      <Edge x1={230} y1={94} x2={102} y2={184} markerId={S} />
      <Edge x1={278} y1={94} x2={310} y2={184} markerId={S} />
      <Edge x1={256} y1={209} x2={156} y2={209} markerId={S} />
      <EdgeLabel x={148} y={128} text="parent" />
      <EdgeLabel x={318} y={128} text="parent" />
      <EdgeLabel x={206} y={196} text="parent" />

      <Obj x={400} y={44} kind="tree" hash="s0t003" body="root" />
      <Obj x={400} y={160} kind="blob" hash="s0b004" body='"draft"' />
      <Edge x1={308} y1={69} x2={400} y2={69} markerId={S} />
      <Edge x1={454} y1={94} x2={454} y2={160} markerId={S} />
      <EdgeLabel x={494} y={124} text="README.md" />

      <Badge x={48 + 54 - badgeW("HEAD") / 2} y={244} text="HEAD" />
      <Badge
        x={256 + 54 - badgeW("index") / 2}
        y={244}
        text="index"
        fill="var(--lg-muted)"
      />
    </IllustrationFrame>
  );
}
