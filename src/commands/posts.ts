import { Command } from "commander";
import { createBackend, getOutputFormat } from "./shared.js";
import { formatPostsTable } from "../formatter.js";
import { serialize } from "../serializer.js";

export const postsCommand = new Command("posts")
  .description("Browse product listings")
  .option("-n, --first <count>", "Number of posts to show", "20")
  .option("--topic <slug>", "Filter by topic slug")
  .option("--featured", "Only show featured posts")
  .option("--after <date>", "Posts after date (YYYY-MM-DD)")
  .option("--before <date>", "Posts before date (YYYY-MM-DD)")
  .option("--cursor <cursor>", "Pagination cursor")
  .action(async (opts, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = getOutputFormat(globalOpts);
    const backend = createBackend(globalOpts);

    const result = await backend.getPosts({
      first: Number.parseInt(opts.first, 10),
      featured: opts.featured || undefined,
      topic: opts.topic,
      postedAfter: opts.after ? `${opts.after}T00:00:00Z` : undefined,
      postedBefore: opts.before ? `${opts.before}T23:59:59Z` : undefined,
      after: opts.cursor,
    });

    if (format === "table") {
      if (result.items.length === 0) {
        console.log("No posts found.");
        return;
      }
      formatPostsTable(result.items);
      if (result.pageInfo.hasNextPage) {
        console.log(`\nMore results available. Use --cursor ${result.pageInfo.endCursor}`);
      }
    } else {
      serialize(result, format);
    }
  });
