import {
  Badge,
  Box,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  PathEdge,
} from "./primitives.tsx";

const C = "ill-stash-conflicts";

export function StashConflictsIllustration() {
  return (
    <IllustrationFrame
      title="Stash apply can leave conflict stages"
      caption="Apply merges W onto the current tree. Conflicting README.md blobs fill index stages 1/2/3; drop the stash only after you resolve and git add."
      viewBox="0 0 640 320"
      markerId={C}
    >
      <Badge x={24} y={12} text="stash" fill="var(--lg-stash)" />

      <Obj x={24} y={40} kind="commit" hash="s0w001" body="W" />
      <Obj x={24} y={160} kind="commit" hash="c1a009" body="HEAD" />

      <Obj x={200} y={40} kind="tree" hash="s0t003" body="root" />
      <Obj x={200} y={160} kind="tree" hash="c1t010" body="root" />
      <Edge x1={132} y1={65} x2={200} y2={65} markerId={C} />
      <Edge x1={132} y1={185} x2={200} y2={185} markerId={C} />

      <Obj
        x={392}
        y={40}
        kind="blob"
        hash="s0b004"
        body='"from stash"'
      />
      <Obj
        x={392}
        y={160}
        kind="blob"
        hash="c1b011"
        body='"from main"'
      />
      <Edge x1={308} y1={65} x2={392} y2={65} markerId={C} />
      <Edge x1={308} y1={185} x2={392} y2={185} markerId={C} />
      <EdgeLabel x={350} y={52} text="README.md" />
      <EdgeLabel x={350} y={172} text="README.md" />

      <PathEdge
        d="M 452 90 C 400 130, 280 180, 240 248"
        dashed
        markerId={C}
      />
      <PathEdge
        d="M 452 210 C 400 230, 360 244, 320 248"
        dashed
        markerId={C}
      />
      <EdgeLabel x={390} y={118} text="apply" />

      <Box
        x={160}
        y={248}
        w={240}
        h={56}
        label="stages 1/2/3"
        sub="drop after resolve"
        warn
      />
    </IllustrationFrame>
  );
}
