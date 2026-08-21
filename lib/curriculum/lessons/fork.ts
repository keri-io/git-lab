import {
  attachUpstreamCopy,
  commitOnRemote,
  seededLocalFromOrigin,
} from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
attachUpstreamCopy(startState);
commitOnRemote(startState, "upstream", "maintainers moved", {
  "README.md": "# demo\n",
  "UPSTREAM.md": "from upstream\n",
});
const upstreamTip = startState.remotes.upstream.refs["refs/heads/main"]!;

export const lesson: Lesson = {
  id: "fork",
  order: 11,
  title: "Fork: a second remote, not a Git command",
  unlocksAfter: ["pull"],
  narrative:
    `There is no git fork. The host copies the repository into your namespace so you can push. git clone of that copy is origin: the remote you push.

The original project is a second remote, conventionally upstream, that you fetch and merge (or later rebase). A pull request is a hosting-site request that they pull your branch into their repo.

A fork is clone, remotes, fetch, and merge, twice. Syncing local main is fetch upstream, switch main, merge (this VM fast-forwards when main is an ancestor), then push origin. Feature work happens on a branch you push to origin, not on upstream.

This sandbox is already cloned from your origin. upstream is attached and one commit ahead (UPSTREAM.md). Fetch upstream and merge upstream/main so local main matches the maintainers. origin/main stays where you last pushed: that lag is the reminder to push after you sync.`,
  objectives: [
    "Explain fork as a hosting-site clone plus a local clone of that fork.",
    "Keep origin (push) and upstream (read-mostly) as two remotes.",
    "Sync main with fetch + merge of upstream/main.",
    "Leave origin/main unchanged until a later push.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git remote",
    "git remote add",
    "git fetch",
    "git fetch upstream",
    "git fetch origin",
    "git merge",
    "git merge upstream/main",
    "git switch",
    "git checkout",
    "git branch",
  ],
  demoScript: [
    "git status",
    "git fetch upstream",
    "git merge upstream/main",
    "git log --oneline",
    "git status",
  ],
  startState,
  goalHint:
    "Fetch upstream and merge upstream/main so local main matches the maintainers’ tip.",
  quiz: [
    {
      id: "fork-q1",
      prompt: "git fork…",
      choices: [
        "is the command that copies a GitHub repo into your account",
        "does not exist; the host copies the repo, then you clone and add remotes",
        "is an alias for git clone --mirror",
        "creates refs/remotes/upstream/* without a network",
      ],
      answer: 1,
      explain:
        "Fork is a product feature. Git only knows remotes, fetch, and merge.",
    },
    {
      id: "fork-q2",
      prompt: "In the usual layout, origin is…",
      choices: [
        "The original project you cannot push to",
        "Your fork: the remote you push",
        "Always the same URL as upstream",
        "A remote-tracking branch, not a remote",
      ],
      answer: 1,
      explain:
        "You clone your fork (origin). You add the original as upstream and fetch it.",
    },
    {
      id: "fork-q3",
      prompt: "Syncing local main with maintainers is…",
      choices: [
        "git push upstream main",
        "fetch upstream, then merge (or rebase) upstream/main",
        "git clone upstream",
        "deleting origin/main",
      ],
      answer: 1,
      explain:
        "Same fetch-then-integrate pattern as pull, aimed at a second remote.",
    },
    {
      id: "fork-q4",
      prompt:
        "After merging upstream/main, origin/main still lags. That means…",
      choices: [
        "Fetch failed",
        "Your fork on the host does not have the sync until you push origin",
        "HEAD is detached",
        "upstream and origin cannot differ",
      ],
      answer: 1,
      explain:
        "Local main moved. The origin remote-tracking ref moves on fetch/push of origin, not on an upstream merge.",
    },
  ],
  goalCheck: (snapshot, state) => {
    return (
      state.refs["refs/heads/main"] === upstreamTip &&
      state.refs["refs/remotes/upstream/main"] === upstreamTip &&
      snapshot.files["UPSTREAM.md"] === "from upstream\n"
    );
  },
};
