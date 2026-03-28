import { API_ENDPOINT } from "../constants.js";
import { AuthError } from "../errors.js";
import type { AuthProvider } from "./types.js";

export class TokenAuth implements AuthProvider {
  constructor(private token: string) {}

  getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async verify(): Promise<boolean> {
    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          query: "{ viewer { user { id } } }",
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return false;
      }

      if (!res.ok) {
        return false;
      }

      const json = (await res.json()) as { errors?: unknown[] };
      return !json.errors;
    } catch {
      throw new AuthError("Failed to verify token: network error");
    }
  }

  /** Mask token for display: first 4 + ... + last 4 */
  static mask(token: string): string {
    if (token.length <= 8) return "****";
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
  }
}
