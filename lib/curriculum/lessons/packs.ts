import { commitOnRemote, seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const localTip = startState.refs["refs/heads/main"]!;
commitOnRemote(startState, "origin", "upstream docs", {
  "README.md": "# demo\n",
  "NOTES.md": "from origin\n",
});
const remoteTip = startState.remotes.origin.refs["refs/heads/main"]!;

export const lesson: Lesson = {
  id: "packs",
  order: 5,
  title: "Packfiles: loose objects and fetch transport",
  unlocksAfter: ["clone"],
  articleUrl: "https://git-scm.com/book/en/v2/Git-Internals-Packfiles",
  narrative:
    `Fresh objects start loose: one zlib-compressed file per hash under .git/objects. Over time git gc packs them into a packfile (.pack) — a single stream of deltified, compressed objects — plus a pack index (.idx) that maps object id to byte offset so lookups stay fast without scanning the whole pack.

git fetch and git clone negotiate have and want, then the server streams one pack of objects you do not already store. Your client unpacks it into the object database (or appends a new .pack on disk). Remote-tracking refs move after the objects land; your branch and worktree are unchanged.

Real Git adds multi-pack indexes (MIDX) when many packfiles exist, and reachability bitmaps so the server can answer “what do they already have?” without walking the whole graph every time. Those are performance layers on the same pack transport.

This teaching VM flashes pack-arrival when objects arrive from a remote, but it keeps every object in an in-memory map — no .pack, no .idx, no zlib. The flash is the wire moment; the lesson is the shape of real storage.

Your sandbox matches fetch setup: local main sits on the initial README commit while origin’s main has walked forward with NOTES.md. Run git fetch origin, inspect origin/main with log and cat-file, and confirm the new commit’s objects landed while local main stayed put.`,
  objectives: [
    "Contrast loose objects with packfile + .idx on-disk layout.",
    "Describe fetch as pack negotiation followed by unpacking new objects.",
    "Name MIDX and reachability bitmaps as real-Git speedups on top of packs.",
    "Recognize that this lab flashes pack-arrival but stores objects in memory.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git fetch",
    "git fetch origin",
    "git branch",
    "git cat-file",
    "git cat-file -p",
    "git ls-files",
  ],
  demoScript: [
    "git status",
    "git log --oneline",
    "git fetch origin",
    "git log --oneline origin/main",
    "git cat-file -p origin/main",
  ],
  startState,
  goalHint:
    "Run git fetch origin. New objects should land (pack flash) and origin/main should advance while local main stays behind.",
  quiz: [
    {
      id: "packs-q1",
      prompt: "Loose objects vs a packfile — which is true?",
      choices: [
        "Loose stores one file per hash; a pack bundles many objects in one compressed stream",
        "Packs are only for tags; commits stay loose forever",
        "Loose objects are never zlib-compressed",
        "A pack replaces refs so objects need no hashes",
      ],
      answer: 0,
      explain:
        "Loose is .git/objects/xx/yyyy…. gc and fetch append .pack files; the idx maps id → offset inside that stream.",
    },
    {
      id: "packs-q2",
      prompt: "The .idx beside a .pack file…",
      choices: [
        "Stores every filename in the working tree",
        "Is an index from object hash to byte offset in the pack",
        "Is the same file as MIDX on all repos",
        "Only lists refs/heads/*",
      ],
      answer: 1,
      explain:
        "Without an idx, finding one object would mean scanning the pack. The idx makes random access cheap.",
    },
    {
      id: "packs-q3",
      prompt: "A multi-pack index (MIDX) helps when…",
      choices: [
        "You have many packfiles and want one lookup table across them",
        "HEAD is detached",
        "The worktree has merge conflicts",
        "You never run git fetch",
      ],
      answer: 0,
      explain:
        "MIDX sits above several .idx files so object lookup does not devolve into “try every pack.”",
    },
    {
      id: "packs-q4",
      prompt: "Reachability bitmaps mainly speed up…",
      choices: [
        "Editing commit messages in the index",
        "Pack negotiation: knowing what the client already has",
        "Renaming branches in .git/packed-refs",
        "Writing loose blobs during git add",
      ],
      answer: 1,
      explain:
        "Bitmaps precompute reachability from refs so have/want sets are cheaper on large repos.",
    },
    {
      id: "packs-q5",
      prompt: "In this Git Lab sandbox, after fetch…",
      choices: [
        "Objects are appended to a real on-disk .pack with zlib",
        "A pack-arrival flash plays but objects live in an in-memory map",
        "No new objects are stored until you merge",
        "The idx file is written beside each blob",
      ],
      answer: 1,
      explain:
        "The VM models the network moment honestly: you see the flash, but storage is a teaching map, not .git/objects/pack.",
    },
  ],
  goalCheck: (_snapshot, state) => {
    const tracking = state.refs["refs/remotes/origin/main"];
    return (
      tracking === remoteTip &&
      state.objects[tracking] !== undefined &&
      state.refs["refs/heads/main"] === localTip &&
      localTip !== tracking
    );
  },
};
