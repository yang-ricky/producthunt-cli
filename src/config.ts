import { readFileSync, writeFileSync, mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { homedir, platform } from "node:os";
import yaml from "js-yaml";
import { CONFIG_DIR_NAME, CONFIG_FILE_NAME } from "./constants.js";
import { ConfigError } from "./errors.js";

export interface AppConfig {
  token?: string;
  authMethod?: "token" | "cookie";
  timezone?: string;
}

function getConfigDir(): string {
  return join(homedir(), CONFIG_DIR_NAME);
}

function getConfigPath(): string {
  return join(getConfigDir(), CONFIG_FILE_NAME);
}

export function loadConfig(): AppConfig {
  try {
    const content = readFileSync(getConfigPath(), "utf-8");
    return (yaml.load(content) as AppConfig) ?? {};
  } catch {
    return {};
  }
}

export function saveConfig(config: AppConfig): void {
  const dir = getConfigDir();
  mkdirSync(dir, { recursive: true });

  const configPath = getConfigPath();
  const content = yaml.dump(config, { indent: 2 });
  writeFileSync(configPath, content, { mode: 0o600 });

  // On POSIX, ensure directory is also protected
  if (platform() !== "win32") {
    try {
      chmodSync(dir, 0o700);
    } catch {
      // Best effort
    }
  }
}

export function clearToken(): void {
  const config = loadConfig();
  delete config.token;
  saveConfig(config);
}

/**
 * Resolve token with priority:
 * 1. Environment variable PRODUCTHUNT_TOKEN
 * 2. Config file token field
 * 3. null (not found)
 */
export function resolveToken(): { token: string; source: "env" | "config" } | null {
  const envToken = process.env.PRODUCTHUNT_TOKEN;
  if (envToken) {
    return { token: envToken, source: "env" };
  }

  const config = loadConfig();
  if (config.token) {
    return { token: config.token, source: "config" };
  }

  return null;
}

export function resolveTimezone(): string {
  const config = loadConfig();
  return config.timezone ?? "UTC";
}
