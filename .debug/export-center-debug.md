# Export Center Debug Log

## Metadata
- Module: export-center
- Created at: 2026-03-05 20:41 +08:00
- Last updated: 2026-03-05 21:21 +08:00
- Related files: `backend/app/services/export_service.py`, `backend/tests/test_export_service_regression.py`, `doc/api/export.md`, `docs/USER_GUIDE.md`
- Dependencies: chat, knowledge_base, file_preview, desensitization
- User doc path: `docs/USER_GUIDE.md`
- Dev/deploy doc path: `doc/api/export.md`, `doc/DEPLOYMENT.md`

## Runtime Context And Test Rules
- Runtime: local Windows
- SSH: N/A
- Remote project path: N/A
- Validation/checkfix execution: local shell in `backend/`, prefer `pytest` and `ruff check`

## Context Network
- File structure:
  - `frontend/src/pages/ExportCenter.tsx`: export options and preview entry
  - `backend/app/api/v1/export.py`: export APIs
  - `backend/app/services/export_service.py`: export item collection and ZIP packaging
- Call chain:
  - `ExportCenter.createJob` -> `POST /exports/candidates`
  - `ExportCenter.onConfirm` -> `POST /exports/jobs`
  - `create_export_job` -> write `export_items` -> build ZIP -> download
- Variable dependencies:
  - `export_types`, `include_raw_file`, `include_sanitized_text`, `filters.chat_limit`
- Data flow:
  - Chat/KB records -> ExportItem rows -> ZIP (`manifest`, `chat`, `kb`)

## Debug History
### [2026-03-05 21:21] Chat export switched to Markdown format
- Problem:
  - User requested chat records in Export Center to be exported as Markdown instead of JSON.
- Root cause:
  - Chat export packaging wrote `chat/{message_id}.json` only.
- Solution:
  - Added `_chat_message_markdown(meta)` renderer and changed chat archive output to `chat/{message_id}.md`.
  - Kept API and task flow unchanged; only archive file format changed for chat records.
- Code changes:
  - `backend/app/services/export_service.py`
  - `backend/tests/test_export_service_regression.py`
- Validation:
  - `backend/.venv/Scripts/python.exe -m pytest -q tests/test_export_service_regression.py tests/test_stage4_kb_export_flow.py` passed (`3 passed`).
  - `ruff check app/services/export_service.py tests/test_export_service_regression.py` passed.
- Impact:
  - Export ZIP is easier to read directly; frontend download behavior is unchanged.
- Docs updated:
  - `doc/api/export.md`: chat output updated to `chat/*.md`.
  - `docs/USER_GUIDE.md`: added user-facing note that chat exports are Markdown files.

### [2026-03-05 20:41] ZIP only contains manifest and item_count is 0
- Problem:
  - User-created export jobs downloaded as ZIP with only `manifest.json` and `item_count=0`.
- Root cause:
  - Missing `db.flush()` before querying `ExportItem` for ZIP packaging. With `autoflush=False`, query returned zero rows, so only manifest was written.
  - `include_raw_file` option was not packaged into ZIP output.
  - KB ownership filter mismatch: candidates used `KnowledgeBase.user_id`, job creation used `KbDocument.member_id`.
  - `chat_limit` had no lower-bound guard.
- Solution:
  - Added `db.flush()` before fetching export items for ZIP build.
  - Added raw file packaging path (`kb/raw/*`) and always-exported metadata path (`kb/meta/*`).
  - Unified KB export ownership filter to `KnowledgeBase.user_id`.
  - Added `chat_limit` clamp (`1..1000`, fallback `200`).
  - Extended manifest with `include_*` flags and `counts`.
- Code changes:
  - `backend/app/services/export_service.py`
    - `_add_export_item`, `_parse_chat_limit`, `_safe_archive_name`
    - `create_export_job` collection and packaging logic
    - `get_export_job` now returns `source_path`
  - `backend/tests/test_export_service_regression.py`
    - Added regression for legacy `member_id` + raw export
    - Added regression for `chat_limit=0`
- Validation:
  - `backend/.venv/Scripts/python.exe -m pytest -q tests/test_export_service_regression.py tests/test_stage4_kb_export_flow.py` passed (`3 passed`).
  - `ruff check app/services/export_service.py tests/test_export_service_regression.py` passed.
- Impact:
  - Export behavior is fixed and aligned with frontend options; no API contract break for existing frontend calls.
- Docs updated:
  - `doc/api/export.md`: ZIP structure and filter behavior
  - `docs/USER_GUIDE.md`: clear raw/sanitized/meta export output description

## Follow-ups
- Export jobs are still synchronous; consider async queue for large datasets.

## Technical Debt
- Missing export metrics (archive size, build duration) can be added later.

## ADR Notes
- Keep export scope as "current user visible data only"; no cross-user aggregation added.
