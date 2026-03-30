<div align="center">
  <h1>producthunt-cli</h1>
  <p><strong>Browse Product Hunt from your terminal.</strong></p>
  <p>Developer Token required · Official GraphQL API · JSON/YAML output · Optional rate-limit auto-wait</p>
  <p>
    <a href="./README.zh-CN.md">中文文档</a> ·
    <a href="https://www.npmjs.com/package/@yshua5631/producthunt-cli">npm</a>
  </p>
  <p>
    <img alt="npm version" src="https://img.shields.io/npm/v/%40yshua5631%2Fproducthunt-cli">
    <img alt="node version" src="https://img.shields.io/node/v/%40yshua5631%2Fproducthunt-cli">
    <img alt="license" src="https://img.shields.io/npm/l/%40yshua5631%2Fproducthunt-cli">
  </p>
</div>

A CLI for Product Hunt API v2 workflows.

Browse today's featured launches, list posts, inspect a post by slug or numeric ID, view user profiles, and explore topics or collections directly from your shell.

Unlike `betalist-cli`, the data commands here require a Product Hunt Developer Token. Current `v0.1` scope: `auth`, `today`, `posts`, `post`, `user`, `topics`, and `collections`.

## Install

```bash
npm install -g @yshua5631/producthunt-cli
```

Requires **Node.js >= 20**.

After installation:

```bash
ph --help
producthunt --help
```

## Quick Start

```bash
# 1. Save your Developer Token
ph auth set-token YOUR_TOKEN

# 2. Browse today's featured launches
ph today --timezone Asia/Shanghai

# 3. Inspect a product and its comments
ph post your-post-slug

# 4. Explore more resources
ph posts --topic developer-tools -n 10
ph topics -q "artificial intelligence"
ph collections --featured
```

Get your token from:

```text
https://www.producthunt.com/v2/oauth/applications
```

Open your app, then scroll to the `Developer Token` section near the bottom.

## Commands

### Authentication

| Command | Description |
|---|---|
| `ph auth set-token [token]` | Save your Product Hunt Developer Token; omitting the argument starts an interactive prompt |
| `ph auth status` | Show the current token source and validity |
| `ph auth doctor` | Diagnose token, API connectivity, and viewer access |
| `ph auth clear` | Remove the stored token from config |

### Browse

| Command | Description |
|---|---|
| `ph today` | Show today's featured products for a target timezone |
| `ph posts` | Browse posts with topic, featured, date-range, and pagination filters |
| `ph post <slug-or-id>` | Show a product's details and comments |
| `ph user <username>` | Show a user profile |
| `ph topics` | Browse or search topics |
| `ph collections` | Browse collections |

### Common Flags

| Flag | Description |
|---|---|
| `--json` | Force JSON output |
| `--yaml` | Force YAML output |
| `--verbose` | Show rate-limit details for the latest request |
| `--wait` | Wait and retry once on HTTP 429 |
| `-n, --first <count>` | Item count for `today`, `posts`, `topics`, and `collections` (default: `20`) |
| `--timezone <tz>` | Timezone used by `today`; defaults to config `timezone`, then `UTC` |
| `--topic <slug>` | Filter `posts` by topic slug |
| `--featured` | Restrict `posts` or `collections` to featured items |
| `--after <date>` | Filter `posts` after a date in `YYYY-MM-DD` |
| `--before <date>` | Filter `posts` before a date in `YYYY-MM-DD` |
| `--cursor <cursor>` | Pagination cursor for `posts`, `topics`, and `collections` |
| `-q, --query <text>` | Search `topics` by name |

## Examples

```bash
# Today's featured launches
ph today

# Structured output
ph today --json
ph post your-post-slug --yaml

# Posts in a topic
ph posts --topic developer-tools -n 10

# Featured posts in a date range
ph posts --featured --after 2026-03-01 --before 2026-03-28

# Continue with pagination cursors
ph posts --cursor YOUR_CURSOR
ph topics --cursor YOUR_CURSOR
ph collections --cursor YOUR_CURSOR

# Inspect a user
ph user your-username

# Pipe to jq
ph today --json | jq '.data[].name'
ph posts --json | jq '.data.items[].name'
```

## Output

`today`, `posts`, `post`, `user`, `topics`, and `collections` follow these output rules:

| Scenario | Default |
|---|---|
| Interactive terminal | Human-readable table / text |
| Pipe / redirect | JSON |
| `--json` | JSON |
| `--yaml` | YAML |

The CLI respects `NO_COLOR` and `FORCE_COLOR`.

Structured output includes:

- `ok`
- `schemaVersion`
- `data`
- `error`

Notes:

- `today` returns a post array in `data`.
- `posts`, `topics`, and `collections` return `data.items` plus `data.pageInfo`.

## Post Slugs And IDs

`ph post <slug-or-id>` accepts either a Product Hunt slug or a numeric ID:

```bash
ph post your-post-slug
ph post 123456
```

Example:

```text
https://www.producthunt.com/posts/your-post-slug -> your-post-slug
```

## Configuration

Configuration is optional, but saving a token is the easiest default setup.

Token resolution order:

1. `PRODUCTHUNT_TOKEN` environment variable
2. `~/.producthunt-cli/config.yaml`

The config file lives at:

```bash
~/.producthunt-cli/config.yaml
```

Example:

```yaml
token: phc_your_developer_token
timezone: Asia/Shanghai
```

Notes:

- `ph auth set-token` writes the token into this file.
- `today` uses config `timezone` when `--timezone` is not provided; otherwise it falls back to `UTC`.
- There is no dedicated `config` subcommand in `v0.1`; edit the YAML file directly if you want to change `timezone`.
- `ph auth clear` only removes the config-file token. It does not affect `PRODUCTHUNT_TOKEN`.

## Data Behavior

- All data commands use Product Hunt API v2 GraphQL.
- `today` computes a same-day range for the target timezone, then queries featured posts in that window.
- `post` currently returns product details plus the first `10` top-level comments, with up to `3` replies per comment.
- In table mode, `posts`, `topics`, and `collections` print a follow-up `--cursor` hint when more pages are available.

## Rate Limits

The Product Hunt API enforces rate limits. The CLI currently behaves like this:

- `--verbose` prints the latest rate-limit information.
- HTTP `429` errors report the wait time returned by the API.
- `--wait` waits until reset time once, then retries automatically.

## Notes

- This is an unofficial project and is not affiliated with Product Hunt.
- If `ph auth doctor` reports a `null` viewer, your token likely has limited viewer access; public data queries may still work.
- Field availability depends on the Product Hunt API response.
- Review Product Hunt's latest API terms before any commercial use.

## License

[MIT](LICENSE)
