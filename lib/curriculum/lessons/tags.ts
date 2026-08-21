import { seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

export const lesson: Lesson = {
  id: "tags",
  order: 2,
  title: "Tags: name a commit without moving a branch",
  unlocksAfter: ["model"],
  articleUrl: "https://git-scm.com/book/en/v2/Git-Internals-Git-Objects",
  narrative:
    `A tag is a human-readable name for a commit that does not move when you make new commits. Branches live under refs/heads/ and advance with each commit; tags live under refs/tags/ and stay fixed unless you delete or move them on purpose.

The simplest form is a lightweight tag: git tag v1.0 writes refs/tags/v1.0 whose entire value is the commit hash at HEAD. No new object is created—the ref is the tag.

Annotated tags add metadata. git tag -a v1.0 -m "first release" writes a tag object (the fourth object type) that records object, type, tag name, tagger, and message, then points refs/tags/v1.0 at that object's hash—not at the commit directly. git cat-file -p v1.0 prints the tag object; Git peels through to the commit when it needs the tree.

Real Git can GPG- or SSH-sign annotated tags and can store objects with SHA-256 hashes in sha256 repositories. This teaching VM uses fake hashes and does not sign—the same refs/tags layout and tag object fields, without cryptography.

Tags mark releases: v1.0 on main today still names that commit after v1.1 lands. Fetch and clone copy tag refs like branch refs; checking out a tag puts you in detached HEAD at the tagged commit.`,
  objectives: [
    "Contrast lightweight tags (ref → commit) with annotated tags (ref → tag object → commit).",
    "Create an annotated tag with git tag -a and inspect it with cat-file -p.",
    "Name the fields stored in a tag object.",
    "Explain refs/tags vs refs/heads.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git branch",
    "git tag",
    'git tag -a v1.0 -m "first release"',
    "git cat-file",
    "git cat-file -p v1.0",
  ],
  demoScript: [
    "git status",
    "git log --oneline",
    "git tag",
    'git tag -a v1.0 -m "first release"',
    "git tag",
    "git cat-file -p v1.0",
  ],
  startState: seededLocalFromOrigin(),
  goalHint: "Create annotated tag v1.0 on HEAD.",
  quiz: [
    {
      id: "tags-q1",
      prompt: "A lightweight tag…",
      choices: [
        "Creates a tag object that points at a commit",
        "Writes refs/tags/<name> directly at a commit hash",
        "Moves refs/heads/main to the tagged commit",
        "Requires -m for a message",
      ],
      answer: 1,
      explain:
        "Lightweight tags are just refs under refs/tags/. Annotated tags add a tag object in between.",
    },
    {
      id: "tags-q2",
      prompt: "An annotated tag object stores…",
      choices: [
        "Only a commit hash, with no metadata",
        "object, type, tag name, tagger, and message",
        "A directory listing of names and hashes",
        "The remote URL and fetch refspec",
      ],
      answer: 1,
      explain:
        "The ref points at the tag object; the tag object points at the commit (or another object).",
    },
    {
      id: "tags-q3",
      prompt: "GPG or SSH signing on git tag -s…",
      choices: [
        "Is required for every annotated tag",
        "Is a real-Git extra this lab does not simulate",
        "Replaces the tag object with a branch ref",
        "Only works on lightweight tags",
      ],
      answer: 1,
      explain:
        "Signing attaches cryptography to the tag object. This VM uses the same fields without signing.",
    },
    {
      id: "tags-q4",
      prompt: "refs/tags/v1.0 vs refs/heads/main…",
      choices: [
        "Both advance automatically on every commit",
        "Tags stay fixed; branch refs move with new commits",
        "Tags live only on the remote",
        "Branch refs cannot be deleted",
      ],
      answer: 1,
      explain:
        "A branch label tracks tip growth. A tag names one commit until you move or delete the ref.",
    },
  ],
  goalCheck: (_snapshot, state) => {
    const id = state.refs["refs/tags/v1.0"];
    if (!id) return false;
    const obj = state.objects[id];
    return obj?.type === "tag" && obj.objectType === "commit";
  },
};
