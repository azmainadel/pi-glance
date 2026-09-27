import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Display-only aliases. Unknown providers retain their real provider ID. */
export const DEFAULT_PROVIDER_ALIASES: Readonly<Record<string, string>> = {
  "openai-codex": "codex",
  "claude-bridge": "claude",
  anthropic: "claude",
  kiro: "kiro",
  zai: "glm",
  "zai-coding": "glm",
  "zai-coding-cn": "glm",
  openrouter: "openrouter",
  "kimi-coding": "kimi",
  moonshot: "kimi",
  xai: "grok",
};

export const THINKING_ALIASES: Readonly<Record<string, string>> = {
  minimal: "min",
  medium: "med",
  high: "hi",
  xhigh: "xhi",
};

export function providerLabel(provider: string, overrides: Readonly<Record<string, string>> = {}): string {
  const key = provider.toLowerCase();
  if (Object.hasOwn(overrides, key)) return overrides[key];
  if (Object.hasOwn(DEFAULT_PROVIDER_ALIASES, key)) return DEFAULT_PROVIDER_ALIASES[key];
  return provider;
}

/** Optional ~/.pi/agent/pi-glance.json; changes take effect after /reload. */
export function loadProviderAliases(agentDir: string): Record<string, string> {
  let contents: string;
  try {
    contents = readFileSync(join(agentDir, "pi-glance.json"), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
  let config: unknown;
  try {
    config = JSON.parse(contents);
  } catch (error) {
    throw new Error("Invalid JSON in pi-glance.json", { cause: error });
  }
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    throw new Error("pi-glance.json must contain an object");
  }
  const aliases = (config as Record<string, unknown>).providerAliases;
  if (aliases === undefined) return {};
  if (typeof aliases !== "object" || aliases === null || Array.isArray(aliases)) {
    throw new Error("providerAliases must be an object of provider IDs to display names");
  }
  const result: Record<string, string> = Object.create(null);
  for (const [key, value] of Object.entries(aliases)) {
    if (typeof value !== "string" || !value.trim() || /[\x00-\x1f\x7f]/.test(value)) {
      throw new Error(`Invalid display name for provider ${key}`);
    }
    result[key.toLowerCase()] = value.trim();
  }
  return result;
}
