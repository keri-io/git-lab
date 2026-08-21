import type { Lesson } from "./types.ts";
import { lessons as catalog } from "./catalog.ts";

export const lessons: Lesson[] = [...catalog].sort((a, b) => a.order - b.order);

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}
