import { isAbsolute, relative, resolve, sep } from "node:path";

export interface TerminalWidth {
  visibleWidth(text: string): number;
  truncateToWidth(text: string, width: number): string;
  wrapTextWithAnsi(text: string, width: number): string[];
}

export interface FooterColors {
  dim(text: string): string;
  session(text: string): string;
}

export function formatDirectory(cwd: string, home: string): string {
  const path = resolve(cwd);
  const relativeToHome = relative(resolve(home), path);
  if (relativeToHome === "") return "~";
  if (relativeToHome !== ".." && !relativeToHome.startsWith(`..${sep}`) && !isAbsolute(relativeToHome)) {
    return `~${sep}${relativeToHome}`;
  }
  return path;
}

/** Shorten middle directories only; the branch is handled separately. */
export function compactDirectory(dir: string, budget: number, measure: (text: string) => number): string {
  if (measure(dir) <= budget) return dir;
  const parts = dir.split(sep).filter(Boolean);
  const root = dir.startsWith(sep) ? "" : parts[0];
  for (let kept = parts.length - 2; kept >= 1; kept--) {
    const candidate = `${root}${sep}…${sep}${parts.slice(-kept).join(sep)}`;
    if (measure(candidate) <= budget) return candidate;
  }
  return "…";
}

export function alignColumns(left: string, right: string, width: number, terminal: TerminalWidth): string {
  const rightWidth = terminal.visibleWidth(right);
  if (rightWidth + 2 > width) return terminal.truncateToWidth(right, width);
  const leftText = terminal.truncateToWidth(left, width - rightWidth - 2);
  return leftText + " ".repeat(width - terminal.visibleWidth(leftText) - rightWidth) + right;
}

/** Keep the full branch. On narrow terminals give it one or more dedicated rows. */
export function renderLocation(options: {
  dir: string;
  branch: string | null;
  sessionName?: string;
  width: number;
}, terminal: TerminalWidth, colors: FooterColors): string[] {
  const { dir, branch, sessionName, width } = options;
  const branchLabel = branch ? ` (${branch})` : "";
  const sessionWidth = sessionName ? terminal.visibleWidth(sessionName) + 2 : 0;
  const budget = width - sessionWidth - terminal.visibleWidth(branchLabel);
  const path = compactDirectory(dir, budget, terminal.visibleWidth);
  const location = colors.dim(`${path}${branchLabel}`);
  if (terminal.visibleWidth(path) + terminal.visibleWidth(branchLabel) + sessionWidth <= width) {
    return [sessionName ? alignColumns(location, colors.session(sessionName), width, terminal) : location];
  }
  const pathLine = colors.dim(path);
  return [
    sessionName ? alignColumns(pathLine, colors.session(sessionName), width, terminal) : terminal.truncateToWidth(pathLine, width),
    ...(branch ? terminal.wrapTextWithAnsi(colors.dim(`(${branch})`), Math.max(1, width)) : []),
  ];
}
