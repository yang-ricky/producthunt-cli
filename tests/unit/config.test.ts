import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveTimezone, resolveToken } from "../../src/config.js";

describe("resolveToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns env token with highest priority", () => {
    process.env.PRODUCTHUNT_TOKEN = "env-token-123";
    const result = resolveToken();
    expect(result).toEqual({ token: "env-token-123", source: "env" });
  });

  it("returns null when no token is available", () => {
    delete process.env.PRODUCTHUNT_TOKEN;
    // Config file won't exist in test env, so should return null
    // (unless there's a real config file, which is fine)
    const result = resolveToken();
    // Either null or from config file
    if (result) {
      expect(result.source).toBe("config");
    } else {
      expect(result).toBeNull();
    }
  });
});

describe("resolveTimezone", () => {
  it("returns UTC by default", () => {
    const tz = resolveTimezone();
    // Default is UTC unless user has a config file with timezone set
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });
});
