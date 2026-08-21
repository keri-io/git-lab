# Examples

Call sites from
[Human-readable Source Codes](https://medium.com/@beeleeong/human-readable-source-codes-988aa997692a),
plus a Git Lab-shaped sketch.

## Jest — fluent assertions

The words parse as English. `expect` and `toBe` are framework methods, not JS
keywords.

```javascript
test("adds 1 + 2 to equal 3", () => {
  expect(sum(1, 2)).toBe(3);
});
```

## Rails — internal DSL

`get`, `post`, and `patch` are not Ruby keywords. Rails defines them so routing
reads as a domain vocabulary.

```ruby
Rails.application.routes.draw do
  get "book/list"
  get "book/new"
  post "book/create"
  patch "book/update"
  get "book/show"
end
```

Hosted at `https://awesome.server.com`, that means (among others):

- `GET https://awesome.server.com/book/list`
- `POST https://awesome.server.com/book/create`

## Kopi Auntie — constrained builder

Reconstructed from the article: a drink-stall auntie (Malaysia / Singapore)
taking an order in local lingo. Running `kopi().o().ping().order()` yields
`Kopi O Ping` — iced coffee without milk.

Runnable file: `scripts/kopi_auntie.ts`.

```typescript
const drink = new DrinkStallAuntie().kopi().o().ping().order();
// "Kopi O Ping"
```

Lingo the builder understands:

| Method             | Meaning         |
| ------------------ | --------------- |
| `kopi()` / `teh()` | coffee / tea    |
| `o()`              | black, no milk  |
| `c()`              | evaporated milk |
| `kosong()`         | no sugar        |
| `ping()`           | iced            |

## Git Lab — author-side fixture (sketch)

Learner-facing code stays as `vm.exec("git …")`. Author-side setup may read as a
sentence:

```typescript
const start = new LessonRepo()
  .file("README.md", "# demo\n")
  .stage("README.md")
  .commit("initial")
  .build();
```

That hides blob hashing, tree writing, and ref updates behind `commit()` /
`build()`, the same way `order()` hides string joining in the auntie example.
