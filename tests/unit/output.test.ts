import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveOutputFormat, shouldUseColor } from "../../src/output.js";

describe("resolveOutputFormat", () => {
  it("returns json when --json flag is set", () => {
    expect(resolveOutputFormat({ json: true })).toBe("json");
  });

  it("returns yaml when --yaml flag is set", () => {
    expect(resolveOutputFormat({ yaml: true })).toBe("yaml");
  });

  it("returns json when both --json and --yaml are set (json wins)", () => {
    const stderrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(resolveOutputFormat({ json: true, yaml: true })).toBe("json");
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("Both --json and --yaml"));
    stderrSpy.mockRestore();
  });

  it("returns table when TTY and no flags", () => {
    const originalIsTTY = process.stdout.isTTY;
    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    expect(resolveOutputFormat({})).toBe("table");
    Object.defineProperty(process.stdout, "isTTY", { value: originalIsTTY, configurable: true });
  });

  it("returns json when non-TTY and no flags", () => {
    const originalIsTTY = process.stdout.isTTY;
    Object.defineProperty(process.stdout, "isTTY", { value: false, configurable: true });
    expect(resolveOutputFormat({})).toBe("json");
    Object.defineProperty(process.stdout, "isTTY", { value: originalIsTTY, configurable: true });
  });
});

describe("shouldUseColor", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns false when NO_COLOR is set", () => {
    process.env.NO_COLOR = "1";
    expect(shouldUseColor()).toBe(false);
  });

  it("returns true when FORCE_COLOR is set", () => {
    delete process.env.NO_COLOR;
    process.env.FORCE_COLOR = "1";
    expect(shouldUseColor()).toBe(true);
  });
});
