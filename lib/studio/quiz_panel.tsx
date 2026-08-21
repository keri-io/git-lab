import type { QuizItem } from "@/lib/curriculum/types.ts";

export function QuizPanel(
  { quiz, answers, onChange, message }: {
    quiz: QuizItem[];
    answers: Record<string, number>;
    onChange: (id: string, idx: number) => void;
    message: string | null;
  },
) {
  return (
    <div class="lg-card mt-4 p-5 space-y-4">
      <h3 class="text-sm font-semibold text-[var(--lg-text)]">Quiz</h3>
      {quiz.map((item) => (
        <fieldset key={item.id} class="space-y-2">
          <legend class="text-sm text-[var(--lg-text)]">{item.prompt}</legend>
          {item.choices.map((choice, idx) => (
            <label
              key={choice}
              class="flex items-start gap-2 text-sm text-[var(--lg-text)] cursor-pointer"
            >
              <input
                type="radio"
                name={item.id}
                checked={answers[item.id] === idx}
                onInput={() => onChange(item.id, idx)}
                class="mt-1 touch-manipulation accent-[var(--lg-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-accent)]"
              />
              <span class="min-w-0 break-words">{choice}</span>
            </label>
          ))}
          {message && answers[item.id] !== undefined
            ? <p class="text-xs text-[var(--lg-muted)] pl-6">{item.explain}</p>
            : null}
        </fieldset>
      ))}
      {message
        ? (
          <p class="text-sm text-[var(--lg-accent)]" aria-live="polite">
            {message}
          </p>
        )
        : null}
    </div>
  );
}
