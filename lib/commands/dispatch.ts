import { cloneJson } from "../git-vm/clone.ts";
import { beginEvents, takeEvents } from "../git-vm/events.ts";
import { GitError } from "../git-vm/repo.ts";
import { coerceBare } from "../git-vm/snapshot.ts";
import type { GitEvent, GitState } from "../git-vm/types.ts";
import { dispatchGit } from "./porcelain.ts";
import { parseArgv } from "./parse.ts";

export interface DispatchResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  state: GitState;
  events: GitEvent[];
}

/** Implemented in commands/*.ts — keep this signature stable. */
export function runCommand(state: GitState, line: string): DispatchResult {
  const trimmed = line.trim();
  const next = coerceBare(cloneJson(state));
  beginEvents(next);
  if (!trimmed) {
    return { ok: true, stdout: "", stderr: "", state: next, events: [] };
  }
  try {
    const argv = parseArgv(trimmed);
    const result = dispatchGit(next, argv);
    return { ...result, state: next, events: takeEvents(next) };
  } catch (err) {
    if (err instanceof GitError) {
      return {
        ok: false,
        stdout: "",
        stderr: err.message,
        state: next,
        events: takeEvents(next),
      };
    }
    throw err;
  }
}
