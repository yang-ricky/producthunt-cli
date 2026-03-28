import type { CLIOutput } from "./models/index.js";
import type { OutputFormat } from "./output.js";
import { outputSuccess } from "./output.js";

export function serialize<T>(data: T, format: OutputFormat): void {
  outputSuccess(data, format);
}
