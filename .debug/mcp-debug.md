# MCP Debug 记录

## 元信息
- 模块名称: mcp
- 创建时间: 2026-02-18
- 最后更新: 2026-02-18
- 相关文件: `frontend/src/pages/SettingsCenter.tsx`, `frontend/src/api/client.ts`, `doc/api/mcp.md`, `docs/USER_GUIDE.md`
- 依赖模块: auth, settings-center, agent
- 用户说明书路径（涉及前端功能时）: `docs/USER_GUIDE.md`
- 开发/部署文档路径（涉及后端或环境时）: `doc/api/mcp.md`

## 运行上下文与测试规则（首次确认后填写，后续优先读取此处，不再反复询问）
- 运行环境: 本机 Windows
- SSH 方式（若远程）: N/A
- 远程项目路径（若远程）: N/A
- 验证/Checkfix 执行方式: 本地终端；前端在 `frontend/` 执行 `npm run build`

## 上下文关系网络
- 文件结构
  - `frontend/src/pages/SettingsCenter.tsx`: MCP 创建与模板导入交互
  - `frontend/src/api/client.ts`: API 错误处理（401 提示）
  - `backend/app/api/v1/mcp.py`: MCP API 鉴权入口
- 函数调用链
  - SettingsCenter -> api.createMcpServer -> `POST /api/v1/mcp/servers` -> `current_user` 鉴权
- 变量依赖图
  - `mcpForm.command/args` -> 自动拼装 `endpoint`
- 数据流向
  - 用户输入命令模板 -> 前端转换 endpoint -> 后端保存 server -> 可绑定 QA agent

## Debug 历史
### [2026-02-18 16:20] MCP 导入交互修正与 401 提示明确化
- 问题描述
  - 用户希望 MCP 按 npx 配置自动导入，不想手填 endpoint。
  - MCP 创建/绑定日志持续 401，误判为导入流程失败。
- 根因定位
  - 前端同时展示手工 endpoint 字段和模板导入，交互认知冲突。
  - 401 实际来自鉴权失败（access token 失效/缺失），不是 MCP 模板解析错误。
- 解决方案
  - MCP 手工创建改为 `启动命令 + 启动参数`，前端自动生成 endpoint。
  - 模板导入保持自动转换，无需用户拼 endpoint。
  - 401 错误文案统一为“登录状态已失效，请重新登录后重试”。
- 代码变更（文件/函数）
  - `frontend/src/pages/SettingsCenter.tsx`: `buildCommandEndpoint`、`splitArgs`、MCP 表单字段与提示文案
  - `frontend/src/api/client.ts`: 401 统一提示处理
  - `doc/api/mcp.md`: 前端自动转换 endpoint 约定
  - `docs/USER_GUIDE.md`: MCP 创建说明与 401 排查
- 验证结果
  - 待执行前端构建检查。
- 影响评估
  - 后端 API 不变，仅前端交互与报错提示增强。
- 文档更新（新增/修改的 docs 文件与更新点）
  - 修改 `doc/api/mcp.md`
  - 修改 `docs/USER_GUIDE.md`

## 待追踪问题
- 后续可增加 access token 自动刷新机制，避免频繁重新登录。

## 技术债务记录
- 当前前端仍未实现 refresh token 自动续期。
