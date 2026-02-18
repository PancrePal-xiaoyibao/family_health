# Agent Role Runtime Debug 记录

## 元信息
- 模块名称: agent-role-runtime
- 创建时间: 2026-02-18
- 最后更新: 2026-02-18
- 相关文件: `backend/app/services/agent_service.py`, `backend/app/services/role_service.py`, `backend/app/api/v1/agent.py`, `backend/app/models/chat_session.py`, `backend/app/schemas/chat.py`, `backend/app/services/chat_service.py`, `backend/app/api/v1/chat.py`, `frontend/src/pages/ChatCenter.tsx`, `frontend/src/api/client.ts`, `frontend/src/api/types.ts`, `backend/app/roles/general_medical_consultant.md`
- 依赖模块: model-registry, runtime-profile, chat, mcp
- 用户说明书路径（涉及前端功能时）: `docs/USER_GUIDE.md`
- 开发/部署文档路径（涉及后端或环境时）: `doc/api/agent.md`, `doc/DEPLOYMENT.md`

## 运行上下文与测试规则
- 运行环境: 本机 Windows
- 验证/Checkfix 执行方式: 后端 `uv run ruff check .` + `uv run pytest`；前端 `npm run build`

## 上下文关系网络
- 会话创建 -> `chat_sessions` 持久化 `role_id/background_prompt`
- QA 请求 -> 解析会话角色提示词 -> 真实调用 Provider API（Gemini/OpenAI 兼容）
- 消息流写入仅用户 query 与 assistant answer，系统角色提示词不入库

## Debug 历史
### [2026-02-18 17:40] Agent 真实 API 接入与角色库落地
- 问题描述
  - 现有 agent 为占位回答，未真实调用模型。
  - 角色提示词应由后端 Markdown 角色库提供，且不应在消息流明文展示。
- 根因定位
  - 原实现 `_compose_answer` 为本地拼接文案。
  - 背景提示词通过 `[SYSTEM]...` 被直接写入 user message，造成信息流污染。
- 解决方案
  - 新增后端角色库读取服务（Markdown）。
  - 新增 `GET /api/v1/agent/roles` 与 `GET /api/v1/agent/roles/{id}`。
  - 聊天会话新增 `role_id/background_prompt`（会话级）。
  - Agent QA 改为基于 Runtime Profile 真实调用 Provider API；无可用 profile 时兜底本地回答。
  - 前端新建会话支持选择角色或填写自定义提示词，并且发送时不再展示/注入到消息流。
- 验证结果
  - `uv run ruff check .` 通过
  - `uv run pytest` 通过（10 passed）
  - `npm run build` 通过
- 影响评估
  - 维持 API-First 结构，扩展会话与 agent 能力；对既有聊天流程向后兼容。
- 文档更新
  - 更新 `doc/api/agent.md`
  - 更新 `docs/USER_GUIDE.md`

## 待追踪问题
- 后续可补充多 provider 参数映射（如 reasoning 族参数）与失败重试策略。

## 技术债务记录
- 当前真实调用主要覆盖 Gemini 与 OpenAI 兼容协议，其他 provider 通过 OpenAI 兼容路径处理。
