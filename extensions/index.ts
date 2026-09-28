import { homedir } from "node:os";
import {
  getAgentDir,
  SettingsManager,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import {
  truncateToWidth,
  visibleWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";
import {
  loadProviderAliases,
  providerLabel,
  THINKING_ALIASES,
} from "../src/config";
import {
  alignColumns,
  formatDirectory,
  renderLocation,
} from "../src/layout";
import { calculateUsage, formatTokens } from "../src/usage";

/**
 * Pi does not expose the live compaction setting to extension contexts, so we
 * re-read the saved effective settings from a timer. Reading is off the render
 * path; render() only reads the cached boolean.
 */
const SETTINGS_REFRESH_MS = 2000;

function readAutoCompactionEnabled(cwd: string, projectTrusted: boolean): boolean {
  return SettingsManager.create(cwd, getAgentDir(), { projectTrusted })
    .getCompactionEnabled();
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode !== "tui") return;

    const cwd = ctx.sessionManager.getCwd();
    const projectTrusted = ctx.isProjectTrusted();
    let autoCompactEnabled = readAutoCompactionEnabled(cwd, projectTrusted);

    let providerAliases: Record<string, string> = {};
    try {
      providerAliases = loadProviderAliases(getAgentDir());
    } catch (error) {
      ctx.ui.notify(`Pi Glance: ${String(error)}`, "warning");
    }

    ctx.ui.setFooter((tui, theme, footerData) => {
      const unsubscribe = footerData.onBranchChange(() => tui.requestRender());
      const terminal = { truncateToWidth, visibleWidth, wrapTextWithAnsi };
      const settingsTimer = setInterval(() => {
        try {
          autoCompactEnabled = readAutoCompactionEnabled(cwd, projectTrusted);
        } catch {
          // Keep the last known value; /settings is validated by Pi itself.
        }
      }, SETTINGS_REFRESH_MS);
      settingsTimer.unref?.();
      return {
        dispose() {
          clearInterval(settingsTimer);
          unsubscribe();
        },
        invalidate() {},
        render(width: number): string[] {
          const tokens = calculateUsage(ctx.sessionManager.getEntries());
          const model = ctx.model;
          const thinking = ctx.thinkingLevel;
          const thinkingLabel = thinking
            ? (THINKING_ALIASES[thinking] ?? thinking)
            : "";
          const context = ctx.getContextUsage();
          const contextText =
            context?.percent != null
              ? `${context.percent.toFixed(1)}% / ${formatTokens(context.contextWindow)}`
              : "context n/a";

          const location = renderLocation(
            {
              dir: formatDirectory(ctx.sessionManager.getCwd(), homedir()),
              branch: footerData.getGitBranch(),
              sessionName: ctx.sessionManager
                .getSessionName()
                ?.replace(/[\x00-\x1f\x7f]/g, " ")
                .trim(),
              width,
            },
            terminal,
            {
              dim: (text: string) => theme.fg("dim", text),
              session: (text: string) => {
                const gold =
                  theme.getColorMode() === "truecolor"
                    ? "\x1b[38;2;181;158;101m"
                    : "\x1b[38;5;143m";
                return `${gold}${text}\x1b[39m`;
              },
            },
          );
          const stats = theme.fg(
            "dim",
            [
              "✨",
              `↑${formatTokens(tokens.input)}`,
              `↓${formatTokens(tokens.output)}`,
              "♻️",
              `${formatTokens(tokens.cacheRead)}`,
              ...(tokens.cacheWrite
                ? [`W${formatTokens(tokens.cacheWrite)}`]
                : []),
              ...(tokens.latestCacheHit !== undefined &&
              (tokens.cacheRead || tokens.cacheWrite)
                ? [`🎯 ${tokens.latestCacheHit.toFixed(1)}%`]
                : []),
              "💰",
              `$${tokens.cost.toFixed(3)}`,
            ].join(" "),
          );
          const usageText = theme.fg(
            "dim",
            `🧠 ${contextText}${autoCompactEnabled ? " (auto)" : ""}`,
          );
          const lsp =
            footerData.getExtensionStatuses().get("pi-lens-lsp") ??
            "LSP status unavailable";
          const modelText = theme.fg(
            "dim",
            [
              providerLabel(model?.provider ?? "", providerAliases),
              model?.id.replace(/[\x00-\x1f\x7f]/g, " "),
              thinkingLabel,
            ]
              .filter(Boolean)
              .join(" · "),
          );
          return [
            ...location,
            alignColumns(stats, usageText, width, terminal),
            alignColumns(
              theme.fg("dim", `🧩 ${lsp}`),
              modelText,
              width,
              terminal,
            ),
          ];
        },
      };
    });
  });
}
