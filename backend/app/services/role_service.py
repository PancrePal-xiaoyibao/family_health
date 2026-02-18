from __future__ import annotations

from pathlib import Path

from app.core.paths import role_library_root


def _to_role_id(path: Path) -> str:
    return path.stem


def _extract_title(markdown_text: str, fallback: str) -> str:
    for line in markdown_text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    return fallback


def list_roles() -> list[dict]:
    root = role_library_root()
    items: list[dict] = []
    for path in sorted(root.glob("*.md")):
        content = path.read_text(encoding="utf-8")
        role_id = _to_role_id(path)
        items.append(
            {
                "id": role_id,
                "name": _extract_title(content, role_id),
                "updated_at": path.stat().st_mtime,
            }
        )
    return items


def get_role_prompt(role_id: str) -> str:
    safe_id = role_id.strip().replace("\\", "").replace("/", "")
    path = role_library_root() / f"{safe_id}.md"
    if not path.exists():
        raise FileNotFoundError(role_id)
    return path.read_text(encoding="utf-8")

