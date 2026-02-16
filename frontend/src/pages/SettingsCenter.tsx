import { useEffect, useState } from "react";

import { api, ApiError } from "../api/client";
import type { McpServer, ModelCatalog, Provider, RuntimeProfile } from "../api/types";

export function SettingsCenter({ token, role }: { token: string; role: string }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [catalog, setCatalog] = useState<ModelCatalog[]>([]);
  const [profiles, setProfiles] = useState<RuntimeProfile[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [message, setMessage] = useState("准备就绪");

  const [providerForm, setProviderForm] = useState({
    provider_name: "gemini",
    base_url: "https://example.local/gemini",
    api_key: "",
    enabled: true,
  });
  const [manualModels, setManualModels] = useState("gemini-custom");
  const [profileForm, setProfileForm] = useState({
    name: "default-profile",
    llm_model_id: "",
    embedding_model_id: "",
    reranker_model_id: "",
    params: '{"temperature":0.2}',
    is_default: true,
  });
  const [mcpForm, setMcpForm] = useState({
    name: "tool-a",
    endpoint: "mock://tool-a",
    auth_type: "none",
    auth_payload: "",
    enabled: true,
    timeout_ms: 8000,
  });
  const [bindingIds, setBindingIds] = useState<string[]>([]);

  const canManage = role === "owner" || role === "admin";

  const loadData = async () => {
    try {
      const [providerRes, catalogRes, profileRes, mcpRes] = await Promise.all([
        api.listProviders(token),
        api.listCatalog(token),
        api.listRuntimeProfiles(token),
        api.listMcpServers(token),
      ]);
      setProviders(providerRes.items);
      setCatalog(catalogRes.items);
      setProfiles(profileRes.items);
      setMcpServers(mcpRes.items);
    } catch (error) {
      const text = error instanceof ApiError ? error.message : "加载设置数据失败";
      setMessage(text);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const createProvider = async () => {
    if (!canManage) {
      return;
    }
    try {
      await api.createProvider(providerForm, token);
      setMessage("Provider 已保存");
      await loadData();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Provider 保存失败");
    }
  };

  const refreshProvider = async (providerId: string) => {
    try {
      await api.refreshProviderModels(
        providerId,
        {
          manual_models: manualModels
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        },
        token,
      );
      setMessage("模型目录已刷新");
      await loadData();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "模型刷新失败");
    }
  };

  const createProfile = async () => {
    if (!canManage) {
      return;
    }
    try {
      const params = JSON.parse(profileForm.params) as Record<string, unknown>;
      await api.createRuntimeProfile(
        {
          name: profileForm.name,
          llm_model_id: profileForm.llm_model_id || null,
          embedding_model_id: profileForm.embedding_model_id || null,
          reranker_model_id: profileForm.reranker_model_id || null,
          params,
          is_default: profileForm.is_default,
        },
        token,
      );
      setMessage("Runtime Profile 已创建");
      await loadData();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Runtime Profile 创建失败");
    }
  };

  const createMcp = async () => {
    if (!canManage) {
      return;
    }
    try {
      await api.createMcpServer(
        {
          ...mcpForm,
          auth_payload: mcpForm.auth_payload || undefined,
        },
        token,
      );
      setMessage("MCP Server 已创建");
      await loadData();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "MCP 创建失败");
    }
  };

  const bindQa = async () => {
    if (!canManage) {
      return;
    }
    try {
      await api.bindQaMcpServers(bindingIds, token);
      setMessage("QA Agent MCP 绑定已更新");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "绑定失败");
    }
  };

  if (!canManage) {
    return <section className="panel">当前角色不可访问设置中心。</section>;
  }

  return (
    <section className="page-grid two-cols">
      <div className="panel">
        <h3>模型与 Provider</h3>
        <p className="muted">保存 API 与 URL 后可刷新模型目录。</p>
        <label>
          Provider
          <input
            value={providerForm.provider_name}
            onChange={(e) => setProviderForm((s) => ({ ...s, provider_name: e.target.value }))}
          />
        </label>
        <label>
          Base URL
          <input
            value={providerForm.base_url}
            onChange={(e) => setProviderForm((s) => ({ ...s, base_url: e.target.value }))}
          />
        </label>
        <label>
          API Key
          <input
            value={providerForm.api_key}
            onChange={(e) => setProviderForm((s) => ({ ...s, api_key: e.target.value }))}
            type="password"
          />
        </label>
        <button type="button" onClick={createProvider}>
          保存 Provider
        </button>

        <label>
          手动补充模型(逗号分隔)
          <input value={manualModels} onChange={(e) => setManualModels(e.target.value)} />
        </label>

        <div className="list">
          {providers.map((item) => (
            <div key={item.id} className="list-item">
              <div>
                <strong>{item.provider_name}</strong>
                <small>{item.base_url}</small>
              </div>
              <button type="button" onClick={() => void refreshProvider(item.id)}>
                刷新模型
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Runtime Profile + MCP 全局配置</h3>
        <label>
          Profile 名称
          <input
            value={profileForm.name}
            onChange={(e) => setProfileForm((s) => ({ ...s, name: e.target.value }))}
          />
        </label>
        <label>
          LLM Model ID
          <input
            value={profileForm.llm_model_id}
            onChange={(e) => setProfileForm((s) => ({ ...s, llm_model_id: e.target.value }))}
          />
        </label>
        <label>
          Params(JSON)
          <textarea
            value={profileForm.params}
            onChange={(e) => setProfileForm((s) => ({ ...s, params: e.target.value }))}
          />
        </label>
        <button type="button" onClick={createProfile}>
          创建 Runtime Profile
        </button>

        <hr />
        <label>
          MCP 名称
          <input value={mcpForm.name} onChange={(e) => setMcpForm((s) => ({ ...s, name: e.target.value }))} />
        </label>
        <label>
          MCP Endpoint
          <input
            value={mcpForm.endpoint}
            onChange={(e) => setMcpForm((s) => ({ ...s, endpoint: e.target.value }))}
          />
        </label>
        <button type="button" onClick={createMcp}>
          创建 MCP Server
        </button>

        <label>
          QA 全局 MCP 绑定
          <select
            multiple
            value={bindingIds}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions).map((opt) => opt.value);
              setBindingIds(values);
            }}
          >
            {mcpServers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={bindQa}>
          更新 QA 绑定
        </button>

        <div className="mini-grid">
          <div>
            <h4>模型目录</h4>
            <ul>
              {catalog.map((item) => (
                <li key={item.id}>{item.model_name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Runtime Profiles</h4>
            <ul>
              {profiles.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="inline-message">{message}</p>
      </div>
    </section>
  );
}
