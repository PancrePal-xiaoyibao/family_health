# 认证与用户 API 文档

## 端点概览

| 方法 | 路径 | 功能 | 认证 |
|---|---|---|---|
| POST | `/api/v1/auth/bootstrap-owner` | 首次初始化 Owner 账户 | 否（仅首次可用） |
| POST | `/api/v1/auth/login` | 用户登录 | 否 |
| POST | `/api/v1/auth/refresh` | 刷新 access token | 否（携带 refresh token） |
| POST | `/api/v1/auth/logout` | 用户退出登录 | Bearer Token |
| POST | `/api/v1/auth/users` | 管理员创建用户 | Owner/Admin |
| PATCH | `/api/v1/auth/users/{id}/role` | 更新用户角色 | Owner/Admin |
| PATCH | `/api/v1/auth/users/{id}/status` | 更新用户状态 | Owner/Admin |

统一响应包络:

```json
{
  "code": 0,
  "data": {},
  "message": "ok",
  "trace_id": "uuid"
}
```

失败响应:

```json
{
  "code": 2001,
  "data": null,
  "message": "Owner already initialized",
  "trace_id": "uuid"
}
```

## 详细接口

### 1) 初始化 Owner

- 路径: `POST /api/v1/auth/bootstrap-owner`
- 描述: 系统首次安装时创建唯一 Owner 用户；后续调用会失败。

请求体:

```json
{
  "username": "owner",
  "password": "owner-pass-123",
  "display_name": "Owner"
}
```

### 2) 登录

- 路径: `POST /api/v1/auth/login`
- 描述: 用户名密码登录，返回 access/refresh token。

请求体:

```json
{
  "username": "owner",
  "password": "owner-pass-123",
  "device_label": "local-browser"
}
```

成功 data:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer",
  "role": "owner",
  "user_id": "uuid"
}
```

### 3) 刷新 Token

- 路径: `POST /api/v1/auth/refresh`
- 描述: 使用 refresh token 轮换并签发新 access/refresh。

请求体:

```json
{
  "refresh_token": "..."
}
```

### 4) 退出登录

- 路径: `POST /api/v1/auth/logout`
- 认证: `Authorization: Bearer <access_token>`
- 描述: 撤销当前 refresh token 会话。

请求体:

```json
{
  "refresh_token": "..."
}
```

### 5) 管理员创建用户

- 路径: `POST /api/v1/auth/users`
- 认证: Owner/Admin

请求体:

```json
{
  "username": "member01",
  "password": "member-pass-123",
  "display_name": "Member 01",
  "role": "member"
}
```

### 6) 更新角色

- 路径: `PATCH /api/v1/auth/users/{id}/role`
- 认证: Owner/Admin

请求体:

```json
{
  "role": "viewer"
}
```

### 7) 更新状态

- 路径: `PATCH /api/v1/auth/users/{id}/status`
- 认证: Owner/Admin

请求体:

```json
{
  "status": "disabled"
}
```

## 错误码

| 错误码 | 含义 |
|---|---|
| 2001 | 资源冲突（如 Owner 已初始化） |
| 2002 | 用户名已存在 |
| 2003 | 用户名或密码错误 |
| 2004 | refresh token 无效 |
| 4003 | 用户被禁用 |
| 4004 | 用户临时锁定 |

## curl 示例

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"owner","password":"owner-pass-123"}'
```
