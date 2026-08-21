import { seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
startState.worktrees[0].files["README.md"] = "# demo\nstaged later\n";

export const lesson: Lesson = {
  id: "index",
  order: 3,
  title: "The index: staging area and DIRC cache",
  unlocksAfter: ["tags"],
  articleUrl: "https://git-scm.com/docs/git-diff",
  narrative:
    `The index is Git’s staging area: the exact snapshot the next commit will record. On disk it is a binary cache called DIRC (Directory Index Cache). Each entry stores path, mode, blob hash, and cached stat metadata (mtime, size, inode) so git status can skip re-hashing unchanged files.

This teaching VM does not store a real DIRC file. It still models the index as path + blob + stage, which is enough for add, diff, and commit.

git diff compares the working tree to the index — what you edited but have not staged. git diff --cached (same as --staged) compares the index to HEAD — what you staged but have not committed.

git add hashes the working-tree bytes into a blob object and updates the index entry at stage 0. Until you commit, HEAD’s tree still points at the old blob. README.md in the worktree already says “staged later”; stage it and confirm with git diff --cached while HEAD stays at # demo.`,
  objectives: [
    "Name what DIRC caches (path, mode, hash, stat) and why status is fast.",
    "Contrast git diff (worktree vs index) with git diff --cached (index vs HEAD).",
    "Treat the index as the next commit’s tree, not a clipboard.",
    "Stage README.md and read the cached diff before committing.",
  ],
  allowedCommands: [
    "git status",
    "git diff",
    "git diff --cached",
    "git diff --staged",
    "git add",
    "git add README.md",
    "git ls-files",
    "git cat-file",
  ],
  demoScript: [
    "git status",
    "git diff",
    "git add README.md",
    "git diff --cached",
    "git status",
  ],
  startState,
  goalHint:
    "Stage README.md so the index blob contains “staged later” while HEAD’s tree still has only # demo.",
  quiz: [
    {
      id: "index-q1",
      prompt: "Real Git’s DIRC index entry caches…",
      choices: [
        "Path, mode, blob hash, and stat info for fast status checks",
        "Only filenames with no blob ids",
        "Remote-tracking ref names",
        "Packfile offsets",
      ],
      answer: 0,
      explain:
        "Stat cache lets status ask “did this file change on disk?” before hashing. The blob hash is what commit will write.",
    },
    {
      id: "index-q2",
      prompt: "git diff (no flags) shows…",
      choices: [
        "Index vs HEAD",
        "Worktree vs index",
        "Worktree vs HEAD only",
        "Origin vs local main",
      ],
      answer: 1,
      explain:
        "Unstaged edits: files differ from what is staged. After git add, that path drops out of plain git diff.",
    },
    {
      id: "index-q3",
      prompt: "git diff --cached compares…",
      choices: [
        "Worktree vs index",
        "Index vs HEAD",
        "Two remote branches",
        "Blob vs tree objects on disk",
      ],
      answer: 1,
      explain:
        "--staged is the same flag. It is the diff you are about to commit.",
    },
    {
      id: "index-q4",
      prompt: "git add README.md…",
      choices: [
        "Moves refs/heads/main to a new commit",
        "Hashes file bytes into a blob and points the index entry at it",
        "Edits the blob already stored in HEAD’s tree",
        "Copies the file into .git/objects without hashing",
      ],
      answer: 1,
      explain:
        "Add updates the index snapshot. Commit is what writes a tree from the index and moves the branch.",
    },
  ],
  goalCheck: (snapshot, state) => {
    const entry = snapshot.index.find(
      (e) => e.path === "README.md" && e.stage === 0,
    );
    if (!entry) return false;
    const staged = state.objects[entry.blob];
    if (!staged || staged.type !== "blob") return false;
    if (!staged.content.includes("staged later")) return false;
    if (!snapshot.head) return false;
    const commit = state.objects[snapshot.head];
    if (!commit || commit.type !== "commit") return false;
    const tree = state.objects[commit.tree];
    if (!tree || tree.type !== "tree") return false;
    const readme = tree.entries.find((e) => e.name === "README.md");
    if (!readme) return false;
    const headBlob = state.objects[readme.id];
    if (!headBlob || headBlob.type !== "blob") return false;
    return !headBlob.content.includes("staged later");
  },
};
