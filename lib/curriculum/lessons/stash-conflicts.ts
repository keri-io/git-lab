import {
  commitOnBranch,
  mainTip,
  seededLocalFromOrigin,
  writeCommit,
} from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const H = mainTip(startState);
const filesH = { "README.md": "# demo\n" };
const filesW = { "README.md": "# demo\nfrom stash\n" };
const { commit: indexCommit, objects: indexObjs } = writeCommit(
  "index on main: wip",
  [H],
  filesH,
);
const { commit: wCommit, objects: wObjs } = writeCommit(
  "WIP on main: wip",
  [H, indexCommit.id],
  filesW,
);
Object.assign(startState.objects, indexObjs, wObjs);
startState.stash = [wCommit.id];
startState.refs["refs/stash"] = wCommit.id;
commitOnBranch(startState, "main", "main edited readme", {
  "README.md": "# demo\nfrom main\n",
});

export const lesson: Lesson = {
  id: "stash-conflicts",
  order: 20,
  title: "Stash merge conflicts",
  unlocksAfter: ["stash"],
  articleUrl: "https://www.themoderncoder.com/fix-git-stash-conflicts/",
  narrative:
    `git stash pop and apply merge W onto the current worktree. If the branch moved, you get the same unmerged stages as any merge. Markers say “Updated upstream” versus “Stashed changes.” There is no git stash --continue.

After you edit and git add (stages collapse to 0), drop the stash yourself. If apply conflicted, pop did not drop it. To abort, git reset --merge; the stash stays listed.

CONFLICT (content) means you are in the merge workflow. “Your local changes would be overwritten by merge” means Git aborted; you never entered markers. Stage or commit the dirty files, then pop again.

If the new tip is a bad place to apply, git stash branch wip-from-stash checks out original H and applies there. While learning, prefer apply then drop, not pop.

main has moved: README now says from main. The stash still records from stash on top of the original H. Pop (or apply) to see stages 1/2/3, resolve to one README, add, then git stash drop.`,
  objectives: [
    "Treat stash apply/pop as a merge of W onto the current tree.",
    "Remember that a conflicting pop does not drop the stash.",
    "Resolve with edit + git add; there is no stash --continue.",
    "Leave a clean index (no unmerged stages) after the stash conflict.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git stash",
    "git stash pop",
    "git stash apply",
    "git stash drop",
    "git stash branch",
    "git add",
    "git add README.md",
    "git add .",
    "git ls-files",
    "git ls-files -u",
    "git reset",
    "git reset --merge",
    "git checkout",
    "git checkout --ours",
    "git checkout --theirs",
    "git checkout --ours -- README.md",
    "git checkout --theirs -- README.md",
    "edit",
    "edit README.md",
  ],
  demoScript: [
    "git status",
    "git stash apply",
    "git status",
    "git ls-files -u",
    'edit README.md << "# demo\\nfrom stash"',
    "git add README.md",
    "git stash drop",
    "git status",
  ],
  startState,
  goalHint:
    "Pop the stash, resolve README (keep the text you want), git add, then drop if pop left it listed.",
  quiz: [
    {
      id: "stashc-q1",
      prompt: "stash pop hits a content conflict. The stash entry…",
      choices: [
        "Is already dropped",
        "Stays listed; drop it after you resolve",
        "Becomes a branch named stash",
        "Is force-pushed to origin",
      ],
      answer: 1,
      explain:
        "Drop is aborted on purpose so you cannot lose W while the merge is messy.",
    },
    {
      id: "stashc-q2",
      prompt: "After fixing markers, you run…",
      choices: [
        "git stash --continue",
        "git add the resolved paths (no stash --continue exists)",
        "git merge --continue",
        "git rebase --skip",
      ],
      answer: 1,
      explain:
        "Same resolution as merge: add collapses stages. The sequencer is not a stash sequencer.",
    },
    {
      id: "stashc-q3",
      prompt: "“Would be overwritten by merge” on stash pop means…",
      choices: [
        "You are looking at <<<<<<< markers",
        "Git refused to start; the stash is untouched; clean the worktree first",
        "Stages 1/2/3 are already in the index",
        "W was dropped",
      ],
      answer: 1,
      explain:
        "Dirty-worktree abort, same as merge. You never entered the conflict workflow.",
    },
    {
      id: "stashc-q4",
      prompt: "Index stages during a stash conflict are…",
      choices: [
        "Unique to stash (stages 4/5/6)",
        "The same 1 base / 2 ours / 3 theirs as merge",
        "Only stage 0",
        "Stored in refs/stash instead of the index",
      ],
      answer: 1,
      explain:
        "git ls-files -u is the same picture as a branch merge. add is still the resolved signal.",
    },
  ],
  goalCheck: (snapshot, state) => {
    if (state.conflicted) return false;
    if (snapshot.index.some((e) => e.stage !== 0)) return false;
    if (state.stash.length !== 0) return false;
    const readme = snapshot.files["README.md"] ?? "";
    return readme.includes("from stash") && !readme.includes("<<<<<<<");
  },
};
