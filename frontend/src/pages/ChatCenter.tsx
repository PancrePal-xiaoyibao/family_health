import { useEffect, useMemo, useState } from "react";

import { api, ApiError } from "../api/client";
import type { AgentRole, ChatMessage, ChatSession, McpServer } from "../api/types";

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function ChatCenter({ token }: { token: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [roles, setRoles] = useState<AgentRole[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [query, setQuery] = useState("");
  const [newSessionRoleId, setNewSessionRoleId] = useState("");
  const [newSessionPrompt, setNewSessionPrompt] = useState("");
  const [reasoningEnabled, setReasoningEnabled] = useState<boolean | null>(null);
  const [reasoningBudget, setReasoningBudget] = useState("");
  const [showReasoning, setShowReasoning] = useState(true);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [streamingReasoning, setStreamingReasoning] = useState("");
  const [message, setMessage] = useState("Session ready");
  const [selectedMcpIds, setSelectedMcpIds] = useState<string[]>([]);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

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
          reasoning_enabled: reasoningEnabled,
          reasoning_budget: reasoningBudget.trim() ? Number(reasoningBudget) : null,
          show_reasoning: showReasoning,
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

  const copySession = async (sessionId: string) => {
    try {
      const row = await api.copyChatSession(sessionId, token);
      setSessions((prev) => [row, ...prev]);
      setMessage("Session copied");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Copy failed");
    }
  };

  const branchSession = async (sessionId: string) => {
    try {
      const row = await api.branchChatSession(sessionId, token);
      setSessions((prev) => [row, ...prev]);
      setMessage("Session branched");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Branch failed");
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await api.deleteChatSession(sessionId, token);
      setSessions((prev) => prev.filter((x) => x.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId("");
      }
      setMessage("Session deleted");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Delete failed");
    }
  };

  const exportSession = async (sessionId: string, format: "json" | "md") => {
    try {
      const blob = await api.exportChatSession(sessionId, format, token);
      downloadBlob(blob, `${sessionId}.${format}`);
      setMessage("Session exported");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Export failed");
    }
  };

  const bulkExport = async () => {
    if (!selectedSessionIds.length) {
      setMessage("Select sessions first");
      return;
    }
    try {
      const blob = await api.bulkExportChatSessions(selectedSessionIds, token);
      downloadBlob(blob, "chat-sessions-export.zip");
      setMessage("Bulk export completed");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Bulk export failed");
    }
  };

  const bulkDelete = async () => {
    if (!selectedSessionIds.length) {
      setMessage("Select sessions first");
      return;
    }
    try {
      await api.bulkDeleteChatSessions(selectedSessionIds, token);
      setSessions((prev) => prev.filter((x) => !selectedSessionIds.includes(x.id)));
      setSelectedSessionIds([]);
      if (activeSessionId && selectedSessionIds.includes(activeSessionId)) {
        setActiveSessionId("");
      }
      setMessage("Bulk delete completed");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Bulk delete failed");
    }
  };

  const persistSessionMcp = async () => {
    if (!activeSessionId) {
      return;
    }
    try {
      const updated = await api.updateChatSession(
        activeSessionId,
        {
          default_enabled_mcp_ids: selectedMcpIds,
          reasoning_enabled: reasoningEnabled,
          reasoning_budget: reasoningBudget.trim() ? Number(reasoningBudget) : null,
          show_reasoning: showReasoning,
        },
        token,
      );
      setSessions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setMessage("Session config saved");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Save config failed");
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
    setStreamingAnswer("");
    setStreamingReasoning("");
    try {
      await api.qaStream(
        {
          session_id: activeSessionId,
          query: normalized,
          enabled_mcp_ids: selectedMcpIds,
          attachments_ids: attachmentIds,
        },
        token,
        (evt) => {
          if (evt.type === "message") {
            setStreamingAnswer((prev) => prev + (evt.delta ?? ""));
          }
          if (evt.type === "reasoning") {
            setStreamingReasoning((prev) => prev + (evt.delta ?? ""));
          }
          if (evt.type === "error") {
            setMessage(evt.message ?? "Stream failed");
          }
        },
      );
      setQuery("");
      setAttachmentIds([]);
      const res = await api.listMessages(activeSessionId, token);
      setMessages(res.items);
      setMessage("Agent replied (stream)");
      setStreamingAnswer("");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Send failed");
      setStreamingAnswer("");
      setStreamingReasoning("");
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
            placeholder="Optional. Hidden from message flow."
          />
        </label>

        <label>
          Reasoning switch
          <select
            value={reasoningEnabled === null ? "auto" : reasoningEnabled ? "on" : "off"}
            onChange={(e) =>
              setReasoningEnabled(
                e.target.value === "auto" ? null : e.target.value === "on",
              )
            }
          >
            <option value="auto">Auto</option>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label>
          Reasoning budget
          <input
            value={reasoningBudget}
            onChange={(e) => setReasoningBudget(e.target.value)}
            placeholder="e.g. 2048"
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={showReasoning}
            onChange={(e) => setShowReasoning(e.target.checked)}
          />
          Show reasoning stream
        </label>

        <div className="actions">
          <button type="button" onClick={bulkExport}>Bulk Export</button>
          <button type="button" className="ghost" onClick={bulkDelete}>Bulk Delete</button>
        </div>

        <div className="list">
          {sessions.map((item) => (
            <div key={item.id} className="list-item">
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedSessionIds.includes(item.id)}
                    onChange={(e) => {
                      setSelectedSessionIds((prev) =>
                        e.target.checked
                          ? [...prev, item.id]
                          : prev.filter((id) => id !== item.id),
                      );
                    }}
                  />
                  <button
                    type="button"
                    className={item.id === activeSessionId ? "session-item active" : "session-item"}
                    onClick={() => setActiveSessionId(item.id)}
                  >
                    <strong>{item.title}</strong>
                    <small>{new Date(item.updated_at).toLocaleString()}</small>
                  </button>
                </label>
              </div>
              <div className="actions">
                <button type="button" onClick={() => void copySession(item.id)}>Copy</button>
                <button type="button" onClick={() => void branchSession(item.id)}>Branch</button>
                <button type="button" onClick={() => void exportSession(item.id, "md")}>Export MD</button>
                <button type="button" onClick={() => void exportSession(item.id, "json")}>Export JSON</button>
                <button type="button" className="ghost" onClick={() => void deleteSession(item.id)}>Delete</button>
              </div>
            </div>
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
          {streamingReasoning && showReasoning && (
            <article className="bubble assistant">
              <header>reasoning</header>
              <p>{streamingReasoning}</p>
            </article>
          )}
          {streamingAnswer && (
            <article className="bubble assistant">
              <header>assistant (streaming)</header>
              <p>{streamingAnswer}</p>
            </article>
          )}
        </div>
        <div className="composer">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type health question. Empty text + attachments works too."
          />
          <button type="button" onClick={sendQa} disabled={!activeSessionId}>
            Send (Stream)
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
          Save Session Config
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
