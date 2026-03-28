import { Command } from "commander";
import { resolveTimezone } from "../config.js";
import { createBackend, getOutputFormat } from "./shared.js";
import { formatPostsTable } from "../formatter.js";
import { serialize } from "../serializer.js";

export const todayCommand = new Command("today")
  .description("Show today's featured products on Product Hunt")
  .option("--timezone <tz>", "Timezone for 'today' (default: UTC or config)")
  .option("-n, --first <count>", "Number of posts to show", "20")
  .action(async (opts, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = getOutputFormat(globalOpts);
    const backend = createBackend(globalOpts);

    const tz = opts.timezone ?? resolveTimezone();
    const now = new Date();

    // Build today's date range in the target timezone
    const dateStr = now.toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
    const postedAfter = `${dateStr}T00:00:00Z`;
    const postedBefore = `${dateStr}T23:59:59Z`;

    const result = await backend.getPosts({
      featured: true,
      postedAfter,
      postedBefore,
      first: Number.parseInt(opts.first, 10),
    });

    if (format === "table") {
      if (result.items.length === 0) {
        console.log("No featured products found for today.");
        return;
      }
      formatPostsTable(result.items);
    } else {
      serialize(result.items, format);
    }
  });
