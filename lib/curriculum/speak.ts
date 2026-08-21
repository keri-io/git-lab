/**
 * Fluent lesson builder: the call site should read as a sentence.
 * Terminal method is build(). GitVM.exec stays the learner-facing CLI.
 */
import type { GitState, Snapshot } from "../git-vm/types.ts";
import type {
  Lesson,
  LessonId,
  LessonViz,
  QuizItem,
  VizBeat,
} from "./types.ts";
import { LESSON_ORDER } from "./types.ts";

export type GoalCheck = (snapshot: Snapshot, state: GitState) => boolean;

export type ThenFlags = { ref?: string; trees?: boolean };

export class LessonTalk {
  #id: LessonId;
  #title = "";
  #unlocksAfter: string[] = [];
  #articleUrl?: string;
  #narrative = "";
  #objectives: string[] = [];
  #allowedCommands: string[] = [];
  #demoScript: string[] = [];
  #startState?: GitState;
  #goalHint = "";
  #quiz: QuizItem[] = [];
  #intro = "";
  #beats: VizBeat[] = [];
  #goalCheck?: GoalCheck;

  constructor(id: LessonId) {
    this.#id = id;
  }

  after(...ids: string[]): this {
    this.#unlocksAfter = ids;
    return this;
  }

  title(title: string): this {
    this.#title = title;
    return this;
  }

  article(url: string): this {
    this.#articleUrl = url;
    return this;
  }

  says(narrative: string): this {
    this.#narrative = narrative;
    return this;
  }

  learn(...objectives: string[]): this {
    this.#objectives = objectives;
    return this;
  }

  allow(...commands: string[]): this {
    this.#allowedCommands = commands;
    return this;
  }

  demo(...commands: string[]): this {
    this.#demoScript = commands;
    return this;
  }

  from(state: GitState): this {
    this.#startState = state;
    return this;
  }

  hint(goalHint: string): this {
    this.#goalHint = goalHint;
    return this;
  }

  watch(intro: string): this {
    this.#intro = intro;
    return this;
  }

  /**
   * Flag string form: "trees" | "main" | "main trees" | "origin/main".
   * Token "trees" pulses the three-tree cards; any other token is highlightRef.
   */
  then(caption: string, opts?: ThenFlags | string): this {
    const beat: VizBeat = { caption };
    if (typeof opts === "string") {
      for (const tok of opts.split(/\s+/).filter(Boolean)) {
        if (tok === "trees") beat.pulseTrees = true;
        else beat.highlightRef = tok;
      }
    } else {
      if (opts?.ref) beat.highlightRef = opts.ref;
      if (opts?.trees) beat.pulseTrees = true;
    }
    this.#beats.push(beat);
    return this;
  }

  ask(
    prompt: string,
    choices: string[],
    answer: number,
    explain: string,
  ): this;
  ask(
    id: string,
    prompt: string,
    choices: string[],
    answer: number,
    explain: string,
  ): this;
  ask(
    idOrPrompt: string,
    promptOrChoices: string | string[],
    choicesOrAnswer: string[] | number,
    answerOrExplain: number | string,
    explain?: string,
  ): this {
    let id: string;
    let prompt: string;
    let choices: string[];
    let answer: number;
    let expl: string;
    if (Array.isArray(promptOrChoices)) {
      prompt = idOrPrompt;
      choices = promptOrChoices;
      answer = choicesOrAnswer as number;
      expl = answerOrExplain as string;
      id = `${this.#id}-q${this.#quiz.length + 1}`;
    } else {
      id = idOrPrompt;
      prompt = promptOrChoices;
      choices = choicesOrAnswer as string[];
      answer = answerOrExplain as number;
      expl = explain as string;
    }
    this.#quiz.push({ id, prompt, choices, answer, explain: expl });
    return this;
  }

  pass(goalCheck: GoalCheck): this {
    this.#goalCheck = goalCheck;
    return this;
  }

  build(): Lesson {
    if (!this.#title) throw new Error(`${this.#id}: missing title`);
    if (!this.#startState) throw new Error(`${this.#id}: missing from()`);
    if (!this.#goalCheck) throw new Error(`${this.#id}: missing pass()`);
    const viz: LessonViz = { intro: this.#intro, beats: this.#beats };
    const lesson: Lesson = {
      id: this.#id,
      order: LESSON_ORDER.indexOf(this.#id) + 1,
      title: this.#title,
      unlocksAfter: this.#unlocksAfter,
      narrative: this.#narrative,
      objectives: this.#objectives,
      allowedCommands: this.#allowedCommands,
      demoScript: this.#demoScript,
      startState: this.#startState,
      goalHint: this.#goalHint,
      quiz: this.#quiz,
      goalCheck: this.#goalCheck,
      viz,
    };
    if (this.#articleUrl) lesson.articleUrl = this.#articleUrl;
    return lesson;
  }
}

/** Start a lesson sentence: speak("tags", "Tags: …").after("model") */
export function speak(id: LessonId, title?: string): LessonTalk {
  const talk = new LessonTalk(id);
  if (title !== undefined) talk.title(title);
  return talk;
}
