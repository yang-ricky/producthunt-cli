import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenAuth } from "../../src/auth/token.js";

describe("TokenAuth", () => {
  it("returns correct Authorization header", () => {
    const auth = new TokenAuth("test-token-12345");
    const headers = auth.getHeaders();
    expect(headers.Authorization).toBe("Bearer test-token-12345");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("masks token correctly for long tokens", () => {
    expect(TokenAuth.mask("abcdefghijklmnop")).toBe("abcd...mnop");
  });

  it("masks token correctly for short tokens", () => {
    expect(TokenAuth.mask("short")).toBe("****");
    expect(TokenAuth.mask("12345678")).toBe("****");
  });

  it("masks token correctly for 9-char tokens", () => {
    expect(TokenAuth.mask("123456789")).toBe("1234...6789");
  });

  describe("verify", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("returns true for valid token", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: { viewer: { user: { id: "1" } } } }),
          headers: new Headers(),
        }),
      );

      const auth = new TokenAuth("valid-token");
      expect(await auth.verify()).toBe(true);
    });

    it("returns false for 401", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: () => Promise.resolve({}),
          headers: new Headers(),
        }),
      );

      const auth = new TokenAuth("bad-token");
      expect(await auth.verify()).toBe(false);
    });

    it("returns false for 403", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          json: () => Promise.resolve({}),
          headers: new Headers(),
        }),
      );

      const auth = new TokenAuth("bad-token");
      expect(await auth.verify()).toBe(false);
    });

    it("returns false for GraphQL errors", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ errors: [{ message: "Unauthorized" }] }),
          headers: new Headers(),
        }),
      );

      const auth = new TokenAuth("error-token");
      expect(await auth.verify()).toBe(false);
    });
  });
});
