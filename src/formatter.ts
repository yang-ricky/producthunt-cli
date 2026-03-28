import chalk from "chalk";
import Table from "cli-table3";
import type { Post, User, Topic, Collection, Comment } from "./models/index.js";
import { shouldUseColor } from "./output.js";

const c = new Proxy(chalk, {
  get(target, prop, receiver) {
    if (!shouldUseColor()) return (s: string) => s;
    return Reflect.get(target, prop, receiver);
  },
}) as typeof chalk;

// ===== Posts =====

export function formatPostsTable(posts: Post[]): void {
  const table = new Table({
    head: [
      c.bold("Rank"),
      c.bold("Name"),
      c.bold("Tagline"),
      c.bold("Votes"),
      c.bold("Comments"),
      c.bold("Date"),
    ],
    colWidths: [6, 25, 40, 8, 10, 12],
    wordWrap: true,
  });

  for (const [i, post] of posts.entries()) {
    table.push([
      c.dim(`${i + 1}`),
      c.cyan(post.name),
      post.tagline,
      c.yellow(`${post.votesCount}`),
      `${post.commentsCount}`,
      formatDate(post.featuredAt ?? post.createdAt),
    ]);
  }

  console.log(table.toString());
}

export function formatPostDetail(post: Post): void {
  console.log();
  console.log(c.bold.cyan(post.name));
  console.log(c.dim(post.tagline));
  console.log();

  if (post.description) {
    console.log(post.description);
    console.log();
  }

  console.log(`${c.bold("URL:")}      ${post.url}`);
  if (post.website) console.log(`${c.bold("Website:")}  ${post.website}`);
  console.log(`${c.bold("Votes:")}    ${c.yellow(`${post.votesCount}`)}`);
  console.log(`${c.bold("Comments:")} ${post.commentsCount}`);
  if (post.reviewsRating) console.log(`${c.bold("Rating:")}   ${post.reviewsRating}/5`);
  console.log(`${c.bold("Date:")}     ${formatDate(post.featuredAt ?? post.createdAt)}`);

  if (post.makers.length > 0) {
    console.log(`${c.bold("Makers:")}   ${post.makers.map((m) => `@${m.username}`).join(", ")}`);
  }

  if (post.topics.length > 0) {
    console.log(`${c.bold("Topics:")}   ${post.topics.map((t) => t.name).join(", ")}`);
  }

  if (post.comments.length > 0) {
    console.log();
    console.log(c.bold(`--- Comments (${post.comments.length}) ---`));
    for (const comment of post.comments) {
      formatComment(comment, 0);
    }
  }
}

function formatComment(comment: Comment, depth: number): void {
  const indent = "  ".repeat(depth);
  console.log();
  console.log(`${indent}${c.bold(`@${comment.user.username}`)} ${c.dim(formatDate(comment.createdAt))} ${c.yellow(`+${comment.votesCount}`)}`);
  console.log(`${indent}${comment.body}`);

  for (const reply of comment.replies) {
    formatComment(reply, depth + 1);
  }
}

// ===== User =====

export function formatUserDetail(user: User): void {
  console.log();
  console.log(c.bold.cyan(user.name) + c.dim(` @${user.username}`));

  if (user.headline) console.log(user.headline);
  console.log();

  console.log(`${c.bold("URL:")}     ${user.url}`);
  if (user.websiteUrl) console.log(`${c.bold("Website:")} ${user.websiteUrl}`);
  if (user.twitterUsername) console.log(`${c.bold("Twitter:")} @${user.twitterUsername}`);
  console.log(`${c.bold("Maker:")}   ${user.isMaker ? "Yes" : "No"}`);
  console.log(`${c.bold("Joined:")}  ${formatDate(user.createdAt)}`);
}

// ===== Topics =====

export function formatTopicsTable(topics: Topic[]): void {
  const table = new Table({
    head: [
      c.bold("#"),
      c.bold("Name"),
      c.bold("Description"),
      c.bold("Posts"),
      c.bold("Followers"),
    ],
    colWidths: [5, 20, 45, 8, 11],
    wordWrap: true,
  });

  for (const [i, topic] of topics.entries()) {
    table.push([
      c.dim(`${i + 1}`),
      c.cyan(topic.name),
      truncate(topic.description ?? "", 42),
      `${topic.postsCount}`,
      `${topic.followersCount}`,
    ]);
  }

  console.log(table.toString());
}

// ===== Collections =====

export function formatCollectionsTable(collections: Collection[]): void {
  const table = new Table({
    head: [
      c.bold("#"),
      c.bold("Name"),
      c.bold("Tagline"),
      c.bold("By"),
      c.bold("Followers"),
    ],
    colWidths: [5, 20, 40, 15, 11],
    wordWrap: true,
  });

  for (const [i, col] of collections.entries()) {
    table.push([
      c.dim(`${i + 1}`),
      c.cyan(col.name),
      truncate(col.tagline ?? "", 37),
      col.user ? `@${col.user.username}` : "-",
      `${col.followersCount}`,
    ]);
  }

  console.log(table.toString());
}

// ===== Helpers =====

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
