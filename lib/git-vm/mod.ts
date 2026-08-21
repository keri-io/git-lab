import { cloneJson } from "./clone.ts";
import { coerceBare, snapshotOf } from "./snapshot.ts";
import type { CommandResult, GitEvent, GitState, Snapshot } from "./types.ts";
import { emptyState } from "./fixtures.ts";
import { runCommand } from "../commands/dispatch.ts";

export class GitVM {
  #state: GitState;

  constructor(state?: GitState) {
    this.#state = coerceBare(cloneJson(state ?? emptyState()));
  }

  get state(): GitState {
    return this.#state;
  }

  snapshot(): Snapshot {
    return snapshotOf(this.#state);
  }

  reset(state: GitState): void {
    this.#state = coerceBare(cloneJson(state));
  }

  exec(line: string): CommandResult {
    const before = snapshotOf(this.#state);
    const result = runCommand(this.#state, line);
    this.#state = result.state;
    const snapshot = snapshotOf(this.#state);
    const events: GitEvent[] = [...result.events];
    const wasDangling = new Set(
      before.commits.filter((c) => c.dangling).map((c) => c.id),
    );
    const existed = new Set(before.commits.map((c) => c.id));
    for (const c of snapshot.commits) {
      if (c.dangling && existed.has(c.id) && !wasDangling.has(c.id)) {
        events.push({ type: "dangling", payload: { id: c.id } });
      }
    }
    return {
      ok: result.ok,
      stdout: result.stdout,
      stderr: result.stderr,
      snapshot,
      events,
    };
  }
}

export { activeWorktree, resolveHead, snapshotOf } from "./snapshot.ts";
export {
  bareFromOrigin,
  emptyState,
  makeCommit,
  originFixture,
  seededLocalFromOrigin,
} from "./fixtures.ts";
export * from "./types.ts";
