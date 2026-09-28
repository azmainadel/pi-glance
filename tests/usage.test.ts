import assert from "node:assert/strict";
import { test } from "node:test";
import type { SessionEntry } from "@earendil-works/pi-coding-agent";
import { calculateUsage, formatTokens } from "../src/usage";

const usage = (input: number, output: number, cacheRead = 0, cacheWrite = 0, cost = 0) => ({
  input, output, cacheRead, cacheWrite, cost: { total: cost },
});
const entry = (data: object) => data as SessionEntry;

test("totals include all persisted usage, including tools and summaries", () => {
  const result = calculateUsage([
    entry({ type: "message", message: { role: "assistant", usage: usage(10, 2, 30, 10, 0.1) } }),
    entry({ type: "usage", usage: usage(1, 0, 2, 0, 0.01) }),
    entry({ type: "message", message: { role: "toolResult", usage: usage(3, 1, 0, 0, 0.02) } }),
    entry({ type: "compaction", usage: usage(4, 5, 0, 0, 0.03) }),
    entry({ type: "branch_summary", usage: usage(6, 7, 0, 0, 0.04) }),
  ]);
  assert.deepEqual(result, { input: 24, output: 15, cacheRead: 32, cacheWrite: 10, cost: 0.2 });
});

test("token formatting follows Pi thresholds", () => {
  assert.equal(formatTokens(999), "999");
  assert.equal(formatTokens(1000), "1.0k");
  assert.equal(formatTokens(12000), "12k");
  assert.equal(formatTokens(1234567), "1.2M");
});
