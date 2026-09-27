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

Or from a GitHub repository once published:

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
- `🧠`: current estimated context/window; `(auto)` appears when automatic compaction is enabled in the saved effective settings. Pi does not expose this live setting to extension contexts, so Pi Glance checks the saved setting at most once per second; the display may briefly lag after changes in `/settings`.
- Provider label, model ID, and thinking level are display-only. `med`, `hi`, and `xhi` abbreviate Pi's levels.
- `🧩`: Pi Lens LSP status if published; otherwise it says `LSP status unavailable`—not `Inactive`.

## Development

```bash
npm install
npm test
npm run typecheck
pi --no-extensions -e ./extensions/index.ts
```

The extension entry lives in `extensions/index.ts`; `src/usage.ts`, `src/layout.ts`, and `src/config.ts` hold the testable accounting, terminal layout, and provider aliases. Tests use Node's built-in test runner (Node 22+). Pi provides its runtime packages; they are peer dependencies rather than bundled libraries.

## License

MIT; see [LICENSE](LICENSE).
