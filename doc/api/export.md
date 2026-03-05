# 导出 API（阶段 4）

- `POST /api/v1/exports/jobs`
- `GET /api/v1/exports/jobs`
- `GET /api/v1/exports/jobs/{id}`
- `GET /api/v1/exports/jobs/{id}/download`
- `DELETE /api/v1/exports/jobs/{id}`
- `POST /api/v1/exports/candidates`（导出前预览候选列表）

## 创建任务示例
```json
{
  "member_scope": "global",
  "export_types": ["chat", "kb"],
  "include_raw_file": false,
  "include_sanitized_text": true,
  "filters": {"chat_limit": 200}
}
```

## 打包输出
- ZIP 必含 `manifest.json`（任务信息 + item 统计）
- `chat/*.md`：聊天消息导出（Markdown 格式，包含角色、内容、会话 ID、时间）
- `kb/meta/*.json`：知识库文档元数据（总是导出）
- `kb/sanitized/*`：脱敏文本（`include_sanitized_text=true`）
- `kb/raw/*`：原始文件（`include_raw_file=true`）

说明：
- 导出任务仅打包当前登录用户可见的数据（按 `knowledge_bases.user_id` 和 `chat_sessions.user_id` 判定）。
- `chat_limit` 会约束到 `1~1000`，非法值回退到 `200`。
