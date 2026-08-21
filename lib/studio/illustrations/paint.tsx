// deno-fmt-ignore-file
import type { LessonId } from "@/lib/curriculum/types.ts";
import type { ComponentChildren } from "preact";
import type { Scene, Op } from "./scenes.ts";
import { SCENES } from "./scenes.ts";
import type { ObjKind } from "./primitives.tsx";
import {
  IllustrationFrame,
  Box,
  Obj,
  ObjCard,
  objChainRow,
  Port,
  Dot,
  Edge,
  PathEdge,
  EdgeLabel,
  BandLabel,
  Badge,
} from "./primitives.tsx";

/** Drop null/undefined so primitive defaults apply. */
function opt<T extends Record<string, unknown>>(
  props: T,
): { [K in keyof T]?: Exclude<T[K], null> } {
  return Object.fromEntries(
    Object.entries(props).filter(([, v]) => v != null),
  ) as { [K in keyof T]?: Exclude<T[K], null> };
}

function extra(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? v as Record<string, unknown> : {};
}

type ChainRow = Parameters<typeof objChainRow>[0];
type Paint = (op: Op, markerId: string) => ComponentChildren;

const PAINT: Record<string, Paint> = {
  card(op) {
    const [, x, y, kind, hash, rows, w, dim, port] = op as never as
      [string, number, number, ObjKind, string, string[], number | null, boolean, boolean];
    return (
      <ObjCard x={x} y={y} kind={kind} hash={hash} rows={rows} dim={dim} port={port} {...opt({ w })} />
    );
  },
  badge(op) {
    const [, x, y, text, fill] = op as never as [string, number, number, string, string | null];
    return <Badge x={x} y={y} text={text} {...opt({ fill })} />;
  },
  port(op) {
    const [, x, y, fill] = op as never as [string, number, number, string];
    return <Port x={x} y={y} fill={fill} />;
  },
  edge(op, markerId) {
    const [, x1, y1, x2, y2, dashed, mid, stroke] = op as never as
      [string, number, number, number, number, boolean, string | null, string | null];
    return (
      <Edge x1={x1} y1={y1} x2={x2} y2={y2} dashed={dashed} markerId={mid ?? markerId} {...opt({ stroke })} />
    );
  },
  path(op, markerId) {
    const [, d, dashed, mid, stroke] = op as never as
      [string, string, boolean, string | null, string | null];
    return <PathEdge d={d} dashed={dashed} markerId={mid ?? markerId} {...opt({ stroke })} />;
  },
  box(op) {
    const [, x, y, w, h, label, sub, flags] = op as never as
      [string, number, number, number, number, string, string | null, string];
    const set = new Set(flags.split(",").map((f) => f.trim()).filter(Boolean));
    return (
      <Box
        x={x}
        y={y}
        w={w}
        h={h}
        label={label}
        accent={set.has("accent")}
        warn={set.has("warn")}
        stash={set.has("stash")}
        {...opt({ sub })}
      />
    );
  },
  obj(op) {
    const [, x, y, kind, hash, body, dim, w, h] = op as never as
      [string, number, number, ObjKind, string | null, string | null, boolean, number | null, number | null];
    return <Obj x={x} y={y} kind={kind} dim={dim} {...opt({ hash, body, w, h })} />;
  },
  dot(op) {
    const [, x, y, r, fill, dim] = op as never as
      [string, number, number, number | null, string | null, boolean];
    return <Dot x={x} y={y} dim={dim} {...opt({ r, fill })} />;
  },
  band(op) {
    const [, x, y, text] = op as never as [string, number, number, string];
    return <BandLabel x={x} y={y} text={text} />;
  },
  elabel(op) {
    const [, x, y, text] = op as never as [string, number, number, string];
    return <EdgeLabel x={x} y={y} text={text} />;
  },
  chain(op, markerId) {
    const row = (op as never as [string, ChainRow])[1];
    return objChainRow({ ...row, markerId: row.markerId ?? markerId });
  },
  rect(op) {
    const [, x, y, w, h, rx, fill, stroke, sw, rest] = op as never as
      [string, number, number, number, number, number, string, string, number, unknown];
    return (
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={stroke} stroke-width={sw} {...extra(rest)} />
    );
  },
  line(op) {
    const [, x1, y1, x2, y2, stroke, sw, rest] = op as never as
      [string, number, number, number, number, string, number, unknown];
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} stroke-width={sw} {...extra(rest)} />;
  },
  text(op) {
    const [, x, y, content, attrs] = op as never as [string, number, number, string, Record<string, unknown>];
    return <text x={x} y={y} {...attrs}>{content}</text>;
  },
  circle(op) {
    const [, cx, cy, r, fill, rest] = op as never as
      [string, number, number, number, string | null, unknown];
    return <circle cx={cx} cy={cy} r={r} {...opt({ fill })} {...extra(rest)} />;
  },
};

export function paint(scene: Scene): ComponentChildren {
  const { title, caption, viewBox, markerId, ops } = scene;
  return (
    <IllustrationFrame title={title} caption={caption} viewBox={viewBox} markerId={markerId}>
      {ops.map((op) => PAINT[op[0]]?.(op, markerId) ?? null)}
    </IllustrationFrame>
  );
}

export function paintLesson(id: LessonId): ComponentChildren {
  return paint(SCENES[id]);
}
