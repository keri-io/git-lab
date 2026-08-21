import { commitOnBranch, mainTip, seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const initial = mainTip(startState);
commitOnBranch(startState, "main", "add notes", {
  "README.md": "# demo\n",
  "NOTES.md": "notes\n",
});
const fixId = commitOnBranch(startState, "hotfix", "urgent fix", {
  "README.md": "# demo\npatched\n",
}, { from: initial, checkout: false });

export const lesson: Lesson = {
  id: "cherry-pick",
  order: 9,
  title: "Cherry-pick: copy one commit’s change",
  unlocksAfter: ["reset"],
  articleUrl: "https://www.themoderncoder.com/git-cherry-pick/",
  narrative:
    `Merge brings a whole branch, and a merge commit when both sides moved. Cherry-pick brings one commit’s diff onto current HEAD as a new commit. Git writes CHERRY_PICK_HEAD so the new commit can copy message and authorship. You create a duplicate patch with a different hash.

Later merging the original branch can confuse Git. Use cherry-pick for a hotfix on two long-lived branches, or lifting one commit off a messy branch, not for integrating a whole feature.

Conflicts are the same as merge: index stages 1/2/3. You are applying one patch, so you edit, git add, then git cherry-pick --continue. If uncommitted edits would be overwritten, cherry-pick aborts before starting. An empty cherry-pick (change already present) uses --skip or --allow-empty.

main has NOTES.md on top of initial. hotfix has a single README patch off the same initial. Cherry-pick that hotfix commit onto main. Confirm the message matches and the hash does not.`,
  objectives: [
    "Contrast cherry-pick (one patch, new hash) with merge (whole branch).",
    "Resolve a cherry-pick conflict with add then --continue, same stages as merge.",
    "Avoid cherry-picking a long series when merge or rebase is the real tool.",
    "Copy the hotfix commit onto main as a new object.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git cherry-pick",
    `git cherry-pick ${fixId}`,
    "git cherry-pick --continue",
    "git cherry-pick --abort",
    "git add",
    "git ls-files",
    "git branch",
    "git switch",
    "git checkout",
  ],
  demoScript: [
    "git status",
    "git log --oneline",
    `git cherry-pick ${fixId}`,
    "git log --oneline",
    "git status",
  ],
  startState,
  goalHint: `Cherry-pick ${
    fixId.slice(0, 7)
  } (urgent fix) onto main so HEAD is a new commit with that message.`,
  quiz: [
    {
      id: "cherry-q1",
      prompt: "A cherry-picked commit has…",
      choices: [
        "The same hash as the source, because the patch is identical",
        "A new hash; the parent is current HEAD, not the source’s parent",
        "Two parents, like a merge",
        "No tree, only a message",
      ],
      answer: 1,
      explain:
        "The patch is replayed. Parent, tree, and therefore id all change even when the message is copied.",
    },
    {
      id: "cherry-q2",
      prompt: "Cherry-pick conflicts use…",
      choices: [
        "A fourth index stage unique to cherry-pick",
        "The same unmerged stages 1/2/3 as merge",
        "Only the worktree; the index stays stage 0",
        "CHERRY_PICK_HEAD as stage 3",
      ],
      answer: 1,
      explain:
        "Same machinery. Continue after add; abort restores the pre-pick branch.",
    },
    {
      id: "cherry-q3",
      prompt: "You have uncommitted edits in the same files. Cherry-pick…",
      choices: [
        "Overlays markers on your dirty files",
        "Aborts with “would be overwritten”; commit or stash first",
        "Stashes automatically",
        "Resets --hard then picks",
      ],
      answer: 1,
      explain:
        "Same dirty-worktree guard as merge. Stash pop later can itself conflict.",
    },
    {
      id: "cherry-q4",
      prompt:
        "Cherry-pick a whole feature’s ten commits when you meant to integrate the branch?",
      choices: [
        "Ideal: hashes stay unique",
        "Usually the wrong tool; merge or rebase the branch instead",
        "Required so GitFlow can fast-forward",
        "The only way to copy a directory",
      ],
      answer: 1,
      explain:
        "Duplicate patches make later merges harder. One-off hotfixes and lifting a single commit are the fit.",
    },
  ],
  goalCheck: (snapshot, state) => {
    if (!snapshot.head || snapshot.head === fixId) return false;
    const obj = state.objects[snapshot.head];
    return obj?.type === "commit" &&
      obj.message === "urgent fix" &&
      obj.parents.length === 1;
  },
};
