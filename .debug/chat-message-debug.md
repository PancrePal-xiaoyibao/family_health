# 聊天消息管理 Debug 记录

## 元信息
- 模块名称: chat-messages
- 创建时间: 2026-02-19
- 最后更新: 2026-02-19
- 相关文件: backend/app/api/v1/chat.py, backend/app/services/chat_service.py, backend/app/schemas/chat.py, frontend/src/api/client.ts, frontend/src/pages/ChatCenter.tsx, doc/api/chat.md
- 依赖模块: 会话管理、鉴权
- 用户说明书路径（涉及前端功能时）: docs/USER_GUIDE.md
- 开发/部署文档路径（涉及后端或环境时）: doc/api/chat.md

## 运行上下文与测试规则（首次确认后填写，后续优先读取此处，不再反复询问）
- 运行环境: NAS Ubuntu 24（本机）
- SSH 方式（若远程）: N/A
- 远程项目路径（若远程）: /home/damncheater/Development/family_health
- 验证/Checkfix 执行方式: 直接在本机终端执行

## 上下文关系网络
- 文件结构: ChatCenter -> api client -> chat API -> chat_service
- 函数调用链: bulkDeleteChatMessages -> bulk_delete_messages
- 变量依赖图: selectedMessageIds -> 删除 API
- 数据流向: UI 勾选 -> API 删除 -> 列表刷新

## Debug 历史
### [2026-02-19 04:30] 消息勾选删除
- 问题描述: 聊天消息无法勾选后删除。
- 根因定位: 缺少消息删除 API 与前端调用。
- 解决方案: 新增单条/批量删除 API；前端增加“删除已选消息”。
- 代码变更（文件/函数）: `backend/app/api/v1/chat.py`, `backend/app/services/chat_service.py`, `backend/app/schemas/chat.py`, `frontend/src/api/client.ts`, `frontend/src/pages/ChatCenter.tsx`, `doc/api/chat.md`
- 验证结果: 前端 `npm run build` ✅；后端 ruff 未执行
- 影响评估: 消息管理可批量清理。
