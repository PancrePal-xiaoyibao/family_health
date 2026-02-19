# Agent QA Debug 记录

## 元信息
- 模块名称: agent-qa
- 创建时间: 2026-02-19
- 最后更新: 2026-02-19
- 相关文件: backend/app/services/agent_service.py, backend/app/services/knowledge_base_service.py
- 依赖模块: 知识库检索、聊天会话
- 用户说明书路径（涉及前端功能时）: docs/USER_GUIDE.md
- 开发/部署文档路径（涉及后端或环境时）: doc/DEPLOYMENT.md

## 运行上下文与测试规则（首次确认后填写，后续优先读取此处，不再反复询问）
- 运行环境: NAS Ubuntu 24（本机）
- SSH 方式（若远程）: N/A
- 远程项目路径（若远程）: /home/damncheater/Development/family_health
- 验证/Checkfix 执行方式: 直接在本机终端执行

## 上下文关系网络
- 文件结构: agent_service -> knowledge_base_service.retrieve_from_kb
- 函数调用链: stream_agent_qa -> _prepare_context -> retrieve_from_kb
- 变量依赖图: kb_id -> retrieve_from_kb(top_k)
- 数据流向: 查询 -> KB 检索 -> QA 上下文

## Debug 历史
### [2026-02-19 04:10] KB QA 报错修复
- 问题描述: QA 流式接口报 `retrieve_from_kb() missing top_k`。
- 根因定位: 调用 `retrieve_from_kb` 时缺少新增必填参数 `top_k`。
- 解决方案: 传入 `top_k=None`，由 KB 默认参数接管。
- 代码变更（文件/函数）: `backend/app/services/agent_service.py` `_prepare_context`
- 验证结果: `uv run ruff check .` 失败（ruff 未安装）
- 影响评估: QA 流式调用恢复，KB 参数默认值生效。

### [2026-02-19 13:10] KB 命中文本未进入上下文
- 问题描述: 挂载知识库后 QA 仍无命中内容，回答缺少 KB 语境。
- 根因定位: `_build_context_suffix` 读取了 `chunk_text` 字段，但 `retrieve_from_kb` 返回的是 `text`。
- 解决方案: 兼容读取 `text`，并保留 `chunk_text` 兜底。
- 代码变更（文件/函数）: `backend/app/services/agent_service.py` `_build_context_suffix`
- 验证结果: 未执行（待确认运行上下文）
- 影响评估: 仅影响上下文拼接，不改变检索排序逻辑。
