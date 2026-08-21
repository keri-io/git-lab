import { seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();

export const lesson: Lesson = {
  id: "reftable",
  order: 6,
  title: "Refs storage: files, packed-refs, and reftable",
  unlocksAfter: ["packs"],
  articleUrl: "https://git-scm.com/docs/reftable",
  narrative:
    `A ref is a name → commit hash mapping. Branches live under refs/heads/, tags under refs/tags/, remotes under refs/remotes/. HEAD is usually symbolic: it points at a branch ref, not a hash directly.

For decades Git stored each ref as its own file under .git/refs/. Many refs meant many tiny files — slow on Windows (case-insensitive paths) and awkward at scale. Git also wrote packed-refs: one file listing ref names and hashes for refs that are not loose files anymore.

Git 3.0 makes reftable the default backend: a compact append-only log of ref updates in one table, with better performance for huge ref counts and safer handling on case-insensitive filesystems. The on-disk shape changed; the names you type (main, feature/UI, v1.0) did not.

This teaching VM keeps refs in a plain map (ref name → object id). You still practice the same commands. Create a nested branch name and a lightweight tag so you see refs/heads/ and refs/tags/ as separate namespaces. git tag without -a stores the commit hash directly; -a would create a tag object instead.`,
  objectives: [
    "Contrast loose ref files plus packed-refs with the reftable backend.",
    "Name the refs/heads/ and refs/tags/ prefixes for branches and tags.",
    "Create a nested branch ref (feature/UI) at the current commit.",
    "Add a lightweight tag (v1.0) that points at a commit, not a tag object.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git branch",
    "git branch feature/UI",
    "git tag",
    "git tag v1.0",
    "git switch",
    "git switch main",
  ],
  demoScript: [
    "git status",
    "git branch",
    "git branch feature/UI",
    "git tag v1.0",
    "git branch",
    "git tag",
  ],
  startState,
  goalHint:
    "Create branch feature/UI and lightweight tag v1.0 at HEAD. List both with git branch and git tag.",
  quiz: [
    {
      id: "reftable-q1",
      prompt: "Classic loose refs vs reftable…",
      choices: [
        "Loose refs are one file per ref; reftable is one compact update log",
        "Reftable stores blobs; loose refs store commits only",
        "Loose refs are only for tags",
        "They differ only in how packfiles are named",
      ],
      answer: 0,
      explain:
        "Files backend sprawl under .git/refs/. Reftable batches ref updates into a single table — better at scale and on Windows.",
    },
    {
      id: "reftable-q2",
      prompt: "packed-refs is…",
      choices: [
        "A second remote named packed",
        "One file listing ref names and hashes for refs not kept as loose files",
        "The index after git add",
        "A tag object created by git tag -a",
      ],
      answer: 1,
      explain:
        "pack-refs (or gc) can fold many loose refs into packed-refs. Lookups check loose files first, then the packed file.",
    },
    {
      id: "reftable-q3",
      prompt: "Git 3.0 defaults to reftable because…",
      choices: [
        "Tags no longer exist",
        "Huge ref counts and case-insensitive filesystems need a better backend",
        "Commits are stored in refs/heads/",
        "fetch requires reftable",
      ],
      answer: 1,
      explain:
        "Reftable scales when you have many refs (CI branches, forks) and avoids path collisions on case-insensitive disks.",
    },
    {
      id: "reftable-q4",
      prompt: "refs/heads/feature/UI vs refs/tags/v1.0…",
      choices: [
        "Both are branch refs that move on every commit",
        "heads/ is for branches; tags/ is for labels (lightweight or annotated)",
        "tags/ is only for remote-tracking refs",
        "heads/ stores trees; tags/ stores blobs",
      ],
      answer: 1,
      explain:
        "Branch refs move when you commit. Tag refs are meant to stay put; lightweight tags point straight at a commit hash.",
    },
  ],
  goalCheck: (_snapshot, state) => {
    const branchRef = state.refs["refs/heads/feature/UI"];
    const tagRef = state.refs["refs/tags/v1.0"];
    return (
      Boolean(branchRef) &&
      Boolean(tagRef) &&
      state.objects[tagRef]?.type === "commit"
    );
  },
};
