# MCP API（阶段 3）

## 1) Server 配置
- `POST /api/v1/mcp/servers`
- `GET /api/v1/mcp/servers`
- `PATCH /api/v1/mcp/servers/{id}`
- `DELETE /api/v1/mcp/servers/{id}`
- `POST /api/v1/mcp/servers/{id}/ping`

字段：`name/endpoint/auth_type/auth_payload/enabled/timeout_ms`

前端约定：
- 用户填写 `command + args` 或导入模板后，前端自动转换为 `endpoint`，格式：`command://<command> <args...>`。
- 普通用户无需手工拼接 endpoint 字符串。

## 2) Agent 绑定
- `PUT /api/v1/mcp/bindings/{agent_name}`
- `GET /api/v1/mcp/bindings/{agent_name}`

说明：MCP Server 与 Agent 绑定按用户隔离，不共享到其他账号。

## 3) 前端模板导入建议
可支持用户粘贴如下 JSON 批量创建工具：

```json
{
  "mcpServers": {
    "mcp-pubmed-llm-server": {
      "command": "npx",
      "args": ["mcp-pubmed-llm-server"]
    }
  }
}
```
