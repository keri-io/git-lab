/** Simple argv split that respects single and double quotes. */

export function parseArgv(line: string): string[] {
  const tokens: string[] = [];
  const s = line.trim();
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    if (s[i] === '"' || s[i] === "'") {
      const q = s[i++];
      let tok = "";
      while (i < s.length && s[i] !== q) tok += s[i++];
      if (i < s.length) i++;
      tokens.push(tok);
    } else {
      let tok = "";
      while (i < s.length && !/\s/.test(s[i])) tok += s[i++];
      tokens.push(tok);
    }
  }
  return tokens;
}

export function takeFlag(args: string[], name: string): boolean {
  const i = args.indexOf(name);
  if (i === -1) return false;
  args.splice(i, 1);
  return true;
}

export function takeOption(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const val = args[i + 1];
  args.splice(i, val === undefined ? 1 : 2);
  return val;
}
