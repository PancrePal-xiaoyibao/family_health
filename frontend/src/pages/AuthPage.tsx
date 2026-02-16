import { FormEvent, useState } from "react";

import { api, ApiError } from "../api/client";
import type { UserSession } from "../api/types";

type AuthMode = "login" | "bootstrap";

export function AuthPage({ onLogin }: { onLogin: (session: UserSession) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("owner");
  const [password, setPassword] = useState("OwnerPass123");
  const [displayName, setDisplayName] = useState("Owner");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = await api.login({ username, password });
      onLogin({ token: data.access_token, role: data.role, userId: data.user_id });
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(`${error.message} (code=${error.code})`);
      } else {
        setMessage("登录失败，请检查服务状态。");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitBootstrap = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await api.bootstrapOwner({
        username,
        password,
        display_name: displayName,
      });
      setMode("login");
      setMessage("Owner 初始化成功，请直接登录。");
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(`${error.message} (code=${error.code})`);
      } else {
        setMessage("初始化失败，请稍后重试。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <h2>{mode === "login" ? "家庭内网登录" : "首次 Owner 初始化"}</h2>
        <p>
          {mode === "login"
            ? "登录后进入四中心工作区。"
            : "仅首次部署时使用，完成后请切回登录。"}
        </p>

        <form onSubmit={mode === "login" ? submitLogin : submitBootstrap}>
          <label>
            用户名
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>

          <label>
            密码
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
            />
          </label>

          {mode === "bootstrap" && (
            <label>
              显示名称
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </label>
          )}

          {message && <div className="inline-message">{message}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "处理中..." : mode === "login" ? "登录" : "初始化"}
          </button>
        </form>

        <button
          type="button"
          className="ghost"
          onClick={() => setMode(mode === "login" ? "bootstrap" : "login")}
        >
          {mode === "login" ? "首次部署？去初始化 Owner" : "返回登录"}
        </button>
      </section>
    </div>
  );
}
