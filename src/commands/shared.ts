import { TokenAuth } from "../auth/token.js";
import { GraphQLBackend } from "../backends/graphql.js";
import type { Backend } from "../backends/types.js";
import { resolveToken } from "../config.js";
import { ExitCode } from "../errors.js";
import { type OutputFormat, resolveOutputFormat } from "../output.js";

export function createBackend(globalOpts: Record<string, unknown>): Backend {
  const resolved = resolveToken();
  if (!resolved) {
    console.error("Not authenticated. Run `ph auth set-token` to configure.");
    process.exit(ExitCode.AuthError);
    return undefined as never; // unreachable, helps TS narrowing
  }

  const auth = new TokenAuth(resolved.token);
  return new GraphQLBackend(auth, {
    verbose: globalOpts.verbose as boolean | undefined,
    wait: globalOpts.wait as boolean | undefined,
  });
}

export function getOutputFormat(globalOpts: Record<string, unknown>): OutputFormat {
  return resolveOutputFormat({
    json: globalOpts.json as boolean | undefined,
    yaml: globalOpts.yaml as boolean | undefined,
  });
}
