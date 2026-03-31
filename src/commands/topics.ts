import { Command } from "commander";
import { formatTopicsTable } from "../formatter.js";
import { serialize } from "../serializer.js";
import { createBackend, getOutputFormat } from "./shared.js";

export const topicsCommand = new Command("topics")
  .description("Browse topics")
  .option("-n, --first <count>", "Number of topics to show", "20")
  .option("-q, --query <text>", "Search topics by name")
  .option("--cursor <cursor>", "Pagination cursor")
  .action(async (opts, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = getOutputFormat(globalOpts);
    const backend = createBackend(globalOpts);

    const result = await backend.getTopics({
      first: Number.parseInt(opts.first, 10),
      query: opts.query,
      after: opts.cursor,
    });

    if (format === "table") {
      if (result.items.length === 0) {
        console.log("No topics found.");
        return;
      }
      formatTopicsTable(result.items);
      if (result.pageInfo.hasNextPage) {
        console.log(`\nMore results available. Use --cursor ${result.pageInfo.endCursor}`);
      }
    } else {
      serialize(result, format);
    }
  });
