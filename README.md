# producthunt-cli

A command-line interface for [Product Hunt](https://www.producthunt.com). Browse today's launches, explore products, topics, collections, and user profiles — right from your terminal.

## Install

```bash
npm install -g @yshua5631/producthunt-cli
```

Requires **Node.js >= 20**.

## Quick Start

```bash
# 1. Set your Developer Token
ph auth set-token

# 2. Browse today's featured products
ph today

# 3. View a product's details
ph post devtools-pro
```

Get your token from the [Product Hunt API Dashboard](https://www.producthunt.com/v2/oauth/applications) — open your app, scroll to "Developer Token" at the bottom.

## Commands

### Authentication

| Command | Description |
|---|---|
| `ph auth set-token` | Set your Developer Token interactively |
| `ph auth status` | Show current token source and validity |
| `ph auth doctor` | Diagnose auth and API issues |
| `ph auth clear` | Remove stored token |

### Browse

| Command | Description |
|---|---|
| `ph today` | Today's featured products |
| `ph posts` | Browse product listings |
| `ph post <slug>` | View product details and comments |
| `ph user <username>` | View user profile |
| `ph topics` | Browse topics |
| `ph collections` | Browse collections |

### Options

| Flag | Description |
|---|---|
| `--json` | Output as JSON |
| `--yaml` | Output as YAML |
| `--verbose` | Show rate limit info and debug details |
| `--wait` | Auto-wait on rate limit instead of failing |
| `-n, --first <count>` | Number of items to show (default: 20) |

### Examples

```bash
# Today's top products as JSON
ph today --json

# Products from a specific topic
ph posts --topic developer-tools -n 10

# Featured posts from a date range
ph posts --featured --after 2026-03-01 --before 2026-03-28

# Search topics
ph topics --query "artificial intelligence"

# Pipe to jq
ph today --json | jq '.data[].name'
```

## Output Formats

| Scenario | Default |
|---|---|
| Interactive terminal (TTY) | Rich table with colors |
| Pipe / redirect (non-TTY) | JSON |
| `--json` flag | JSON (always) |
| `--yaml` flag | YAML (always) |

Respects `NO_COLOR` and `FORCE_COLOR` environment variables per [no-color.org](https://no-color.org).

## Configuration

Token is resolved in this order:
1. `PRODUCTHUNT_TOKEN` environment variable
2. `~/.producthunt-cli/config.yaml`
3. Prompt to run `ph auth set-token`

## API Rate Limits

Product Hunt API allows **6,250 complexity points per 15 minutes**. The CLI shows remaining quota with `--verbose` and reports wait time on HTTP 429. Use `--wait` to auto-retry.

## Disclaimer

This tool uses the [Product Hunt API v2](https://api.producthunt.com/v2/docs). Per their terms, **the API may not be used for commercial purposes** without explicit permission from Product Hunt.

## License

[MIT](LICENSE)
