import {
  BADGE_H,
  Badge,
  BandLabel,
  Box,
  Edge,
  EdgeLabel,
  IllustrationFrame,
  Obj,
  ObjCard,
  badgeW,
  objCardH,
  objColor,
} from "./primitives.tsx";

const M = "ill-clone";

export function CloneIllustration() {
  const commitW = 248;
  const commitX = 196;
  const badgeY = 28;
  const commitY = badgeY + BADGE_H + 22;
  const commitH = objCardH(4);
  const treeY = commitY + commitH + 24;
  const treeH = objCardH(1);
  const blobY = treeY + treeH + 24;
  const blobW = 196;
  const blobH = objCardH(2);
  const cx = commitX + commitW / 2;
  const originX = 16;
  const originW = 108;
  const originY = commitY + commitH / 2 - 25;
  const worktreeX = 468;
  const worktreeH = blobH - 12;
  const worktreeY = blobY + blobH / 2 - worktreeH / 2;
  const commitStroke = objColor("commit");
  const treeStroke = objColor("tree");
  const headText = "HEAD → main";

  return (
    <IllustrationFrame
      title="Clone fetches objects then checks out files"
      caption="Clone copies origin’s objects into your repo (same hashes), then checkout writes blobs as files. A bare clone would stop after objects and refs, with no worktree."
      viewBox="0 0 640 420"
      markerId={M}
    >
      <BandLabel x={originX} y={16} text="ORIGIN" />
      <BandLabel x={commitX} y={16} text="LOCAL" />
      <BandLabel x={worktreeX} y={16} text="WORKTREE" />

      <Badge
        x={originX}
        y={badgeY}
        text="origin/main"
        fill="var(--lg-stash)"
      />
      <Badge
        x={commitX + commitW - badgeW(headText)}
        y={badgeY}
        text={headText}
      />

      <Obj
        x={originX}
        y={originY}
        kind="commit"
        hash="a1b003e4"
        body="init"
      />
      <Edge
        x1={originX + originW}
        y1={originY + 25}
        x2={commitX}
        y2={commitY + commitH / 2}
        dashed
        markerId={M}
      />
      <EdgeLabel x={158} y={originY + 8} text="fetch" />

      <ObjCard
        x={commitX}
        y={commitY}
        w={commitW}
        kind="commit"
        hash="a1b003e4"
        rows={[
          "tree     d8329fc1",
          "parent   (none)",
          "author   you",
          "initial",
        ]}
      />
      <Edge
        x1={cx}
        y1={commitY + commitH}
        x2={cx}
        y2={treeY}
        markerId={M}
        stroke={commitStroke}
      />

      <ObjCard
        x={commitX}
        y={treeY}
        w={commitW}
        kind="tree"
        hash="d8329fc1"
        rows={["blob  d670460b  README.md"]}
      />
      <Edge
        x1={cx}
        y1={treeY + treeH}
        x2={cx}
        y2={blobY}
        markerId={M}
        stroke={treeStroke}
      />

      <ObjCard
        x={commitX}
        y={blobY}
        w={blobW}
        kind="blob"
        hash="d670460b"
        rows={['"# demo"', "(no filename)"]}
        port={false}
      />
      <Box
        x={worktreeX}
        y={worktreeY}
        w={152}
        h={worktreeH}
        label="README.md"
        sub="files"
        accent
      />
      <Edge
        x1={commitX + blobW}
        y1={blobY + blobH / 2}
        x2={worktreeX}
        y2={blobY + blobH / 2}
        markerId={M}
      />
      <EdgeLabel
        x={(commitX + blobW + worktreeX) / 2}
        y={blobY + blobH / 2 - 16}
        text="checkout"
      />
    </IllustrationFrame>
  );
}
