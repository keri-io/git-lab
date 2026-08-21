import type { ComponentChildren } from "preact";

export type ObjKind = "commit" | "tree" | "blob" | "tag";

const OBJ_STROKE: Record<ObjKind, string> = {
  commit: "var(--lg-obj-commit)",
  tree: "var(--lg-obj-tree)",
  blob: "var(--lg-obj-blob)",
  tag: "var(--lg-obj-tag)",
};

export function IllustrationFrame(
  {
    title,
    caption,
    viewBox = "0 0 640 280",
    markerId = "lg-ill-arrow",
    children,
  }: {
    title: string;
    caption: string;
    viewBox?: string;
    markerId?: string;
    children: ComponentChildren;
  },
) {
  return (
    <figure class="rounded-xl border border-[var(--lg-border)] bg-[var(--lg-bg)] p-3 sm:p-4">
      <svg
        viewBox={viewBox}
        class="w-full h-auto max-h-[28rem]"
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--lg-muted)" />
          </marker>
        </defs>
        {children}
      </svg>
      <figcaption class="mt-2 text-xs leading-relaxed text-[var(--lg-muted)] text-pretty">
        {caption}
      </figcaption>
    </figure>
  );
}

export function Box(
  {
    x,
    y,
    w,
    h,
    label,
    sub,
    accent = false,
    warn = false,
    stash = false,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    sub?: string;
    accent?: boolean;
    warn?: boolean;
    stash?: boolean;
  },
) {
  const stroke = warn
    ? "var(--lg-warn)"
    : stash
    ? "var(--lg-stash)"
    : accent
    ? "var(--lg-accent)"
    : "var(--lg-border)";
  const fill = accent
    ? "color-mix(in srgb, var(--lg-accent) 12%, var(--lg-surface))"
    : "var(--lg-surface)";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="10"
        fill={fill}
        stroke={stroke}
        stroke-width="1.5"
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 6 : y + h / 2 + 5}
        text-anchor="middle"
        fill="var(--lg-text)"
        font-size="13"
        font-weight="600"
        font-family="Inter, ui-sans-serif, system-ui, sans-serif"
      >
        {label}
      </text>
      {sub
        ? (
          <text
            x={x + w / 2}
            y={y + h / 2 + 12}
            text-anchor="middle"
            fill="var(--lg-muted)"
            font-size="11"
            font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {sub}
          </text>
        )
        : null}
    </g>
  );
}

export function objColor(kind: ObjKind): string {
  return OBJ_STROKE[kind];
}

/** Height of an ObjCard with the given number of body rows. */
export function objCardH(rows: number): number {
  return 44 + rows * 15 + 10;
}

export const BADGE_H = 20;

/** Width of a Badge pill for `text`. */
export function badgeW(text: string): number {
  return Math.max(48, text.length * 7.2 + 16);
}

/** Width of an ObjCard hash tab. */
export function hashTabW(hash: string): number {
  return Math.max(72, hash.length * 7.2 + 16);
}

export function Port(
  { x, y, fill }: { x: number; y: number; fill: string },
) {
  return (
    <circle
      cx={x}
      cy={y}
      r="3.5"
      fill={fill}
      stroke="var(--lg-bg)"
      stroke-width="1.25"
    />
  );
}

export function ObjCard(
  {
    x,
    y,
    kind,
    hash,
    rows,
    w = 228,
    dim = false,
    port = true,
  }: {
    x: number;
    y: number;
    kind: ObjKind;
    hash: string;
    rows: string[];
    w?: number;
    dim?: boolean;
    port?: boolean;
  },
) {
  const h = objCardH(rows.length);
  const tabW = hashTabW(hash);
  const stroke = OBJ_STROKE[kind];
  const fill =
    `color-mix(in srgb, ${stroke} 16%, var(--lg-surface))`;
  const title = kind[0]!.toUpperCase() + kind.slice(1);
  const cx = x + w / 2;
  return (
    <g opacity={dim ? "0.45" : "1"}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="10"
        fill={fill}
        stroke={stroke}
        stroke-width="1.7"
      />
      <rect
        x={x + 12}
        y={y - 8}
        width={tabW}
        height="16"
        rx="4"
        fill={stroke}
      />
      <text
        x={x + 12 + tabW / 2}
        y={y + 4}
        text-anchor="middle"
        fill="var(--lg-bg)"
        font-size="10"
        font-weight="700"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {hash}
      </text>
      <text
        x={cx}
        y={y + 26}
        text-anchor="middle"
        fill="var(--lg-text)"
        font-size="13"
        font-weight="700"
        font-family="Inter, ui-sans-serif, system-ui, sans-serif"
      >
        {title}
      </text>
      {rows.map((row, i) => (
        <text
          x={x + 12}
          y={y + 44 + i * 15}
          fill="var(--lg-text)"
          font-size="11"
          font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {row}
        </text>
      ))}
      {port ? <Port x={cx} y={y + h} fill={stroke} /> : null}
    </g>
  );
}

export function Obj(
  {
    x,
    y,
    kind,
    hash,
    body,
    dim = false,
    w,
    h,
  }: {
    x: number;
    y: number;
    kind: ObjKind;
    hash?: string;
    body?: string;
    dim?: boolean;
    w?: number;
    h?: number;
  },
) {
  const width = w ?? (kind === "blob" ? 120 : 108);
  const height = h ?? 50;
  const stroke = OBJ_STROKE[kind];
  const fill =
    `color-mix(in srgb, ${stroke} 18%, var(--lg-surface))`;
  const kindY = hash ? y + 16 : y + (body ? height / 2 - 6 : height / 2 + 4);
  const bodyY = hash ? y + 34 : y + height / 2 + 12;
  return (
    <g opacity={dim ? "0.45" : "1"}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="8"
        fill={fill}
        stroke={stroke}
        stroke-width="1.6"
      />
      {hash
        ? (
          <text
            x={x + 8}
            y={y + 13}
            fill="var(--lg-muted)"
            font-size="9"
            font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {hash}
          </text>
        )
        : null}
      <text
        x={x + width / 2}
        y={kindY}
        text-anchor="middle"
        fill="var(--lg-text)"
        font-size="12"
        font-weight="700"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {kind}
      </text>
      {body
        ? (
          <text
            x={x + width / 2}
            y={bodyY}
            text-anchor="middle"
            fill="var(--lg-muted)"
            font-size="10"
            font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {body}
          </text>
        )
        : null}
    </g>
  );
}

export function Dot(
  { x, y, r = 11, fill = "var(--lg-accent)", dim = false }: {
    x: number;
    y: number;
    r?: number;
    fill?: string;
    dim?: boolean;
  },
) {
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill={fill}
      opacity={dim ? "0.45" : "1"}
    />
  );
}

export function Edge(
  {
    x1,
    y1,
    x2,
    y2,
    dashed = false,
    markerId = "lg-ill-arrow",
    stroke = "var(--lg-muted)",
  }: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    dashed?: boolean;
    markerId?: string;
    stroke?: string;
  },
) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      stroke-width="1.6"
      stroke-dasharray={dashed ? "5 4" : undefined}
      marker-end={`url(#${markerId})`}
    />
  );
}

export function PathEdge(
  {
    d,
    dashed = false,
    markerId = "lg-ill-arrow",
    stroke = "var(--lg-muted)",
  }: {
    d: string;
    dashed?: boolean;
    markerId?: string;
    stroke?: string;
  },
) {
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      stroke-width="1.6"
      stroke-dasharray={dashed ? "5 4" : undefined}
      marker-end={`url(#${markerId})`}
    />
  );
}

export function EdgeLabel(
  { x, y, text }: { x: number; y: number; text: string },
) {
  const w = Math.max(36, text.length * 6.6 + 12);
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - 8}
        width={w}
        height="16"
        rx="4"
        fill="var(--lg-surface)"
        stroke="var(--lg-border)"
        stroke-width="1"
      />
      <text
        x={x}
        y={y + 4}
        text-anchor="middle"
        fill="var(--lg-text)"
        font-size="10"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {text}
      </text>
    </g>
  );
}

export function BandLabel(
  { x, y, text }: { x: number; y: number; text: string },
) {
  return (
    <text
      x={x}
      y={y}
      fill="var(--lg-muted)"
      font-size="10"
      font-weight="600"
      letter-spacing="0.06em"
      font-family="Inter, ui-sans-serif, system-ui, sans-serif"
    >
      {text}
    </text>
  );
}

export function Badge(
  { x, y, text, fill = "var(--lg-accent)" }: {
    x: number;
    y: number;
    text: string;
    fill?: string;
  },
) {
  const w = badgeW(text);
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={BADGE_H}
        rx="10"
        fill={fill}
      />
      <text
        x={x + w / 2}
        y={y + 14}
        text-anchor="middle"
        fill="var(--lg-accent-fg)"
        font-size="11"
        font-weight="600"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {text}
      </text>
    </g>
  );
}
