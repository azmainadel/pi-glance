import assert from "node:assert/strict";
import { test } from "node:test";
import { sep } from "node:path";
import { alignColumns, compactDirectory, formatDirectory, renderLocation } from "../src/layout";

const terminal = {
  visibleWidth: (s: string) => Array.from(s.replace(/\x1b\[[0-9;]*m/g, "")).length,
  truncateToWidth: (s: string, width: number) => Array.from(s).slice(0, Math.max(0, width)).join(""),
  wrapTextWithAnsi: (s: string, width: number) => s.match(new RegExp(`.{1,${width}}`, "g")) ?? [],
};
const colors = { dim: (s: string) => s, session: (s: string) => s };

test("shows home-relative paths, but not sibling directories", () => {
  assert.equal(formatDirectory(`/home/adel/work/app`, `/home/adel`), `~${sep}work${sep}app`);
  assert.equal(formatDirectory(`/home/adel-other/work`, `/home/adel`), `/home/adel-other/work`);
});

test("compacts middle directories while keeping project name", () => {
  assert.equal(compactDirectory("~/Developer/monsha/app", 15, terminal.visibleWidth), "~/…/monsha/app");
  assert.equal(compactDirectory("~/Developer/monsha/app", 7, terminal.visibleWidth), "~/…/app");
});

test("aligns session name right without shortening the branch", () => {
  const lines = renderLocation({
    dir: "~/Developer/monsha/app", branch: "feature/long-branch", sessionName: "Dev", width: 42,
  }, terminal, colors);
  assert.equal(lines.length, 1);
  assert.ok(lines[0].includes("(feature/long-branch)"));
  assert.ok(lines[0].endsWith("Dev"));
  assert.equal(terminal.visibleWidth(lines[0]), 42);
});

test("wraps the complete branch on narrow terminals instead of truncating it", () => {
  const lines = renderLocation({ dir: "~/Developer/monsha/app", branch: "feature/long-branch", sessionName: "Dev", width: 20 }, terminal, colors);
  assert.ok(lines.length > 1);
  assert.equal(lines.slice(1).join(""), "(feature/long-branch)");
  assert.ok(lines.every((line) => terminal.visibleWidth(line) <= 20));
});

test("keeps right side visible when other columns are too wide", () => {
  assert.equal(alignColumns("long left", "right", 8, terminal), "l  right");
});
