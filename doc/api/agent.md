# Agent QA API

- `GET /api/v1/agent/roles`
- `GET /api/v1/agent/roles/{role_id}`
- `POST /api/v1/agent/qa`
- `POST /api/v1/agent/qa/stream` (SSE)

## Request

```json
{
  "session_id": "session-id",
  "query": "最新血脂指南怎么看",
  "kb_ids": ["kb-a", "kb-b"],
  "background_prompt": "optional request-level prompt override",
  "enabled_mcp_ids": ["mcp-a"],
  "runtime_profile_id": null,
  "attachments_ids": ["att-1"],
  "regenerate_from_message_id": null
}
```

## Behavior

1. Normal QA writes a new user message, then assembles trimmed history, attachment context, KB retrieval, and MCP outputs.
2. `regenerate_from_message_id` reuses an existing `user` message in the same session and does not create another user message.
3. Regeneration trims history to the target user turn, so the model does not see the old assistant answer being regenerated.
4. KB retrieval is additive per selected KB; `7003` (KB not ready) is downgraded to warning.
5. MCP effective order remains: request override > session default > global QA bindings.
6. Assistant messages persist:
   - `reasoning_content`
   - `tool_calls` (structured MCP / KB trace)

## Non-stream Response

```json
{
  "session_id": "session-id",
  "assistant_message_id": "msg-id",
  "assistant_answer": "...",
  "reasoning_content": "...",
  "context": {
    "history_messages": 4,
    "attachment_chunks": 1,
    "kb_hits": 3,
    "enabled_mcp_ids": ["mcp-a"]
  },
  "mcp_results": [],
  "tool_warnings": [],
  "tool_calls": [
    {
      "kind": "mcp",
      "status": "success",
      "server_id": "mcp-a",
      "server_name": "pubmed-search",
      "query": "最新血脂指南怎么看",
      "output": "...",
      "duration_ms": 132
    },
    {
      "kind": "kb",
      "status": "success",
      "kb_id": "kb-a",
      "query": "最新血脂指南怎么看",
      "hit_count": 2,
      "hits": [
        {
          "score": 0.91,
          "preview": "..."
        }
      ],
      "detail": "KB kb-a returned 2 hit(s)"
    }
  ]
}
```

## Stream Events

- `{"type":"tool","tool_call":{...}}`
- `{"type":"message","delta":"..."}`
- `{"type":"reasoning","delta":"..."}`
- `{"type":"done","assistant_message_id":"...","assistant_answer":"...","reasoning_content":"...","tool_calls":[...]}`
- `{"type":"error","message":"..."}`

Notes:

- Tool events are emitted before model output starts, so the UI can show whether MCP / KB lookup actually ran.
- If the client aborts the HTTP stream, the frontend can stop rendering immediately and keep partial output.
