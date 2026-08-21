import { useEffect, useRef, useState } from "preact/hooks";
import { getLesson, lessons } from "@/lib/curriculum/mod.ts";
import { GitVM } from "@/lib/git-vm/mod.ts";
import type {
  CommandResult,
  GitEvent,
  GitState,
  Snapshot,
} from "@/lib/git-vm/types.ts";
import { IndexStages } from "@/lib/overlays/index_stages.tsx";
import { PackArrival } from "@/lib/overlays/pack_arrival.tsx";
import { prefersReducedMotion } from "@/lib/overlays/motion.ts";
import { StashHiwInset } from "@/lib/overlays/stash_hiw.tsx";
import { ThreeTrees } from "@/lib/overlays/three_trees.tsx";
import type { XtermHost } from "@/lib/terminal/xterm_host.ts";
import {
  isLessonComplete,
  loadProgress,
  markGoalPassed,
  markQuizPassed,
} from "@/lib/progress.ts";
import { LessonIllustration } from "@/lib/studio/illustrations/mod.tsx";
import { MarkdownView } from "@/lib/studio/markdown.tsx";
import { QuizPanel } from "@/lib/studio/quiz_panel.tsx";
import { VizCaption } from "@/lib/studio/viz_caption.tsx";
import {
  getLessonViz,
  vizAfterCommand,
  type VizBeat,
  vizBeat,
} from "@/lib/curriculum/viz.ts";

const controlClass =
  "px-4 py-2 rounded-full text-sm font-medium touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lg-bg)]";
const primaryClass =
  `${controlClass} bg-[var(--lg-accent)] text-[var(--lg-accent-fg)] hover:opacity-90 disabled:opacity-50`;
const secondaryClass =
  `${controlClass} border border-[var(--lg-border)] bg-[var(--lg-surface)] text-[var(--lg-text)] hover:bg-[var(--lg-bg)] disabled:opacity-50`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCommandAllowed(line: string, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  const trimmed = line.trim();
  return allowed.some((cmd) =>
    trimmed === cmd || trimmed.startsWith(`${cmd} `)
  );
}

export default function LessonStudio({ lessonId }: { lessonId: string }) {
  const lesson = getLesson(lessonId)!;
  const graphRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const vmRef = useRef<GitVM | null>(null);
  const hostRef = useRef<XtermHost | null>(null);
  const startRef = useRef<GitState>(lesson.startState);
  const lessonRef = useRef(lesson);

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [events, setEvents] = useState<GitEvent[]>([]);
  const [logGraph, setLogGraph] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizMsg, setQuizMsg] = useState<string | null>(null);
  const [goalMsg, setGoalMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [quizOk, setQuizOk] = useState(false);
  const [goalOk, setGoalOk] = useState(false);
  const [vizStep, setVizStep] = useState<number | null>(null);
  const [vizHint, setVizHint] = useState<VizBeat | null>(null);

  const nextLesson = lessons.find((l) => l.unlocksAfter.includes(lessonId));
  const lessonDone = goalOk && quizOk;

  const graphGen = useRef(0);
  const demoGen = useRef(0);
  const paint = (
    snap: Snapshot,
    nextEvents: GitEvent[] = [],
    hint: VizBeat | null = null,
  ) => {
    setSnapshot(snap);
    setEvents(nextEvents);
    const vm = vmRef.current;
    if (vm) {
      const graph = vm.exec("git log --graph --oneline");
      setLogGraph(graph.ok ? graph.stdout : "");
    }
    const el = graphRef.current;
    if (!el) return;
    const my = ++graphGen.current;
    void import("@/lib/graph/render.ts").then(({ renderGitGraph }) =>
      renderGitGraph(el, snap, () => my !== graphGen.current, {
        reduceMotion: reduceMotion || prefersReducedMotion(),
        highlightRef: hint?.highlightRef ?? null,
      })
    );
  };

  const checkGoal = (result: CommandResult) => {
    const vm = vmRef.current;
    if (vm && lessonRef.current.goalCheck(result.snapshot, vm.state)) {
      markGoalPassed(lessonId);
      setGoalOk(true);
      setShowQuiz(true);
      setGoalMsg("Goal met. Answer the quiz to unlock the next lesson.");
    }
  };

  const afterExec = (result: CommandResult, line: string) => {
    const host = hostRef.current;
    if (result.stdout) host?.writeStdout(result.stdout);
    if (result.stderr) host?.writeStderr(result.stderr);
    const hint = vizAfterCommand(lessonId, line) ?? null;
    setVizHint(hint);
    setVizStep(null);
    paint(result.snapshot, result.events, hint);
    checkGoal(result);
  };

  const runLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const vm = vmRef.current;
    if (!vm) return;
    const allowed = lessonRef.current.allowedCommands;
    if (!isCommandAllowed(trimmed, allowed)) {
      hostRef.current?.writeln(
        "Not in this lesson’s allowed list — not executed. Press Tab to complete an allowed command.",
      );
      return;
    }
    afterExec(vm.exec(trimmed), trimmed);
  };

  useEffect(() => {
    const mq = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const full = lesson;
    lessonRef.current = full;
    startRef.current = full.startState;
    const vm = new GitVM(full.startState);
    vmRef.current = vm;
    paint(vm.snapshot());

    const termEl = termRef.current;
    if (!termEl) return;

    let cancelled = false;
    let host: XtermHost | null = null;
    let onResize: (() => void) | undefined;
    let ro: ResizeObserver | undefined;

    void import("@/lib/terminal/xterm_host.ts").then(({ attachXterm }) =>
      attachXterm(termEl, runLine, full.allowedCommands)
    ).then((attached) => {
      if (cancelled) {
        attached.dispose();
        return;
      }
      host = attached;
      hostRef.current = attached;
      attached.focus();
      onResize = () => attached.fit();
      globalThis.addEventListener("resize", onResize);
      ro = new ResizeObserver(onResize);
      ro.observe(termEl);
    });

    const progress = loadProgress();
    const goal = progress.goalPassed.includes(full.id) ||
      progress.completed.includes(full.id);
    const quiz = progress.quizPassed.includes(full.id);
    setBusy(false);
    setGoalOk(goal);
    setQuizOk(quiz);
    if (goal) setShowQuiz(true);
    if (goal && quiz) {
      setGoalMsg("Goal met.");
    }

    return () => {
      demoGen.current++;
      cancelled = true;
      if (onResize) globalThis.removeEventListener("resize", onResize);
      ro?.disconnect();
      host?.dispose();
      hostRef.current = null;
      vmRef.current = null;
    };
  }, [lessonId]);

  const playDemo = async () => {
    const vm = vmRef.current;
    const host = hostRef.current;
    if (!vm || !host) return;
    const my = ++demoGen.current;
    setBusy(true);
    const reduce = reduceMotion || prefersReducedMotion();
    try {
      const lines = lessonRef.current.demoScript;
      for (let i = 0; i < lines.length; i++) {
        if (my !== demoGen.current) return;
        const line = lines[i]!;
        host.echoCommand(line);
        const result = vm.exec(line);
        if (result.stdout) host.writeStdout(result.stdout);
        if (result.stderr) host.writeStderr(result.stderr);
        const beat = vizBeat(lessonId, i) ?? null;
        setVizStep(i);
        setVizHint(beat);
        paint(result.snapshot, result.events, beat);
        checkGoal(result);
        await sleep(reduce ? 0 : 420);
      }
      if (my !== demoGen.current) return;
      host.prompt();
    } finally {
      if (my === demoGen.current) setBusy(false);
    }
  };

  const reset = () => {
    demoGen.current++;
    const vm = vmRef.current;
    const host = hostRef.current;
    if (!vm || !host) return;
    setBusy(false);
    vm.reset(startRef.current);
    setVizStep(null);
    setVizHint(null);
    paint(vm.snapshot(), []);
    host.writeln("reset to lesson start.");
    host.prompt();
    setShowQuiz(goalOk);
    setQuizMsg(null);
    setAnswers({});
  };

  const markQuiz = () => {
    if (!showQuiz) {
      setShowQuiz(true);
      setQuizMsg("Answer the questions, then mark again.");
      return;
    }
    const items = lessonRef.current.quiz;
    const allCorrect = items.every((q) => answers[q.id] === q.answer);
    if (!allCorrect) {
      setQuizMsg("Not quite — check the explanations and try again.");
      return;
    }
    const progress = markQuizPassed(lessonId);
    setQuizOk(true);
    if (isLessonComplete(lessonId, progress)) {
      setQuizMsg("All correct. Progress saved.");
    } else {
      setQuizMsg(
        "All correct. Finish the sandbox goal to unlock the next lesson.",
      );
    }
  };

  return (
    <div class="lesson-studio relative min-h-screen flex flex-col bg-[var(--lg-bg)] text-[var(--lg-text)]">
      <a
        href="#lesson-main"
        class="absolute left-3 top-3 z-50 -translate-y-[150%] rounded-full bg-[var(--lg-accent)] px-4 py-2 text-sm font-medium text-[var(--lg-accent-fg)] transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-accent)]"
      >
        Skip to Lesson
      </a>
      <header class="flex flex-wrap items-center gap-3 border-b border-[var(--lg-border)] bg-[var(--lg-surface)] px-6 py-5 lg:px-8">
        <a
          href="/"
          class="text-sm font-medium text-[var(--lg-accent)] hover:opacity-90 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-accent)]"
        >
          Git Lab
        </a>
        <span class="text-[var(--lg-muted)]">/</span>
        <h1 class="text-lg font-semibold flex-1 min-w-[12rem] text-pretty break-words">
          {lesson.title}
        </h1>
        <div class="flex flex-wrap gap-2 min-w-0">
          <button
            type="button"
            disabled={busy}
            onClick={playDemo}
            class={primaryClass}
          >
            Play Demo
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={reset}
            class={secondaryClass}
          >
            Reset
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={markQuiz}
            class={secondaryClass}
          >
            Mark Quiz
          </button>
          {lessonDone && nextLesson
            ? (
              <a
                href={`/lessons/${nextLesson.id}`}
                class={`${primaryClass} inline-block`}
              >
                Next Lesson
              </a>
            )
            : null}
        </div>
      </header>

      <main
        id="lesson-main"
        tabIndex={-1}
        class="flex-1 overflow-y-auto min-h-0 scroll-mt-4 p-6 lg:p-8 flex flex-col gap-4"
      >
        <VizCaption
          intro={getLessonViz(lessonId)?.intro ?? null}
          caption={vizHint?.caption ?? null}
          step={vizStep}
          total={lesson.demoScript.length}
        />
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <div
            class="relative min-h-0 h-full"
            role="region"
            aria-label="Git commit graph"
          >
            <div
              ref={graphRef}
              class="git-graph-canvas h-full min-h-[17.5rem] rounded-xl border border-[var(--lg-border)] bg-[var(--lg-graph-canvas)] overflow-auto"
            />
            <PackArrival events={events} reduceMotion={reduceMotion} />
            {logGraph
              ? (
                <pre class="sr-only" translate={false}>
                  {logGraph}
                </pre>
              )
              : null}
          </div>
          <div
            class="relative min-h-0 h-full flex flex-col"
            role="region"
            aria-label="Lesson terminal"
          >
            <div class="relative h-full min-h-[17.5rem] flex flex-col overflow-hidden rounded-xl border border-[var(--lg-border)] bg-[var(--lg-term-bg)]">
              <p
                class="pointer-events-none absolute right-3 top-2 z-10 text-[11px] uppercase tracking-wide text-[var(--lg-muted)] opacity-50"
                aria-hidden="true"
              >
                Terminal
              </p>
              <span class="sr-only">Terminal</span>
              <div ref={termRef} class="xterm-host flex-1 min-h-0 px-2 py-1" />
            </div>
          </div>
        </div>
        <StashHiwInset snapshot={snapshot} events={events} />
        <IndexStages snapshot={snapshot} events={events} />
        <ThreeTrees snapshot={snapshot} pulse={!!vizHint?.pulseTrees} />
        <div class="lg-card p-5 space-y-4">
          <h2 class="text-xl font-semibold text-pretty">{lesson.title}</h2>
          <LessonIllustration lessonId={lessonId} />
          <MarkdownView source={lesson.narrative} />
          <section>
            <h3 class="text-xs uppercase tracking-wide text-[var(--lg-muted)] mb-2">
              Objectives
            </h3>
            <ul class="list-disc pl-5 text-sm space-y-1 text-[var(--lg-text)]">
              {lesson.objectives.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </section>
          {lesson.articleUrl
            ? (
              <p class="text-sm">
                <a
                  href={lesson.articleUrl}
                  class="text-[var(--lg-accent)] hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-accent)]"
                  target="_blank"
                  rel="noreferrer"
                >
                  Reading
                </a>
              </p>
            )
            : null}
          <p class="text-xs text-[var(--lg-muted)]">{lesson.goalHint}</p>
          {lesson.allowedCommands.length > 0
            ? (
              <p class="text-xs text-[var(--lg-muted)]">
                Allowed: {lesson.allowedCommands.map((c) => (
                  <code
                    key={c}
                    class="mr-1 px-1.5 py-0.5 rounded-md border border-[var(--lg-border)] bg-[var(--lg-bg)] text-[var(--lg-text)]"
                    translate={false}
                  >
                    {c}
                  </code>
                ))}
              </p>
            )
            : null}
          <div class="space-y-1" aria-live="polite">
            {goalOk
              ? (
                <p class="text-xs text-[var(--lg-success)]">
                  {goalMsg ?? "Goal met."}
                </p>
              )
              : null}
            {quizOk
              ? (
                <p class="text-xs text-[var(--lg-success)]">
                  Quiz passed for this lesson.
                </p>
              )
              : null}
          </div>
        </div>
        {showQuiz
          ? (
            <QuizPanel
              quiz={lesson.quiz}
              answers={answers}
              onChange={(id, idx) =>
                setAnswers((prev) => ({ ...prev, [id]: idx }))}
              message={quizMsg}
            />
          )
          : null}
      </main>
    </div>
  );
}
