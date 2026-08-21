# Goals

Git Lab teaches Git by letting people **see** objects, refs, and the three
trees, then **type** the same commands they will use at work. These three
commitments govern how we write the product and the source.

## 1. Source that reads as English

Codes are conversations. Call sites should parse as a sentence, not as a
protocol the reader has to compile in their head
([Human-readable Source Codes](https://medium.com/@beeleeong/human-readable-source-codes-988aa997692a)).

- Learners type real Git. `GitVM.exec("git …")` stays the teaching CLI.
- Authors speak in fluent builders:
  `speak("tags", "…").says().learn().allow().demo().then().ask().pass().build()`.
- Tests and fixtures chain as the work:
  `vm.file().stage().commit().branch().onto()`.
- Diagrams are a small vocabulary of scene ops (`card`, `edge`, `chain`, …),
  painted by one interpreter.

We do not wrap the learner-facing command line in a cute DSL. The classroom
language is Git. The author language is TypeScript that sounds like what we
mean.

## 2. Steadfast optimisation

Smaller, clearer, same behaviour. We cut ceremony, duplication, and extra files.
We do not cut lessons, quizzes, allow-lists, or visual beats to win a line-count
contest.

- Prefer one painter and a scene list over twenty-three copy-pasted SVGs.
- Prefer one helper over three identical DFS walks or merge-abort blocks.
- Measure in tracked source, keep functionality, and refuse patches that grow
  the tree without teaching more.
- When a well-documented algorithm already exists (topo sort, flyweight,
  interpreter, scene graph), use it instead of inventing a parallel one.

Optimisation that makes the source _less_ speakable is a regression. So is
“readable” code that balloons the repo.

## 3. Resources for visual learners

Git is a graph of immutable objects with moving labels. Many people learn it
faster when that graph is on screen, captioned, and in step with the command
they just ran.

- Every lesson has a notes illustration and viz beats 1:1 with `demoScript`.
- The commit DAG, three-trees overlay, stash inset, and index stages are
  first-class teaching surfaces, not decoration.
- Captions say what just moved (a ref, a tree, a dangling object), not generic
  “success” copy.
- Play demo must still reach `goalCheck`. If the picture and the VM disagree,
  the picture is wrong.

We keep building for people who need to _see_ `HEAD`, `origin/main`, and a
conflicted index before the words stick.

## How we judge a change

A change belongs here if it does at least one of these and breaks none:

1. Makes an author call site easier to read aloud.
2. Shrinks or simplifies the implementation without dropping behaviour.
3. Makes the graph, illustration, or caption clearer for a visual learner.

The skill that encodes (1) lives in
`.cursor/skills/human-readable-source-codes/`. Run the suite with
`deno task test` before you claim (2) or (3).
