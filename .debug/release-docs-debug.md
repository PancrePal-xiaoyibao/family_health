# Release Docs Debug 记录

## 元信息
- 模块名称: release-docs
- 创建时间: 2026-02-16
- 最后更新: 2026-02-16
- 相关文件: `README.md`, `doc/DEPLOYMENT.md`
- 依赖模块: frontend, backend, scripts
- 用户说明书路径（涉及前端功能时）: `docs/USER_GUIDE.md`
- 开发/部署文档路径（涉及后端或环境时）: `doc/DEPLOYMENT.md`

## 运行上下文与测试规则
- 运行环境: 本机 Windows
- SSH 方式（若远程）: N/A
- 远程项目路径（若远程）: N/A
- 验证/Checkfix 执行方式: 文档一致性检查 + 路径命令核对

## 上下文关系网络
- 文件结构:
  - `README.md` -> 仓库入口说明
  - `doc/DEPLOYMENT.md` -> 开发部署与联调验收指南
- 函数调用链: N/A
- 变量依赖图: N/A
- 数据流向: N/A

## Debug 历史
### [2026-02-16 17:20] 发布前 README 编写与 DEPLOYMENT 审校
- 问题描述: 发布前需要补仓库级 README，并检查部署文档是否与当前实现一致。
- 根因定位: 根目录无 README，DEPLOYMENT 内容存在阶段性叠加，缺少明确联调入口与统一结构。
- 解决方案: 新增 `README.md`，并重写 `doc/DEPLOYMENT.md` 为当前实现一致版本。
- 代码变更（文件/函数）:
  - 新增 `README.md`
  - 更新 `doc/DEPLOYMENT.md`
- 验证结果:
  - 文档链接与路径检查通过（frontend/backend/scripts/doc/api/docs）
  - 联调脚本入口与命令与当前仓库结构一致
- 影响评估: 仅文档变更，不影响运行逻辑。
- 文档更新（新增/修改的 docs 文件与更新点）:
  - `README.md`: 项目概览、快速启动、检查命令、文档入口
  - `doc/DEPLOYMENT.md`: 环境/部署/联调/检查与文档维护约定

### [2026-02-16 17:35] Windows 启动命令修订（WinError 10013）
- 问题描述: 用户在 Windows 上使用 `--host 0.0.0.0` 启动出现 `WinError 10013`，`127.0.0.1` 可正常启动。
- 根因定位: 本机网络/安全策略对“监听所有网卡”有限制，非依赖安装问题。
- 解决方案: 文档默认启动命令统一为 `--host 127.0.0.1`，并补充内网访问时切回 `0.0.0.0` 的说明。
- 代码变更（文件/函数）:
  - `README.md`
  - `doc/DEPLOYMENT.md`
- 验证结果:
  - 用户实测 `uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` 启动成功并 `/health` 返回 200。
- 影响评估: 仅文档变更，默认更稳健；不影响业务逻辑。
- 文档更新（新增/修改的 docs 文件与更新点）:
  - `README.md`: 启动命令与 WinError 10013 说明
  - `doc/DEPLOYMENT.md`: 启动命令与排查说明

## 待追踪问题
- `.exe` 打包章节仍为规划态，待 packager 实装后补实操命令。

## 技术债务记录
- 可后续补 Linux/macOS 命令分支（当前主要面向 Windows 内网部署）。
