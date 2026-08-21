# Git Lab

Interactive Deno / Fresh app for learning Git along the proficiency-guide
dependency chain. Fake terminal (xterm.js) drives an in-memory teaching VM;
@gitgraph/js draws the commit DAG.

## Run locally

```bash
cd ~/Projects/git-lab
deno task dev
```

Open the URL Vite prints (usually http://localhost:5173).

```bash
deno task test
deno task check
```

Curriculum source: `~/Downloads/Git Proficiency Guide.md`. No YouTube embeds.
