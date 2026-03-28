import { createRequire } from "node:module";
import { Command } from "commander";
import { handleError } from "./output.js";
import { authCommand } from "./commands/auth.js";
import { todayCommand } from "./commands/today.js";
import { postsCommand } from "./commands/posts.js";
import { postCommand } from "./commands/post.js";
import { userCommand } from "./commands/user.js";
import { topicsCommand } from "./commands/topics.js";
import { collectionsCommand } from "./commands/collections.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

program
  .name("producthunt")
  .description("A command-line interface for Product Hunt")
  .version(pkg.version)
  .option("--json", "Output as JSON")
  .option("--yaml", "Output as YAML")
  .option("--verbose", "Verbose output")
  .option("--wait", "Auto-wait on rate limit instead of failing");

program.addCommand(authCommand);
program.addCommand(todayCommand);
program.addCommand(postsCommand);
program.addCommand(postCommand);
program.addCommand(userCommand);
program.addCommand(topicsCommand);
program.addCommand(collectionsCommand);

program.parseAsync().catch(handleError);
