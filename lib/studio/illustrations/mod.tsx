import type { ComponentChildren } from "preact";
import type { LessonId } from "@/lib/curriculum/types.ts";
import { SCENES } from "./scenes.ts";
import { paint } from "./paint.tsx";

export const ILLUSTRATIONS: Record<LessonId, () => ComponentChildren> = Object
  .fromEntries(
    (Object.keys(SCENES) as LessonId[]).map((
      id,
    ) => [id, () => paint(SCENES[id])]),
  ) as Record<LessonId, () => ComponentChildren>;

export function LessonIllustration({ lessonId }: { lessonId: string }) {
  const scene = SCENES[lessonId as LessonId];
  if (!scene) return null;
  return <div class="lesson-illustration">{paint(scene)}</div>;
}
