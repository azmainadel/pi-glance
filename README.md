# Pi Glance

A compact, low-contrast, three-line footer for [Pi](https://pi.dev). Shows the current directory and Git branch, session name (soft gold, right-aligned), session token totals and latest request cache hit, context usage, model, and Pi Lens LSP status when available.

```text
~/Developer/project (feature/my-branch)                              my session
✨ ↑41k ↓2.3k ♻️ 274k 🎯 97.6% 💰 $0.008       🧠 7.9% / 272k (auto)
🧩 LSP Inactive                                      codex · gpt-6-luna · med
```

Directory paths compact from the middle (`~/…/project`) as space runs out; **branch names are never shortened**. If a branch cannot fit on the first line, it moves to its own row. The model and context information stay right-aligned.

## Install

From a local clone:

```bash
pi install ~/Developer/pi-glance
```

Or from this GitHub repository directly:

```bash
pi install git:github.com/azmainadel/pi-glance
```

Then start Pi again (or run `/reload`). **Remove any other custom-footer extension first**: Pi allows only one active footer factory, and whichever extension sets it last wins. In particular, if you previously copied `~/.pi/agent/extensions/pi-glance.ts`, move or remove that standalone file before installing this package. `pi list` lists configured packages; `pi remove <source>` removes one.

This repository is a Pi **Git package**, not an npm release (`private: true`). No remote is configured here; add your own when ready.

## Provider labels

Display names never change the actual provider selection or API requests. Defaults live in [`src/config.ts`](src/config.ts): Codex, Claude/Anthropic, Kiro, GLM (`zai`), OpenRouter, Kimi (Kimi Coding/Moonshot), and Grok (`xai`). Unknown provider IDs are shown unchanged. To override or extend them without editing the package, create `~/.pi/agent/pi-glance.json`:

```json
{
  "providerAliases": {
    "my-provider": "My AI",
    "openrouter": "Router"
  }
}
```

Keys match Pi provider IDs (case-insensitive). Changes take effect after `/reload`. Invalid JSON triggers a warning and uses the built-in names.

## Reading the footer

- `↑` / `↓`: cumulative input/output tokens for **all persisted session entries**, including compactions and tool/summarization usage.
- `♻️`: cumulative cached input tokens. `W` appears if there are cache-write tokens. `🎯`: cache-hit rate of the **latest assistant request** (not the cumulative average).
- `💰`: Pi's estimated session cost; it can differ from your actual subscription bill.
- `🧠`: current estimated context/window; `(auto)` appears when automatic compaction is enabled in the saved effective settings. Pi does not expose this live setting to extension contexts, so Pi Glance re-reads the saved settings on a 2s timer instead of on every render; the display may briefly lag after changes in `/settings`.
- Provider label, model ID, and thinking level are display-only. `med`, `hi`, and `xhi` abbreviate Pi's levels.
- `🧩`: Pi Lens LSP status if published; otherwise it says `LSP status unavailable`—not `Inactive`.

## Common questions

- **Why does `🎯` differ wildly from my average?** It is the cache-hit rate of the most recent assistant request only. A single uncached turn drops it; that is expected, not a bug.
- **Why is `💰` not my bill?** It is Pi's own estimate of session cost. Subscriptions, enterprise rates, and rounding are not reflected.
- **Why do my token totals grow after a compaction?** `↑`/`↓`/`♻️` sum every persisted entry, including compaction and summarization calls. They are a session-lifetime total, not the current context.
- **Why does `(auto)` lag for a second after I change `/settings`?** Pi does not expose the live setting to extensions. Pi Glance re-reads the saved settings on a timer, so the footer can briefly be stale.
- **Why does the branch disappear?** It is never truncated — it moves to its own row, wrapping as needed. On a very narrow terminal even that is clipped, so widen the window or shorten the branch.
- **Is `🧩 LSP Inactive` the same as `LSP status unavailable`?** No. `Inactive` is Pi Lens reporting a stopped language server. `LSP status unavailable` means Pi Lens is not installed or not running, so Pi Glance has nothing to read.

## Development

```bash
npm install
npm test
npm run typecheck
pi --no-extensions -e ./extensions/index.ts
```

The extension entry lives in `extensions/index.ts`; `src/usage.ts`, `src/layout.ts`, and `src/config.ts` hold the testable accounting, terminal layout, and provider aliases. Relative imports are extensionless, matching how Pi's jiti-based loader resolves the extension. Tests use Node's built-in runner through `jiti/register` (Node 22+), so they exercise the same resolution the TUI does. Pi provides its runtime packages; they are peer dependencies rather than bundled libraries.

## License

MIT; see [LICENSE](LICENSE).
