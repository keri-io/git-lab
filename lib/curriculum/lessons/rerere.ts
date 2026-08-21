import { commitOnBranch, mainTip, seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const initial = mainTip(startState);
commitOnBranch(startState, "main", "add notes", {
  "README.md": "# demo\nfrom main\n",
  "NOTES.md": "local notes\n",
});
commitOnBranch(startState, "feature", "add app", {
  "README.md": "# demo\nfrom feature\n",
  "app.ts": "export const ok = true;\n",
}, { from: initial, checkout: false });

export const lesson: Lesson = {
  id: "rerere",
  order: 9,
  title: "rerere: remember conflict resolutions",
  unlocksAfter: ["merge"],
  articleUrl: "https://git-scm.com/docs/git-rerere",
  narrative:
    `Conflict markers show two sides. merge.conflictstyle merge prints <<<<<<< HEAD, =======, and >>>>>>> label. diff3 and zdiff3 add a ||||||| base section with the merge-base text so you see what both sides changed from.

rerere (reuse recorded resolution) stores your resolution when rerere.enabled is true. On git add of a resolved path during a merge, Git keys the worktree bytes by ours\\0theirs (stage-2 and stage-3 blob contents) and saves them in the rerere cache. A later merge of the same pair auto-applies that blob: no stages 1/2/3, no markers, and the merge can finish immediately.

git merge --abort restores HEAD and clears MERGE_HEAD, but it does not wipe rerere’s recorded resolutions. That is why aborting a practice merge and merging again can auto-complete.

This teaching VM accepts git config merge.conflictstyle diff3 and git config rerere.enabled true. Real repos also use git rerere status, git rerere diff, and git rerere clear; AI-assisted merge tools are optional extras not exercised here.

Enable rerere, merge feature, resolve README.md once, abort, then merge feature again so rerere replays your resolution into a two-parent commit.`,
  objectives: [
    "Contrast merge conflictstyle with diff3/zdiff3 (the ||||||| base section).",
    "Explain how rerere keys resolutions by ours and theirs blob bytes.",
    "See that merge --abort keeps the rerere cache.",
    "Finish the second merge without manual conflict stages.",
  ],
  allowedCommands: [
    "git config",
    "git config rerere.enabled true",
    "git config merge.conflictstyle diff3",
    "git merge",
    "git merge feature",
    "git merge --abort",
    "git ls-files -u",
    "git checkout --theirs -- README.md",
    "git add README.md",
    "git status",
    "git log",
  ],
  demoScript: [
    "git config rerere.enabled true",
    "git status",
    "git merge feature",
    "git ls-files -u",
    "git checkout --theirs -- README.md",
    "git add README.md",
    "git merge --abort",
    "git merge feature",
    "git status",
  ],
  startState,
  goalHint:
    "Enable rerere, record a README resolution, abort, then merge feature again so HEAD is a two-parent commit with a clean README.",
  quiz: [
    {
      id: "rerere-q1",
      prompt: "With rerere.enabled, git add on a resolved conflict…",
      choices: [
        "Deletes stages 1/2/3 but stores nothing",
        "Records ours\\0theirs → resolved bytes in the rerere cache",
        "Only works after git commit",
        "Requires merge.conflictstyle zdiff3",
      ],
      answer: 1,
      explain:
        "add collapses unmerged stages and, when rerere is on, saves the resolution keyed by the stage-2 and stage-3 blob contents.",
    },
    {
      id: "rerere-q2",
      prompt: "You resolved a conflict, then git merge --abort. The rerere cache…",
      choices: [
        "Is wiped with MERGE_HEAD",
        "Keeps the recorded resolution for the same ours/theirs pair",
        "Moves entries into the stash",
        "Only survives if you git commit first",
      ],
      answer: 1,
      explain:
        "abort restores the pre-merge tree and index; rerere recordings live outside that rollback.",
    },
    {
      id: "rerere-q3",
      prompt: "In diff3 conflict markers, ||||||| base shows…",
      choices: [
        "Theirs (the branch you merged)",
        "Ours (HEAD)",
        "The merge-base version both sides diverged from",
        "The resolved file you will commit",
      ],
      answer: 2,
      explain:
        "diff3 and zdiff3 insert the ancestor text between ours and theirs so you can see what each side changed.",
    },
    {
      id: "rerere-q4",
      prompt: "merge.conflictstyle zdiff3 differs from diff3 because…",
      choices: [
        "zdiff3 omits the ||||||| section entirely",
        "zdiff3 moves the base section adjacent to the conflicting hunk (diff3 places it between ours and theirs)",
        "zdiff3 disables rerere",
        "zdiff3 uses only two index stages",
      ],
      answer: 1,
      explain:
        "Both styles expose the base; zdiff3 rearranges where the ancestor block appears in the marker layout.",
    },
  ],
  goalCheck: (snapshot, state) => {
    if (!snapshot.head) return false;
    const obj = state.objects[snapshot.head];
    if (obj?.type !== "commit" || obj.parents.length !== 2) return false;
    if (!state.rerereEnabled) return false;
    const readme = snapshot.files["README.md"] ?? "";
    return !readme.includes("<<<<<<<");
  },
};
