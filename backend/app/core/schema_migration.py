from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy.engine import Engine


_SQLITE_COMPAT_COLUMNS: dict[str, dict[str, str]] = {
    "model_providers": {"user_id": "VARCHAR(36)"},
    "llm_runtime_profiles": {"user_id": "VARCHAR(36)"},
    "mcp_servers": {"user_id": "VARCHAR(36)"},
    "agent_mcp_bindings": {"user_id": "VARCHAR(36)"},
    "chat_sessions": {
        "role_id": "VARCHAR(120)",
        "background_prompt": "TEXT",
        "reasoning_enabled": "BOOLEAN",
        "reasoning_budget": "INTEGER",
        "show_reasoning": "BOOLEAN",
    },
}


def _existing_columns(conn, table_name: str) -> set[str]:
    rows = conn.exec_driver_sql(f"PRAGMA table_info({table_name})").all()
    return {row[1] for row in rows}


def _add_missing_columns(
    conn,
    table_name: str,
    missing_columns: Iterable[str],
    column_types: dict[str, str],
) -> None:
    for column_name in missing_columns:
        column_type = column_types[column_name]
        conn.exec_driver_sql(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
        )
        if table_name == "chat_sessions" and column_name == "show_reasoning":
            conn.exec_driver_sql("UPDATE chat_sessions SET show_reasoning = 1 WHERE show_reasoning IS NULL")
        if column_name.endswith("_id") or column_name == "user_id":
            conn.exec_driver_sql(
                f"CREATE INDEX IF NOT EXISTS idx_{table_name}_{column_name} ON {table_name} ({column_name})"
            )


def run_startup_migrations(engine: Engine, db_url: str) -> None:
    if not db_url.startswith("sqlite"):
        return

    with engine.begin() as conn:
        for table_name, column_types in _SQLITE_COMPAT_COLUMNS.items():
            existing = _existing_columns(conn, table_name)
            if not existing:
                continue
            missing = [column for column in column_types if column not in existing]
            if missing:
                _add_missing_columns(conn, table_name, missing, column_types)
