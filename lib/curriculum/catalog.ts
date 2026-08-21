// deno-fmt-ignore-file
/** Fluent lesson catalog. One method call per thought; GitVM.exec stays the CLI. */
import {
  attachUpstreamCopy,
  checkoutCommit,
  commitOnBranch,
  commitOnRemote,
  emptyState,
  mainTip,
  originFixture,
  reachableCount,
  seededLocalFromOrigin,
  treeHas,
  writeCommit,
} from "./build.ts";
import { commitFiles } from "../git-vm/repo.ts";
import type { GitObject } from "../git-vm/types.ts";
import { speak } from "./speak.ts";

// --- model ---
function modelLesson() {
  return speak("model", "The model: objects, three trees, refs")
    .article("https://git-scm.com/book/en/v2/Git-Internals-Git-Objects")
    .says(`Git is a content-addressable database, not a folder of file copies. Every object is type + size + NUL + content, hashed, and stored by that hash. The four types you will meet are blobs (file bytes with no name), trees (a directory listing of names to hashes), commits (a root tree, parent commit(s), and metadata), and optional annotated tags.

A branch is a tiny pointer: a ref whose entire contents are one commit hash. HEAD is usually symbolic: it names refs/heads/main rather than storing a hash itself.

The three trees git status compares are the working directory (files you edit), the index (the exact snapshot the next commit will record), and HEAD (the last committed snapshot on the current branch). git add hashes working-tree bytes into a blob and points the index at that blob. git commit writes a tree from the index, wraps it in a new commit object, and moves the branch label. Commits never change after they are written.

That immutability is why later chapters talk about rewriting history as creating new objects and moving labels. Amend, reset, rebase, and stash all reuse this model. Inspect a commit with git cat-file -p HEAD and the index with git ls-files. Identical file bytes share one blob; two commits can share trees when the directory has not changed.`)
    .learn("Name the four object types and what each one stores.", "Explain how git add and git commit move data among worktree, index, and HEAD.", "Treat a branch as a movable label, not a copy of the project.", "Create a first commit and inspect it with cat-file and ls-files.")
    .allow("git status", "git log", "git log --oneline", "git add", "git add .", "git add README.md", "git commit", "git cat-file", "git ls-files")
    .demo("git status", "git add README.md", 'git commit -m "initial"', "git log --oneline", "git cat-file -p HEAD", "git ls-files")
    .from((() => {
      const state = emptyState();
      state.worktrees[0].files = { "README.md": "# demo\n" };
      return state;
    })())
    .hint("Stage README.md and commit it so refs/heads/main points at a real commit object.")
    .watch("Watch the three trees. Worktree already has README.md; index and HEAD are empty until you add and commit.")
    .then("The graph is empty (no commits). status compares the three trees: README.md is untracked — only the worktree has it.", "trees")
    .then("git add hashes the file into a blob and points the index at it. HEAD still has no commit.", "trees")
    .then("commit writes a tree from the index, wraps it in a commit object, and slides the main label onto that hash.", "main trees")
    .then("The graph is the object store: one commit, main and HEAD on it. Click the node to inspect parents and the message.", "main")
    .then("cat-file -p HEAD prints the commit object: tree, parent list, message. The graph node is that object.", "main")
    .then("ls-files is the index. All three trees now agree. Next lessons move these labels without editing old commits.", "trees")
    .ask("What does a blob object store?", ["A file’s bytes only, with no path and no mode", "A directory listing of names and hashes", "A commit message and its parent list", "The current branch name"], 0, "Blobs are content only. The tree that points at the blob supplies the filename and mode.")
    .ask("git add does which of these?", ["Moves the branch label to a new commit", "Hashes working-tree bytes into a blob and points the index at it", "Downloads missing objects from origin", "Edits the previous commit in place"], 1, "The index is the snapshot the next commit will write. add updates that snapshot; commit is what creates the object and moves the ref.")
    .ask("Why does rewriting history produce a new commit hash?", ["Git generates a random id on every command", "The old commit is mutated and then rehashed", "Commits are immutable; Git writes a new object and moves the label", "The working tree path is part of the hash"], 2, "You never edit a commit. Amend, rebase, and reset create new objects (or only move a ref) and leave the old hash dangling until GC.")
    .ask("HEAD is usually…", ["A copy of every file in the repository", "A symbolic ref such as refs/heads/main", "The remote-tracking branch origin/main", "The packfile index"], 1, "HEAD names the current branch. Resolving it gives the commit hash that branch currently points at.")
    .pass((_snapshot, state) => {
      const id = state.refs["refs/heads/main"];
      if (!id) return false;
      const obj = state.objects[id];
      return obj?.type === "commit";
    })
    .build();
}

// --- tags ---
function tagsLesson() {
  return speak("tags", "Tags: name a commit without moving a branch")
    .after("model")
    .article("https://git-scm.com/book/en/v2/Git-Internals-Git-Objects")
    .says(`A tag is a human-readable name for a commit that does not move when you make new commits. Branches live under refs/heads/ and advance with each commit; tags live under refs/tags/ and stay fixed unless you delete or move them on purpose.

The simplest form is a lightweight tag: git tag v1.0 writes refs/tags/v1.0 whose entire value is the commit hash at HEAD. No new object is created—the ref is the tag.

Annotated tags add metadata. git tag -a v1.0 -m "first release" writes a tag object (the fourth object type) that records object, type, tag name, tagger, and message, then points refs/tags/v1.0 at that object's hash—not at the commit directly. git cat-file -p v1.0 prints the tag object; Git peels through to the commit when it needs the tree.

Real Git can GPG- or SSH-sign annotated tags and can store objects with SHA-256 hashes in sha256 repositories. This teaching VM uses fake hashes and does not sign—the same refs/tags layout and tag object fields, without cryptography.

Tags mark releases: v1.0 on main today still names that commit after v1.1 lands. Fetch and clone copy tag refs like branch refs; checking out a tag puts you in detached HEAD at the tagged commit.`)
    .learn("Contrast lightweight tags (ref → commit) with annotated tags (ref → tag object → commit).", "Create an annotated tag with git tag -a and inspect it with cat-file -p.", "Name the fields stored in a tag object.", "Explain refs/tags vs refs/heads.")
    .allow("git status", "git log", "git log --oneline", "git branch", "git tag", 'git tag -a v1.0 -m "first release"', "git cat-file", "git cat-file -p v1.0")
    .demo("git status", "git log --oneline", "git tag", 'git tag -a v1.0 -m "first release"', "git tag", "git cat-file -p v1.0")
    .from(seededLocalFromOrigin())
    .hint("Create annotated tag v1.0 on HEAD.")
    .watch("HEAD already has a commit. An annotated tag is a fourth object type; the ref in refs/tags/ points at that tag object, not directly at the commit.")
    .then("main and HEAD sit on the initial commit. No tags exist yet — refs/tags is empty.", "main")
    .then("The log is one commit. A tag will name this snapshot without moving main.", "main")
    .then("git tag with no arguments lists annotated and lightweight tags. Still none.", "main")
    .then("tag -a writes a tag object (object, type, tagger, message) and points refs/tags/v1.0 at it.", "v1.0")
    .then("The list now shows v1.0. The graph badge is the tag ref; click the commit it names.", "v1.0")
    .then("cat-file -p v1.0 prints the tag object, not the commit. Lightweight tags would print the commit instead.", "v1.0")
    .ask("A lightweight tag…", ["Creates a tag object that points at a commit", "Writes refs/tags/<name> directly at a commit hash", "Moves refs/heads/main to the tagged commit", "Requires -m for a message"], 1, "Lightweight tags are just refs under refs/tags/. Annotated tags add a tag object in between.")
    .ask("An annotated tag object stores…", ["Only a commit hash, with no metadata", "object, type, tag name, tagger, and message", "A directory listing of names and hashes", "The remote URL and fetch refspec"], 1, "The ref points at the tag object; the tag object points at the commit (or another object).")
    .ask("GPG or SSH signing on git tag -s…", ["Is required for every annotated tag", "Is a real-Git extra this lab does not simulate", "Replaces the tag object with a branch ref", "Only works on lightweight tags"], 1, "Signing attaches cryptography to the tag object. This VM uses the same fields without signing.")
    .ask("refs/tags/v1.0 vs refs/heads/main…", ["Both advance automatically on every commit", "Tags stay fixed; branch refs move with new commits", "Tags live only on the remote", "Branch refs cannot be deleted"], 1, "A branch label tracks tip growth. A tag names one commit until you move or delete the ref.")
    .pass((_snapshot, state) => {
      const id = state.refs["refs/tags/v1.0"];
      if (!id) return false;
      const obj = state.objects[id];
      return obj?.type === "tag" && obj.objectType === "commit";
    })
    .build();
}

// --- index ---
function indexLesson() {
  const startState = seededLocalFromOrigin();
  startState.worktrees[0].files["README.md"] = "# demo\nstaged later\n";

  return speak("index", "The index: staging area and DIRC cache")
    .after("tags")
    .article("https://git-scm.com/docs/git-diff")
    .says(`The index is Git’s staging area: the exact snapshot the next commit will record. On disk it is a binary cache called DIRC (Directory Index Cache). Each entry stores path, mode, blob hash, and cached stat metadata (mtime, size, inode) so git status can skip re-hashing unchanged files.

This teaching VM does not store a real DIRC file. It still models the index as path + blob + stage, which is enough for add, diff, and commit.

git diff compares the working tree to the index — what you edited but have not staged. git diff --cached (same as --staged) compares the index to HEAD — what you staged but have not committed.

git add hashes the working-tree bytes into a blob object and updates the index entry at stage 0. Until you commit, HEAD’s tree still points at the old blob. README.md in the worktree already says “staged later”; stage it and confirm with git diff --cached while HEAD stays at # demo.`)
    .learn("Name what DIRC caches (path, mode, hash, stat) and why status is fast.", "Contrast git diff (worktree vs index) with git diff --cached (index vs HEAD).", "Treat the index as the next commit’s tree, not a clipboard.", "Stage README.md and read the cached diff before committing.")
    .allow("git status", "git diff", "git diff --cached", "git diff --staged", "git add", "git add README.md", "git ls-files", "git cat-file")
    .demo("git status", "git diff", "git add README.md", "git diff --cached", "git status")
    .from(startState)
    .hint("Stage README.md so the index blob contains “staged later” while HEAD’s tree still has only # demo.")
    .watch("README.md in the worktree already differs from HEAD. Watch git diff versus git diff --cached as the index catches up.")
    .then("status: README.md is modified in the worktree. The index still matches HEAD’s blob.", "main trees")
    .then("git diff is worktree versus index. You should see the unstaged “staged later” line.", "trees")
    .then("git add hashes the worktree bytes into a blob and points the index at it. HEAD is unchanged.", "trees")
    .then("git diff --cached is index versus HEAD — the snapshot the next commit would record.", "trees")
    .then("Worktree and index agree; HEAD still has the old README. That gap is what commit would close.", "main trees")
    .ask("Real Git’s DIRC index entry caches…", ["Path, mode, blob hash, and stat info for fast status checks", "Only filenames with no blob ids", "Remote-tracking ref names", "Packfile offsets"], 0, "Stat cache lets status ask “did this file change on disk?” before hashing. The blob hash is what commit will write.")
    .ask("git diff (no flags) shows…", ["Index vs HEAD", "Worktree vs index", "Worktree vs HEAD only", "Origin vs local main"], 1, "Unstaged edits: files differ from what is staged. After git add, that path drops out of plain git diff.")
    .ask("git diff --cached compares…", ["Worktree vs index", "Index vs HEAD", "Two remote branches", "Blob vs tree objects on disk"], 1, "--staged is the same flag. It is the diff you are about to commit.")
    .ask("git add README.md…", ["Moves refs/heads/main to a new commit", "Hashes file bytes into a blob and points the index entry at it", "Edits the blob already stored in HEAD’s tree", "Copies the file into .git/objects without hashing"], 1, "Add updates the index snapshot. Commit is what writes a tree from the index and moves the branch.")
    .pass((snapshot, state) => {
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
    })
    .build();
}

// --- clone ---
function cloneLesson() {
  const { remote, tip } = originFixture();

  return speak("clone", "What git clone does")
    .after("index")
    .says(`git clone is not “download the files.” It is init, plus recording a remote, plus fetch, plus checkout. The remote named origin is a config alias whose fetch refspec copies their refs/heads/* into your refs/remotes/origin/*. After negotiation, the server streams one pack of objects you do not already have.

Clone’s first fetch has an empty have list, so you receive the reachable history of the advertised tips. Remote-tracking refs such as refs/remotes/origin/main are local sticky notes: “last time I looked, origin’s main was this commit.” They are not branches you work on.

Clone then creates a local branch, points HEAD at it, fills the index from that commit’s tree, and writes blobs out as files. After that you have a full object database and can work offline. Network is only for later fetch and push.

git clone --bare copies objects and refs only. It skips the working tree, the index, and checkout. That is the server shape: a git dir of history with no files to edit beside it.

In this lab there is no separate git clone verb. The origin remote is already attached, empty of local commits. Fetch origin, then check out main so Git can create refs/heads/main from origin/main, materialize README.md, and stage it in the index. That is the checkout half of clone.`)
    .learn("Unpack clone as init + remote + fetch + checkout.", "Treat origin/main as a local remote-tracking ref, not a second working copy.", "Fetch objects from origin and create local main so the worktree matches the tip.", "Confirm the index and files were filled from the commit’s tree.")
    .allow("git status", "git log", "git log --oneline", "git fetch", "git fetch origin", "git clone --bare", "git clone --bare origin", "git checkout", "git checkout main", "git checkout -b main", "git switch", "git switch main", "git branch", "git ls-files", "git cat-file", "git remote")
    .demo("git status", "git fetch origin", "git checkout main", "git log --oneline", "git ls-files", "git status")
    .from((() => {
      const state = emptyState();
      state.remotes.origin = remote;
      return state;
    })())
    .hint("Fetch origin, then check out main so HEAD, the index, and README.md all match origin’s tip.")
    .watch("This lab starts with origin attached and no local commits. Clone is fetch plus checkout — watch origin/main appear, then main.")
    .then("The graph is empty — no local commits. origin is a named object store; nothing has been fetched yet.", "trees")
    .then("fetch copies objects (pack flash) and writes origin/main. Worktree and local main stay empty — watch the three trees.", "origin/main trees")
    .then("checkout main creates refs/heads/main from origin/main, fills the index, and writes files. That is clone’s checkout half.", "main trees")
    .then("Local main and origin/main sit on the same commit. Click it: that object arrived in the pack.", "main")
    .then("ls-files shows the index filled from the commit’s tree — not a folder copy.", "trees")
    .then("Clean status: worktree, index, and HEAD match. origin/main remains a sticky note, not a second checkout.", "origin/main trees")
    .ask("Which sequence is clone?", ["checkout, then fetch, then init", "init + remote add + fetch + checkout", "merge origin/main into an empty index", "copy the working tree over SSH without objects"], 1, "Clone writes a .git, records origin’s refspec, fetches a pack, then checks out the default branch into index and files.")
    .ask("refs/remotes/origin/main is…", ["A branch you should commit on directly", "A file on the origin server that Git edits remotely", "A local ref remembering origin’s last advertised main", "The same object as HEAD after every command"], 2, "Remote-tracking refs live in your repo. Fetch updates them; your working branch only moves when you merge, rebase, or reset.")
    .ask("After a normal clone, why can you work offline?", ["Git stores only the latest snapshot and re-downloads history later", "The object database, remote-tracking refs, local branch, index, and worktree are already local", "The index is a complete backup of origin", "HEAD contains the packfile"], 1, "Clone copies objects, not only files. Later network is fetch/push, not a requirement to git log or commit.")
    .ask("The + in +refs/heads/*:refs/remotes/origin/* means…", ["Create a merge commit on every fetch", "Update the destination even if the update is not a fast-forward", "Fetch tags only", "Delete local branches that origin deleted"], 1, "The plus forces the ref update. Fetch is allowed to rewind a remote-tracking ref when origin rewrote that branch.")
    .ask("git clone --bare copies…", ["Objects and refs only: no worktree, index, or checkout", "A full checkout plus a second origin remote", "Only the latest snapshot files, without objects", "The index and worktree, skipping the object database"], 0, "A bare clone is a git dir of objects and refs. There is no working tree to edit and no index to stage.")
    .pass((snapshot, state) => {
      const local = state.refs["refs/heads/main"];
      const tracking = state.refs["refs/remotes/origin/main"];
      return (
        snapshot.head === tip &&
        local === tip &&
        tracking === tip &&
        snapshot.files["README.md"] === "# demo\n"
      );
    })
    .build();
}

// --- packs ---
function packsLesson() {
  const startState = seededLocalFromOrigin();
  const localTip = startState.refs["refs/heads/main"]!;
  commitOnRemote(startState, "origin", "upstream docs", {
    "README.md": "# demo\n",
    "NOTES.md": "from origin\n",
  });
  const remoteTip = startState.remotes.origin.refs["refs/heads/main"]!;

  return speak("packs", "Packfiles: loose objects and fetch transport")
    .after("clone")
    .article("https://git-scm.com/book/en/v2/Git-Internals-Packfiles")
    .says(`Fresh objects start loose: one zlib-compressed file per hash under .git/objects. Over time git gc packs them into a packfile (.pack) — a single stream of deltified, compressed objects — plus a pack index (.idx) that maps object id to byte offset so lookups stay fast without scanning the whole pack.

git fetch and git clone negotiate have and want, then the server streams one pack of objects you do not already store. Your client unpacks it into the object database (or appends a new .pack on disk). Remote-tracking refs move after the objects land; your branch and worktree are unchanged.

Real Git adds multi-pack indexes (MIDX) when many packfiles exist, and reachability bitmaps so the server can answer “what do they already have?” without walking the whole graph every time. Those are performance layers on the same pack transport.

This teaching VM flashes pack-arrival when objects arrive from a remote, but it keeps every object in an in-memory map — no .pack, no .idx, no zlib. The flash is the wire moment; the lesson is the shape of real storage.

Your sandbox matches fetch setup: local main sits on the initial README commit while origin’s main has walked forward with NOTES.md. Run git fetch origin, inspect origin/main with log and cat-file, and confirm the new commit’s objects landed while local main stayed put.`)
    .learn("Contrast loose objects with packfile + .idx on-disk layout.", "Describe fetch as pack negotiation followed by unpacking new objects.", "Name MIDX and reachability bitmaps as real-Git speedups on top of packs.", "Recognize that this lab flashes pack-arrival but stores objects in memory.")
    .allow("git status", "git log", "git log --oneline", "git fetch", "git fetch origin", "git branch", "git cat-file", "git cat-file -p", "git ls-files")
    .demo("git status", "git log --oneline", "git fetch origin", "git log --oneline origin/main", "git cat-file -p origin/main")
    .from(startState)
    .hint("Run git fetch origin. New objects should land (pack flash) and origin/main should advance while local main stays behind.")
    .watch("Local main is behind origin’s server. Fetch streams a pack of missing objects and moves only origin/main.")
    .then("main and origin/main still share one commit. The extra NOTES.md commit lives only on the remote so far.", "main")
    .then("Local log is the README commit. origin/main has not moved on this graph yet.", "main")
    .then("fetch copies the missing objects (pack flash) and slides origin/main. Local main and files stay put.", "origin/main")
    .then("log origin/main shows the new tip. That history arrived as a pack; it is not a second checkout.", "origin/main")
    .then("cat-file prints the remote commit object now stored locally. Real Git would have written a .pack and .idx.", "origin/main")
    .ask("Loose objects vs a packfile — which is true?", ["Loose stores one file per hash; a pack bundles many objects in one compressed stream", "Packs are only for tags; commits stay loose forever", "Loose objects are never zlib-compressed", "A pack replaces refs so objects need no hashes"], 0, "Loose is .git/objects/xx/yyyy…. gc and fetch append .pack files; the idx maps id → offset inside that stream.")
    .ask("The .idx beside a .pack file…", ["Stores every filename in the working tree", "Is an index from object hash to byte offset in the pack", "Is the same file as MIDX on all repos", "Only lists refs/heads/*"], 1, "Without an idx, finding one object would mean scanning the pack. The idx makes random access cheap.")
    .ask("A multi-pack index (MIDX) helps when…", ["You have many packfiles and want one lookup table across them", "HEAD is detached", "The worktree has merge conflicts", "You never run git fetch"], 0, "MIDX sits above several .idx files so object lookup does not devolve into “try every pack.”")
    .ask("Reachability bitmaps mainly speed up…", ["Editing commit messages in the index", "Pack negotiation: knowing what the client already has", "Renaming branches in .git/packed-refs", "Writing loose blobs during git add"], 1, "Bitmaps precompute reachability from refs so have/want sets are cheaper on large repos.")
    .ask("In this Git Lab sandbox, after fetch…", ["Objects are appended to a real on-disk .pack with zlib", "A pack-arrival flash plays but objects live in an in-memory map", "No new objects are stored until you merge", "The idx file is written beside each blob"], 1, "The VM models the network moment honestly: you see the flash, but storage is a teaching map, not .git/objects/pack.")
    .pass((_snapshot, state) => {
      const tracking = state.refs["refs/remotes/origin/main"];
      return (
        tracking === remoteTip &&
        state.objects[tracking] !== undefined &&
        state.refs["refs/heads/main"] === localTip &&
        localTip !== tracking
      );
    })
    .build();
}

// --- reftable ---
function reftableLesson() {
  const startState = seededLocalFromOrigin();

  return speak("reftable", "Refs storage: files, packed-refs, and reftable")
    .after("packs")
    .article("https://git-scm.com/docs/reftable")
    .says(`A ref is a name → commit hash mapping. Branches live under refs/heads/, tags under refs/tags/, remotes under refs/remotes/. HEAD is usually symbolic: it points at a branch ref, not a hash directly.

For decades Git stored each ref as its own file under .git/refs/. Many refs meant many tiny files — slow on Windows (case-insensitive paths) and awkward at scale. Git also wrote packed-refs: one file listing ref names and hashes for refs that are not loose files anymore.

Git 3.0 makes reftable the default backend: a compact append-only log of ref updates in one table, with better performance for huge ref counts and safer handling on case-insensitive filesystems. The on-disk shape changed; the names you type (main, feature/UI, v1.0) did not.

This teaching VM keeps refs in a plain map (ref name → object id). You still practice the same commands. Create a nested branch name and a lightweight tag so you see refs/heads/ and refs/tags/ as separate namespaces. git tag without -a stores the commit hash directly; -a would create a tag object instead.`)
    .learn("Contrast loose ref files plus packed-refs with the reftable backend.", "Name the refs/heads/ and refs/tags/ prefixes for branches and tags.", "Create a nested branch ref (feature/UI) at the current commit.", "Add a lightweight tag (v1.0) that points at a commit, not a tag object.")
    .allow("git status", "git log", "git log --oneline", "git branch", "git branch feature/UI", "git tag", "git tag v1.0", "git switch", "git switch main")
    .demo("git status", "git branch", "git branch feature/UI", "git tag v1.0", "git branch", "git tag")
    .from(startState)
    .hint("Create branch feature/UI and lightweight tag v1.0 at HEAD. List both with git branch and git tag.")
    .watch("Refs are names in namespaces. Practice heads versus tags; real Git 3.0 stores them in reftable instead of one file per ref.")
    .then("You are on main with one commit. refs/heads/main is the only branch name so far.", "main")
    .then("git branch lists local heads. The files backend would be .git/refs/heads/main on disk.", "main")
    .then("feature/UI is a nested name under refs/heads. Same commit as main until you add commits.", "feature/UI")
    .then("Lightweight git tag v1.0 writes refs/tags/v1.0 pointing at the commit — no tag object.", "v1.0")
    .then("Two heads now: main and feature/UI. Reftable would log both updates in one table.", "feature/UI")
    .then("git tag lists v1.0. heads and tags are different namespaces even when they name the same hash.", "v1.0")
    .ask("Classic loose refs vs reftable…", ["Loose refs are one file per ref; reftable is one compact update log", "Reftable stores blobs; loose refs store commits only", "Loose refs are only for tags", "They differ only in how packfiles are named"], 0, "Files backend sprawl under .git/refs/. Reftable batches ref updates into a single table — better at scale and on Windows.")
    .ask("packed-refs is…", ["A second remote named packed", "One file listing ref names and hashes for refs not kept as loose files", "The index after git add", "A tag object created by git tag -a"], 1, "pack-refs (or gc) can fold many loose refs into packed-refs. Lookups check loose files first, then the packed file.")
    .ask("Git 3.0 defaults to reftable because…", ["Tags no longer exist", "Huge ref counts and case-insensitive filesystems need a better backend", "Commits are stored in refs/heads/", "fetch requires reftable"], 1, "Reftable scales when you have many refs (CI branches, forks) and avoids path collisions on case-insensitive disks.")
    .ask("refs/heads/feature/UI vs refs/tags/v1.0…", ["Both are branch refs that move on every commit", "heads/ is for branches; tags/ is for labels (lightweight or annotated)", "tags/ is only for remote-tracking refs", "heads/ stores trees; tags/ stores blobs"], 1, "Branch refs move when you commit. Tag refs are meant to stay put; lightweight tags point straight at a commit hash.")
    .pass((_snapshot, state) => {
      const branchRef = state.refs["refs/heads/feature/UI"];
      const tagRef = state.refs["refs/tags/v1.0"];
      return (
        Boolean(branchRef) &&
        Boolean(tagRef) &&
        state.objects[tagRef]?.type === "commit"
      );
    })
    .build();
}

// --- fetch ---
function fetchLesson() {
  const startState = seededLocalFromOrigin();
  const localTip = startState.refs["refs/heads/main"]!;
  commitOnRemote(startState, "origin", "upstream docs", {
    "README.md": "# demo\n",
    "NOTES.md": "from origin\n",
  });
  const remoteTip = startState.remotes.origin.refs["refs/heads/main"]!;

  return speak("fetch", "git fetch: download, do not integrate")
    .after("reftable")
    .says(`git fetch is the same network step as clone, without moving your branch or touching your files. The client now sends have for objects it already stores, so the pack is only new history. Git then updates refs/remotes/origin/*. Your refs/heads/main does not move.

git status may say you are behind origin/main because it compares two labels. After fetch, local main can sit one commit behind origin/main. The next move is git merge origin/main, not pull yet. Inspect with git log HEAD..origin/main for commits they have and you do not.

Fetch is always safe: it only grows the object database and moves remote-tracking refs. Integration waits for the merge chapter.

Your sandbox starts cloned at the initial README commit. Origin’s main has walked forward to a commit that adds NOTES.md. Fetch so origin/main matches that tip while README.md in the worktree stays # demo and local main stays put.`)
    .learn("Describe fetch as pack negotiation plus updating remote-tracking refs.", "Show that worktree, index, and refs/heads/main are unchanged after fetch.", "Read behind/ahead as a comparison of two ref names.", "Leave integration for merge (and later pull).")
    .allow("git status", "git log", "git log --oneline", "git fetch", "git fetch origin", "git branch", "git cat-file", "git ls-files")
    .demo("git status", "git log --oneline", "git fetch origin", "git log --oneline", "git status")
    .from(startState)
    .hint("Run git fetch origin. Local main and README.md must stay put; origin/main should advance.")
    .watch("Origin’s main has moved on the server. Until you fetch, origin/main still sits on the same commit as main. Fetch slides only that badge — files stay put.")
    .then("main and origin/main share one commit. Origin has a newer tip on the server — it is not on this graph yet.", "main")
    .then("Terminal log is this one commit. origin/main’s badge has not moved; fetch will slide it onto a new node.", "main")
    .then("fetch streams a pack and slides origin/main forward. README.md in the worktree must not change.", "origin/main trees")
    .then("Terminal log still starts at local main. Click origin/main’s node — it is in the object store, just not checked out.", "origin/main")
    .then("status stays clean on the old snapshot. Fetch never merges. Pull is the next lesson.", "trees")
    .ask("What does git fetch change?", ["HEAD, the index, and the worktree", "Only objects plus refs/remotes/origin/* (and similar tracking refs)", "refs/heads/main to match origin", "The remote server’s branches"], 1, "Fetch never checks out. Integration is a later merge or rebase of those tracking refs.")
    .ask("git status says you are behind origin/main. Why?", ["The worktree files are older than the index", "It compares refs/heads/main with refs/remotes/origin/main", "The packfile failed to unpack NOTES.md", "HEAD is detached"], 1, "Behind/ahead is two labels. Your files can be clean and still be behind the tracking ref.")
    .ask("Why is fetch always safe relative to pull?", ["It cannot download a rewritten branch", "It never mutates the current branch, index, or worktree", "It fast-forwards main automatically", "It deletes local commits that origin does not have"], 1, "Pull integrates into the current branch and can conflict. Fetch only grows storage and moves sticky notes.")
    .ask("After fetch, git log HEAD..origin/main shows…", ["Commits you have that they do not", "Commits they have that you do not", "Every commit in the packfile", "Only merge commits"], 1, "A..B is reachable from B but not A. Swap the ends for the opposite set.")
    .pass((snapshot, state) => {
      return (
        state.refs["refs/remotes/origin/main"] === remoteTip &&
        state.refs["refs/heads/main"] === localTip &&
        snapshot.files["README.md"] === "# demo\n" &&
        snapshot.files["NOTES.md"] === undefined
      );
    })
    .build();
}

// --- merge ---
function mergeLesson() {
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

  return speak("merge", "Merge, and what a conflict is")
    .after("fetch")
    .article("https://www.themoderncoder.com/git-merge/")
    .says(`Merge is how Git combines two tips. It finds the merge base (best common ancestor). If main is an ancestor of the named commit, Git fast-forwards: it only moves the main label. If both sides moved, Git does a three-way merge of the base tree, ours (HEAD), and theirs, then writes a merge commit with two parents.

git merge --no-ff always makes that bubble; GitFlow relies on it. git merge --abort restores the pre-merge state.

When both sides changed the same region, Git cannot pick a tree. The index changes shape. A normal file is stage 0 (one blob). A conflicted path becomes three unmerged stages: 1 base, 2 ours, 3 theirs.

The working-tree file gets conflict markers. git add of the resolved bytes is the resolution: stages 1/2/3 collapse to stage 0 and a new blob. Editing without add leaves the path unmerged. Then you commit the merge; do not skip that commit.

A second failure mode never enters markers: uncommitted local edits that would be overwritten. Git refuses to start. Commit or stash first. The same stage-1/2/3 machinery comes back for cherry-pick, rebase, and stash pop.

Your graph already diverged: main added NOTES.md, feature added app.ts from the same initial commit. Merge feature to get a two-parent commit.`)
    .learn("Distinguish fast-forward from a two-parent merge commit.", "Name index stages 1, 2, and 3 during a content conflict.", "Treat git add as the signal that a conflict is resolved.", "Merge feature into main so HEAD is a merge commit.")
    .allow("git status", "git log", "git log --oneline", "git merge", "git merge feature", "git merge --no-ff", "git merge --no-ff feature", "git merge --abort", "git add", "git add README.md", "git commit", "git ls-files", "git ls-files -u", "git branch", "git switch", "git checkout", "git checkout --ours", "git checkout --theirs", "git checkout --ours -- README.md", "git checkout --theirs -- README.md", "edit", "edit README.md")
    .demo("git status", "git log --oneline", "git branch", "git merge feature", "git ls-files -u", "git checkout --theirs -- README.md", "git add README.md", "git commit", "git log --oneline", "git status")
    .from(startState)
    .hint("On main, merge feature so HEAD is a commit with two parents (NOTES.md and app.ts together).")
    .watch("feature overlaps README.md with main. Conflict stages 1/2/3 appear in Index Stages, not on the DAG. After you resolve, watch the graph grow a two-parent bubble.")
    .then("You are on main. feature is the other tip you will merge.", "main")
    .then("Terminal log walks HEAD only. The graph still shows feature’s tip on the other line.", "main")
    .then("Two branch labels, two lines of work. Click each tip before merging.", "feature")
    .then("Overlapping README.md → conflict. Stages 1/2/3 open in Index Stages — the DAG still has two tips, no merge bubble.", "feature")
    .then("ls-files -u lists the unmerged stages. The graph still has two tips; HEAD did not move.")
    .then("checkout --theirs writes stage 3 into the worktree but does not collapse the index. Add is what resolves.", "trees")
    .then("git add drops stages 1/2/3 to stage 0. The next commit can be the merge.", "trees")
    .then("The merge commit has two parents. Click it: that is the join, not a fast-forward.", "main")
    .then("Log now includes both lines. The bubble is the merge commit.", "main")
    .then("Clean tree. Stages are gone. You kept theirs by adding it.", "trees")
    .ask("When both branches moved, a successful merge writes…", ["No new object; it copies files from feature", "A commit with two parents whose tree is the merge result", "Three new blobs and deletes the merge base", "A fast-forward even if main is not an ancestor"], 1, "The merge commit’s first parent is HEAD, second is the named tip. Fast-forward happens only when HEAD is already an ancestor.")
    .ask("In a conflict, index stage 2 is…", ["The merge base", "Ours (HEAD)", "Theirs (the branch you named)", "The resolved file"], 1, "Stage 1 is base, 2 is ours, 3 is theirs. git ls-files -u lists all three until git add collapses them to stage 0.")
    .ask("You deleted the conflict markers but git status still says unmerged. Why?", ["You must git merge --continue", "The blob hash cannot change until you push", "git add is the resolution; without it stages 1/2/3 remain", "You need git reset --hard"], 2, "Editing the worktree is not enough. add writes a new blob and replaces the unmerged stages.")
    .ask("Your local changes would be overwritten by merge. What happened?", ["You are in a content conflict with markers in the file", "Git aborted before starting; commit or stash, then merge again", "The index already has stages 1, 2, and 3", "HEAD detached and Git fast-forwarded"], 1, "Dirty-worktree abort is not a conflict. Git refuses to clobber uncommitted bytes.")
    .pass((snapshot, state) => {
      if (!snapshot.head) return false;
      const obj = state.objects[snapshot.head];
      return obj?.type === "commit" && obj.parents.length === 2;
    })
    .build();
}

// --- rerere ---
function rerereLesson() {
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

  return speak("rerere", "rerere: remember conflict resolutions")
    .after("merge")
    .article("https://git-scm.com/docs/git-rerere")
    .says(`Conflict markers show two sides. merge.conflictstyle merge prints <<<<<<< HEAD, =======, and >>>>>>> label. diff3 and zdiff3 add a ||||||| base section with the merge-base text so you see what both sides changed from.

rerere (reuse recorded resolution) stores your resolution when rerere.enabled is true. On git add of a resolved path during a merge, Git keys the worktree bytes by ours\\0theirs (stage-2 and stage-3 blob contents) and saves them in the rerere cache. A later merge of the same pair auto-applies that blob: no stages 1/2/3, no markers, and the merge can finish immediately.

git merge --abort restores HEAD and clears MERGE_HEAD, but it does not wipe rerere’s recorded resolutions. That is why aborting a practice merge and merging again can auto-complete.

This teaching VM accepts git config merge.conflictstyle diff3 and git config rerere.enabled true. Real repos also use git rerere status, git rerere diff, and git rerere clear; AI-assisted merge tools are optional extras not exercised here.

Enable rerere, merge feature, resolve README.md once, abort, then merge feature again so rerere replays your resolution into a two-parent commit.`)
    .learn("Contrast merge conflictstyle with diff3/zdiff3 (the ||||||| base section).", "Explain how rerere keys resolutions by ours and theirs blob bytes.", "See that merge --abort keeps the rerere cache.", "Finish the second merge without manual conflict stages.")
    .allow("git config", "git config rerere.enabled true", "git config merge.conflictstyle diff3", "git merge", "git merge feature", "git merge --abort", "git ls-files -u", "git checkout --theirs -- README.md", "git add README.md", "git status", "git log")
    .demo("git config rerere.enabled true", "git status", "git merge feature", "git ls-files -u", "git checkout --theirs -- README.md", "git add README.md", "git merge --abort", "git merge feature", "git status")
    .from(startState)
    .hint("Enable rerere, record a README resolution, abort, then merge feature again so HEAD is a two-parent commit with a clean README.")
    .watch("Same README conflict as merge. Enable rerere, record a resolution, abort, then merge again and watch it replay.")
    .then("rerere.enabled is now true. The cache is empty until you git add a resolved conflict.", "main")
    .then("On main, feature’s README diverged. Merge will conflict the same way as the previous lesson.", "main")
    .then("Conflict: stages 1/2/3 in the index. Worktree has markers. This is the recording input.", "main trees")
    .then("ls-files -u lists base, ours, and theirs. rerere will key the two sides, not the markers.", "trees")
    .then("checkout --theirs fills README with feature’s bytes. Still unmerged until add.", "trees")
    .then("git add records ours versus theirs → this blob in the rerere cache, and collapses stages to 0.", "trees")
    .then("merge --abort restores the worktree. The recorded resolution stays in the cache.", "main")
    .then("Second merge hits the same sides, reapplies the cache, and writes the merge commit automatically.", "main")
    .then("Clean tree, two-parent tip, no markers. That is reuse of a recorded resolution.", "main trees")
    .ask("With rerere.enabled, git add on a resolved conflict…", ["Deletes stages 1/2/3 but stores nothing", "Records ours\\0theirs → resolved bytes in the rerere cache", "Only works after git commit", "Requires merge.conflictstyle zdiff3"], 1, "add collapses unmerged stages and, when rerere is on, saves the resolution keyed by the stage-2 and stage-3 blob contents.")
    .ask("You resolved a conflict, then git merge --abort. The rerere cache…", ["Is wiped with MERGE_HEAD", "Keeps the recorded resolution for the same ours/theirs pair", "Moves entries into the stash", "Only survives if you git commit first"], 1, "abort restores the pre-merge tree and index; rerere recordings live outside that rollback.")
    .ask("In diff3 conflict markers, ||||||| base shows…", ["Theirs (the branch you merged)", "Ours (HEAD)", "The merge-base version both sides diverged from", "The resolved file you will commit"], 2, "diff3 and zdiff3 insert the ancestor text between ours and theirs so you can see what each side changed.")
    .ask("merge.conflictstyle zdiff3 differs from diff3 because…", ["zdiff3 omits the ||||||| section entirely", "zdiff3 moves the base section adjacent to the conflicting hunk (diff3 places it between ours and theirs)", "zdiff3 disables rerere", "zdiff3 uses only two index stages"], 1, "Both styles expose the base; zdiff3 rearranges where the ancestor block appears in the marker layout.")
    .pass((snapshot, state) => {
      if (!snapshot.head) return false;
      const obj = state.objects[snapshot.head];
      if (obj?.type !== "commit" || obj.parents.length !== 2) return false;
      if (!state.rerereEnabled) return false;
      const readme = snapshot.files["README.md"] ?? "";
      return !readme.includes("<<<<<<<");
    })
    .build();
}

// --- pull ---
function pullLesson() {
  const startState = seededLocalFromOrigin();
  const behind = startState.refs["refs/heads/main"]!;
  commitOnRemote(startState, "origin", "origin moved", {
    "README.md": "# demo\n",
    "NOTES.md": "pulled from origin\n",
  });
  const remoteTip = startState.remotes.origin.refs["refs/heads/main"]!;

  return speak("pull", "git pull: fetch then merge")
    .after("rerere")
    .says(`git pull is fetch, then integrate into the current branch. Fetch still downloads missing objects and updates remote-tracking refs. Pull then merges (historically git merge FETCH_HEAD). The working tree and index can change.

Pull can fast-forward, write a merge commit, or conflict. Fetch alone cannot.

git pull --ff-only integrates only if the result is a fast-forward; otherwise it aborts. git pull --rebase rebases local commits instead (you will unpack that after rebase). From Git 2.27 a pull without a configured policy warns.

Practical rule: fetch, look, then merge. Pull is fine on a clean branch when you accept the default policy.

This sandbox is a clean clone whose origin/main has one extra commit (NOTES.md). Local main still points at the initial README. Pull --ff-only so local main, origin/main, and the worktree all meet at that tip.`)
    .learn("Define pull as fetch plus integrate-into-current-branch.", "Contrast pull’s mutation of worktree/index with fetch’s safety.", "Use --ff-only when you want merge only if it is a fast-forward.", "Bring local main even with origin after a fast-forward pull.")
    .allow("git status", "git log", "git log --oneline", "git fetch", "git fetch origin", "git pull", "git pull --ff-only", "git merge", "git merge origin/main")
    .demo("git status", "git fetch origin", "git log --oneline", "git pull --ff-only", "git log --oneline", "git status")
    .from(startState)
    .hint("Fast-forward main to origin’s tip so NOTES.md appears and local main matches origin/main.")
    .watch("Pull is fetch plus integrate. First watch origin/main jump, then watch main fast-forward onto it.")
    .then("Local main and origin/main still share one commit. Origin’s server is ahead; files still match the old HEAD.", "main trees")
    .then("fetch only. origin/main moves; main and the worktree stay. Pack flash is new objects.", "origin/main trees")
    .then("Terminal log still starts at local main. The graph already shows origin/main on the extra commit — two labels, one checkout.", "main")
    .then("pull --ff-only slides main to origin/main and updates index + files. No merge commit.", "main trees")
    .then("HEAD’s log now includes “origin moved” (the commit that added NOTES.md). main and origin/main agree.", "origin/main")
    .then("Clean status. Fast-forward is just moving a pointer.", "trees")
    .ask("After git fetch, what has pull not done yet?", ["Download missing objects", "Update refs/remotes/origin/main", "Move refs/heads/main and update the worktree", "Record FETCH_HEAD"], 2, "Fetch stops at tracking refs. Pull’s second half is the merge or rebase into HEAD.")
    .ask("git pull --ff-only fails when…", ["Origin has any new commit", "The integration would not be a fast-forward", "The worktree is clean", "You have never set pull.rebase"], 1, "--ff-only refuses a merge commit. Diverged local commits need an explicit merge, rebase, or reset.")
    .ask("Which statement is true?", ["Pull never conflicts because fetch already merged", "Pull can merge-commit or conflict; fetch cannot", "Pull updates only remote-tracking refs", "Pull and fetch are identical on a dirty worktree"], 1, "The extra integrate step is why pull is the dangerous one-liner and fetch is the safe habit.")
    .ask("git pull --rebase is…", ["fetch, then rebase local commits onto the updated tracking branch", "rebase origin onto your worktree without fetching", "the same as git reset --hard origin/main", "a fast-forward of origin"], 0, "Same fetch; different second half. You will treat rebase as cherry-pick in a loop two chapters from now.")
    .pass((snapshot, state) => {
      return (
        state.refs["refs/heads/main"] === remoteTip &&
        state.refs["refs/remotes/origin/main"] === remoteTip &&
        snapshot.head !== behind &&
        snapshot.files["NOTES.md"] === "pulled from origin\n"
      );
    })
    .build();
}

// --- fork ---
function forkLesson() {
  const startState = seededLocalFromOrigin();
  attachUpstreamCopy(startState);
  commitOnRemote(startState, "upstream", "maintainers moved", {
    "README.md": "# demo\n",
    "UPSTREAM.md": "from upstream\n",
  });
  const upstreamTip = startState.remotes.upstream.refs["refs/heads/main"]!;

  return speak("fork", "Fork: a second remote, not a Git command")
    .after("pull")
    .says(`There is no git fork. The host copies the repository into your namespace so you can push. git clone of that copy is origin: the remote you push.

The original project is a second remote, conventionally upstream, that you fetch and merge (or later rebase). A pull request is a hosting-site request that they pull your branch into their repo.

A fork is clone, remotes, fetch, and merge, twice. Syncing local main is fetch upstream, switch main, merge (this VM fast-forwards when main is an ancestor), then push origin. Feature work happens on a branch you push to origin, not on upstream.

This sandbox is already cloned from your origin. upstream is attached and one commit ahead (UPSTREAM.md). Fetch upstream and merge upstream/main so local main matches the maintainers. origin/main stays where you last pushed: that lag is the reminder to push after you sync.`)
    .learn("Explain fork as a hosting-site clone plus a local clone of that fork.", "Keep origin (push) and upstream (read-mostly) as two remotes.", "Sync main with fetch + merge of upstream/main.", "Leave origin/main unchanged until a later push.")
    .allow("git status", "git log", "git log --oneline", "git remote", "git remote add", "git fetch", "git fetch upstream", "git fetch origin", "git merge", "git merge upstream/main", "git switch", "git checkout", "git branch")
    .demo("git status", "git fetch upstream", "git merge upstream/main", "git log --oneline", "git status")
    .from(startState)
    .hint("Fetch upstream and merge upstream/main so local main matches the maintainers’ tip.")
    .watch("origin is your clone; upstream is the maintainers. Fetch upstream, then merge their main into yours.")
    .then("Three names: main (yours), origin/main, upstream/main. You are behind upstream.", "main")
    .then("fetch upstream updates only refs/remotes/upstream/main. Your checkout does not move.", "upstream/main")
    .then("merge upstream/main fast-forwards local main. That is “sync the fork.”", "main trees")
    .then("Your main now matches the maintainers’ tip. Click the new HEAD.", "main")
    .then("Worktree matches. origin/main may still lag until you push — not in this lab.", "trees")
    .ask("git fork…", ["is the command that copies a GitHub repo into your account", "does not exist; the host copies the repo, then you clone and add remotes", "is an alias for git clone --mirror", "creates refs/remotes/upstream/* without a network"], 1, "Fork is a product feature. Git only knows remotes, fetch, and merge.")
    .ask("In the usual layout, origin is…", ["The original project you cannot push to", "Your fork: the remote you push", "Always the same URL as upstream", "A remote-tracking branch, not a remote"], 1, "You clone your fork (origin). You add the original as upstream and fetch it.")
    .ask("Syncing local main with maintainers is…", ["git push upstream main", "fetch upstream, then merge (or rebase) upstream/main", "git clone upstream", "deleting origin/main"], 1, "Same fetch-then-integrate pattern as pull, aimed at a second remote.")
    .ask("After merging upstream/main, origin/main still lags. That means…", ["Fetch failed", "Your fork on the host does not have the sync until you push origin", "HEAD is detached", "upstream and origin cannot differ"], 1, "Local main moved. The origin remote-tracking ref moves on fetch/push of origin, not on an upstream merge.")
    .pass((snapshot, state) => {
      return (
        state.refs["refs/heads/main"] === upstreamTip &&
        state.refs["refs/remotes/upstream/main"] === upstreamTip &&
        snapshot.files["UPSTREAM.md"] === "from upstream\n"
      );
    })
    .build();
}

// --- amend ---
function amendLesson() {
  const startState = seededLocalFromOrigin();
  const originalTip = mainTip(startState);
  startState.worktrees[0].files["extra.md"] = "forgot this\n";

  return speak("amend", "Amend: the smallest rewrite")
    .after("fork")
    .article("https://www.themoderncoder.com/rewriting-git-history/")
    .says(`Amend writes a new commit with the same parent(s) and moves the branch label. Objects never change; labels move. The long way is git reset HEAD~1 (uncommit, keep the index) then re-stage and commit. Amend is that in one step.

Take the current index (stage forgotten files first). Git writes a new tree, then a new commit with the same parent(s) as HEAD, and moves the branch to the new hash. The old commit is dangling and still in the reflog.

--no-edit keeps the message. --amend on a merge commit keeps both parents. Author stays by default; the committer becomes you now.

Do not amend a commit you already pushed unless you will force-push a private branch. extra.md is sitting untracked in the worktree: the classic forgotten file. Add it and git commit --amend --no-edit so HEAD is a new id whose tree contains extra.md, while the initial commit object remains in the database.`)
    .learn("State that amend writes a new commit with the same parent(s) and moves the branch.", "Stage forgotten files before amending so they enter the new tree.", "Find the old hash still stored (and listed in reflog).", "Avoid amending published commits on shared branches.")
    .allow("git status", "git log", "git log --oneline", "git add", "git add extra.md", "git add .", "git commit", "git commit --amend", "git commit --amend --no-edit", "git reflog", "git cat-file", "git ls-files")
    .demo("git status", "git add extra.md", "git commit --amend --no-edit", "git log --oneline", "git reflog", "git status")
    .from(startState)
    .hint("Add extra.md and amend the last commit (keep the message) so HEAD is a new hash that contains extra.md.")
    .watch("Amend never edits a commit. It writes a new object and moves main; the old hash stays in the graph — here origin/main still names it.")
    .then("HEAD is a commit that forgot extra.md. extra.md sits only in the worktree.", "main trees")
    .then("add stages extra.md. The current commit object is unchanged.", "trees")
    .then("amend --no-edit builds a new commit with the same message. main hops to the new hash; origin/main still sits on the old object.", "main")
    .then("Log shows one tip with a new id. Click both nodes: old parent list vs new tree.", "main")
    .then("reflog still names the old hash. Rewriting is moving labels, not mutating objects.")
    .then("Clean status. Highlight main to dim origin/main’s commit — it is not dangling while that ref still points at it.", "main trees")
    .ask("After a successful amend, the original commit…", ["Is overwritten in place with a new tree", "Is gone from disk immediately", "Still exists as an object; the branch now points at a new id", "Has its message field mutated"], 2, "Immutability: new tree, new commit, moved label. reflog still names the old hash.")
    .ask("The new commit’s parent is…", ["The commit you amended", "The same parent(s) the old HEAD had", "Always empty (it becomes a root)", "origin/main"], 1, "Amend is a one-commit rebase onto the same parent. The amended commit is not a parent of its replacement.")
    .ask("You forgot extra.md in the last commit. The fix is…", ["git add extra.md && git commit --amend --no-edit", "git merge extra.md", "git fetch extra.md", "edit the old commit object in .git/objects"], 0, "Amend uses the index. Forgotten files must be staged or they will not enter the new tree.")
    .ask("When is amending dangerous?", ["On any local unpushed commit", "On a commit other people already based work on, unless the team agreed to force-push", "Whenever the message stays the same", "Only if the tree did not change"], 1, "Private unpushed commits are fair game. Shared history needs a new commit (or an agreed rewrite).")
    .pass((snapshot, state) => {
      if (!snapshot.head || snapshot.head === originalTip) return false;
      const obj = state.objects[snapshot.head];
      if (!obj || obj.type !== "commit") return false;
      const old = state.objects[originalTip];
      return (
        old?.type === "commit" &&
        obj.parents.length === old.parents.length &&
        treeHas(state, snapshot.head, "extra.md")
      );
    })
    .build();
}

// --- reset ---
function resetLesson() {
  const startState = seededLocalFromOrigin();
  const initial = mainTip(startState);
  commitOnBranch(startState, "main", "wip notes", {
    "README.md": "# demo\n",
    "NOTES.md": "scratch\n",
  });

  return speak("reset", "Reset and reflog: move the label on purpose")
    .after("amend")
    .says(`git reset moves the branch to any commit, and optionally drags the index and working tree with it. --soft moves HEAD only (index and files unchanged: uncommit, keep everything staged). --mixed, the default, moves HEAD and makes the index match the target (file edits remain).

--hard moves HEAD, index, and files. You need this before rebase (rebase resets, then replays) and before you trust --hard.

--hard is recoverable only while the old HEAD is in the reflog: git reflog, then git reset --hard HEAD@{1}. Reflog is a local ledger of every HEAD movement. It is not pushed, so another clone cannot save you. After a panic reset, look there before you run gc.

main currently has two commits: initial README, then wip notes. Reset --hard HEAD~1 so the branch label, index, and files all sit on the root commit. Then read the reflog: the wip commit is still an object.`)
    .learn("Contrast --soft, --mixed, and --hard on HEAD vs index vs worktree.", "Use HEAD~1 as the first parent of the current commit.", "Recover a hard reset from reflog while the old tip is still referenced there.", "Move main back to the initial commit.")
    .allow("git status", "git log", "git log --oneline", "git reset", "git reset --soft", "git reset --mixed", "git reset --hard", "git reset --hard HEAD~1", "git reset --soft HEAD~1", "git reflog", "git ls-files", "git cat-file")
    .demo("git status", "git log --oneline", "git reset --hard HEAD~1", "git log --oneline", "git reflog", "git status")
    .from(startState)
    .hint("Reset main hard to HEAD~1 so you are back on the initial README-only commit.")
    .watch("Hard reset moves HEAD, index, and files together. The undone commit stays in the object graph — click it.")
    .then("main is one commit ahead of the initial README. That extra commit is what you will leave.", "main")
    .then("Log: newest on top. Remember the tip hash; reset will not delete the object.", "main")
    .then("--hard HEAD~1 slides main back. Worktree and index match the older commit. The newer node is dangling.", "main trees")
    .then("Log no longer lists the undone commit. It is still in the graph if you click the dim node.", "main")
    .then("reflog records the jump. That is how you find the dangling hash later.")
    .then("Three trees agree on the older snapshot.", "trees")
    .ask("git reset --soft HEAD~1…", ["Deletes the files that commit introduced", "Moves HEAD; index and worktree still match the commit you left", "Moves HEAD and the index, leaves the worktree", "Moves all three trees to origin/main"], 1, "Soft is uncommit-keep-staged. Mixed unstages. Hard throws the work away (into reflog).")
    .ask("git reset --hard HEAD~1 vs git reset HEAD~1 (mixed)…", ["They are identical", "Hard also makes the worktree match the target; mixed leaves file contents", "Mixed deletes objects; hard does not", "Hard cannot be undone even with reflog"], 1, "Mixed is the default: uncommit, keep edits unstaged. Hard aligns files too.")
    .ask("You hard-reset by mistake. First look at…", ["origin, because reflog is pushed", "git reflog, then reset --hard to the old HEAD entry", "git fetch, which restores dangling commits", "git merge --abort"], 1, "Reflog is local. HEAD@{1} is the pre-reset tip. It is not on the server.")
    .ask("HEAD~1 means…", ["The remote-tracking branch", "The first parent of the current HEAD commit", "The stash", "Index stage 1"], 1, "For a linear history that is the previous commit on the branch. Merge commits have a second parent too (~2 / ^2).")
    .pass((snapshot, state) => {
      return snapshot.head === initial &&
        state.refs["refs/heads/main"] === initial &&
        snapshot.files["NOTES.md"] === undefined;
    })
    .build();
}

// --- cherry-pick ---
function cherry_pickLesson() {
  const startState = seededLocalFromOrigin();
  const initial = mainTip(startState);
  commitOnBranch(startState, "main", "add notes", {
    "README.md": "# demo\n",
    "NOTES.md": "notes\n",
  });
  const fixId = commitOnBranch(startState, "hotfix", "urgent fix", {
    "README.md": "# demo\npatched\n",
  }, { from: initial, checkout: false });

  return speak("cherry-pick", "Cherry-pick: copy one commit’s change")
    .after("reset")
    .article("https://www.themoderncoder.com/git-cherry-pick/")
    .says(`Merge brings a whole branch, and a merge commit when both sides moved. Cherry-pick brings one commit’s diff onto current HEAD as a new commit. Git writes CHERRY_PICK_HEAD so the new commit can copy message and authorship. You create a duplicate patch with a different hash.

Later merging the original branch can confuse Git. Use cherry-pick for a hotfix on two long-lived branches, or lifting one commit off a messy branch, not for integrating a whole feature.

Conflicts are the same as merge: index stages 1/2/3. You are applying one patch, so you edit, git add, then git cherry-pick --continue. If uncommitted edits would be overwritten, cherry-pick aborts before starting. An empty cherry-pick (change already present) uses --skip or --allow-empty.

main has NOTES.md on top of initial. hotfix has a single README patch off the same initial. Cherry-pick that hotfix commit onto main. Confirm the message matches and the hash does not.`)
    .learn("Contrast cherry-pick (one patch, new hash) with merge (whole branch).", "Resolve a cherry-pick conflict with add then --continue, same stages as merge.", "Avoid cherry-picking a long series when merge or rebase is the real tool.", "Copy the hotfix commit onto main as a new object.")
    .allow("git status", "git log", "git log --oneline", "git cherry-pick", "git cherry-pick 5bd78815bc107056a92ad4fb183d3b8335763021", "git cherry-pick --continue", "git cherry-pick --abort", "git add", "git ls-files", "git branch", "git switch", "git checkout")
    .demo("git status", "git log --oneline", `git cherry-pick ${fixId}`, "git log --oneline", "git status")
    .from(startState)
    .hint(`Cherry-pick ${
        fixId.slice(0, 7)
      } (urgent fix) onto main so HEAD is a new commit with that message.`)
    .watch("Cherry-pick copies a patch onto HEAD as a brand-new commit. Same message, different hash and parent.")
    .then("You are on main. The urgent-fix commit lives on another line — find it in the graph.", "main")
    .then("Log of HEAD. The fix is not an ancestor yet.", "main")
    .then("cherry-pick applies that diff here. A new node appears with one parent: old HEAD. The original fix stays put.", "main")
    .then("Two commits share a message, not an id. Click both and compare parents.", "main")
    .then("Clean checkout of the copied snapshot.", "trees")
    .ask("cherry-q1", "A cherry-picked commit has…", ["The same hash as the source, because the patch is identical", "A new hash; the parent is current HEAD, not the source’s parent", "Two parents, like a merge", "No tree, only a message"], 1, "The patch is replayed. Parent, tree, and therefore id all change even when the message is copied.")
    .ask("cherry-q2", "Cherry-pick conflicts use…", ["A fourth index stage unique to cherry-pick", "The same unmerged stages 1/2/3 as merge", "Only the worktree; the index stays stage 0", "CHERRY_PICK_HEAD as stage 3"], 1, "Same machinery. Continue after add; abort restores the pre-pick branch.")
    .ask("cherry-q3", "You have uncommitted edits in the same files. Cherry-pick…", ["Overlays markers on your dirty files", "Aborts with “would be overwritten”; commit or stash first", "Stashes automatically", "Resets --hard then picks"], 1, "Same dirty-worktree guard as merge. Stash pop later can itself conflict.")
    .ask("cherry-q4", "Cherry-pick a whole feature’s ten commits when you meant to integrate the branch?", ["Ideal: hashes stay unique", "Usually the wrong tool; merge or rebase the branch instead", "Required so GitFlow can fast-forward", "The only way to copy a directory"], 1, "Duplicate patches make later merges harder. One-off hotfixes and lifting a single commit are the fit.")
    .pass((snapshot, state) => {
      if (!snapshot.head || snapshot.head === fixId) return false;
      const obj = state.objects[snapshot.head];
      return obj?.type === "commit" &&
        obj.message === "urgent fix" &&
        obj.parents.length === 1;
    })
    .build();
}

// --- rebase ---
function rebaseLesson() {
  const startState = seededLocalFromOrigin();
  const initial = mainTip(startState);
  const mainId = commitOnBranch(startState, "main", "main work", {
    "README.md": "# demo\n",
    "core.ts": "export const core = 1;\n",
  });
  commitOnBranch(startState, "feature", "feat step one", {
    "README.md": "# demo\n",
    "feat.ts": "export const a = 1;\n",
  }, { from: initial, checkout: false });
  const oldFeature = commitOnBranch(startState, "feature", "feat step two", {
    "README.md": "# demo\n",
    "feat.ts": "export const a = 1;\nexport const b = 2;\n",
  }, { checkout: false });
  startState.HEAD = "refs/heads/feature";
  startState.worktrees[0].branch = "feature";
  checkoutCommit(startState, oldFeature);

  return speak("rebase", "Rebase: cherry-pick in a loop")
    .after("cherry-pick")
    .article("https://www.themoderncoder.com/a-better-git-workflow-with-rebase/")
    .says(`Rebase does not move commits. It duplicates them on a new base, with new ids and the same author, date, and message. Git finds the merge base of feature and main and collects commits unique to feature, oldest first. It resets feature to main, cherry-picks each saved commit, and points feature at the last new commit.

Old commits remain until GC. Reflog still has them.

Merge preserves topology (two parents). Rebase replays your commits as if they were written on the new base. Conflicts use the same index stages, one replayed commit at a time: add, then git rebase --continue (or --skip / --abort).

Sequencer state lives under .git/rebase-merge/; do not delete it by hand. The golden rule: do not rebase commits other people already based work on, unless the team agreed to force-push that branch (prefer --force-with-lease).

You are on feature, two commits off the initial README. main has since added core.ts. git rebase main so feature’s two patches sit on top of main work as new hashes. Linear history, no merge bubble.`)
    .learn("Describe rebase as reset to the new base plus cherry-pick of unique commits.", "Expect new hashes even when messages match.", "Resolve one replayed commit at a time with --continue / --abort / --skip.", "Rebase feature onto main so main is an ancestor of feature.")
    .allow("git status", "git log", "git log --oneline", "git rebase", "git rebase main", "git rebase --continue", "git rebase --abort", "git rebase --skip", "git add", "git ls-files", "git branch", "git switch", "git checkout", "git reflog")
    .demo("git status", "git log --oneline", "git rebase main", "git log --oneline", "git status")
    .from(startState)
    .hint("On feature, rebase onto main so your two feature commits are replayed on top of core.ts.")
    .watch("Rebase is reset to the new base plus cherry-pick of your unique commits. Old feature commits will dangle.")
    .then("You are on feature, two commits off the old main. main has since moved (core.ts).", "feature")
    .then("Log of feature does not include main’s new commit. Two lines of work.", "feature")
    .then("rebase main replays your two patches on top of main. New hashes; old feature nodes dim. No merge bubble.", "feature")
    .then("feature is now a straight line on top of main. Click a new node vs a dangling old one.", "feature")
    .then("Worktree matches the replayed tip.", "trees")
    .ask("After git rebase main, the old feature commits…", ["Are rewritten in place and keep their hashes", "Still exist; feature now points at new commits whose patches were replayed", "Are deleted from the object database immediately", "Become the second parent of main"], 1, "New objects, moved label. reflog is how you get the old tip back.")
    .ask("The first step of rebase is…", ["Force-push origin", "Find the merge base, save unique commits, reset the branch to the new base", "Create a merge commit with two parents", "Stash the worktree"], 1, "Then each saved commit is cherry-picked onto that base, oldest first.")
    .ask("The golden rule of rebase is…", ["Always rebase main onto feature before a pull request", "Do not rebase commits others already based work on, unless the team agreed", "Never rebase a local unpushed branch", "Rebase instead of merge on every shared main"], 1, "Rewriting published history forces everyone else to reset. Feature branches can rewrite with agreement and --force-with-lease.")
    .ask("git pull --rebase is now…", ["Only a fetch", "Fetch, then this replay instead of merge", "reset --hard origin/main", "cherry-pick origin/main onto HEAD without fetching"], 1, "Same first half as pull; second half is rebase onto the updated tracking branch.")
    .pass((snapshot, state) => {
      const feature = state.refs["refs/heads/feature"];
      if (!feature || feature === oldFeature) return false;
      if (snapshot.branch !== "feature") return false;
      let cur: string | undefined = feature;
      const seen = new Set<string>();
      while (cur && !seen.has(cur)) {
        seen.add(cur);
        if (cur === mainId) {
          const tip = state.objects[feature];
          return tip?.type === "commit" &&
            snapshot.files["core.ts"] !== undefined &&
            snapshot.files["feat.ts"] !== undefined;
        }
        const obj: GitObject | undefined = state.objects[cur];
        if (!obj || obj.type !== "commit") break;
        cur = obj.parents[0];
      }
      return false;
    })
    .build();
}

// --- rebase-onto ---
function rebase_ontoLesson() {
  const startState = seededLocalFromOrigin();
  const initial = mainTip(startState);
  const mainId = commitOnBranch(startState, "main", "main work", {
    "README.md": "# demo\n",
    "core.ts": "export const core = 1;\n",
  });
  const wip = commitOnBranch(startState, "wip", "only A", {
    "README.md": "# demo\n",
    "a.ts": "export const a = 1;\n",
  }, { from: initial, checkout: false });
  const oldTopic = commitOnBranch(startState, "topic", "only B", {
    "README.md": "# demo\n",
    "a.ts": "export const a = 1;\n",
    "b.ts": "export const b = 1;\n",
  }, { from: wip, checkout: true });

  return speak("rebase-onto", "Rebase --onto: replay a slice of history")
    .after("rebase")
    .article("https://git-scm.com/docs/git-rebase")
    .says(`git rebase --onto <newbase> <upstream> [<branch>] replays commits reachable from branch (or HEAD) but not from upstream, onto newbase. Upstream is an exclusive cutoff: commits on the branch side of upstream stay out of the replay list.

Plain git rebase main moves every commit unique to the current branch since the merge base with main. --onto adds a second anchor so you can drop a middle patch, transplant a stack onto another line, or rescue commits after a bad rebase without replaying the whole branch.

Interactive rebase (-i) is a todo script at the top of the replay list: pick, reword, edit, squash, fixup, drop. This VM supports a simplified -i plus --onto. In real Git, --exec runs a command after each pick; this lab does not run --exec.

You are on topic. wip is the parent of topic and holds commit A (a.ts). main has moved forward with core.ts. git rebase --onto main wip topic drops A from the replay and replays only B onto main work. topic should end with core.ts and b.ts, not a.ts.`)
    .learn("State what --onto, upstream, and optional branch mean in git rebase --onto.", "Contrast upstream as an exclusive cutoff with a full-branch rebase.", "Use --onto to drop a middle commit and replay the tip onto main.", "Leave topic replayed on main with b.ts and core.ts, without a.ts.")
    .allow("git status", "git log", "git log --oneline", "git rebase", "git rebase --onto main wip topic", "git rebase --onto", "git rebase -i", "git rebase --interactive", "git rebase --continue", "git rebase --abort", "git rebase --skip", "git add", "git ls-files", "git branch", "git switch", "git checkout", "git reflog")
    .demo("git status", "git log --oneline", "git rebase --onto main wip topic", "git log --oneline", "git status")
    .from(startState)
    .hint("On topic, run git rebase --onto main wip topic so only B replays onto main work and a.ts drops out.")
    .watch("topic is B on top of wip’s A; main has since added core.ts. --onto replays only commits after wip onto main.")
    .then("You are on topic. wip holds commit A (a.ts). topic added B (b.ts). main has core.ts.", "topic")
    .then("Log of topic includes A then B. Those two sit off the old main, not on core.ts.", "topic")
    .then("rebase --onto main wip topic drops A as the cutoff and cherry-picks only B onto main.", "topic")
    .then("topic is now B' on top of main work. a.ts is gone; core.ts and b.ts remain. Old B may dangle.", "topic")
    .then("Clean checkout of the replayed tip. wip still names commit A; you did not delete that branch.", "topic trees")
    .ask("git rebase --onto <newbase> <upstream> [<branch>]…", ["Moves upstream and newbase to the same commit", "Replays commits reachable from branch but not upstream, onto newbase", "Merges upstream into newbase with a merge commit", "Deletes every commit between upstream and newbase from the object database"], 1, "Git collects the commits on the branch side of upstream, checks out newbase, and cherry-picks each one oldest first.")
    .ask("Upstream in --onto is…", ["Inclusive: upstream’s commit is always replayed", "Exclusive: commits reachable from upstream are excluded from the replay list", "Only a branch name; tags are rejected", "The merge base with newbase, always"], 1, "Commits reachable from upstream are not replayed. Only commits after upstream on the branch side enter the todo list.")
    .ask("Interactive rebase (-i) presents…", ["A merge conflict marker for every file", "A todo script (pick, squash, drop, …) for commits in the replay range", "A list of stashes to apply", "Only --exec hooks, no pick/squash"], 1, "Each line is one commit oldest-first. drop removes it from the replay; squash folds it into the previous pick.")
    .ask("git rebase --exec in real Git…", ["Is required for every rebase in this teaching VM", "Runs a command after each pick; this lab does not implement --exec", "Replaces interactive rebase entirely", "Only works with git merge --squash"], 1, "Real Git can run a hook after each replayed commit. This VM supports simplified -i and --onto without --exec.")
    .pass((snapshot, state) => {
      const topic = state.refs["refs/heads/topic"];
      if (!topic || topic === oldTopic) return false;
      if (snapshot.branch !== "topic") return false;

      const headFiles = commitFiles(state, topic);
      if (
        headFiles["b.ts"] === undefined || headFiles["core.ts"] === undefined
      ) {
        return false;
      }
      if (headFiles["a.ts"] !== undefined) return false;
      if (snapshot.files["a.ts"] !== undefined) return false;
      if (snapshot.threeTrees.index.includes("a.ts")) return false;
      if (snapshot.threeTrees.head.includes("a.ts")) return false;

      let cur: string | undefined = topic;
      const seen = new Set<string>();
      while (cur && !seen.has(cur)) {
        seen.add(cur);
        if (cur === mainId) return true;
        const obj: GitObject | undefined = state.objects[cur];
        if (!obj || obj.type !== "commit") break;
        cur = obj.parents[0];
      }
      return false;
    })
    .build();
}

// --- rewrite ---
function rewriteLesson() {
  const startState = seededLocalFromOrigin();
  commitOnBranch(startState, "main", "wip one", {
    "README.md": "# demo\n",
    "a.ts": "export const a = 1;\n",
  });
  commitOnBranch(startState, "main", "wip two", {
    "README.md": "# demo\n",
    "a.ts": "export const a = 1;\n",
    "b.ts": "export const b = 2;\n",
  });

  return speak("rewrite", "Rewriting history: the same tools, on purpose")
    .after("rebase-onto")
    .article("https://www.themoderncoder.com/rewriting-git-history/")
    .says(`Anything that creates new commits and moves a branch rewrites history. git revert does not: it adds a commit that applies the inverse patch. Use revert on published main.

Interactive rebase is a script (oldest at the top): pick, reword, edit, squash, fixup, drop. This teaching VM does not run rebase -i; the squash recipe here is the same idea with reset --soft and one new commit.

Split a commit with rebase stopping on edit, then reset HEAD^ to uncommit while keeping files, then add -p and commit twice. Bulk rewrite of every descendant (strip a secret) is git-filter-repo, not filter-branch.

Rules: rewrite local unpushed commits freely. Never rewrite shared main. Rewrite a shared feature only with agreement and --force-with-lease. Disaster recovery is reflog then reset --hard, not panic-gc.

main has three commits: initial, wip one (a.ts), wip two (b.ts). Soft-reset to HEAD~2 so HEAD is initial while the index still holds both files, then commit once. Two commits on the branch, one new hash, old wip objects still in the database.`)
    .learn("Contrast revert (adds an inverse commit) with rewrite (new objects, moved label).", "Squash a range with reset --soft and a single commit.", "State the policy: local free, shared main never, shared feature only with agreement.", "Leave main with two reachable commits: initial plus one squashed wip.")
    .allow("git status", "git log", "git log --oneline", "git reset", "git reset --soft", "git reset --soft HEAD~2", "git reset --mixed", "git reset --hard", "git commit", "git revert", "git reflog", "git add", "git ls-files")
    .demo("git log --oneline", "git reset --soft HEAD~2", "git status", 'git commit -m "squash wip into one"', "git log --oneline", "git reflog")
    .from(startState)
    .hint("Soft-reset past the two wip commits and make a single new commit so main is initial plus one squash.")
    .watch("Soft reset keeps the index and files, then one new commit replaces two wip nodes. Same idea as squash.")
    .then("main has an initial commit plus two wip commits. Those two are what you will squash.", "main")
    .then("reset --soft HEAD~2 moves the label back two, leaving the index with both wips’ trees combined.", "main trees")
    .then("status shows staged changes vs the older HEAD. Nothing was deleted from disk.", "trees")
    .then("One new commit. Two old wip nodes dangle. Click the new tip: one parent, one message.", "main")
    .then("Log is initial plus squash. Linear, new hash.", "main")
    .then("reflog still has the wip tips. History rewrite is labels + new objects.")
    .ask("git revert <commit>…", ["Deletes that commit and rewrites descendants", "Adds a new commit that applies the inverse patch", "Moves the branch to the parent (like reset --hard)", "Amends the named commit in place"], 1, "Revert is the safe published-history undo. Reset/rebase rewrite.")
    .ask("git reset --soft HEAD~2 then git commit…", ["Drops the files from those two commits", "Keeps their trees in the index and records them as one new commit", "Creates a merge commit with two parents", "Pushes a force update automatically"], 1, "Soft moves only the label. The index still matches the old tip, so the next commit is a squash.")
    .ask("On shared main you should…", ["rebase -i and force-push", "merge or revert, not rewrite", "filter-repo without telling anyone", "amend the release tag"], 1, "Other clones based work on those hashes. New inverse commits keep the graph honest.")
    .ask("After a bad rewrite, do not panic-gc. Do…", ["git reflog, then reset --hard to the old tip", "git clone again from origin immediately", "delete .git/objects", "git fetch --prune"], 0, "Dangling commits stay reachable from reflog for weeks by default. GC after you panic is how you lose them.")
    .pass((snapshot, state) => {
      if (!snapshot.head) return false;
      const tip = state.objects[snapshot.head];
      if (!tip || tip.type !== "commit") return false;
      if (reachableCount(state, snapshot.head) !== 2) return false;
      return snapshot.files["a.ts"] !== undefined &&
        snapshot.files["b.ts"] !== undefined;
    })
    .build();
}

// --- gc ---
function gcLesson() {
  const startState = seededLocalFromOrigin();
  const initial = mainTip(startState);
  const droppedId = commitOnBranch(startState, "main", "wip notes", {
    "README.md": "# demo\n",
    "NOTES.md": "scratch\n",
  });

  return speak("gc", "Garbage collection: when dangling commits disappear")
    .after("rewrite")
    .article("https://git-scm.com/docs/git-gc")
    .says(`Resetting or rewriting leaves old commits as dangling objects. They stay in .git/objects until garbage collection removes them. The reflog keeps many of those commits reachable for about 90 days by default, so panic-gc is how you lose work you could have reset --hard back to.

git gc packs loose objects and may prune unreachable ones. git gc --prune=now is aggressive: prune immediately instead of waiting for the grace window. To drop commits that only the reflog still references, expire the reflog first: git reflog expire --expire=now --all, then git gc --prune=now. That removes anything not reachable from refs, stash, remotes, or reflog entries.

Real Git also has cruft packs (old unreachable objects kept separately) and git maintenance for scheduled gc. This teaching VM does not pack: plain git gc prints a no-op message. git gc --prune=now deletes unreachable objects from the object database.

main has two commits: initial README, then wip notes. Hard-reset to HEAD~1 so the wip commit dangles but reflog still points at it. Expire the reflog, then prune. The branch label stays on initial; the wip commit and its tree and blobs are gone.`)
    .learn("Explain that dangling objects persist until GC, and reflog keeps them reachable by default.", "Contrast git gc (pack, optional prune) with git gc --prune=now (immediate prune).", "Expire reflog before aggressive prune so old tips are not kept alive.", "Leave main on the initial commit with the wip notes commit pruned from the database.")
    .allow("git status", "git log", "git log --oneline", "git reset --hard HEAD~1", "git reflog", "git reflog expire --expire=now --all", "git gc", "git gc --prune=now")
    .demo("git status", "git log --oneline", "git reset --hard HEAD~1", "git reflog expire --expire=now --all", "git gc --prune=now", "git log --oneline")
    .from(startState)
    .hint("Hard-reset to drop the wip commit from main, expire the reflog, then gc --prune=now so the dangling commit is gone.")
    .watch("Reset leaves the wip commit dangling. Reflog still reaches it until you expire, then prune deletes the objects.")
    .then("main is on the extra wip notes commit. NOTES.md is in HEAD. That commit is what you will drop.", "main")
    .then("Two commits on main: initial README, then wip notes. Reset will move the label backward.", "main")
    .then("reset --hard HEAD~1 slides main to the README commit. The wip node dangles but reflog still holds it.", "main")
    .then("reflog expire --expire=now --all drops the safety net. Nothing named still points at wip notes.", "main")
    .then("gc --prune=now deletes unreachable objects. The dim node disappears from the object store.", "main")
    .then("Log is only the initial commit. Real Git also writes cruft packs and git maintenance timers.", "main")
    .ask("git gc vs git gc --prune=now…", ["Both always delete every dangling commit immediately", "gc packs (and may prune later); --prune=now prunes unreachable objects now", "gc only touches the reflog; prune touches packs", "Neither can remove objects still named by a branch ref"], 1, "GC compacts and cleans. Prune removes unreachable objects; --prune=now skips the usual grace period.")
    .ask("By default, reflog entries keep old commits reachable for about…", ["One hour", "90 days", "Forever until you push", "Only while git status is clean"], 1, "Reflog expire defaults are measured in days. That is why reset --hard is recoverable for weeks locally.")
    .ask("Cruft packs in real Git…", ["Store unreachable objects separately instead of deleting them immediately", "Replace the reflog entirely", "Are created only by git stash", "Hold only remote-tracking refs"], 0, "Cruft packs give GC a place to park pruned objects before final deletion.")
    .ask("git maintenance is for…", ["Force-pushing shared main", "Scheduled gc, commit-graph, and other repo housekeeping", "Replacing git fetch", "Disabling the reflog on clone"], 1, "Maintenance runs background tasks so repos stay packed and pruned without manual gc.")
    .pass((snapshot, state) => {
      return state.objects[droppedId] === undefined &&
        state.refs["refs/heads/main"] === initial &&
        snapshot.head === initial &&
        snapshot.files["NOTES.md"] === undefined;
    })
    .build();
}

// --- stash ---
function stashLesson() {
  const startState = seededLocalFromOrigin();
  startState.worktrees[0].files["README.md"] = "# demo\ndraft\n";

  return speak("stash", "Stash: commits that are not on a branch")
    .after("gc")
    .article("https://www.themoderncoder.com/git-stash/")
    .says(`Stash writes real commits, then resets your worktree to HEAD so you can switch branches. It is not a clipboard. Default stash ignores untracked files: new files you never git add’d still sit in the worktree. Fix that with git add then stash, or git stash push -u.

From git-stash(1): H is HEAD when you stashed; I is a commit whose tree is the index (parent H); W is a merge commit whose tree is the working directory (parents H and I). -u adds a third parent for untracked files.

refs/stash points at W. Older entries are the reflog of that ref. Then Git resets index and worktree to H. That is why stash show can diff, why stash branch can recreate the starting point, and why dropped stashes sometimes show up in git fsck before GC.

git stash apply restores and keeps the entry. pop is apply plus drop if apply succeeded.

README.md is dirty (a draft line) and untracked files are none. Stash the draft so status is clean and stash@{0} names W. The object database grew; main did not move.`)
    .learn("Describe stash as commits W (and I) off to the side, then a reset to H.", "Include untracked files with -u (or add first); default stash ignores them.", "Contrast apply (keep) with pop (drop only if apply succeeded).", "Hide the draft so the worktree matches HEAD and stash is non-empty.")
    .allow("git status", "git log", "git log --oneline", "git stash", "git stash push", 'git stash push -m "wip"', "git stash push -u", "git stash apply", "git stash pop", "git stash drop", "git stash branch", "git ls-files", "git reflog")
    .demo("git status", 'git stash push -m "wip"', "git status", "git log --oneline", "git ls-files")
    .from(startState)
    .hint("Stash the dirty README so the worktree matches HEAD and stash@{0} exists. Apply is optional; pop is not required.")
    .watch("stash push writes a merge-like W commit (parents H and I) and cleans the worktree. Watch the mauve stash node.")
    .then("README.md is dirty vs HEAD. That diff is what stash will snapshot.", "main trees")
    .then("stash push creates W with parents HEAD (H) and the index commit (I). Worktree returns to HEAD.", "stash")
    .then("Clean status. The WIP lives on the stash ref, not in the worktree.", "trees")
    .then("Log of HEAD is unchanged. The stash node is extra — click W, H, and I.", "stash")
    .then("Index matches HEAD again. Stash is a commit graph, not a cloud clipboard.", "trees")
    .ask("The stash ref points at…", ["H, the HEAD you left", "W, a merge commit whose tree is the stashed worktree", "A blob of concatenated diffs", "origin/main"], 1, "W’s parents are H and I (index). That graph is why stash is real history, not a clipboard.")
    .ask("After git stash (default, no -u), untracked files…", ["Are in W’s tree", "Still sit in the worktree", "Are deleted", "Become index stage 3"], 1, "Default stash only records tracked files (and the index). git stash push -u includes untracked.")
    .ask("git stash pop vs apply…", ["They are identical", "pop is apply, then drop only if apply succeeded", "apply deletes the stash; pop keeps it", "pop never conflicts"], 1, "A conflicting apply leaves the stash listed on purpose. Drop yourself after you resolve.")
    .ask("git stash branch rescue stash@{0}…", ["Pushes the stash to origin", "Checks out original H, applies there, and drops the stash", "Creates a merge commit on main", "Converts W into a tag"], 1, "When the current tip is a bad place to apply, recreate the starting point as a branch.")
    .pass((snapshot, state) => {
      if (state.stash.length < 1) return false;
      const head = snapshot.head;
      if (!head) return false;
      const obj = state.objects[head];
      if (!obj || obj.type !== "commit") return false;
      const tree = state.objects[obj.tree];
      if (!tree || tree.type !== "tree") return false;
      const readme = tree.entries.find((e) => e.name === "README.md");
      if (!readme) return false;
      const blob = state.objects[readme.id];
      if (!blob || blob.type !== "blob") return false;
      return snapshot.files["README.md"] === blob.content;
    })
    .build();
}

// --- stash-conflicts ---
function stash_conflictsLesson() {
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

  return speak("stash-conflicts", "Stash merge conflicts")
    .after("stash")
    .article("https://www.themoderncoder.com/fix-git-stash-conflicts/")
    .says(`git stash pop and apply merge W onto the current worktree. If the branch moved, you get the same unmerged stages as any merge. Markers say “Updated upstream” versus “Stashed changes.” There is no git stash --continue.

After you edit and git add (stages collapse to 0), drop the stash yourself. If apply conflicted, pop did not drop it. To abort, git reset --merge; the stash stays listed.

CONFLICT (content) means you are in the merge workflow. “Your local changes would be overwritten by merge” means Git aborted; you never entered markers. Stage or commit the dirty files, then pop again.

If the new tip is a bad place to apply, git stash branch wip-from-stash checks out original H and applies there. While learning, prefer apply then drop, not pop.

main has moved: README now says from main. The stash still records from stash on top of the original H. Pop (or apply) to see stages 1/2/3, resolve to one README, add, then git stash drop.`)
    .learn("Treat stash apply/pop as a merge of W onto the current tree.", "Remember that a conflicting pop does not drop the stash.", "Resolve with edit + git add; there is no stash --continue.", "Leave a clean index (no unmerged stages) after the stash conflict.")
    .allow("git status", "git log", "git log --oneline", "git stash", "git stash pop", "git stash apply", "git stash drop", "git stash branch", "git add", "git add README.md", "git add .", "git ls-files", "git ls-files -u", "git reset", "git reset --merge", "git checkout", "git checkout --ours", "git checkout --theirs", "git checkout --ours -- README.md", "git checkout --theirs -- README.md", "edit", "edit README.md")
    .demo("git status", "git stash apply", "git status", "git ls-files -u", 'edit README.md << "# demo\\nfrom stash"', "git add README.md", "git stash drop", "git status")
    .from(startState)
    .hint("Pop the stash, resolve README (keep the text you want), git add, then drop if pop left it listed.")
    .watch("apply replays W onto a moved HEAD. Overlap → stages 1/2/3; drop only after you resolve.")
    .then("HEAD moved since the stash was taken. stash@{0} still points at W.", "stash")
    .then("stash apply replays the worktree commit. Conflict: stages appear; the stash ref is not dropped.", "stash")
    .then("Conflicted status. Graph still has W. You must resolve in the worktree.", "trees")
    .then("ls-files -u: stage 1 base, 2 ours, 3 theirs (from the stash).")
    .then("edit writes the file you want. That is the worktree side of the three trees.", "trees")
    .then("add collapses stages to 0. The conflict is recorded as resolved.", "trees")
    .then("stash drop removes the stash ref. W and I may dangle; HEAD did not rewind.", "main")
    .then("Clean enough to continue. Apply + drop is pop, but you chose when to drop.", "trees")
    .ask("stashc-q1", "stash pop hits a content conflict. The stash entry…", ["Is already dropped", "Stays listed; drop it after you resolve", "Becomes a branch named stash", "Is force-pushed to origin"], 1, "Drop is aborted on purpose so you cannot lose W while the merge is messy.")
    .ask("stashc-q2", "After fixing markers, you run…", ["git stash --continue", "git add the resolved paths (no stash --continue exists)", "git merge --continue", "git rebase --skip"], 1, "Same resolution as merge: add collapses stages. The sequencer is not a stash sequencer.")
    .ask("stashc-q3", "“Would be overwritten by merge” on stash pop means…", ["You are looking at <<<<<<< markers", "Git refused to start; the stash is untouched; clean the worktree first", "Stages 1/2/3 are already in the index", "W was dropped"], 1, "Dirty-worktree abort, same as merge. You never entered the conflict workflow.")
    .ask("stashc-q4", "Index stages during a stash conflict are…", ["Unique to stash (stages 4/5/6)", "The same 1 base / 2 ours / 3 theirs as merge", "Only stage 0", "Stored in refs/stash instead of the index"], 1, "git ls-files -u is the same picture as a branch merge. add is still the resolved signal.")
    .pass((snapshot, state) => {
      if (state.conflicted) return false;
      if (snapshot.index.some((e) => e.stage !== 0)) return false;
      if (state.stash.length !== 0) return false;
      const readme = snapshot.files["README.md"] ?? "";
      return readme.includes("from stash") && !readme.includes("<<<<<<<");
    })
    .build();
}

// --- worktrees ---
function worktreesLesson() {
  const startState = seededLocalFromOrigin();
  const initial = mainTip(startState);
  commitOnBranch(startState, "hotfix", "hotfix patch", {
    "README.md": "# demo\nhotfix\n",
  }, { from: initial, checkout: false });

  return speak("worktrees", "Worktrees: isolation without stashing")
    .after("stash-conflicts")
    .article("https://gist.github.com/ashwch/946ad983977c9107db7ee9abafeb95bd")
    .says(`Each worktree has its own HEAD, index, worktree reflog, and files, and they share .git/objects. Stash is for a short interruption; for two branches at once, check out twice.

git worktree add ../repo-hotfix hotfix creates that folder, does not copy objects, and writes a gitdir file pointing at .git/worktrees/<name>/. It refuses if that branch is already checked out: one branch per worktree.

git fetch in any worktree updates the shared database. git worktree list / remove / prune manage the extras. Compared with stash: uncommitted work stays visible as normal files in another folder; you can build and test two branches; each worktree needs its own submodule init; disk cost is a full working copy per tree.

A bare repo stores objects and refs with no checkout: the git dir has no working-tree files. This lesson starts with main already checked out, and you add an extra worktree for hotfix. On a bare repo, git worktree add creates the first checkout, and git worktree list shows (bare).

main is checked out here. hotfix already exists as a ref. Add a second worktree at ../hotfix on that branch. The graph’s objects do not duplicate; you get another index and another set of files.`)
    .learn("Share one object database across worktrees; give each its own HEAD and index.", "Add a worktree for a branch that is not already checked out.", "Prefer a worktree over stash when you need two checkouts at once.", "List the extra worktree after git worktree add.")
    .allow("git status", "git log", "git log --oneline", "git worktree", "git worktree add", "git worktree add ../hotfix hotfix", "git worktree list", "git worktree remove", "git worktree remove ../hotfix", "git branch", "git switch", "git checkout")
    .demo("git status", "git branch", "git worktree add ../hotfix hotfix", "git worktree list", "git status", "git log --oneline")
    .from(startState)
    .hint("git worktree add ../hotfix hotfix so this repo has two worktrees sharing objects.")
    .watch("Linked worktrees share the object database. Diamonds are extra checkouts, not copies of Git.")
    .then("One worktree at `.` on main. Objects live in this repo regardless of extra checkouts.", "main")
    .then("hotfix already exists as a branch. worktree add will check it out elsewhere.", "hotfix")
    .then("worktree add ../hotfix hotfix. Two diamonds appear at once: `.` on main and `../hotfix` on the hotfix tip. Same objects.", "hotfix")
    .then("worktree list: `.` on main and `../hotfix` on hotfix. Two checkouts, one object store.")
    .then("This checkout’s status is still main’s tree. The other tree lives in ../hotfix.", "trees")
    .then("Click each diamond and its commit. Two HEADs, one object store.", "hotfix")
    .ask("wt-q1", "A linked worktree…", ["Copies every object into a second .git/objects", "Shares objects; has its own HEAD, index, and files", "Is a stash under another name", "Cannot run git fetch"], 1, "The extra .git is a file pointing at the main repo’s worktrees metadata. Objects stay unique by hash.")
    .ask("wt-q2", "git worktree add for a branch already checked out…", ["Succeeds and both trees share the same index", "Refuses; one branch per worktree", "Detaches HEAD in the first tree", "Stashes the first tree automatically"], 1, "Two checkouts of the same branch would fight over the same ref. Use a new branch or a detached HEAD if the VM allows it.")
    .ask("wt-q3", "When should you worktree instead of stash?", ["A five-second interrupt to look at git status", "You need two branches built/tested at once, without hiding work in refs/stash", "You want to delete objects", "You are resolving stash stages 1/2/3"], 1, "Stash hides a snapshot on W. A worktree keeps a real directory you can compile.")
    .ask("wt-q4", "git fetch in the linked worktree…", ["Updates only that worktree’s private object store", "Updates the shared object database and remote-tracking refs", "Cannot see origin", "Clones origin again into ../hotfix"], 1, "One database. Remote-tracking refs are in the shared git dir, so every worktree sees the new tips.")
    .ask("wt-q5", "A bare repo has no primary worktree. git worktree add…", ["Creates the first checkout; git worktree list shows (bare)", "Fails because a worktree needs an existing checkout of main", "Copies objects into a second .git/objects", "Checks out every branch into the git dir itself"], 0, "The git dir is marked (bare) until you add a worktree. That add is the first checkout, not a second one.")
    .pass((snapshot, _state) => {
      return snapshot.worktrees.length >= 2;
    })
    .build();
}

// --- gitflow ---
function gitflowLesson() {
  const startState = seededLocalFromOrigin();
  const initial = mainTip(startState);
  commitOnBranch(startState, "develop", "start develop", {
    "README.md": "# demo\n",
    "dev.md": "integration branch\n",
  }, { from: initial, checkout: true });
  commitOnBranch(startState, "feature/login", "add login", {
    "README.md": "# demo\n",
    "dev.md": "integration branch\n",
    "login.ts": "export const login = true;\n",
  }, {
    checkout: false,
    from: startState.refs["refs/heads/develop"]!,
  });

  return speak("gitflow", "GitFlow: convention on top of merge")
    .after("worktrees")
    .article("https://www.themoderncoder.com/a-better-git-workflow-with-rebase/")
    .says(`GitFlow adds no new Git mechanics. It is a naming scheme plus merge --no-ff so the feature stays a visible bubble instead of fast-forwarding develop into a straight line. main (or master) is production; each commit there is a release. develop is next-release integration.

feature/* lives days to weeks off develop and merges back into develop. release/* freezes develop, merges into main and develop, and is tagged. hotfix/* branches from main and merges into both main and develop.

You do not need the git-flow helper. You need the graph. Long-lived feature/* off develop means large merges. Some CI/CD teams use short-lived branches on main plus feature flags instead.

Learn GitFlow to work in repos that use it; do not assume every project should. The linear rebase workflow from the previous chapters is the other common taste: same primitives, different shape.

You are on develop. feature/login already has login.ts. Merge it with --no-ff so develop gains a two-parent commit even if Git could have fast-forwarded. That bubble is the whole point of the convention.`)
    .learn("Map main, develop, feature/*, release/*, and hotfix/* to their lifetimes and merge targets.", "Use merge --no-ff so a finished feature remains a bubble on develop.", "Contrast GitFlow’s merge bubbles with a linear rebase-onto-main workflow.", "Finish feature/login into develop with a merge commit.")
    .allow("git status", "git log", "git log --oneline", "git merge", "git merge --no-ff", "git merge --no-ff feature/login", "git merge feature/login", "git branch", "git branch -d", "git branch -d feature/login", "git switch", "git switch develop", "git checkout", "git switch -c")
    .demo("git status", "git log --oneline", "git merge --no-ff feature/login", "git log --oneline", "git branch -d feature/login", "git status")
    .from(startState)
    .hint("On develop, git merge --no-ff feature/login so HEAD is a two-parent merge commit.")
    .watch("GitFlow is naming plus merge --no-ff. You are on develop; keep feature/login as a visible bubble.")
    .then("develop is checked out. feature/login is the side branch to merge.", "develop")
    .then("Log of develop. feature/login’s commits are the other lane.", "develop")
    .then("--no-ff creates a two-parent commit even if Git could fast-forward. That bubble is the convention.", "develop")
    .then("Click the merge node: parents are old develop and feature/login.", "develop")
    .then("Deleting feature/login removes the label, not the commits. The bubble remains.", "develop")
    .then("develop is clean. GitFlow did not add new Git mechanics — only shape.", "trees")
    .ask("flow-q1", "GitFlow’s merge --no-ff is for…", ["Deleting feature branches without a commit", "Keeping a visible merge bubble even when a fast-forward was possible", "Rewriting develop’s hashes", "Skipping the index"], 1, "Without --no-ff, a feature that is strictly ahead of develop would only move the develop label. The bubble is the convention.")
    .ask("flow-q2", "A hotfix branches from… and merges into…", ["develop; develop only", "main; main and develop", "feature/*; main only", "origin/main; upstream/main"], 1, "Production fire starts at main, is tagged on main, and is merged back to develop so the fix is not lost.")
    .ask("flow-q3", "GitFlow vs the linear rebase workflow…", ["GitFlow invents new object types", "Same primitives; GitFlow prefers --no-ff bubbles, rebase prefers a straight line on main", "Rebase cannot exist in a repo that once used GitFlow", "GitFlow forbids merge commits"], 1, "You already have switch, merge, fetch, and tags. Naming and --no-ff are policy, not new mechanics.")
    .ask("flow-q4", "release/* exists to…", ["Replace tags", "Freeze develop for version bump and QA, then merge into main and develop", "Hold untracked files", "Store stash W commits"], 1, "Short-lived. Tag the merge on main (v1.2.0). Then delete the release branch.")
    .pass((snapshot, state) => {
      if (snapshot.branch !== "develop" || !snapshot.head) return false;
      const obj = state.objects[snapshot.head];
      return obj?.type === "commit" &&
        obj.parents.length === 2 &&
        snapshot.files["login.ts"] !== undefined;
    })
    .build();
}

// --- trunk ---
function trunkLesson() {
  const startState = seededLocalFromOrigin();
  const initial = mainTip(startState);
  commitOnBranch(startState, "main", "trunk work", {
    "README.md": "# demo\n",
    "core.ts": "export const core = 1;\n",
  });
  commitOnBranch(startState, "feature/login", "add login", {
    "README.md": "# demo\n",
    "login.ts": "export const login = true;\n",
  }, { from: initial, checkout: true });

  return speak("trunk", "Trunk-based development: short branches on main")
    .after("gitflow")
    .article("https://www.themoderncoder.com/a-better-git-workflow-with-rebase/")
    .says(`Trunk-based development (TBD) keeps one integration line—main or trunk—and treats every other branch as short-lived. You branch off main, integrate back within hours or days, and ship incomplete work behind feature flags instead of parking it on a long-lived develop branch.

GitFlow’s merge --no-ff bubbles are a deliberate policy choice: they preserve the shape of finished features on develop. TBD teams often prefer the opposite: rebase the feature onto current main, then fast-forward main with merge --ff-only so history stays a straight line. No two-parent merge commit; the feature’s commits (replayed on the new base) become ordinary ancestors of main.

That does not invent new Git mechanics. You still have switch, rebase, merge, and branch -d. The difference is cadence and graph shape: frequent integration on main, small diffs, CI on every push, and flags to hide unfinished UI instead of a release branch that waits weeks.

You are on feature/login. main already has core.ts; your branch has login.ts but branched before core landed. Rebase onto main, switch to main, fast-forward with --ff-only, delete the feature branch, and leave main as a single-parent tip with both files.`)
    .learn("Contrast trunk-based short branches on main with GitFlow’s long-lived develop and --no-ff bubbles.", "Use feature flags (or similar) to integrate incomplete work without a release branch.", "Rebase a feature onto main, then merge --ff-only so main stays linear.", "Finish feature/login into main with one parent on HEAD and no feature/login ref.")
    .allow("git status", "git log", "git log --oneline", "git rebase", "git rebase main", "git rebase --continue", "git rebase --abort", "git rebase --skip", "git merge", "git merge --ff-only", "git merge --ff-only feature/login", "git branch", "git branch -d", "git branch -d feature/login", "git switch", "git switch main", "git switch feature/login", "git checkout", "git add")
    .demo("git status", "git log --oneline", "git rebase main", "git switch main", "git merge --ff-only feature/login", "git branch -d feature/login", "git log --oneline")
    .from(startState)
    .hint("Rebase feature/login onto main, switch to main, merge --ff-only, delete feature/login.")
    .watch("Trunk-based work is a short-lived branch on main, rebased, then fast-forwarded. No GitFlow bubble.")
    .then("You are on feature/login with login.ts. main has already added core.ts on the trunk.", "feature/login")
    .then("Log of the feature does not include core.ts yet. Rebase will replay login on top of trunk.", "feature/login")
    .then("rebase main copies the login commit onto main’s tip. New hash; linear history, no merge node.", "feature/login")
    .then("switch main. The feature label still sits on the replayed commit, one step ahead of main.", "main")
    .then("merge --ff-only slides main to feature/login. If Git needed a merge commit, this would abort.", "main")
    .then("Deleting feature/login drops the label. main is a straight line with both core.ts and login.ts.", "main")
    .then("Log of trunk is linear. Contrast GitFlow’s --no-ff bubble on develop.", "main")
    .ask("Trunk-based development vs GitFlow mainly differs in…", ["Object types stored in .git/objects", "Branch lifetime and graph shape: short branches on main vs long-lived develop with --no-ff bubbles", "Whether fetch is allowed", "Whether tags exist"], 1, "Same primitives. TBD integrates on main often; GitFlow names develop, release/*, and merge bubbles.")
    .ask("Feature flags in a TBD team help you…", ["Skip the index on commit", "Merge incomplete work to main while keeping it off for users until ready", "Replace git rebase", "Force --no-ff on every merge"], 1, "Small, frequent merges on main; hide unfinished behavior in the app instead of a long integration branch.")
    .ask("merge --ff-only after a rebase onto main…", ["Always creates a two-parent merge commit", "Moves main forward only if it can fast-forward—refuses a merge bubble", "Deletes all feature commits from the object database", "Requires --no-ff"], 1, "After rebase, feature is strictly ahead of main with shared history; --ff-only slides main to the tip without a merge commit.")
    .ask("Short-lived feature branches mean…", ["Never deleting branches after merge", "Branching from main (or trunk), integrating back within days, not weeks on develop", "Forbidding rebase on shared repos", "Using only hotfix/* names"], 1, "The branch exists to isolate a small change until CI passes and review lands—not as a parking lot for the next release.")
    .pass((snapshot, state) => {
      if (snapshot.branch !== "main" || !snapshot.head) return false;
      if (state.refs["refs/heads/feature/login"]) return false;
      const obj = state.objects[snapshot.head];
      return obj?.type === "commit" &&
        obj.parents.length === 1 &&
        snapshot.files["login.ts"] !== undefined &&
        snapshot.files["core.ts"] !== undefined;
    })
    .build();
}

export const lessons = [
  modelLesson(),
  tagsLesson(),
  indexLesson(),
  cloneLesson(),
  packsLesson(),
  reftableLesson(),
  fetchLesson(),
  mergeLesson(),
  rerereLesson(),
  pullLesson(),
  forkLesson(),
  amendLesson(),
  resetLesson(),
  cherry_pickLesson(),
  rebaseLesson(),
  rebase_ontoLesson(),
  rewriteLesson(),
  gcLesson(),
  stashLesson(),
  stash_conflictsLesson(),
  worktreesLesson(),
  gitflowLesson(),
  trunkLesson(),
];
