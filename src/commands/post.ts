import { Command } from "commander";
import { formatPostDetail } from "../formatter.js";
import { serialize } from "../serializer.js";
import { createBackend, getOutputFormat } from "./shared.js";

export const postCommand = new Command("post")
  .description("View a product's details and comments")
  .argument("<slug>", "Post slug or ID")
  .action(async (slug: string, _opts, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = getOutputFormat(globalOpts);
    const backend = createBackend(globalOpts);

    const post = await backend.getPost(slug);

    if (format === "table") {
      formatPostDetail(post);
    } else {
      serialize(post, format);
    }
  });
