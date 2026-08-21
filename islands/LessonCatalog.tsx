import { useEffect, useState } from "preact/hooks";
import {
  breakIntoLesson,
  isLessonComplete,
  isUnlocked,
  loadProgress,
} from "@/lib/progress.ts";

export interface CatalogLesson {
  id: string;
  order: number;
  title: string;
  unlocksAfter: string[];
  description?: string;
}

export interface LessonCatalogProps {
  lessons: CatalogLesson[];
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lg-bg)]";

const titleLinkClass =
  `rounded-sm text-[var(--lg-text)] hover:text-[var(--lg-accent)] ${focusRing}`;

const ctaClass =
  `mt-auto inline-flex w-fit touch-manipulation items-center rounded-full bg-[var(--lg-accent)] px-3.5 py-1.5 text-sm font-medium text-[var(--lg-accent-fg)] hover:opacity-90 ${focusRing}`;

const breakInClass =
  `mt-auto inline-flex w-fit touch-manipulation items-center rounded-full border border-[var(--lg-border)] bg-[var(--lg-bg)] px-3.5 py-1.5 text-sm font-medium text-[var(--lg-text)] hover:border-[var(--lg-accent)] hover:text-[var(--lg-accent)] ${focusRing}`;

type CardStatus = "locked" | "not-started" | "completed";

function cardStatus(open: boolean, complete: boolean): CardStatus {
  if (!open) return "locked";
  if (complete) return "completed";
  return "not-started";
}

function StatusChip({ status }: { status: CardStatus }) {
  const label = status === "not-started"
    ? "Not started"
    : status === "completed"
    ? "Completed"
    : "Locked";
  const tone = status === "completed"
    ? "bg-[var(--lg-success-bg)] text-[var(--lg-success)]"
    : "bg-[var(--lg-bg)] text-[var(--lg-muted)]";
  return (
    <span
      class={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {status === "locked"
        ? (
          <svg
            aria-hidden="true"
            class="h-3 w-3"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M4 7V5a4 4 0 118 0v2h1.5A1.5 1.5 0 0115 8.5v5A1.5 1.5 0 0113.5 15h-11A1.5 1.5 0 011 13.5v-5A1.5 1.5 0 012.5 7H4zm1.5 0h5V5a2.5 2.5 0 00-5 0v2z" />
          </svg>
        )
        : null}
      {label}
    </span>
  );
}

function applyProgress(
  lessons: CatalogLesson[],
  setUnlocked: (map: Record<string, boolean>) => void,
  setDone: (ids: Set<string>) => void,
) {
  const progress = loadProgress();
  const map: Record<string, boolean> = {};
  for (const lesson of lessons) {
    map[lesson.id] = isUnlocked(lesson.id, lesson.unlocksAfter, progress);
  }
  setUnlocked(map);
  setDone(
    new Set(
      lessons.filter((l) => isLessonComplete(l.id, progress)).map((l) => l.id),
    ),
  );
}

export default function LessonCatalog({ lessons }: LessonCatalogProps) {
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    applyProgress(lessons, setUnlocked, setDone);
  }, [lessons]);

  const ordered = [...lessons].sort((a, b) => a.order - b.order);

  function onBreakIn(lessonId: string) {
    breakIntoLesson(lessonId);
    applyProgress(lessons, setUnlocked, setDone);
    globalThis.location.assign(`/lessons/${lessonId}`);
  }

  return (
    <nav aria-label="Lesson catalog">
      <ol
        id="lesson-catalog"
        class="m-0 grid list-none grid-cols-1 gap-4 scroll-mt-4 p-0 md:grid-cols-2"
      >
        {ordered.map((lesson) => {
          const open = lesson.unlocksAfter.length === 0 ||
            unlocked[lesson.id] === true;
          const complete = done.has(lesson.id);
          const status = cardStatus(open, complete);
          const href = `/lessons/${lesson.id}`;
          return (
            <li key={lesson.id} class="min-w-0">
              <div class="lg-card flex h-full flex-col gap-3 p-5">
                <StatusChip status={status} />
                <h2 class="text-lg font-semibold tracking-tight text-pretty break-words">
                  {open
                    ? (
                      <a href={href} class={titleLinkClass}>
                        {lesson.title}
                      </a>
                    )
                    : lesson.title}
                </h2>
                {lesson.description
                  ? (
                    <p class="text-sm leading-relaxed text-[var(--lg-muted)] text-pretty">
                      {lesson.description}
                    </p>
                  )
                  : null}
                {lesson.unlocksAfter.length > 0
                  ? (
                    <p class="text-xs text-[var(--lg-muted)]">
                      After: {lesson.unlocksAfter.join(", ")}
                    </p>
                  )
                  : null}
                {open
                  ? (
                    <a href={href} class={ctaClass}>
                      {complete ? "Continue →" : "Start →"}
                    </a>
                  )
                  : (
                    <div class="mt-auto flex flex-col gap-2">
                      <p class="text-xs text-[var(--lg-muted)]">
                        Break in to skip earlier goals and quizzes.
                      </p>
                      <button
                        type="button"
                        class={breakInClass}
                        onClick={() => onBreakIn(lesson.id)}
                      >
                        Break in →
                      </button>
                    </div>
                  )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
