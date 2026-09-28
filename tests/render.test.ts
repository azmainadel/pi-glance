import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { visibleWidth } from "@earendil-works/pi-tui";
import register from "../extensions/index";

test("extension registers a footer that renders session, full branch and provider", async () => {
  const handlers = new Map<string, Function>();
  let footerFactory: Function | undefined;
  const pi = { on(name: string, handler: Function) { handlers.set(name, handler); } } as unknown as ExtensionAPI;
  register(pi);
  const ctx = {
    mode: "tui",
    isProjectTrusted: () => false,
    ui: { notify() {}, setFooter(factory: Function) { footerFactory = factory; } },
    sessionManager: { getCwd: () => "/tmp", getSessionName: () => "My session", getEntries: () => [] },
    model: { provider: "openai-codex", id: "gpt-example" },
    thinkingLevel: "medium",
    getContextUsage: () => ({ percent: 5, contextWindow: 100000 }),
  } as unknown as ExtensionContext;
  await handlers.get("session_start")?.({}, ctx);
  assert.ok(footerFactory);
  const theme = { fg: (_color: string, text: string) => text, getColorMode: () => "truecolor" };
  const data = {
    onBranchChange: () => () => {},
    getGitBranch: () => "feature/a-long-branch",
    getExtensionStatuses: () => new Map([["pi-lens-lsp", "LSP Inactive"]]),
  };
  const component = footerFactory({}, theme, data);
  const lines: string[] = component.render(70);
  const plain = lines.map((line) => line.replace(/\x1b\[[0-9;]*m/g, ""));
  assert.ok(plain[0].includes("(feature/a-long-branch)"));
  assert.ok(plain[0].endsWith("My session"));
  assert.ok(plain.some((line) => line.includes("codex · gpt-example · med")));
  assert.ok(lines.every((line) => visibleWidth(line) <= 70));
  component.dispose();
});
