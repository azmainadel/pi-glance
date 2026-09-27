import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadProviderAliases, providerLabel } from "../src/config.ts";

test("common provider labels and unknown-provider fallback", () => {
  assert.equal(providerLabel("openai-codex"), "codex");
  assert.equal(providerLabel("zai"), "glm");
  assert.equal(providerLabel("openrouter"), "openrouter");
  assert.equal(providerLabel("kimi-coding"), "kimi");
  assert.equal(providerLabel("xai"), "grok");
  assert.equal(providerLabel("some-new-provider"), "some-new-provider");
  assert.equal(providerLabel("constructor"), "constructor");
  assert.equal(providerLabel("toString"), "toString");
  assert.equal(providerLabel("xai", { xai: "X.AI" }), "X.AI");
});

test("reads optional user aliases and rejects malformed configuration", () => {
  const dir = mkdtempSync(join(tmpdir(), "pi-glance-test-"));
  try {
    assert.deepEqual(loadProviderAliases(dir), {});
    const file = join(dir, "pi-glance.json");
    writeFileSync(file, JSON.stringify({ providerAliases: { "my-provider": "My AI" } }));
    assert.equal(providerLabel("my-provider", loadProviderAliases(dir)), "My AI");
    writeFileSync(file, "{invalid");
    assert.throws(() => loadProviderAliases(dir), /Invalid JSON/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
