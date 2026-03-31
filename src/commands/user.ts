import { Command } from "commander";
import { formatUserDetail } from "../formatter.js";
import { serialize } from "../serializer.js";
import { createBackend, getOutputFormat } from "./shared.js";

export const userCommand = new Command("user")
  .description("View a user's profile")
  .argument("<username>", "Username")
  .action(async (username: string, _opts, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = getOutputFormat(globalOpts);
    const backend = createBackend(globalOpts);

    const user = await backend.getUser(username);

    if (format === "table") {
      formatUserDetail(user);
    } else {
      serialize(user, format);
    }
  });
