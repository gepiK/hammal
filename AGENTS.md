# AGENTS.md

## 基本要求

- 使用中文回复。
- 修改前先阅读与任务相关的现有代码，不要凭经验重写项目结构。
- 仓库内已有未提交改动时，默认视为用户改动；除非用户明确要求，不要回退或覆盖。

## 项目速览

- 项目名称：`hammal`。
- 运行环境：Cloudflare Pages 应用，使用 Cloudflare Worker/Fetch 运行时能力处理请求。
- Cloudflare 域名：`hammal.gepik.work`。
- 主要用途：作为 Docker 镜像仓库代理与加速入口，用于代理 Docker Hub 及部分常见镜像仓库。
- 主要语言：当前运行入口为 JavaScript，另有少量 TypeScript 文件。
- 包管理：仓库包含 `pnpm-lock.yaml`，优先使用 `pnpm`。
- 部署工具：Wrangler。

## 关键文件

- `src/index.js`：当前请求处理入口，包含请求路由、上游仓库选择、token 转发、响应头改写、首页伪装与搜索页逻辑。
- `src/token.ts`：TokenProvider 与 token 缓存相关实现；依赖 Cloudflare KV 绑定 `HAMMAL_CACHE`。
- `wrangler.toml.sample`：Wrangler 配置示例。注意其中 `main = "src/index.ts"` 与当前可见运行入口 `src/index.js` 不完全一致，实际调整配置前必须先确认目标入口。
- `handler.ts.back`：历史备份文件，不要在未确认的情况下作为生产入口或规范依据。
- `README.md`：项目用途说明与外部文档入口。

## 开发命令

- 安装依赖：`pnpm install`。
- 本地运行：`pnpm dev`，对应 `npx wrangler dev`。
- 部署：`pnpm deploy`，对应 `npx wrangler deploy`。
- 格式化：`pnpm format`。

## 实现约束

- 保持 Cloudflare Pages/Worker 运行时兼容的请求处理入口形态，除非同时更新 Wrangler 或 Pages 配置并验证运行方式。
- 变更代理逻辑时，必须同时关注 Docker Registry v2 协议路径、`Www-Authenticate` 头、token `realm` 改写、`Authorization` 透传、重定向 `Location` 处理和 CORS 相关响应头。
- 新增上游仓库路由时，优先更新 `src/index.js` 中的路由表与 `routeKeys`，并确认路径前缀剥离逻辑仍然正确。
- 处理 Docker Hub 官方镜像时，注意 `library/` 命名空间补全逻辑，避免破坏 `busybox`、`nginx` 等单段镜像名访问。
- 不要把 `env.URL`、`env.URL302`、`env.UA`、`HAMMAL_CACHE` 等运行时配置硬编码到代码中；需要新增配置时，通过 Worker 环境变量或 Wrangler 配置示例表达。
- 不要把账号 ID、KV namespace ID、域名、token、密码等真实敏感信息提交到仓库。
- `handler.ts.back` 中引用了仓库当前未发现的 `./backend`，不得直接迁移其中实现，除非先补齐并验证依赖。

## 代码风格

- 维持当前文件的轻量函数式结构；小范围修改优先在既有函数附近完成。
- 修改 `src/index.js` 时保持现有中文注释风格，但不要为显而易见的赋值添加注释。
- 需要新增 TypeScript 代码时，遵守 `tsconfig.json` 中的 `strict: true`。
- 处理 URL、Headers、Request、Response 时优先使用 Web 标准 API，避免引入 Node.js 专用 API。

## 验证建议

- 修改后至少运行与改动相关的命令；常规优先级为 `pnpm format`、`pnpm dev` 或 Wrangler 能执行的等价校验。
- 如果变更路由或鉴权逻辑，应手动覆盖 `/v2/`、`/token`、Docker Hub 单段镜像名、带仓库前缀路径，以及非 Docker Hub 上游路径。
- 当前仓库未发现正式测试框架；不要声称已通过自动化测试，除非实际补充并运行了测试。
