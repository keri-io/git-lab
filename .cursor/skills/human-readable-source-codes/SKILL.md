---
name: human-readable-source-codes
description: Writes and reviews TypeScript so call sites read like English sentences, using fluent interfaces, internal DSLs, and the builder pattern. Use when designing APIs, test helpers, fixture builders, or method chains, or when the user mentions readable source, fluent interfaces, DSLs, builders, Jest-style expect().toBe(), Rails-style routing, Kopi Auntie, or reducing mental compilation overhead.
---

# Human-readable Source Codes

Source from
[Human-readable Source Codes](https://medium.com/@beeleeong/human-readable-source-codes-988aa997692a)
(Bee Lee Ong, 2021). Apply this skill when writing or reviewing APIs in this
repo.

Codes are conversations interspersed with assignments and function calls.
Programming languages are not as malleable as English, so call sites feel
incoherent unless the API hides the machinery. **Mental compilation is a
significant overhead.** Prefer reusable pieces that make sense when used — the
reader should not spend effort decoding punctuation.

## Prefer a sentence the reader can speak

Design the consumer sentence first. Implementation exists to make that sentence
compile.

```typescript
// Clear on first glance: expecting the sum of 1 and 2 to be 3.
test("adds 1 + 2 to equal 3", () => {
  expect(sum(1, 2)).toBe(3);
});
```

`expect` and `toBe` are not language keywords. They are fluent methods whose
names carry the meaning. Forget the punctuation; the words should still parse.

Do the same for Git Lab helpers: a test or fixture call site should read as what
the learner or author is doing, not as how the VM stores objects.

```typescript
// Prefer (when a builder exists)
repo.stage("README.md").commit("initial");

// Avoid dumping the protocol at every call site
vm.exec("git add README.md");
vm.exec('git commit -m "initial"');
```

Keep `GitVM.exec` as the teaching surface (the learner types those commands).
Use fluent builders for **author-side** setup: fixtures, lesson start states,
graph scenes, test arrangement.

## Fluent interface vs internal DSL

They get used interchangeably. They are not the same.

|            | Fluent interface                                                 | Internal DSL                                                  |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| What it is | Host-language methods that chain into a readable sentence        | A domain vocabulary hosted in another language                |
| Example    | Jest `expect(x).toBe(y)`                                         | Rails `get "book/list"` inside `routes.draw`                  |
| Host       | TypeScript / JS methods returning `this` (or the next step type) | Ruby methods that look like keywords (`get`, `post`, `patch`) |

HTML is an external DSL (a language of its own). Rails routing is an internal
DSL: `get` / `post` / `patch` are functions the framework supplies, written so
they read as routing keywords.

When Git Lab needs a small domain vocabulary (demo scripts, allowed commands,
viz beats), prefer an internal DSL over a bag of unrelated option objects. When
the task is assembling one object step by step, prefer a fluent builder.

## Builder pattern

Fluent interfaces often use the builder pattern: describe, in code, what you are
trying to achieve. Each mutating step returns `this` (or a narrowed type) so the
next word in the sentence is a method.

Canonical consumer sentence from the article — iced coffee without milk:

```typescript
auntie.kopi().o().ping().order(); // "Kopi O Ping"
```

That is a constrained string builder. Methods encode domain lingo; `order()`
hides the join/if-else assembly. Full reconstruction:
[examples.md](examples.md). Runnable copy: `scripts/kopi_auntie.ts`.

## Workflow

Copy this checklist and track progress:

```
- [ ] Write the call-site sentence in a comment or test name
- [ ] Name methods as words in that sentence (verbs/nouns the domain already uses)
- [ ] Return `this` (or the next-step type) from each describing method
- [ ] Put assembly, defaults, and validation behind a terminal method (`order`, `build`, `commit`)
- [ ] Constrain illegal sequences when the domain has real order (kopi vs teh, then modifiers)
- [ ] Keep the teaching Git CLI (`vm.exec("git …")`) for learner-facing paths
```

**Step 1 — Sentence first.** If you cannot read the chain aloud, rename until
you can.

**Step 2 — Hide low-level detail.** The amount of bootstrapping you invest
depends on how much machinery consumers should never see. A drink order should
not mention array joins. A lesson fixture should not mention blob hashing.

**Step 3 — Constrain, don't just chain.** The article's auntie is a
_constrained_ builder: coffee or tea, then modifiers. Illegal combinations
belong in types or terminal-method errors, not in docs the caller must remember.

**Step 4 — Stop when a function is already a sentence.** `snapshotOf(state)` and
`hashObject("blob", content)` are fine. Do not wrap every one-shot helper in
`new Foo().bar().build()`.

## Git Lab surfaces

Apply fluently here:

- Lesson and fixture construction in `lib/curriculum/build.ts` and
  `lib/git-vm/fixtures.ts`
- Author-side test arrangement (not the learner's typed commands)
- Graph / overlay scene setup when several fields must be described together
- New assertion helpers that read like Jest (`expect(sum(1, 2)).toBe(3)`) if
  they remove repeated `assertEquals` noise

Do not fluent-wrap:

- `GitVM.exec` / porcelain dispatch (those strings _are_ the lesson)
- One-argument pure functions
- React/Preact component props that are already declarative

## Naming

- Use domain words, not implementation words: `kopi` / `stage` / `onto`, not
  `setBase` / `mutateIndex` / `applyRebaseFlag`.
- Terminal methods are verbs that finish the sentence: `order()`, `build()`,
  `commit()`, `draw()`.
- Match existing repo terms: worktree, index, HEAD, ref, blob, tree, commit.

## Additional resources

- Call-site examples (Jest, Rails, Kopi Auntie, a Git Lab fixture sketch):
  [examples.md](examples.md)
- Source article:
  https://medium.com/@beeleeong/human-readable-source-codes-988aa997692a
