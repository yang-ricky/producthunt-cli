import { Command } from "commander";
import { createBackend, getOutputFormat } from "./shared.js";
import { formatCollectionsTable } from "../formatter.js";
import { serialize } from "../serializer.js";

export const collectionsCommand = new Command("collections")
  .description("Browse collections")
  .option("-n, --first <count>", "Number of collections to show", "20")
  .option("--featured", "Only show featured collections")
  .option("--cursor <cursor>", "Pagination cursor")
  .action(async (opts, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = getOutputFormat(globalOpts);
    const backend = createBackend(globalOpts);

    const result = await backend.getCollections({
      first: Number.parseInt(opts.first, 10),
      featured: opts.featured || undefined,
      after: opts.cursor,
    });

    if (format === "table") {
      if (result.items.length === 0) {
        console.log("No collections found.");
        return;
      }
      formatCollectionsTable(result.items);
      if (result.pageInfo.hasNextPage) {
        console.log(`\nMore results available. Use --cursor ${result.pageInfo.endCursor}`);
      }
    } else {
      serialize(result, format);
    }
  });
