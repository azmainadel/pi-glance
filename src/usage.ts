import type { SessionEntry } from "@earendil-works/pi-coding-agent";

export interface UsageStats {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
}

/** Mirrors Pi's default footer: cumulative totals across all persisted entries. */
export function calculateUsage(entries: readonly SessionEntry[]): UsageStats {
  const totals: UsageStats = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    cost: 0,
  };
  for (const entry of entries) {
    let usage;
    if (entry.type === "usage") usage = entry.usage;
    else if (entry.type === "message" && entry.message.role === "assistant")
      usage = entry.message.usage;
    else if (entry.type === "message" && entry.message.role === "toolResult")
      usage = entry.message.usage;
    else if (entry.type === "branch_summary" || entry.type === "compaction")
      usage = entry.usage;
    if (!usage) continue;
    totals.input += usage.input;
    totals.output += usage.output;
    totals.cacheRead += usage.cacheRead;
    totals.cacheWrite += usage.cacheWrite;
    totals.cost += usage.cost.total;
  }
  return totals;
}

export function formatTokens(count: number): string {
  if (count < 1000) return `${count}`;
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1000000) return `${Math.round(count / 1000)}k`;
  if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
  return `${Math.round(count / 1000000)}M`;
}
