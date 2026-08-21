# Git Lab

Interactive Deno / Fresh app for learning Git along the proficiency-guide
dependency chain. A fake terminal (xterm.js) drives an in-memory teaching VM;
the commit DAG is drawn in the browser.

Author-side TypeScript is written so call sites read as English sentences
([Human-readable Source Codes](https://medium.com/@beeleeong/human-readable-source-codes-988aa997692a)).
The learner still types real Git: `GitVM.exec("git …")` is the teaching CLI.

## Run locally

The CLI binary is named **`deno`** (Deno). It is not `demo`.

1. Install Deno if `deno --version` fails
   ([docs](https://docs.deno.com/runtime/getting_started/installation/)):

```bash
curl -fsSL https://deno.land/install.sh | sh
```

macOS with Homebrew: `brew install deno`. Then open a new terminal so `PATH`
includes `~/.deno/bin`.

2. Install this repo’s npm packages, then start Vite:

```bash
cd ~/Projects/git-lab
git pull
deno install
deno task dev
```

Open the URL Vite prints (usually http://localhost:5173).

`deno.json` sets `"nodeModulesDir": "manual"`, so `deno install` writes
`node_modules` for Preact, xterm, vis-network, and the other npm imports. That
command only works after the `deno` binary is on your `PATH`.

```bash
deno task test
```

`deno task check` also runs `deno fmt --check` on the whole tree. Some older CSS
is not formatted; use `deno task test` for a green suite.

## Source that should read as a sentence

| Who                   | API                                                                            | Where                                |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| Learner               | `GitVM.exec("git status")`                                                     | terminal in the lesson studio        |
| Lesson author         | `speak("tags", "…").says().learn().allow().demo().then().ask().pass().build()` | `lib/curriculum/catalog.ts`          |
| Test / fixture author | `vm.file().stage().commit().branch().onto()`                                   | `lib/git-vm/mod.ts`, `tests/vm/`     |
| Diagram author        | flat scene ops (`card`, `edge`, `chain`, …)                                    | `lib/studio/illustrations/scenes.ts` |

`paint()` in `lib/studio/illustrations/paint.tsx` interprets that scene list
(one painter, 23 lessons). Allowed commands are a hard whitelist: do not add Git
verbs to a lesson unless the studio already permits them.

Each lesson’s `demoScript` lines stay 1:1 with viz beats. Play demo in the UI
should still reach `goalCheck`.
