"""
ORACLE V5 — Local Oracle Agent API
Safe read/write backend for managing OracleObjects through the core loop.
No dangerous system-control actions are exposed.
"""

from __future__ import annotations

import json
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from .classify import classify
from .models import (
    ClassifyRequest,
    CreateObjectRequest,
    OracleObject,
    ObjectScore,
)
from .router import route

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent / "oracle_workspace"
DRAFTS_DIR = BASE_DIR / "drafts"
APPROVED_DIR = BASE_DIR / "approved"
REJECTED_DIR = BASE_DIR / "rejected"
LOGS_DIR = BASE_DIR / "logs"
MEMORY_DIR = BASE_DIR / "memory"

for _dir in (DRAFTS_DIR, APPROVED_DIR, REJECTED_DIR, LOGS_DIR, MEMORY_DIR):
    _dir.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ORACLE V5 Agent API",
    description="Core loop backend — capture, classify, route, approve.",
    version="0.2.0",
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _append_log(entry: dict) -> None:
    log_path = LOGS_DIR / "activity.jsonl"
    try:
        with log_path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")
    except OSError:
        pass


def _find_in_dir(directory: Path, filename: str) -> Path:
    safe_name = Path(filename).name
    for entry in directory.iterdir():
        if entry.is_file() and entry.name == safe_name:
            return entry
    raise HTTPException(status_code=404, detail=f"File '{safe_name}' not found.")


def _unique_dest(directory: Path, filename: str) -> Path:
    base = Path(filename)
    stem, suffix = base.stem, base.suffix
    candidate = directory / filename
    counter = 1
    while candidate.exists():
        candidate = directory / f"{stem}_{counter}{suffix}"
        counter += 1
    return candidate


def _load_object(directory: Path, filename: str) -> OracleObject:
    path = _find_in_dir(directory, filename)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return OracleObject(**data)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse object: {exc}") from exc


def _save_object(obj: OracleObject, directory: Path) -> Path:
    filename = f"{obj.id}.json"
    path = directory / filename
    path.write_text(obj.model_dump_json(indent=2), encoding="utf-8")
    return path


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health", summary="Health check")
def health() -> JSONResponse:
    return JSONResponse({"status": "ok", "version": "0.2.0", "timestamp": _utc_now()})


# --- Object lifecycle -------------------------------------------------------


@app.post("/objects", status_code=201, summary="Capture a new object")
def create_object(req: CreateObjectRequest) -> JSONResponse:
    """
    Capture step: accept raw input, auto-classify if domain is unclassified,
    score it, and save as a draft OracleObject.
    """
    now = _utc_now()
    obj_id = uuid.uuid4().hex

    # Auto-classify if the caller didn't specify a domain
    domain = req.domain
    tags = req.tags
    if domain == "unclassified":
        classification = classify(ClassifyRequest(raw=req.raw))
        domain = classification.domain
        tags = list(set(tags + classification.tags))

    score = ObjectScore(
        importance=req.importance,
        urgency=req.urgency,
        quality=req.quality,
    )

    obj = OracleObject(
        id=obj_id,
        created_at=now,
        updated_at=now,
        domain=domain,
        input_type=req.input_type,
        raw=req.raw,
        tags=tags,
        score=score,
        metadata=req.metadata,
    )

    try:
        _save_object(obj, DRAFTS_DIR)
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Failed to save object.") from exc

    _append_log({"event": "object_captured", "id": obj_id, "domain": domain, "timestamp": now})

    return JSONResponse(
        {"message": "Object captured as draft.", "id": obj_id, "domain": domain, "filename": f"{obj_id}.json"},
        status_code=201,
    )


@app.get("/objects/{object_id}", summary="Get a draft object by ID")
def get_object(object_id: str) -> JSONResponse:
    """Retrieve a draft OracleObject by its ID."""
    obj = _load_object(DRAFTS_DIR, f"{object_id}.json")
    return JSONResponse(obj.model_dump())


@app.get("/drafts", summary="List all drafts")
def list_drafts() -> JSONResponse:
    files = sorted(p.name for p in DRAFTS_DIR.glob("*.json"))
    return JSONResponse({"drafts": files, "count": len(files)})


@app.post("/drafts/{filename}/approve", summary="Approve a draft")
def approve_draft(filename: str) -> JSONResponse:
    src = _find_in_dir(DRAFTS_DIR, filename)
    dest = _unique_dest(APPROVED_DIR, src.name)
    try:
        shutil.move(str(src), str(dest))
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Failed to move to approved.") from exc
    _append_log({"event": "draft_approved", "filename": src.name, "timestamp": _utc_now()})
    return JSONResponse({"message": f"'{src.name}' approved.", "location": dest.name})


@app.post("/drafts/{filename}/reject", summary="Reject a draft")
def reject_draft(filename: str) -> JSONResponse:
    src = _find_in_dir(DRAFTS_DIR, filename)
    dest = _unique_dest(REJECTED_DIR, src.name)
    try:
        shutil.move(str(src), str(dest))
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Failed to move to rejected.") from exc
    _append_log({"event": "draft_rejected", "filename": src.name, "timestamp": _utc_now()})
    return JSONResponse({"message": f"'{src.name}' rejected.", "location": dest.name})


# --- Classify ---------------------------------------------------------------


@app.post("/classify", summary="Classify raw input")
def classify_input(req: ClassifyRequest) -> JSONResponse:
    """
    Run the classification engine on raw text.
    Returns domain, suggested workflow, confidence, tags, and reasoning.
    Does NOT create an object — use POST /objects to capture.
    """
    result = classify(req)
    return JSONResponse(result.model_dump())


# --- Route ------------------------------------------------------------------


@app.post("/objects/{object_id}/route", summary="Route a draft object")
def route_object(object_id: str) -> JSONResponse:
    """
    Routing step: assign a workflow and priority to a draft OracleObject.
    Updates the object file in place.
    """
    obj = _load_object(DRAFTS_DIR, f"{object_id}.json")
    result = route(obj)

    obj.workflow = result.workflow
    obj.status = "routed"
    obj.updated_at = _utc_now()

    try:
        _save_object(obj, DRAFTS_DIR)
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Failed to update object.") from exc

    _append_log({
        "event": "object_routed",
        "id": object_id,
        "workflow": result.workflow,
        "priority": result.priority,
        "timestamp": obj.updated_at,
    })

    return JSONResponse(result.model_dump())


# --- Logs -------------------------------------------------------------------


@app.get("/logs", summary="Retrieve activity log")
def get_logs() -> JSONResponse:
    log_path = LOGS_DIR / "activity.jsonl"
    if not log_path.exists():
        return JSONResponse({"logs": [], "count": 0})
    entries = []
    malformed = 0
    with log_path.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                malformed += 1
    result: dict = {"logs": entries, "count": len(entries)}
    if malformed:
        result["malformed_entries"] = malformed
    return JSONResponse(result)
