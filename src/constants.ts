export const API_ENDPOINT = "https://api.producthunt.com/v2/api/graphql";
export const OAUTH_TOKEN_URL = "https://api.producthunt.com/v2/oauth/token";

export const CONFIG_DIR_NAME = ".producthunt-cli";
export const CONFIG_FILE_NAME = "config.yaml";

export const DEFAULT_FIRST = 20;
export const DEFAULT_COMMENTS_FIRST = 10;

export const RATE_LIMIT_HEADERS = {
  limit: "x-rate-limit-limit",
  remaining: "x-rate-limit-remaining",
  reset: "x-rate-limit-reset",
} as const;
