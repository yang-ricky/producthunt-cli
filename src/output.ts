import yaml from "js-yaml";
import { type CLIError, ExitCode } from "./errors.js";
import type { CLIOutput } from "./models/index.js";

export type OutputFormat = "table" | "json" | "yaml";

export function resolveOutputFormat(flags: { json?: boolean; yaml?: boolean }): OutputFormat {
  if (flags.json && flags.yaml) {
    console.error("[warn] Both --json and --yaml specified. Using --json.");
  }

  if (flags.json) return "json";
  if (flags.yaml) return "yaml";

  // Non-TTY defaults to JSON
  if (!process.stdout.isTTY) return "json";

  return "table";
}

export function shouldUseColor(): boolean {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  return !!process.stdout.isTTY;
}

export function outputSuccess<T>(data: T, format: OutputFormat): void {
  if (format === "json") {
    const envelope: CLIOutput<T> = {
      ok: true,
      schemaVersion: "1",
      data,
      error: null,
    };
    console.log(JSON.stringify(envelope, null, 2));
  } else if (format === "yaml") {
    const envelope: CLIOutput<T> = {
      ok: true,
      schemaVersion: "1",
      data,
      error: null,
    };
    console.log(yaml.dump(envelope, { indent: 2 }));
  }
  // "table" format is handled by formatter.ts directly
}

export function outputError(err: CLIError): void {
  const format = resolveOutputFormat({
    json: process.argv.includes("--json"),
    yaml: process.argv.includes("--yaml"),
  });

  if (format === "json" || format === "yaml") {
    const envelope: CLIOutput<null> = {
      ok: false,
      schemaVersion: "1",
      data: null,
      error: {
        code: err.errorCode ?? "unknown_error",
        message: err.message,
        exitCode: err.exitCode,
      },
    };
    if (format === "json") {
      console.error(JSON.stringify(envelope, null, 2));
    } else {
      console.error(yaml.dump(envelope, { indent: 2 }));
    }
  } else {
    console.error(`Error: ${err.message}`);
  }

  process.exit(err.exitCode);
}

export function handleError(err: unknown): never {
  if (err instanceof Error && "exitCode" in err) {
    outputError(err as CLIError);
  }

  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(ExitCode.GeneralError);
  return undefined as never; // unreachable, satisfies TS never return
}
