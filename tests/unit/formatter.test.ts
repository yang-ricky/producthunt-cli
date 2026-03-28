import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePost, parseUser, parseTopic, parseCollection } from "../../src/backends/graphql.js";
import {
  formatPostsTable,
  formatPostDetail,
  formatUserDetail,
  formatTopicsTable,
  formatCollectionsTable,
} from "../../src/formatter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "..", "fixtures");

function loadFixture(name: string) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf-8"));
}

/** Capture console.log output and strip ANSI codes */
function captureLog(fn: () => void): string {
  const logs: string[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
    logs.push(args.map(String).join(" "));
  });
  fn();
  spy.mockRestore();
  // Strip ANSI escape codes for reliable matching
  return logs.join("\n").replace(/\x1B\[[0-9;]*m/g, "");
}

describe("formatPostsTable", () => {
  it("outputs a table with all posts", () => {
    const fixture = loadFixture("posts-response.json");
    const posts = fixture.data.posts.edges.map((e: { node: Record<string, unknown> }) => parsePost(e.node));

    const output = captureLog(() => formatPostsTable(posts));

    expect(output).toContain("DevTools Pro");
    expect(output).toContain("DesignFlow");
    expect(output).toContain("NoteAI");
    expect(output).toContain("342");
    expect(output).toContain("215");
  });
});

describe("formatPostDetail", () => {
  it("outputs post details with comments", () => {
    const fixture = loadFixture("post-response.json");
    const post = parsePost(fixture.data.post);

    const output = captureLog(() => formatPostDetail(post));

    expect(output).toContain("DevTools Pro");
    expect(output).toContain("The ultimate developer toolkit");
    expect(output).toContain("devtools.pro");
    expect(output).toContain("342");
    expect(output).toContain("@alicechen");
    expect(output).toContain("Comments");
    expect(output).toContain("amazing");
    expect(output).toContain("@bobsmith");
  });
});

describe("formatUserDetail", () => {
  it("outputs user details", () => {
    const fixture = loadFixture("user-response.json");
    const user = parseUser(fixture.data.user);

    const output = captureLog(() => formatUserDetail(user));

    expect(output).toContain("Alice Chen");
    expect(output).toContain("@alicechen");
    expect(output).toContain("Founder @ DevTools Pro");
    expect(output).toContain("alicechen.dev");
    expect(output).toContain("@alicechen_dev");
    expect(output).toContain("Yes"); // isMaker
  });
});

describe("formatTopicsTable", () => {
  it("outputs topics table", () => {
    const fixture = loadFixture("topics-response.json");
    const topics = fixture.data.topics.edges.map((e: { node: Record<string, unknown> }) => parseTopic(e.node));

    const output = captureLog(() => formatTopicsTable(topics));

    expect(output).toContain("Developer Tools");
    // "Artificial Intelligence" may be word-wrapped in narrow column, check parts
    expect(output).toContain("Artificial");
    expect(output).toContain("Intelligence");
    expect(output).toContain("5230");
    expect(output).toContain("42100");
  });
});

describe("formatCollectionsTable", () => {
  it("outputs collections table", () => {
    const fixture = loadFixture("collections-response.json");
    const collections = fixture.data.collections.edges.map(
      (e: { node: Record<string, unknown> }) => parseCollection(e.node),
    );

    const output = captureLog(() => formatCollectionsTable(collections));

    expect(output).toContain("Best AI Tools 2026");
    // "Remote Work Essentials" may be word-wrapped, check parts
    expect(output).toContain("Remote Work");
    expect(output).toContain("Essentials");
    expect(output).toContain("@alicechen");
  });
});
