# Auth Page 视觉升维记录

## 🎨 艺术指导
**Mood**: 沉稳、可信、克制奢华
**Metaphor**: 私人健康资产管理仪表舱（磨砂玻璃 + 柔光轨道）

## 运行上下文与测试规则
- 运行环境: 本机 Windows
- 验证/Checkfix 执行方式: 本地终端执行

## 👁️ 视觉审计
| 维度 | 现状 | 升维策略 |
|------|------|----------|
| 首屏气质 | 单卡片登录，品牌感弱 | 增加品牌英雄区与能力指标卡 |
| 动效反馈 | 几乎无动效 | 加入缓动入场与背景轨迹光晕漂移 |
| 空间节奏 | 信息密度平铺 | 双栏层次（内容叙事 + 操作）并保留移动端单栏 |
| 材质质感 | 普通面板 | 半透明玻璃、轻模糊、柔和阴影与高光边界 |

## 🛠️ 实施记录
- `frontend/src/pages/AuthPage.tsx`
  - 重构为 `auth-stage` 双栏布局。
  - 新增 `auth-hero` 品牌叙事区与 `auth-metrics` 指标模块。
  - 新增 `auth-backdrop` + `auth-orb` 背景动效层。
  - 保持登录/注册/初始化逻辑不变。
- `frontend/src/styles/global.css`
  - 新增登录页专属视觉系统样式与关键帧动画：`drift`、`elevate-in`。
  - 增加移动端响应式适配，确保单栏可读性。
- 用户说明书更新
  - `docs/USER_GUIDE.md`：补充登录页双栏与移动端自适应说明。

## ✅ Checkfix
- `npm run build` 通过

## [2026-02-19 01:18] 双语品牌文案联动 + README 品牌化
- Auth 首页
  - 左侧品牌区文案改为 `TEXT` 多语言字段驱动（中英联动）。
  - 语言切换时，品牌标题、描述、能力指标同步切换。
  - 影响文件: `frontend/src/pages/AuthPage.tsx`
- README 品牌化
  - 新增项目 Logo: `docs/assets/fhp-logo.svg`
  - README 顶部增加 logo、定位语、技术栈/协议标签（badges）。
  - 重构 README 结构：定位、能力、技术栈、启动、检查、文档入口、协议。
  - 影响文件: `README.md`
- 用户文档
  - 增加“首页品牌区双语跟随切换”说明。
  - 影响文件: `docs/USER_GUIDE.md`

## ✅ Checkfix
- `npm run build` 通过
