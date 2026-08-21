export interface LessonProgress {
  /** Schema version. v1 wrote `completed` on quiz mark without goalCheck. */
  v: 2;
  /** Lesson ids whose sandbox `goalCheck` succeeded. */
  goalPassed: string[];
  /** Lesson ids whose quiz answers were marked correct. */
  quizPassed: string[];
  /** Alias of `goalPassed` (goalCheck only — not quiz). */
  completed: string[];
  /** Lesson ids opened via catalog Break in (unlock without prior quizzes). */
  brokenInto: string[];
}

const KEY_V1 = "git-lab-progress";
const KEY = "git-lab-progress.v2";

function empty(): LessonProgress {
  return {
    v: 2,
    goalPassed: [],
    quizPassed: [],
    completed: [],
    brokenInto: [],
  };
}

function asIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string");
}

function normalize(raw: unknown): LessonProgress {
  if (!raw || typeof raw !== "object") return empty();
  const rec = raw as Record<string, unknown>;
  const quizPassed = asIdList(rec.quizPassed);
  const goalPassed = asIdList(
    rec.goalPassed ?? (rec.v === 2 ? rec.completed : undefined),
  );
  return {
    v: 2,
    goalPassed,
    quizPassed,
    completed: [...goalPassed],
    brokenInto: asIdList(rec.brokenInto),
  };
}

function persist(p: LessonProgress): void {
  if (typeof localStorage === "undefined") return;
  const goalPassed = [...new Set(p.goalPassed)];
  const quizPassed = [...new Set(p.quizPassed)];
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(
        {
          v: 2,
          goalPassed,
          quizPassed,
          completed: goalPassed,
          brokenInto: [...new Set(p.brokenInto)],
        } satisfies LessonProgress,
      ),
    );
  } catch {
    // Quota, private mode, or disabled storage.
  }
}

export function loadProgress(): LessonProgress {
  if (typeof localStorage === "undefined") return empty();
  try {
    const v2 = localStorage.getItem(KEY);
    if (v2) return normalize(JSON.parse(v2));

    const v1 = localStorage.getItem(KEY_V1);
    if (!v1) return empty();

    const old = JSON.parse(v1) as { quizPassed?: unknown; completed?: unknown };
    // v1 set `completed` whenever the quiz was marked, even if goalCheck
    // never ran. Keep quizPassed; drop completed/goalPassed.
    const migrated = normalize({
      v: 2,
      quizPassed: old.quizPassed,
      goalPassed: [],
    });
    persist(migrated);
    try {
      localStorage.removeItem(KEY_V1);
    } catch {
      // ignore
    }
    return migrated;
  } catch {
    return empty();
  }
}

export function saveProgress(p: LessonProgress): void {
  persist(p);
}

export function markGoalPassed(id: string): LessonProgress {
  const progress = loadProgress();
  if (!progress.goalPassed.includes(id)) {
    progress.goalPassed = [...progress.goalPassed, id];
  }
  progress.completed = [...progress.goalPassed];
  persist(progress);
  return progress;
}

export function markQuizPassed(id: string): LessonProgress {
  const progress = loadProgress();
  if (!progress.quizPassed.includes(id)) {
    progress.quizPassed = [...progress.quizPassed, id];
  }
  persist(progress);
  return progress;
}

export function isLessonComplete(
  id: string,
  progress: LessonProgress,
): boolean {
  const goal = progress.goalPassed.includes(id) ||
    progress.completed.includes(id);
  return goal && progress.quizPassed.includes(id);
}

export function isUnlocked(
  lessonId: string,
  unlocksAfter: string[],
  progress: LessonProgress,
): boolean {
  if (unlocksAfter.length === 0) return true;
  if (progress.brokenInto.includes(lessonId)) return true;
  return unlocksAfter.every((id) => isLessonComplete(id, progress));
}

/** Unlock `lessonId` without marking prior lessons’ goals or quizzes. */
export function breakIntoLesson(lessonId: string): LessonProgress {
  const progress = loadProgress();
  if (!progress.brokenInto.includes(lessonId)) {
    progress.brokenInto = [...progress.brokenInto, lessonId];
  }
  persist(progress);
  return progress;
}
