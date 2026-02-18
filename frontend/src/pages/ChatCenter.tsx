import { useEffect, useMemo, useState } from "react";

import { api, ApiError } from "../api/client";
import type { AgentRole, ChatMessage, ChatSession, McpServer } from "../api/types";

export function ChatCenter({ token }: { token: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [roles, setRoles] = useState<AgentRole[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [query, setQuery] = useState("");
  const [newSessionRoleId, setNewSessionRoleId] = useState("");
  const [newSessionPrompt, setNewSessionPrompt] = useState("");
  const [message, setMessage] = useState("Session ready");
  const [selectedMcpIds, setSelectedMcpIds] = useState<string[]>([]);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);

  const activeSession = useMemo(
    () => sessions.find((item) => item.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  const loadSessions = async () => {
    try {
      const [sessionRes, mcpRes, roleRes] = await Promise.all([
        api.listChatSessions(token),
        api.listMcpServers(token),
        api.listAgentRoles(token),
      ]);
      setSessions(sessionRes.items);
      setMcpServers(mcpRes.items);
      setRoles(roleRes.items);
      if (!activeSessionId && sessionRes.items.length > 0) {
        setActiveSessionId(sessionRes.items[0].id);
      }
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Failed to load sessions");
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }
      try {
        const res = await api.listMessages(activeSessionId, token);
        setMessages(res.items);
      } catch (error) {
        setMessage(error instanceof ApiError ? error.message : "Failed to load messages");
      }
    };
    void loadMessages();
  }, [activeSessionId, token]);

  useEffect(() => {
    if (!activeSession) {
      setSelectedMcpIds([]);
      return;
    }
    setSelectedMcpIds(activeSession.default_enabled_mcp_ids);
  }, [activeSession]);

  const createSession = async () => {
    try {
      const session = await api.createChatSession(
        {
          title: `Chat ${new Date().toLocaleTimeString()}`,
          runtime_profile_id: null,
          role_id: newSessionRoleId || null,
          background_prompt: newSessionPrompt.trim() || null,
          default_enabled_mcp_ids: selectedMcpIds,
        },
        token,
      );
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessage("Session created");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Failed to create session");
    }
  };

  const persistSessionMcp = async () => {
    if (!activeSessionId) {
      return;
    }
    try {
      const updated = await api.updateChatSession(
        activeSessionId,
        { default_enabled_mcp_ids: selectedMcpIds },
        token,
      );
      setSessions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setMessage("Default MCP saved");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Failed to save default MCP");
    }
  };

  const sendQa = async () => {
    const normalized = query.trim();
    if (!activeSessionId) {
      return;
    }
    if (!normalized && attachmentIds.length === 0) {
      setMessage("Enter a question or upload attachment(s) first");
      return;
    }
    try {
      await api.qa(
        {
          session_id: activeSessionId,
          query: normalized,
          enabled_mcp_ids: selectedMcpIds,
          attachments_ids: attachmentIds,
        },
        token,
      );
      setQuery("");
      setAttachmentIds([]);
      const res = await api.listMessages(activeSessionId, token);
      setMessages(res.items);
      setMessage("Agent replied");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Send failed");
    }
  };

  const upload = async (file: File | null) => {
    if (!file || !activeSessionId) {
      return;
    }
    try {
      const res = await api.uploadAttachment(activeSessionId, file, token);
      setAttachmentIds((prev) => [...prev, res.id]);
      setMessage(`Attachment sanitized: ${file.name}`);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Upload failed");
    }
  };

  return (
    <section className="chat-grid">
      <div className="panel">
        <div className="row-between">
          <h3>Sessions</h3>
          <button type="button" onClick={createSession}>
            New
          </button>
        </div>
        <label>
          Medical Role
          <select value={newSessionRoleId} onChange={(e) => setNewSessionRoleId(e.target.value)}>
            <option value="">No preset role</option>
            {roles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Custom Role Prompt (session-level)
          <textarea
            value={newSessionPrompt}
            onChange={(e) => setNewSessionPrompt(e.target.value)}
            placeholder="Optional. Used as system prompt and hidden from message flow."
          />
        </label>
        <div className="list">
          {sessions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeSessionId ? "session-item active" : "session-item"}
              onClick={() => setActiveSessionId(item.id)}
            >
              <strong>{item.title}</strong>
              <small>{new Date(item.updated_at).toLocaleString()}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="panel message-flow">
        <h3>Message Flow</h3>
        <div className="messages">
          {messages.length === 0 && <p className="muted">No messages yet.</p>}
          {messages.map((item) => (
            <article key={item.id} className={item.role === "assistant" ? "bubble assistant" : "bubble user"}>
              <header>{item.role}</header>
              <p>{item.content}</p>
            </article>
          ))}
        </div>
        <div className="composer">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type health question. Empty text + attachments works too."
          />
          <button type="button" onClick={sendQa} disabled={!activeSessionId}>
            Send to Agent
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Tools & Context</h3>
        <label>
          MCP for this request
          <select
            multiple
            value={selectedMcpIds}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions).map((x) => x.value);
              setSelectedMcpIds(values);
            }}
          >
            {mcpServers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={persistSessionMcp} disabled={!activeSessionId}>
          Save as Session Default MCP
        </button>

        <label>
          Upload attachment
          <input type="file" onChange={(e) => void upload(e.target.files?.[0] ?? null)} />
        </label>
        <p className="muted">Pending attachment ids: {attachmentIds.join(",") || "none"}</p>

        <div className="inline-message">{message}</div>
      </div>
    </section>
  );
}
