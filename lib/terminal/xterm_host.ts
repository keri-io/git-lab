const PROMPT = "git-lab> ";
const STDOUT = "\x1b[38;2;205;214;244m";
const STDERR = "\x1b[38;2;243;139;168m";
const RESET = "\x1b[0m";
const DIM = "\x1b[38;2;108;112;134m";

export interface XtermHost {
  writeStdout(text: string): void;
  writeStderr(text: string): void;
  writeln(text: string): void;
  echoCommand(line: string): void;
  prompt(): void;
  dispose(): void;
  fit(): void;
  focus(): void;
}

export interface TabCycle {
  prefix: string;
  index: number;
}

/** Next Tab completion from `allowedCommands`. Cycles the match set for `prefix`. */
export function nextTabComplete(
  buffer: string,
  allowed: readonly string[],
  cycle: TabCycle | null,
): { value: string; cycle: TabCycle } | null {
  if (allowed.length === 0) return null;
  const prefix = cycle?.prefix ?? buffer;
  const matches = allowed.filter((cmd) => cmd.startsWith(prefix)).toSorted();
  if (matches.length === 0) return null;
  const index = cycle ? (cycle.index + 1) % matches.length : 0;
  const value = matches[index];
  if (value === undefined) return null;
  return { value, cycle: { prefix, index } };
}

function pickExport<T>(mod: unknown, name: string): T {
  const rec = mod as Record<string, unknown>;
  if (typeof rec[name] === "function") return rec[name] as T;
  const def = rec.default as Record<string, unknown> | undefined;
  if (def && typeof def[name] === "function") return def[name] as T;
  if (typeof rec.default === "function") return rec.default as T;
  throw new Error(`Cannot load ${name} from UMD module`);
}

function toCrlf(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
}

/**
 * Attach xterm.js to a div. Dynamic import so Fresh SSR never loads xterm
 * (it touches `document` at module init).
 */
export async function attachXterm(
  container: HTMLElement,
  onLine: (line: string) => void,
  allowedCommands: readonly string[] = [],
): Promise<XtermHost> {
  const cssReady = import("xterm/css/xterm.css");
  const [xtermStar, fitStar] = await Promise.all([
    import("xterm"),
    import("xterm-addon-fit"),
  ]);
  await cssReady;
  type TerminalInstance = {
    loadAddon: (addon: { fit?: () => void }) => void;
    open: (el: HTMLElement) => void;
    write: (s: string) => void;
    clear: () => void;
    dispose: () => void;
    focus: () => void;
    onData: (cb: (data: string) => void) => void;
    element?: HTMLElement;
  };
  type TerminalCtor = new (opts: Record<string, unknown>) => TerminalInstance;
  type FitAddonInstance = { fit: () => void };
  type FitAddonCtor = new () => FitAddonInstance;
  const Terminal = pickExport<TerminalCtor>(xtermStar, "Terminal");
  const FitAddon = pickExport<FitAddonCtor>(fitStar, "FitAddon");

  const term = new Terminal({
    cursorBlink: true,
    convertEol: true,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: 13,
    scrollback: 2000,
    theme: {
      background: "#1e1e2e",
      foreground: "#cdd6f4",
      cursor: "#f5e0dc",
      cursorAccent: "#1e1e2e",
      selectionBackground: "#585b70",
      black: "#45475a",
      red: "#f38ba8",
      green: "#a6e3a1",
      yellow: "#f9e2af",
      blue: "#89b4fa",
      magenta: "#cba6f7",
      cyan: "#94e2d5",
      white: "#bac2de",
      brightBlack: "#585b70",
      brightRed: "#f38ba8",
      brightGreen: "#a6e3a1",
      brightYellow: "#f9e2af",
      brightBlue: "#89b4fa",
      brightMagenta: "#cba6f7",
      brightCyan: "#94e2d5",
      brightWhite: "#a6adc8",
    },
    disableStdin: false,
  });
  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(container);

  const applyFit = () => {
    fitAddon.fit();
    const el = term.element;
    if (el) el.style.height = "100%";
  };
  applyFit();

  const ro = new ResizeObserver(() => {
    applyFit();
  });
  ro.observe(container);

  let buffer = "";
  const history: string[] = [];
  let histIdx = -1;
  let draft = "";
  let tabCycle: TabCycle | null = null;

  const prompt = () => {
    term.write(PROMPT);
  };

  const clearInput = () => {
    term.write("\r\x1b[K");
    term.write(PROMPT);
  };

  const setBuffer = (next: string) => {
    buffer = next;
    clearInput();
    term.write(buffer);
  };

  prompt();

  term.onData((data) => {
    if (data === "\t") {
      const next = nextTabComplete(buffer, allowedCommands, tabCycle);
      if (!next) return;
      tabCycle = next.cycle;
      setBuffer(next.value);
      return;
    }
    if (data === "\r") {
      const line = buffer;
      term.write("\r\n");
      buffer = "";
      draft = "";
      histIdx = -1;
      tabCycle = null;
      if (line.trim()) history.push(line);
      onLine(line);
      prompt();
      return;
    }
    if (data === "\x7f" || data === "\b") {
      tabCycle = null;
      if (buffer.length === 0) return;
      buffer = buffer.slice(0, -1);
      term.write("\b \b");
      return;
    }
    if (data === "\x1b[A") {
      if (history.length === 0) return;
      tabCycle = null;
      if (histIdx === -1) {
        draft = buffer;
        histIdx = history.length - 1;
      } else if (histIdx > 0) {
        histIdx -= 1;
      }
      setBuffer(history[histIdx] ?? "");
      return;
    }
    if (data === "\x1b[B") {
      if (histIdx === -1) return;
      tabCycle = null;
      if (histIdx < history.length - 1) {
        histIdx += 1;
        setBuffer(history[histIdx] ?? "");
      } else {
        histIdx = -1;
        setBuffer(draft);
      }
      return;
    }
    if (data === "\x03") {
      term.write("^C\r\n");
      buffer = "";
      draft = "";
      histIdx = -1;
      tabCycle = null;
      prompt();
      return;
    }
    if (data === "\x0c") {
      term.clear();
      prompt();
      term.write(buffer);
      return;
    }
    if (data === "\x1b[C" || data === "\x1b[D") return;
    if (data.startsWith("\x1b")) return;
    const printable = data.replace(/[\r\n]+/g, "");
    if (!printable) return;
    tabCycle = null;
    buffer += printable;
    term.write(printable);
  });

  const writeColored = (color: string, text: string) => {
    if (!text) return;
    const body = toCrlf(text);
    const needsNl = !body.endsWith("\r\n") && !body.endsWith("\n");
    term.write(`${color}${body}${needsNl ? "\r\n" : ""}${RESET}`);
  };

  return {
    writeStdout(text: string) {
      writeColored(STDOUT, text);
    },
    writeStderr(text: string) {
      writeColored(STDERR, text);
    },
    writeln(text: string) {
      writeColored(DIM, text);
    },
    echoCommand(line: string) {
      buffer = "";
      draft = "";
      histIdx = -1;
      tabCycle = null;
      term.write(`\r\x1b[K${PROMPT}${line}\r\n`);
    },
    prompt() {
      term.write(PROMPT);
    },
    dispose() {
      ro.disconnect();
      term.dispose();
    },
    fit() {
      applyFit();
    },
    focus() {
      term.focus();
    },
  };
}
