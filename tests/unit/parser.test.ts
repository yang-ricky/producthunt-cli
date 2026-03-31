import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseCollection, parsePageInfo, parsePost, parseTopic, parseUser } from "../../src/backends/graphql.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "..", "fixtures");

function loadFixture(name: string) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf-8"));
}

describe("parseUser", () => {
  it("parses user from fixture data", () => {
    const fixture = loadFixture("user-response.json");
    const user = parseUser(fixture.data.user);

    expect(user.id).toBe("111");
    expect(user.name).toBe("Alice Chen");
    expect(user.username).toBe("alicechen");
    expect(user.headline).toBe("Founder @ DevTools Pro");
    expect(user.isMaker).toBe(true);
    expect(user.isFollowing).toBe(false);
    expect(user.twitterUsername).toBe("alicechen_dev");
    expect(user.websiteUrl).toBe("https://alicechen.dev");
  });
});

describe("parsePost", () => {
  it("parses post with comments from fixture data", () => {
    const fixture = loadFixture("post-response.json");
    const post = parsePost(fixture.data.post);

    expect(post.id).toBe("456789");
    expect(post.name).toBe("DevTools Pro");
    expect(post.tagline).toBe("The ultimate developer toolkit");
    expect(post.slug).toBe("devtools-pro");
    expect(post.votesCount).toBe(342);
    expect(post.commentsCount).toBe(28);
    expect(post.reviewsRating).toBe(4.5);
    expect(post.website).toBe("https://devtools.pro");
    expect(post.thumbnail).toBe("https://ph-files.imgix.net/devtools-thumb.png");
  });

  it("parses makers correctly", () => {
    const fixture = loadFixture("post-response.json");
    const post = parsePost(fixture.data.post);

    expect(post.makers).toHaveLength(1);
    expect(post.makers[0].username).toBe("alicechen");
  });

  it("parses media correctly", () => {
    const fixture = loadFixture("post-response.json");
    const post = parsePost(fixture.data.post);

    expect(post.media).toHaveLength(2);
    expect(post.media[0].type).toBe("image");
    expect(post.media[1].type).toBe("video");
    expect(post.media[1].videoUrl).toBeTruthy();
  });

  it("parses topics from edges", () => {
    const fixture = loadFixture("post-response.json");
    const post = parsePost(fixture.data.post);

    expect(post.topics).toHaveLength(2);
    expect(post.topics[0].name).toBe("Developer Tools");
    expect(post.topics[1].name).toBe("Artificial Intelligence");
  });

  it("parses comments with replies", () => {
    const fixture = loadFixture("post-response.json");
    const post = parsePost(fixture.data.post);

    expect(post.comments).toHaveLength(2);
    expect(post.comments[0].body).toContain("amazing");
    expect(post.comments[0].user.username).toBe("bobsmith");
    expect(post.comments[0].replies).toHaveLength(1);
    expect(post.comments[0].replies[0].user.username).toBe("alicechen");
    expect(post.comments[1].replies).toHaveLength(0);
  });
});

describe("parsePost (list items)", () => {
  it("parses multiple posts from posts-response fixture", () => {
    const fixture = loadFixture("posts-response.json");
    const edges = fixture.data.posts.edges;
    const posts = edges.map((e: { node: Record<string, unknown> }) => parsePost(e.node));

    expect(posts).toHaveLength(3);
    expect(posts[0].name).toBe("DevTools Pro");
    expect(posts[1].name).toBe("DesignFlow");
    expect(posts[2].name).toBe("NoteAI");
    expect(posts[2].description).toBeNull();
    expect(posts[2].featuredAt).toBeNull();
  });
});

describe("parseTopic", () => {
  it("parses topics from fixture", () => {
    const fixture = loadFixture("topics-response.json");
    const edges = fixture.data.topics.edges;
    const topics = edges.map((e: { node: Record<string, unknown> }) => parseTopic(e.node));

    expect(topics).toHaveLength(2);
    expect(topics[0].name).toBe("Developer Tools");
    expect(topics[0].postsCount).toBe(5230);
    expect(topics[0].followersCount).toBe(42100);
    expect(topics[1].image).toBeNull();
  });
});

describe("parseCollection", () => {
  it("parses collections from fixture", () => {
    const fixture = loadFixture("collections-response.json");
    const edges = fixture.data.collections.edges;
    const collections = edges.map((e: { node: Record<string, unknown> }) => parseCollection(e.node));

    expect(collections).toHaveLength(2);
    expect(collections[0].name).toBe("Best AI Tools 2026");
    expect(collections[0].user?.username).toBe("alicechen");
    expect(collections[1].user).toBeNull();
    expect(collections[1].coverImage).toBeNull();
  });
});

describe("parsePageInfo", () => {
  it("parses hasNextPage and endCursor", () => {
    const pageInfo = parsePageInfo({
      hasNextPage: true,
      endCursor: "abc123",
    });
    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.endCursor).toBe("abc123");
  });

  it("handles missing values", () => {
    const pageInfo = parsePageInfo({});
    expect(pageInfo.hasNextPage).toBe(false);
    expect(pageInfo.endCursor).toBeNull();
  });
});
