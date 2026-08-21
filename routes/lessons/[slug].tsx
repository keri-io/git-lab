import { HttpError } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { getLesson } from "@/lib/curriculum/mod.ts";
import LessonStudio from "../../islands/LessonStudio.tsx";

export default define.page(function LessonPage(ctx) {
  const lesson = getLesson(ctx.params.slug);
  if (!lesson) {
    throw new HttpError(404, "Unknown lesson");
  }

  return (
    <div>
      <Head>
        <title>{lesson.title} · Git Lab</title>
      </Head>
      <LessonStudio
        lessonId={lesson.id}
        id={lesson.id}
        title={lesson.title}
        narrative={lesson.narrative}
        objectives={lesson.objectives}
        allowedCommands={lesson.allowedCommands}
        demoScript={lesson.demoScript}
        goalHint={lesson.goalHint}
        quiz={lesson.quiz}
        articleUrl={lesson.articleUrl}
      />
    </div>
  );
});
