/** Deterministic fake SHA-1 (not cryptographic). Teaching hashes only.
 *
 * Five independent 32-bit mixers (FNV-1a style update + murmur-ish finalizer)
 * concatenated to 40 hex chars. Earlier this was `(a+b)+(a+b)` — a 16-char
 * block repeated — so cat-file tree ids looked like `639b4cacd70ba482` twice.
 */
const SEEDS = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];

function mix32(payload: string, seed: number): string {
  let h = seed >>> 0;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
    h = (h + Math.imul(i + 1, seed ^ 0x9e3779b9)) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function hashContent(payload: string): string {
  let out = "";
  for (let s = 0; s < SEEDS.length; s++) {
    out += mix32(`${s}:${payload}`, SEEDS[s]);
  }
  return out.slice(0, 40);
}

export function hashObject(
  type: "blob" | "tree" | "commit",
  body: string,
): string {
  return hashContent(`${type} ${body.length}\0${body}`);
}
