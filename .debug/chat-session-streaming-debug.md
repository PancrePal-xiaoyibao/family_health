# Chat Session Ops + Streaming Reasoning Debug Record

## Metadata
- Module: chat-session-streaming
- Created: 2026-02-18
- Updated: 2026-02-18
- Related files: `backend/app/api/v1/chat.py`, `backend/app/services/chat_service.py`, `backend/app/models/chat_session.py`, `backend/app/api/v1/agent.py`, `backend/app/services/agent_service.py`, `backend/app/core/schema_migration.py`, `frontend/src/pages/ChatCenter.tsx`, `frontend/src/api/client.ts`, `frontend/src/api/types.ts`, `doc/api/chat.md`, `doc/api/agent.md`, `docs/USER_GUIDE.md`

## Runtime Context
- Environment: Local Windows
- Checkfix: backend `uv run ruff check .` + `uv run pytest`; frontend `npm run build`

## Context Graph
- Chat session now stores role + reasoning controls.
- Agent supports non-stream + SSE stream modes.
- Frontend chat center calls stream API and renders answer/reasoning incrementally.
- Session list now supports single and bulk operations.

## Debug History
### [2026-02-18 18:30] Session Ops + Stream CoT
- Issue
  - Missing session operations (copy/export/branch/bulk actions).
  - Need stream output and model reasoning controls at session level.
- Root cause
  - API only had basic CRUD for sessions.
  - Agent endpoint only returned full response after completion.
- Solution
  - Added chat session operation APIs: copy, branch, export (json/md), bulk export (zip), bulk delete.
  - Added session-level reasoning fields: `reasoning_enabled`, `reasoning_budget`, `show_reasoning`.
  - Added `/api/v1/agent/qa/stream` SSE endpoint.
  - Implemented provider calls for Gemini + OpenAI-compatible with reasoning parameter mapping.
  - Implemented frontend streaming renderer and session operation actions.
- Validation
  - `uv run ruff check .` passed
  - `uv run pytest` passed (10 passed)
  - `npm run build` passed
- Impact
  - No breaking API removals, additive endpoints and fields only.
- Docs updated
  - `doc/api/chat.md`
  - `doc/api/agent.md`
  - `docs/USER_GUIDE.md`

## Follow-ups
- Add pagination/search UI for large session lists.
- Add cancellation control for in-flight stream.

## [2026-02-18] UX pass: i18n + theme + chat session UX polish
- Scope: frontend App/Auth/Chat/Settings/KB/Export + global styles
- Changes:
  - Added bilingual UI (zh/en) toggle and persisted locale state in App.
  - Added light/dark theme toggle and CSS token theming via data-theme.
  - Reworked ChatCenter session rows with compact icon actions (copy/branch/export/share/delete).
  - Added share-link copy per session via URL query param.
  - Implemented smoother stream rendering with buffered queue + timed drain.
  - Added reasoning panel auto-collapse when stream finishes; final answer remains primary.
  - Fixed AuthPage mojibake by rewriting page text and locale wiring.
- Verification:
  - npm run build (frontend) passed.

### [2026-02-18 20:35] Attachment upload 400 parse-failed on chat
- Issue
  - Uploading document file to `/api/v1/chat/sessions/{id}/attachments` returned `400 Attachment parse failed`.
- Root cause
  - Attachment parser only did naive UTF-8 decode, no dedicated `docx` extraction path.
  - Desensitization regex rules were not validated; invalid regex could throw runtime `re.error` and be mapped into generic parse-failed.
- Solution
  - Added robust extraction pipeline in `chat_service`:
    - text decode fallback (`utf-8`/`utf-8-sig`/`gb18030`/`latin-1`)
    - `docx` extraction from `word/document.xml` with XML tag stripping.
  - Added regex validation in desensitization service:
    - validate regex at rule creation
    - guard regex compile during sanitize with explicit `DesensitizationError(5003)`.
  - Added regression tests:
    - upload minimal `docx` attachment succeeds
    - invalid regex rule is rejected with code `5003`.
- Verification
  - `uv run ruff check .` passed
  - `uv run pytest` passed (13 passed)
- Impact
  - Backward compatible; attachment parsing is more tolerant and errors are now deterministic for invalid regex rules.

### [2026-02-18 21:40] 附件上传 400 与知识库管理增强
- 问题描述
  - 部分文件在 Chat 上传仍返回 400。
  - 知识库缺少删除/配置管理/文档上传/策略权重等基础能力。
- 根因定位
  - Windows 文件名非法字符导致写盘路径异常，触发 `Attachment parse failed`。
  - 知识库 API 仅覆盖 create/list/build，未覆盖管理与策略配置。
- 解决方案
  - 新增通用文件文本提取与安全文件名模块：`file_text_extract.py`。
  - Chat 附件写盘改用 `safe_storage_name`，并返回更具体错误类型。
  - 新增知识库能力：
    - KB 配置更新、KB 删除、文档上传入库、文档删除、全局默认参数查询。
    - 每 KB 专用模型与策略：embedding/reranker/semantic model、strategy/weights。
    - 检索支持 keyword/semantic/hybrid，带权重融合评分。
  - 前端知识库中心重构：图标化管理、配置表单、上传+文本构建、策略检索。
- 验证
  - `uv run ruff check .` 通过
  - `uv run pytest` 通过（15 passed）
  - `npm run build` 通过

### [2026-02-18 22:05] Chat 附件上传仍报 OperationalError（二次定位）
- 问题描述
  - 前端仍提示 `Attachment parse failed: OperationalError`。
- 根因定位
  - 真实旧库结构中：`desensitization_rules` 与 `pii_mapping_vault` 缺少 `user_id`。
  - 附件上传会进入脱敏链路：查询 `desensitization_rules.user_id`、写入 `pii_mapping_vault.user_id`，直接触发 SQLite `OperationalError`。
- 解决方案
  - 扩展 SQLite 启动兼容迁移：
    - `desensitization_rules.user_id`
    - `pii_mapping_vault.user_id`
  - 本地执行迁移并验证列存在。
  - 新增迁移回归测试覆盖两张表补列。
- 验证
  - 现库校验：`rule user_id True`、`pii user_id True`
  - `uv run ruff check .` 通过
  - `uv run pytest tests/test_schema_migration.py tests/test_attachment_upload_parsing.py` 通过

### [2026-02-18 23:05] Chat UX & memory/multimodal enhancements
- Added session-level `context_message_limit` (1-100) and applied in history trimming.
- Added attachment metadata columns (`content_type`, `is_image`) with SQLite startup migration support.
- Added multimodal guard: image attachments are rejected at QA runtime when model capabilities are not multimodal.
- Improved attachment context injection: clipped context + anti-verbatim instruction to reduce raw text echo.
- Added model capability defaults for Gemini multimodal discovery.
- Frontend ChatCenter redesign:
  - Attachment upload moved into chatbox icon, supports paste-to-upload.
  - MCP selector moved into composer icon area.
  - Markdown-like rendering with proper line wraps.
  - Per-message actions: copy / export md / export pdf(print).
  - Multi-message share via generated URL (`session` + `msgs`).
- Checkfix:
  - `uv run ruff check .` passed
  - `uv run pytest` passed (17 passed)
  - `npm run build` passed

### [2026-02-18 23:45] Session export UX + KB select + action hierarchy polish
- Scope
  - Chat session export flow, QA request payload, backend export/reasoning persistence, chat button visual hierarchy.
- Changes
  - Removed session JSON export path from UI flow; session export now uses one popover with:
    - format choice: Markdown / PDF(print)
    - include reasoning toggle
  - Added `kb_id` support end-to-end for QA:
    - `AgentQaRequest` + API client payload + ChatCenter chatbox KB picker
    - agent context now merges KB retrieval snippets into prompt suffix.
  - Persisted assistant reasoning into DB:
    - new `chat_messages.reasoning_content` column
    - startup SQLite migration auto-adds missing column
    - non-stream and stream both save reasoning when enabled.
  - Export behavior update:
    - `/chat/sessions/{id}/export` now supports markdown export with `include_reasoning` query switch
    - bulk export zip now outputs markdown only (no json payload files).
  - UI refinement (no feature removal):
    - icon buttons smaller and quieter by default
    - session/message/composer icon actions become prominent on hover
    - compact export popover style for session-row actions.
- Checkfix
  - `uv run pytest tests/test_schema_migration.py tests/test_attachment_upload_parsing.py` passed
  - `npm run build` passed

### [2026-02-19 00:05] 会话配置区与新建会话交互重构
- 需求
  - 选中会话时，顶部显示并编辑该会话配置。
  - 新建会话改为弹窗参数确认后创建，取消“一键立即创建”。
- 改动
  - 顶部配置区改为绑定 `activeSession`：
    - 标题、角色、背景提示词、思维参数、上下文轮数、默认 MCP。
    - 点击“保存会话配置”写回当前会话。
  - 新建会话新增弹窗：
    - 标题、角色、提示词、思维参数、上下文轮数、默认 MCP。
    - 确认后调用创建接口并激活新会话。
  - 新增弹窗样式：`modal-mask` / `modal-card`。
- 影响文件
  - `frontend/src/pages/ChatCenter.tsx`
  - `frontend/src/styles/global.css`
  - `docs/USER_GUIDE.md`
- 验证
  - `npm run build` 通过

## [2026-02-19 12:45] 流式回复兜底显示
- 问题描述
  - 前端出现“流式请求 200 OK，但无回复内容”现象。
- 根因定位
  - 流式结束时队列仍有残留未被刷出，且完成事件未落库时 UI 清空流式显示。
- 解决方案
  - 流式结束时强制刷出剩余队列。
  - 若 done 事件存在但消息列表未包含该消息，则临时补齐前端展示。
- 影响文件
  - `frontend/src/pages/ChatCenter.tsx`
- 验证
  - `npm run build` 通过

## [2026-02-19 14:10] 会话 ChatDB + 多知识库挂载
- 问题描述
  - Runtime Profile 中填写的 embedding/reranker 未用于会话上传 RAG。
  - Chat 只能挂载单一知识库，无法多选合并检索。
- 根因定位
  - 附件入库仍写入全局 Chat Default KB，未按会话配置生成专属 ChatDB。
  - Agent QA 仅支持 `kb_id` 单值。
- 解决方案
  - 新增会话级 `chat_kb_id`，会话创建时按 `会话名 + chatdb` 自动生成 ChatDB，使用会话 Runtime Profile 的 embedding/reranker。
  - 附件 `kb_mode=chat_default` 改为写入当前会话 ChatDB。
  - Agent QA 支持 `kb_ids` 多选并合并检索结果。
  - 前端 KB 选择改为多选，上传入口文案更新为“当前会话 ChatDB”。
- 影响文件
  - `backend/app/models/chat_session.py`
  - `backend/app/core/schema_migration.py`
  - `backend/app/services/chat_service.py`
  - `backend/app/api/v1/chat.py`
  - `backend/app/schemas/agent.py`
  - `backend/app/api/v1/agent.py`
  - `backend/app/services/agent_service.py`
  - `frontend/src/api/client.ts`
  - `frontend/src/api/types.ts`
  - `frontend/src/pages/ChatCenter.tsx`
  - `docs/USER_GUIDE.md`
  - `doc/api/chat.md`
  - `doc/api/agent.md`
- 验证
  - `uv run ruff check .` 通过
  - `uv run pytest` 失败：`snap-confine` 权限不足（cap_dac_override）
  - `npm run build` 通过

## [2026-02-19 14:30] ChatBox 工具栏弹出式选择
- 问题描述
  - ChatBox 上方控件过多，知识库选择缺少明确选中反馈。
- 解决方案
  - ChatBox 工具栏改为三个图标（附件/MCP/知识库）点击弹出小窗选择。
  - 知识库多选改为复选列表，选中有打钩反馈。
  - MCP 多选改为复选列表，选中有打钩反馈。
- 影响文件
  - `frontend/src/pages/ChatCenter.tsx`
  - `frontend/src/styles/global.css`
  - `docs/USER_GUIDE.md`
- 验证
  - `npm run build` 通过

## [2026-02-19 15:10] KB 未就绪导致 QA 流式异常
- 问题描述
  - QA/stream 在 KB 状态为非 ready/building/failed 时抛异常，中断流式回复。
- 根因定位
  - `retrieve_from_kb` 对未就绪 KB 抛 `KbError(7003)`，上层直接转换为 `ChatError`。
- 解决方案
  - 将 `KbError(7003)` 降级为 warning，跳过该 KB，继续执行 QA。
  - warning 合并到 `tool_warnings` 返回。
- 影响文件
  - `backend/app/services/agent_service.py`
- 验证
  - `uv run ruff check .` 通过

## [2026-02-19 13:10] 会话 Runtime Profile 绑定与可编辑
- 问题描述
  - Runtime Profile 支持多套配置，但新建会话与既有会话无法选择/切换具体组合。
- 根因定位
  - ChatCenter 未提供运行时配置选择；创建时固定传 `runtime_profile_id: null`。
  - 后端 `PATCH /chat/sessions/{id}` 无法显式清空 runtime_profile（`null` 被当成“未变更”）。
- 解决方案
  - 会话参数与新建弹窗新增 Runtime Profile 下拉，支持“使用默认 Runtime Profile”。
  - 创建/更新会话传入所选 `runtime_profile_id`。
  - 后端更新接口支持显式 `null`：若请求体包含 `runtime_profile_id` 字段则更新（含清空）。
- 影响文件
  - `frontend/src/pages/ChatCenter.tsx`
  - `backend/app/api/v1/chat.py`
  - `backend/app/services/chat_service.py`
  - `docs/USER_GUIDE.md`
  - `doc/api/chat.md`
- 验证
  - `uv sync --extra dev` 完成（新增 `black`）
  - `uv run ruff check .` 通过
  - `uv run pytest` 失败：`snap-confine` 权限不足（cap_dac_override）
  - `npm run build` 通过
