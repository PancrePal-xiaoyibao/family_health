# 聊天中心视觉与交互调试记录

## 2026-03-06 Chat QA UX 强化

### 用户问题
- 对话流里没有停止输出入口。
- 不能基于上一轮用户问题重新回答，同时保留旧答案。
- 看不到模型是否真的调用了 MCP / KB，也看不到调用明细。

### 根因
- 前端 `qaStream` 没接入 `AbortController`，只能等流结束。
- 后端 QA 仅支持“新增一条用户消息后回答”，没有 regenerate 语义。
- `chat_messages.tool_calls_json` 虽然存在，但没有在 QA 链路写入，也没有被消息列表接口返回。

### 修复
- `frontend/src/pages/ChatCenter.tsx`
  - 新增停止输出按钮。
  - 新增 assistant 消息级“重新回答”按钮。
  - 新增默认折叠的调用过程面板，流式中实时显示，结束后挂到对应消息。
- `frontend/src/api/client.ts`
  - `qaStream` 支持 `AbortSignal`。
- `backend/app/services/agent_service.py`
  - 支持 `regenerate_from_message_id`。
  - 生成并持久化 MCP / KB telemetry。
- `backend/app/services/chat_service.py`
  - assistant message 持久化 `tool_calls_json`。
  - 消息列表接口统一经 `message_to_dict` 返回 `tool_calls`。

### 验证
- `npm run build` 通过
- `uv run ruff check app tests` 通过
- `uv run pytest tests/test_stage3_mcp_flow.py` 通过
- `uv run pytest tests/test_phase1_phase2_flow.py` 通过

### 影响
- 对话过程更可解释，尤其适合医学 QA 中核验 MCP 文献检索是否真的执行。
- regenerate 为追加式，不覆盖旧回答，便于对比多版答案。

## 2026-03-06 ChatBox 固定性修复

### 用户问题
- 流式输出持续增长时，消息区把整个页面往下撑，导致 ChatBox 和 `停止输出` 按钮一起下移，难以及时点击。

### 根因
- 聊天页高度链路没有完全锁定在工作区内部。
- 右侧 `message-flow` 面板在流式增长时参与了页面整体高度扩张，而不是只让 `.messages` 自身滚动。

### 修复
- `frontend/src/styles/global.css`
  - 为 `.workspace`、`.chat-grid`、`.chat-grid > *`、`.message-flow` 补齐 `min-height: 0` / `overflow: hidden`。
  - 将滚动明确收口到 `.messages`。
  - 为 `.composer` 增加底部 sticky 语义，保证输入区和停止按钮保持在可点击位置。

### 验证
- `npm run build` 通过

### 影响
- 流式输出再长，ChatBox 也不会跟着页面一起往下跑。
- 停止输出按钮的点击路径稳定，用户可以在回答中途直接打断。

## 2026-03-06 MCP 原始详情可展开

### 用户问题
- `调用过程` 里只有“成功/失败”摘要，不足以判断 PubMed 之类 MCP 到底返回了什么。
- 用户需要在需要时展开查看 request / response / raw detail，而不是把所有原始信息直接铺在主消息流里。

### 根因
- 后端 `tool_calls` telemetry 只有摘要字段，没有结构化 request/response。
- 前端 `renderToolCalls` 只渲染概览，没有二级明细展开层。

### 修复
- `backend/app/services/mcp_service.py`
  - MCP telemetry 增加 `request`、`response`、`raw_detail`。
- `frontend/src/api/types.ts`
  - `ToolCall` 类型增加 request/response/raw detail 字段。
- `frontend/src/pages/ChatCenter.tsx`
  - 每个 MCP 调用项下增加二级折叠：`查看原始调用详情`。
  - 结构化对象用 pretty JSON 展示，便于核验调用参数与返回内容。

### 验证
- `npm run build` 通过
- `uv run python -m pytest tests/test_stage3_mcp_flow.py` 通过
- `uv run python -m pytest tests/test_phase1_phase2_flow.py` 通过
- `uv run ruff check app tests` 通过

### 影响
- 用户可以先看摘要，再按需钻取到 MCP 原始返回，不会污染主消息流。
- 医学 QA 下核验文献检索是否真正命中会更直接。
