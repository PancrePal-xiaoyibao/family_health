# 项目文档目录

本目录存放**产品与开发级文档**，与 [PRD.md](./PRD.md)（当前 v1.7）中的系统设计、API 契约及 AI 执行指令保持一致。

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [PRD.md](./PRD.md) | **产品需求与技术规范**：需求审计、架构决策（ADR）、系统设计（目录/数据模型/状态机/流程）、实现要求（错误处理/测试/安全/性能）、分阶段 AI 执行指令与 Checkfix 闭环 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | **开发与部署指南**：环境要求、本地开发搭建、Checkfix、.exe 打包规划、安全与文档维护约定；新开发者可按此独立部署与验证 |
| [api/](./api/) | **API 接口文档**：按 API-First 规范，按模块维护（见下表） |

**用户面向的零基础说明书**位于仓库根下 `docs/`（如 `docs/USER_GUIDE.md`），与前端功能同步更新。

---

## API 文档模块（与 PRD 对应）

| 模块 | 文档 | 说明 |
|------|------|------|
| 认证与用户 | [api/auth.md](./api/auth.md) | 初始化 Owner、登录、刷新、退出、用户与角色管理 |
| 聊天与 Agent | [api/chat.md](./api/chat.md)、[api/agent.md](./api/agent.md) | 会话 CRUD、消息、附件、问答与上下文组装 |
| 模型配置 | [api/model_registry.md](./api/model_registry.md) | Provider、模型目录刷新、Runtime Profile |
| MCP | [api/mcp.md](./api/mcp.md) | MCP Server 配置、连通性、会话内启用 |
| 知识库与检索 | [api/knowledge_base.md](./api/knowledge_base.md)、[api/retrieval.md](./api/retrieval.md) | KB 构建/重建、检索、引用 |
| 脱敏 | [api/desensitization.md](./api/desensitization.md) | 线性脱敏规则、双域隔离 |
| 数据导出 | [api/export.md](./api/export.md) | 导出任务、打包、下载 |
| Pipeline | [api/pipeline.md](./api/pipeline.md) | 文档入库、转换、脱敏、建库流程 |

上述文档随 PRD 各阶段实现逐步补充；模板见项目规则 `.cursor/rules/api-first-development.mdc` 中的「API 文档标准模板」。
