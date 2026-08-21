import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import type { Lesson } from "@/lib/curriculum/types.ts";
import { lessons as allLessons } from "@/lib/curriculum/mod.ts";
import LessonCatalog from "../islands/LessonCatalog.tsx";

export default define.page(function Home() {
  const lessons = allLessons.map((l: Lesson) => ({
    id: l.id,
    order: l.order,
    title: l.title,
    unlocksAfter: l.unlocksAfter,
    description: l.objectives[0] ?? "",
  }));

  return (
    <div class="min-h-screen bg-[var(--lg-bg)] text-[var(--lg-text)]">
      <Head>
        <title>Git Lab</title>
      </Head>
      <div class="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:gap-12 md:px-8 md:py-10">
        <header class="shrink-0 md:sticky md:top-8 md:w-44 md:self-start">
          <p
            class="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--lg-text)]"
            translate={false}
          >
            Git Lab
          </p>
        </header>
        <div class="min-w-0 flex-1">
          <h1 class="text-3xl font-semibold tracking-tight text-pretty">
            Lessons
          </h1>
          <p class="mt-2 mb-8 max-w-xl text-[0.95rem] leading-relaxed text-[var(--lg-muted)]">
            Work through the proficiency-guide chain in a fake terminal, where
            the graph is the object store and HEAD, the index, and the worktree
            stay visible.
          </p>
          <LessonCatalog lessons={lessons} />
        </div>
      </div>
    </div>
  );
});
