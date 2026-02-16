import { useEffect, useState } from "react";

import { api, ApiError } from "../api/client";
import type { KnowledgeBase } from "../api/types";

export function KnowledgeBaseCenter({ token, role }: { token: string; role: string }) {
  const [kbList, setKbList] = useState<KnowledgeBase[]>([]);
  const [activeKbId, setActiveKbId] = useState("");
  const [kbName, setKbName] = useState("family-kb");
  const [docTitle, setDocTitle] = useState("doc-1");
  const [docContent, setDocContent] = useState("请输入文档内容，可粘贴 markdown。");
  const [query, setQuery] = useState("高血压");
  const [queryResult, setQueryResult] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<Array<Record<string, unknown>>>([]);
  const [message, setMessage] = useState("等待构建");

  const canWrite = role !== "viewer";

  const loadKb = async () => {
    try {
      const res = await api.listKb(token);
      setKbList(res.items);
      if (!activeKbId && res.items.length > 0) {
        setActiveKbId(res.items[0].id);
      }
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "知识库读取失败");
    }
  };

  useEffect(() => {
    void loadKb();
  }, []);

  const loadTimeline = async (kbId: string) => {
    try {
      const res = await api.listKbDocuments(kbId, token);
      setTimeline(res.items);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "文档状态读取失败");
    }
  };

  useEffect(() => {
    if (activeKbId) {
      void loadTimeline(activeKbId);
    }
  }, [activeKbId]);

  const createKb = async () => {
    if (!canWrite) {
      return;
    }
    try {
      const kb = await api.createKb(
        {
          name: kbName,
          member_scope: "global",
          chunk_size: 1000,
          chunk_overlap: 150,
          top_k: 8,
          rerank_top_n: 4,
        },
        token,
      );
      setKbList((prev) => [kb, ...prev]);
      setActiveKbId(kb.id);
      setMessage("知识库已创建");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "创建知识库失败");
    }
  };

  const build = async () => {
    if (!activeKbId || !canWrite) {
      return;
    }
    try {
      const res = await api.buildKb(activeKbId, [{ title: docTitle, content: docContent }], token);
      setMessage(`构建完成: docs=${res.documents}, chunks=${res.chunks}, status=${res.status}`);
      await loadTimeline(activeKbId);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "构建失败");
    }
  };

  const search = async () => {
    if (!activeKbId) {
      return;
    }
    try {
      const res = await api.retrievalQuery({ kb_id: activeKbId, query, top_k: 5 }, token);
      const text = res.items.map((item) => String(item.text ?? ""));
      setQueryResult(text);
      setMessage(`命中 ${text.length} 条`);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "检索失败");
    }
  };

  return (
    <section className="page-grid two-cols">
      <div className="panel">
        <h3>知识库列表与参数</h3>
        <label>
          KB 名称
          <input value={kbName} onChange={(e) => setKbName(e.target.value)} />
        </label>
        <button type="button" onClick={createKb} disabled={!canWrite}>
          创建 KB
        </button>

        <div className="list">
          {kbList.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeKbId ? "session-item active" : "session-item"}
              onClick={() => setActiveKbId(item.id)}
            >
              <strong>{item.name}</strong>
              <small>{item.status}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>构建与任务时间线</h3>
        <label>
          文档标题
          <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
        </label>
        <label>
          文档内容
          <textarea value={docContent} onChange={(e) => setDocContent(e.target.value)} rows={6} />
        </label>
        <button type="button" onClick={build} disabled={!activeKbId || !canWrite}>
          构建
        </button>

        <label>
          检索 Query
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button type="button" onClick={search} disabled={!activeKbId}>
          检索
        </button>

        <div className="mini-grid">
          <div>
            <h4>文档状态</h4>
            <ul>
              {timeline.map((item) => (
                <li key={String(item.id)}>
                  {String(item.id).slice(0, 8)} - {String(item.status)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>检索结果</h4>
            <ul>
              {queryResult.map((item, idx) => (
                <li key={`${idx}-${item.slice(0, 10)}`}>{item.slice(0, 80)}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="inline-message">{message}</p>
      </div>
    </section>
  );
}
