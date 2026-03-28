import { Command } from "commander";
import { createInterface } from "node:readline";
import { TokenAuth } from "../auth/token.js";
import { resolveToken, saveConfig, loadConfig, clearToken } from "../config.js";
import { getLastRateLimitInfo } from "../backends/graphql.js";
import { ExitCode } from "../errors.js";

export const authCommand = new Command("auth").description("Manage authentication");

// ph auth set-token
authCommand
  .command("set-token")
  .description("Set your Product Hunt Developer Token")
  .argument("[token]", "Developer Token (omit for interactive prompt)")
  .action(async (tokenArg?: string) => {
    let token = tokenArg?.trim();

    if (!token) {
      console.log("Get your token from: https://www.producthunt.com/v2/oauth/applications");
      console.log("Open your app → scroll to 'Developer Token' at the bottom.\n");

      const rl = createInterface({ input: process.stdin, output: process.stderr });
      token = await new Promise<string>((resolve) => {
        rl.question("Paste your token: ", (answer: string) => {
          rl.close();
          resolve(answer.trim());
        });
      });
    }

    if (!token) {
      console.error("No token provided.");
      process.exit(ExitCode.ArgumentError);
    }

    console.log("\nVerifying token...");
    const auth = new TokenAuth(token);
    const valid = await auth.verify();

    if (!valid) {
      console.error("Token verification failed. Please check your token and try again.");
      process.exit(ExitCode.AuthError);
    }

    const config = loadConfig();
    config.token = token;
    saveConfig(config);

    console.log(`Token saved. (${TokenAuth.mask(token)})`);
  });

// ph auth status
authCommand
  .command("status")
  .description("Show current authentication status")
  .action(async () => {
    const resolved = resolveToken();

    if (!resolved) {
      console.log("Not authenticated. Run `ph auth set-token` to configure.");
      return;
    }

    console.log(`Token:  ${TokenAuth.mask(resolved.token)}`);
    console.log(`Source: ${resolved.source === "env" ? "PRODUCTHUNT_TOKEN env var" : "~/.producthunt-cli/config.yaml"}`);

    const auth = new TokenAuth(resolved.token);
    const valid = await auth.verify();
    console.log(`Valid:  ${valid ? "Yes" : "No"}`);
  });

// ph auth doctor
authCommand
  .command("doctor")
  .description("Diagnose authentication and API issues")
  .action(async () => {
    console.log("Running diagnostics...\n");

    // 1. Token check
    const resolved = resolveToken();
    if (!resolved) {
      console.log("[ FAIL ] No token found.");
      console.log("         Run `ph auth set-token` to configure.\n");
      process.exit(ExitCode.AuthError);
      return; // unreachable, helps TS narrowing
    }

    console.log(`[  OK  ] Token found (source: ${resolved.source})`);

    // 2. Token validity
    const auth = new TokenAuth(resolved.token);
    const valid = await auth.verify();
    if (!valid) {
      console.log("[ FAIL ] Token is invalid or expired.");
      console.log("         Get a new one: https://www.producthunt.com/v2/oauth/applications\n");
      process.exit(ExitCode.AuthError);
    }
    console.log("[  OK  ] Token is valid");

    // 3. Viewer access
    try {
      const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
        method: "POST",
        headers: auth.getHeaders(),
        body: JSON.stringify({ query: "{ viewer { user { id username } } }" }),
      });
      const json = (await res.json()) as { data?: { viewer?: { user?: { username: string } } } };
      if (json.data?.viewer?.user) {
        console.log(`[  OK  ] Viewer access works (logged in as @${json.data.viewer.user.username})`);
      } else {
        console.log("[ WARN ] Viewer returns null. This may be a client-only token.");
        console.log("         `ph me` and user-specific features won't work.");
        console.log("         Use a Developer Token for full access.");
      }
    } catch {
      console.log("[ FAIL ] Could not check viewer access");
    }

    // 4. Rate limit
    const rl = getLastRateLimitInfo();
    if (rl) {
      console.log(`[  OK  ] Rate limit: ${rl.remaining}/${rl.limit} points (resets in ${rl.resetInSeconds}s)`);
    }

    console.log("\nDiagnostics complete.");
  });

// ph auth clear
authCommand
  .command("clear")
  .description("Clear stored token")
  .action(() => {
    clearToken();
    console.log("Token cleared from config file.");
    console.log("Note: PRODUCTHUNT_TOKEN env var (if set) is not affected.");
  });
