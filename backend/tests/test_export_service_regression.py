import json
import shutil
import zipfile
from pathlib import Path
from uuid import uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.config import settings
from app.core.database import Base
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession
from app.models.export_item import ExportItem
from app.models.kb_document import KbDocument
from app.models.knowledge_base import KnowledgeBase
from app.models.user import User
from app.services.export_service import create_export_job


def _make_db_session() -> Session:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, future=True
    )
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal()


def _make_local_tmp_dir() -> Path:
    path = Path(".tmp_test_exports") / str(uuid4())
    path.mkdir(parents=True, exist_ok=True)
    return path


def test_export_kb_includes_raw_file_and_legacy_member_doc():
    tmp_path = _make_local_tmp_dir()
    old_data_root = settings.data_root
    settings.data_root = str(tmp_path / "data")
    db = _make_db_session()
    try:
        user_id = str(uuid4())
        kb_id = str(uuid4())
        doc_id = str(uuid4())

        db.add(
            User(
                id=user_id,
                username="owner",
                password_hash="hash",
                display_name="Owner",
                role="owner",
            )
        )
        db.add(KnowledgeBase(id=kb_id, user_id=user_id, name="family-kb"))

        source_path = tmp_path / "raw" / "report.txt"
        source_path.parent.mkdir(parents=True, exist_ok=True)
        source_path.write_text("raw-report", encoding="utf-8")
        masked_path = tmp_path / "masked" / "report.md"
        masked_path.parent.mkdir(parents=True, exist_ok=True)
        masked_path.write_text("masked-report", encoding="utf-8")

        db.add(
            KbDocument(
                id=doc_id,
                kb_id=kb_id,
                member_id="legacy-member",
                source_type="upload",
                source_path=str(source_path),
                masked_path=str(masked_path),
                status="indexed",
            )
        )
        db.commit()

        job = create_export_job(
            db,
            user_id=user_id,
            member_scope="global",
            export_types=["kb"],
            include_raw_file=True,
            include_sanitized_text=False,
            filters={},
        )

        items = db.query(ExportItem).filter(ExportItem.job_id == job.id).all()
        assert len(items) == 1
        assert items[0].item_id == doc_id

        archive_path = Path(job.archive_path or "")
        assert archive_path.exists()
        with zipfile.ZipFile(archive_path, "r") as zf:
            names = set(zf.namelist())
            assert "manifest.json" in names
            assert f"kb/meta/{doc_id}.json" in names
            assert any(name.startswith("kb/raw/") for name in names)
            assert not any(name.startswith("kb/sanitized/") for name in names)
            manifest = json.loads(zf.read("manifest.json"))
            assert manifest["item_count"] == 1
            assert manifest["counts"]["kb_document"] == 1
    finally:
        db.close()
        settings.data_root = old_data_root
        shutil.rmtree(tmp_path, ignore_errors=True)


def test_export_chat_limit_clamped_to_positive():
    tmp_path = _make_local_tmp_dir()
    old_data_root = settings.data_root
    settings.data_root = str(tmp_path / "data")
    db = _make_db_session()
    try:
        user_id = str(uuid4())
        session_id = str(uuid4())
        message_id = str(uuid4())

        db.add(
            User(
                id=user_id,
                username="member",
                password_hash="hash",
                display_name="Member",
                role="member",
            )
        )
        db.add(ChatSession(id=session_id, user_id=user_id, title="Session A"))
        db.add(
            ChatMessage(
                id=message_id,
                session_id=session_id,
                role="user",
                content="hello export",
            )
        )
        db.commit()

        job = create_export_job(
            db,
            user_id=user_id,
            member_scope="global",
            export_types=["chat"],
            include_raw_file=False,
            include_sanitized_text=True,
            filters={"chat_limit": 0},
        )

        items = db.query(ExportItem).filter(ExportItem.job_id == job.id).all()
        assert len(items) == 1
        assert items[0].item_id == message_id

        archive_path = Path(job.archive_path or "")
        assert archive_path.exists()
        with zipfile.ZipFile(archive_path, "r") as zf:
            names = set(zf.namelist())
            assert f"chat/{message_id}.json" in names
            manifest = json.loads(zf.read("manifest.json"))
            assert manifest["item_count"] == 1
            assert manifest["counts"]["chat_message"] == 1
    finally:
        db.close()
        settings.data_root = old_data_root
        shutil.rmtree(tmp_path, ignore_errors=True)
