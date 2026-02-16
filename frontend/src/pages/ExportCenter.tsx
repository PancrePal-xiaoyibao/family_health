import { useEffect, useState } from "react";

import { api, ApiError } from "../api/client";
import type { ExportJob } from "../api/types";

export function ExportCenter({ token }: { token: string }) {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [includeRaw, setIncludeRaw] = useState(false);
  const [includeSanitized, setIncludeSanitized] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [kbEnabled, setKbEnabled] = useState(true);
  const [chatLimit, setChatLimit] = useState(200);
  const [message, setMessage] = useState("准备创建导出任务");

  const loadJobs = async () => {
    try {
      const res = await api.listExportJobs(token);
      setJobs(res.items);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "导出任务读取失败");
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const createJob = async () => {
    const exportTypes = [chatEnabled ? "chat" : "", kbEnabled ? "kb" : ""].filter(Boolean);
    if (exportTypes.length === 0) {
      setMessage("至少选择一种导出类型");
      return;
    }
    try {
      await api.createExportJob(
        {
          member_scope: "global",
          export_types: exportTypes,
          include_raw_file: includeRaw,
          include_sanitized_text: includeSanitized,
          filters: { chat_limit: chatLimit },
        },
        token,
      );
      setMessage("导出任务创建成功");
      await loadJobs();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "导出任务创建失败");
    }
  };

  const removeJob = async (jobId: string) => {
    try {
      await api.deleteExportJob(jobId, token);
      setMessage("任务已删除");
      await loadJobs();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "删除任务失败");
    }
  };

  const download = async (jobId: string) => {
    try {
      const blob = await api.downloadExportJob(jobId, token);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${jobId}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("下载已开始");
    } catch {
      setMessage("下载失败，请确认任务状态为 done");
    }
  };

  return (
    <section className="page-grid two-cols">
      <div className="panel">
        <h3>导出筛选器</h3>
        <label>
          <input type="checkbox" checked={chatEnabled} onChange={(e) => setChatEnabled(e.target.checked)} />
          聊天记录
        </label>
        <label>
          <input type="checkbox" checked={kbEnabled} onChange={(e) => setKbEnabled(e.target.checked)} />
          知识库文档
        </label>
        <label>
          <input type="checkbox" checked={includeRaw} onChange={(e) => setIncludeRaw(e.target.checked)} />
          包含原始文件（谨慎）
        </label>
        <label>
          <input
            type="checkbox"
            checked={includeSanitized}
            onChange={(e) => setIncludeSanitized(e.target.checked)}
          />
          包含脱敏文本
        </label>

        <label>
          聊天导出条数上限
          <input
            type="number"
            value={chatLimit}
            min={1}
            max={1000}
            onChange={(e) => setChatLimit(Number(e.target.value))}
          />
        </label>

        <button type="button" onClick={createJob}>
          创建打包任务
        </button>
        <p className="inline-message">{message}</p>
      </div>

      <div className="panel">
        <h3>导出任务列表</h3>
        <div className="list">
          {jobs.map((item) => (
            <article key={item.id} className="list-item">
              <div>
                <strong>{item.id.slice(0, 8)}</strong>
                <small>
                  {item.status} | {item.export_types.join(",")}
                </small>
              </div>
              <div className="actions">
                <button type="button" onClick={() => void download(item.id)}>
                  下载
                </button>
                <button type="button" className="ghost" onClick={() => void removeJob(item.id)}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
