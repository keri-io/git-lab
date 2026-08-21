export interface VizCaptionProps {
  intro: string | null;
  caption: string | null;
  step: number | null;
  total: number;
}

export function VizCaption(
  { intro, caption, step, total }: VizCaptionProps,
) {
  const text = caption ?? intro;
  if (!text) return null;
  return (
    <div
      class="viz-caption rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface)] px-4 py-3"
      aria-live="polite"
    >
      {step != null && total > 0
        ? (
          <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--lg-muted)]">
            Demo {step + 1} / {total}
          </p>
        )
        : (
          <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--lg-muted)]">
            Watch the graph
          </p>
        )}
      <p class="text-sm leading-relaxed text-[var(--lg-text)] text-pretty">
        {text}
      </p>
    </div>
  );
}
