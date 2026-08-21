import { emptyState } from "../build.ts";
import type { Lesson } from "../types.ts";

export const lesson: Lesson = {
  id: "model",
  order: 1,
  title: "The model: objects, three trees, refs",
  unlocksAfter: [],
  articleUrl: "https://git-scm.com/book/en/v2/Git-Internals-Git-Objects",
  narrative:
    `Git is a content-addressable database, not a folder of file copies. Every object is type + size + NUL + content, hashed, and stored by that hash. The four types you will meet are blobs (file bytes with no name), trees (a directory listing of names to hashes), commits (a root tree, parent commit(s), and metadata), and optional annotated tags.

A branch is a tiny pointer: a ref whose entire contents are one commit hash. HEAD is usually symbolic: it names refs/heads/main rather than storing a hash itself.

The three trees git status compares are the working directory (files you edit), the index (the exact snapshot the next commit will record), and HEAD (the last committed snapshot on the current branch). git add hashes working-tree bytes into a blob and points the index at that blob. git commit writes a tree from the index, wraps it in a new commit object, and moves the branch label. Commits never change after they are written.

That immutability is why later chapters talk about rewriting history as creating new objects and moving labels. Amend, reset, rebase, and stash all reuse this model. Inspect a commit with git cat-file -p HEAD and the index with git ls-files. Identical file bytes share one blob; two commits can share trees when the directory has not changed.`,
  objectives: [
    "Name the four object types and what each one stores.",
    "Explain how git add and git commit move data among worktree, index, and HEAD.",
    "Treat a branch as a movable label, not a copy of the project.",
    "Create a first commit and inspect it with cat-file and ls-files.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git add",
    "git add .",
    "git add README.md",
    "git commit",
    "git cat-file",
    "git ls-files",
  ],
  demoScript: [
    "git status",
    "git add README.md",
    'git commit -m "initial"',
    "git log --oneline",
    "git cat-file -p HEAD",
    "git ls-files",
  ],
  startState: (() => {
    const state = emptyState();
    state.worktrees[0].files = { "README.md": "# demo\n" };
    return state;
  })(),
  goalHint:
    "Stage README.md and commit it so refs/heads/main points at a real commit object.",
  quiz: [
    {
      id: "model-q1",
      prompt: "What does a blob object store?",
      choices: [
        "A file’s bytes only, with no path and no mode",
        "A directory listing of names and hashes",
        "A commit message and its parent list",
        "The current branch name",
      ],
      answer: 0,
      explain:
        "Blobs are content only. The tree that points at the blob supplies the filename and mode.",
    },
    {
      id: "model-q2",
      prompt: "git add does which of these?",
      choices: [
        "Moves the branch label to a new commit",
        "Hashes working-tree bytes into a blob and points the index at it",
        "Downloads missing objects from origin",
        "Edits the previous commit in place",
      ],
      answer: 1,
      explain:
        "The index is the snapshot the next commit will write. add updates that snapshot; commit is what creates the object and moves the ref.",
    },
    {
      id: "model-q3",
      prompt: "Why does rewriting history produce a new commit hash?",
      choices: [
        "Git generates a random id on every command",
        "The old commit is mutated and then rehashed",
        "Commits are immutable; Git writes a new object and moves the label",
        "The working tree path is part of the hash",
      ],
      answer: 2,
      explain:
        "You never edit a commit. Amend, rebase, and reset create new objects (or only move a ref) and leave the old hash dangling until GC.",
    },
    {
      id: "model-q4",
      prompt: "HEAD is usually…",
      choices: [
        "A copy of every file in the repository",
        "A symbolic ref such as refs/heads/main",
        "The remote-tracking branch origin/main",
        "The packfile index",
      ],
      answer: 1,
      explain:
        "HEAD names the current branch. Resolving it gives the commit hash that branch currently points at.",
    },
  ],
  goalCheck: (_snapshot, state) => {
    const id = state.refs["refs/heads/main"];
    if (!id) return false;
    const obj = state.objects[id];
    return obj?.type === "commit";
  },
};
