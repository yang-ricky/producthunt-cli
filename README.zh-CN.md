<div align="center">
  <h1>producthunt-cli</h1>
  <p><strong>在终端里浏览 Product Hunt。</strong></p>
  <p>需要 Developer Token · 基于官方 GraphQL API · 支持 JSON/YAML 输出 · 支持限流自动等待</p>
  <p>
    <a href="./README.md">English</a> ·
    <a href="https://www.npmjs.com/package/@yshua5631/producthunt-cli">npm</a>
  </p>
  <p>
    <img alt="npm version" src="https://img.shields.io/npm/v/%40yshua5631%2Fproducthunt-cli">
    <img alt="node version" src="https://img.shields.io/node/v/%40yshua5631%2Fproducthunt-cli">
    <img alt="license" src="https://img.shields.io/npm/l/%40yshua5631%2Fproducthunt-cli">
  </p>
</div>

一个面向 [Product Hunt](https://www.producthunt.com) API v2 的命令行工具。

你可以直接在 shell 里查看今天的 featured 产品、浏览产品列表、按 slug 或 ID 查看单个产品详情与评论、读取用户资料、浏览 topics / collections，并输出为终端友好的文本、JSON 或 YAML。

和 `betalist-cli` 不同，这个 CLI 的数据命令默认都依赖 Product Hunt Developer Token。当前 `v0.1` 范围包含：`auth`、`today`、`posts`、`post`、`user`、`topics`、`collections`。

## 安装

```bash
npm install -g @yshua5631/producthunt-cli
```

需要 **Node.js >= 20**。

安装后可以这样用：

```bash
ph --help
producthunt --help
```

## 快速开始

```bash
# 1. 保存你的 Developer Token（也支持交互输入）
ph auth set-token YOUR_TOKEN

# 2. 查看今天的 featured 产品
ph today --timezone Asia/Shanghai

# 3. 查看单个产品详情和评论
ph post your-post-slug

# 4. 浏览更多数据
ph posts --topic developer-tools -n 10
ph topics -q "artificial intelligence"
ph collections --featured
```

Token 获取入口：

```text
https://www.producthunt.com/v2/oauth/applications
```

打开你的应用后，下拉到页面底部的 `Developer Token` 区域即可复制。

## 命令

### 认证

| 命令 | 说明 |
|---|---|
| `ph auth set-token [token]` | 保存 Product Hunt Developer Token；省略参数时会进入交互输入 |
| `ph auth status` | 显示当前 token 来源和有效性 |
| `ph auth doctor` | 检查 token、API 连通性和 viewer 访问能力 |
| `ph auth clear` | 清除配置文件里保存的 token |

### 浏览

| 命令 | 说明 |
|---|---|
| `ph today` | 查看指定时区“今天”的 featured 产品 |
| `ph posts` | 浏览产品列表，支持 topic、featured、日期范围和分页 |
| `ph post <slug-or-id>` | 查看单个产品详情和评论 |
| `ph user <username>` | 查看用户资料 |
| `ph topics` | 浏览或搜索 topics |
| `ph collections` | 浏览 collections |

### 常用参数

| 参数 | 说明 |
|---|---|
| `--json` | 强制输出 JSON |
| `--yaml` | 强制输出 YAML |
| `--verbose` | 输出最近一次请求的 rate limit 信息 |
| `--wait` | 遇到 HTTP 429 时自动等待后重试一次 |
| `-n, --first <count>` | `today`、`posts`、`topics`、`collections` 的返回条数，默认 `20` |
| `--timezone <tz>` | `today` 使用的时区；默认取配置文件中的 `timezone`，否则为 `UTC` |
| `--topic <slug>` | `posts` 按 topic slug 过滤 |
| `--featured` | `posts` / `collections` 只看 featured 内容 |
| `--after <date>` | `posts` 只看某日期之后的数据，格式 `YYYY-MM-DD` |
| `--before <date>` | `posts` 只看某日期之前的数据，格式 `YYYY-MM-DD` |
| `--cursor <cursor>` | `posts`、`topics`、`collections` 的分页游标 |
| `-q, --query <text>` | `topics` 按名称搜索 |

## 示例

```bash
# 查看今天的 featured 产品
ph today

# 结构化输出
ph today --json
ph post your-post-slug --yaml

# 按 topic 浏览产品
ph posts --topic developer-tools -n 10

# 按时间范围筛选 featured 产品
ph posts --featured --after 2026-03-01 --before 2026-03-28

# 使用分页游标继续读取
ph posts --cursor YOUR_CURSOR
ph topics --cursor YOUR_CURSOR
ph collections --cursor YOUR_CURSOR

# 查询用户资料
ph user your-username

# 配合 jq 使用
ph today --json | jq '.data[].name'
ph posts --json | jq '.data.items[].name'
```

## 输出格式

`today`、`posts`、`post`、`user`、`topics`、`collections` 这些数据命令遵循以下输出规则：

| 场景 | 默认输出 |
|---|---|
| 交互式终端 | 人类可读的表格 / 文本 |
| 管道 / 重定向 | JSON |
| `--json` | JSON |
| `--yaml` | YAML |

CLI 会遵守 `NO_COLOR` 和 `FORCE_COLOR`。

结构化输出会包含这些字段：

- `ok`
- `schemaVersion`
- `data`
- `error`

补充说明：

- `today` 的结构化输出里，`data` 是产品数组。
- `posts`、`topics`、`collections` 的结构化输出里，`data` 包含 `items` 和 `pageInfo`。

## Post Slug / ID

`ph post <slug-or-id>` 同时接受 Product Hunt 的 slug 和数字 ID：

```bash
ph post your-post-slug
ph post 123456
```

例如：

```text
https://www.producthunt.com/posts/your-post-slug -> your-post-slug
```

## 配置

配置文件不是必需的，但如果你不想每次都传环境变量，建议至少保存一次 token。

Token 的解析顺序如下：

1. `PRODUCTHUNT_TOKEN` 环境变量
2. `~/.producthunt-cli/config.yaml`

配置文件路径：

```bash
~/.producthunt-cli/config.yaml
```

示例：

```yaml
token: phc_your_developer_token
timezone: Asia/Shanghai
```

说明：

- `ph auth set-token` 会把 token 写入这个文件。
- `today` 在未显式传入 `--timezone` 时，会读取 `timezone` 配置；如果没有配置，则默认使用 `UTC`。
- 当前 `v0.1` 还没有单独的 `config` 子命令，想修改 `timezone` 时请直接编辑 YAML 文件。
- `ph auth clear` 只会清除配置文件中的 token，不会影响 `PRODUCTHUNT_TOKEN` 环境变量。

## 数据来源与行为

- 所有数据命令都通过 Product Hunt API v2 GraphQL 获取。
- `today` 会根据目标时区计算当天的时间范围，再去查询 featured 产品。
- `post` 当前会返回产品详情，并附带前 `10` 条一级评论；每条评论最多展开 `3` 条回复。
- `posts`、`topics`、`collections` 在表格模式下如果还有下一页，会提示继续使用 `--cursor`。

## 速率限制

Product Hunt API 本身存在 rate limit。CLI 的行为如下：

- 使用 `--verbose` 时，会输出最近一次请求的额度信息。
- 遇到 HTTP `429` 时，会提示等待秒数。
- 加上 `--wait` 后，CLI 会按服务端返回的重置时间自动等待一次，然后重试。

## 说明

- 这是一个非官方项目，与 Product Hunt 没有官方关联。
- 如果 `ph auth doctor` 提示 viewer 为 `null`，通常说明当前 token 权限有限；公共数据查询可能仍然可用。
- Product Hunt API 的字段和可访问性以官方接口实际返回为准。
- 在商业化使用前，请自行确认 Product Hunt API 的最新使用条款。

## License

[MIT](LICENSE)
