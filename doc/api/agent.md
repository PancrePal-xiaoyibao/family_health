# Agent QA API（阶段 2+3）

- `GET /api/v1/agent/roles`（读取后端 Markdown 角色库）
- `GET /api/v1/agent/roles/{role_id}`（读取角色提示词全文）
- `POST /api/v1/agent/qa`
- `POST /api/v1/agent/qa/stream`（SSE）

请求：
```json
{
  "session_id": "...",
  "query": "",
  "background_prompt": "可选：仅本次请求覆盖会话角色提示词",
  "enabled_mcp_ids": ["mcp-a"],
  "runtime_profile_id": null,
  "attachments_ids": ["att-1"]
}
```

行为：
1. 写入用户消息（不写入背景提示词/角色提示词）。
2. 读取会话历史并按窗口裁剪。
3. 仅加载 `parse_status=done` 的脱敏附件文本。
4. 支持“仅附件模式”：`query` 可为空，但 `attachments_ids` 至少一个。
5. 计算 MCP 生效列表：本轮 > 会话默认 > 全局绑定。
6. 并发执行 MCP，失败降级为 `tool_warnings`。
7. 优先按 Runtime Profile 真实调用已配置 Provider（Gemini/OpenAI 兼容）；未配置时回退本地兜底回答。
8. 生成 assistant 回答并入库。

流式事件格式（`qa/stream`）：
- `{"type":"message","delta":"..."}`：回答增量
- `{"type":"reasoning","delta":"..."}`：思维链增量（当会话 `show_reasoning=true` 且模型支持）
- `{"type":"done","assistant_message_id":"...","assistant_answer":"...","reasoning_content":"..."}`：结束
- `{"type":"error","message":"..."}`：失败

思维链参数来源（会话级）：
- `reasoning_enabled`：`null/true/false`
- `reasoning_budget`：思维预算（Gemini 映射到 `thinkingBudget`；DeepSeek/兼容路径映射到 `max_tokens` 兜底）
- `show_reasoning`：是否向前端输出 reasoning 事件
