import type { GitEvent } from "./types.ts";

const bags = new WeakMap<object, GitEvent[]>();

export function beginEvents(owner: object): void {
  bags.set(owner, []);
}

export function emit(owner: object, type: string, payload?: unknown): void {
  const list = bags.get(owner);
  if (!list) return;
  list.push(payload === undefined ? { type } : { type, payload });
}

export function takeEvents(owner: object): GitEvent[] {
  return bags.get(owner) ?? [];
}
