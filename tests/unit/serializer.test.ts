import { afterEach, describe, expect, it, vi } from "vitest";
import { outputSuccess } from "../../src/output.js";

describe("outputSuccess", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("outputs valid JSON envelope", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const data = { id: "1", name: "Test" };
    outputSuccess(data, "json");

    expect(logSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output).toEqual({
      ok: true,
      schemaVersion: "1",
      data: { id: "1", name: "Test" },
      error: null,
    });
  });

  it("outputs valid YAML envelope", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    outputSuccess({ id: "1" }, "yaml");

    expect(logSpy).toHaveBeenCalledOnce();
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain("ok: true");
    expect(output).toContain("schemaVersion: '1'");
    expect(output).toContain("id: '1'");
    expect(output).toContain("error: null");
  });

  it("does nothing for table format", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    outputSuccess({ id: "1" }, "table");

    expect(logSpy).not.toHaveBeenCalled();
  });
});
