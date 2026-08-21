import {
  BandLabel,
  Box,
  IllustrationFrame,
} from "./primitives.tsx";

const M = "ill-reftable";

function RefFile(
  { x, y, w, path }: { x: number; y: number; w: number; path: string },
) {
  const h = 36;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="6"
        fill="var(--lg-surface)"
        stroke="var(--lg-border)"
        stroke-width="1.4"
      />
      <text
        x={x + 10}
        y={y + 22}
        fill="var(--lg-text)"
        font-size="10"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {path}
      </text>
    </g>
  );
}

function TableRow(
  {
    x,
    y,
    w,
    name,
    hash,
    accent = false,
  }: {
    x: number;
    y: number;
    w: number;
    name: string;
    hash: string;
    accent?: boolean;
  },
) {
  const rowH = 28;
  const fill = accent
    ? "color-mix(in srgb, var(--lg-accent) 10%, var(--lg-surface))"
    : "var(--lg-surface)";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={rowH}
        fill={fill}
        stroke="var(--lg-border)"
        stroke-width="1"
      />
      <text
        x={x + 10}
        y={y + 18}
        fill="var(--lg-text)"
        font-size="10"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {name}
      </text>
      <text
        x={x + w - 10}
        y={y + 18}
        text-anchor="end"
        fill="var(--lg-muted)"
        font-size="10"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {hash}
      </text>
    </g>
  );
}

export function ReftableIllustration() {
  const filesX = 24;
  const filesW = 248;
  const tableX = 340;
  const tableW = 276;
  const rowY0 = 52;
  const rowGap = 8;
  const fileH = 36;

  const looseRefs = [
    "refs/heads/main",
    "refs/heads/feature/UI",
    "refs/tags/v1.0",
    "refs/remotes/origin/main",
  ];

  const tableRows = [
    { name: "refs/heads/main", hash: "a1b003e4" },
    { name: "refs/heads/feature/UI", hash: "a1b003e4", accent: true },
    { name: "refs/tags/v1.0", hash: "a1b003e4", accent: true },
    { name: "refs/remotes/origin/main", hash: "a1b003e4" },
  ];

  const tableBodyH = tableRows.length * 28;
  const packedY = rowY0 + looseRefs.length * (fileH + rowGap) + 12;
  const tableY = rowY0;

  return (
    <IllustrationFrame
      title="Files backend vs reftable"
      caption="Classic Git stores many loose files under .git/refs/ (plus packed-refs). Reftable records ref updates in one compact table — Git 3.0’s default for huge ref counts and case-insensitive paths."
      viewBox="0 0 640 340"
      markerId={M}
    >
      <BandLabel x={filesX} y={24} text="FILES (.git/refs/)" />
      <BandLabel x={tableX} y={24} text="REFTABLE" />

      {looseRefs.map((path, i) => (
        <RefFile
          key={path}
          x={filesX}
          y={rowY0 + i * (fileH + rowGap)}
          w={filesW}
          path={path}
        />
      ))}

      <Box
        x={filesX}
        y={packedY}
        w={filesW}
        h={44}
        label="packed-refs"
        sub="bulk lookup file"
      />

      <rect
        x={tableX}
        y={tableY - 4}
        width={tableW}
        height={tableBodyH + 8}
        rx="10"
        fill="color-mix(in srgb, var(--lg-accent) 8%, var(--lg-surface))"
        stroke="var(--lg-accent)"
        stroke-width="1.6"
      />
      {tableRows.map((row, i) => (
        <TableRow
          key={row.name}
          x={tableX + 4}
          y={tableY + i * 28}
          w={tableW - 8}
          name={row.name}
          hash={row.hash}
          accent={row.accent}
        />
      ))}
    </IllustrationFrame>
  );
}
