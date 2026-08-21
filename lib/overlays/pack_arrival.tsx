import type { GitEvent } from "../git-vm/types.ts";
import { prefersReducedMotion } from "./motion.ts";

export interface PackArrivalProps {
  events: GitEvent[];
  reduceMotion?: boolean;
}

export function PackArrival(
  { events, reduceMotion }: PackArrivalProps,
) {
  const reduce = reduceMotion ?? prefersReducedMotion();
  if (reduce) return null;
  if (!events.some((e) => e.type === "pack-arrival")) return null;

  return (
    <div
      class="pack-arrival-flash pointer-events-none absolute inset-0 bg-[color-mix(in_srgb,var(--lg-sky)_25%,transparent)]"
      aria-hidden="true"
    >
      <style>
        {`
          @keyframes gitlab-pack-flash {
            from { opacity: 0.7; }
            to { opacity: 0; }
          }
          .pack-arrival-flash {
            animation: gitlab-pack-flash 700ms ease-out forwards;
          }
          @media (prefers-reduced-motion: reduce) {
            .pack-arrival-flash { animation: none; display: none; }
          }
        `}
      </style>
    </div>
  );
}
