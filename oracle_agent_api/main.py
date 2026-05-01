"""
ORACLE V5 — Local Oracle Agent API
Safe read/write backend for managing tasks, drafts, and logs.
No dangerous system-control actions are exposed.
"""

import json
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent / "oracle_workspace"
DRAFTS_DIR = BASE_DIR / "drafts"
APPROVED_DIR = BASE_DIR / "approved"
REJECTED_DIR = BASE_DIR / "rejected"
LOGS_DIR = BASE_DIR / "logs"

for _dir in (DRAFTS_DIR, APPROVED_DIR, REJECTED_DIR, LOGS_DIR):
    _dir.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ORACLE V5 Agent API",
    description="Safe local backend for the ORACLE V5 agent workspace.",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class TaskRequest(BaseModel):
    title: str
    content: str


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
        # Logging failure must not mask a successful operation.
        pass


def _find_in_dir(directory: Path, filename: str) -> Path:
    """
    Look up *filename* by iterating over *directory* entries.
    Returns the matching Path or raises HTTPException 404.
    This avoids constructing a path directly from user-supplied input.
    """
    safe_name = Path(filename).name  # strip any directory components
    for entry in directory.iterdir():
        if entry.is_file() and entry.name == safe_name:
            return entry
    raise HTTPException(status_code=404, detail=f"File '{safe_name}' not found.")


def _unique_dest(directory: Path, filename: str) -> Path:
    """
    Return a destination path in *directory* for *filename* that does not
    already exist, appending a counter suffix if necessary.
    """
    base = Path(filename)
    stem, suffix = base.stem, base.suffix
    candidate = directory / filename
    counter = 1
    while candidate.exists():
        candidate = directory / f"{stem}_{counter}{suffix}"
        counter += 1
    return candidate


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health", summary="Health check")
def health() -> JSONResponse:
    """Returns API status and current UTC timestamp."""
    return JSONResponse({"status": "ok", "timestamp": _utc_now()})


@app.post("/tasks", status_code=201, summary="Submit a new task")
def create_task(task: TaskRequest) -> JSONResponse:
    """
    Accept a task payload, write it as a draft JSON file, and log the event.
    The filename is a server-generated UUID; user input is stored only in the
    JSON body, never in the file path.
    """
    filename = f"{uuid.uuid4().hex}.json"
    draft_path = DRAFTS_DIR / filename  # path is fully server-controlled

    payload = {
        "title": task.title,
        "content": task.content,
        "created_at": _utc_now(),
        "status": "draft",
    }
    try:
        draft_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Failed to save draft.") from exc

    _append_log({"event": "task_created", "filename": filename, "timestamp": _utc_now()})

    return JSONResponse({"message": "Task saved as draft.", "filename": filename}, status_code=201)


@app.get("/drafts", summary="List all drafts")
def list_drafts() -> JSONResponse:
    """Returns a list of all JSON files currently in the drafts directory."""
    files = sorted(p.name for p in DRAFTS_DIR.glob("*.json"))
    return JSONResponse({"drafts": files})


@app.post("/drafts/{filename}/approve", summary="Approve a draft")
def approve_draft(filename: str) -> JSONResponse:
    """
    Move a draft file to the approved directory and log the action.
    The source file is located via a directory listing, not from a
    user-constructed path. Raises 404 if the file does not exist.
    """
    src = _find_in_dir(DRAFTS_DIR, filename)
    dest = _unique_dest(APPROVED_DIR, src.name)
    try:
        shutil.move(str(src), str(dest))
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Failed to move draft to approved.") from exc

    _append_log({"event": "draft_approved", "filename": src.name, "timestamp": _utc_now()})

    return JSONResponse({"message": f"Draft '{src.name}' approved.", "location": dest.name})


@app.post("/drafts/{filename}/reject", summary="Reject a draft")
def reject_draft(filename: str) -> JSONResponse:
    """
    Move a draft file to the rejected directory and log the action.
    The source file is located via a directory listing, not from a
    user-constructed path. Raises 404 if the file does not exist.
    """
    src = _find_in_dir(DRAFTS_DIR, filename)
    dest = _unique_dest(REJECTED_DIR, src.name)
    try:
        shutil.move(str(src), str(dest))
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Failed to move draft to rejected.") from exc

    _append_log({"event": "draft_rejected", "filename": src.name, "timestamp": _utc_now()})

    return JSONResponse({"message": f"Draft '{src.name}' rejected.", "location": dest.name})


@app.get("/logs", summary="Retrieve activity log")
def get_logs() -> JSONResponse:
    """
    Returns all entries from the activity log as a list of JSON objects.
    Reads the file line-by-line to avoid loading large files into memory at once.
    Returns an empty list if no log file exists yet.
    """
    log_path = LOGS_DIR / "activity.jsonl"
    if not log_path.exists():
        return JSONResponse({"logs": []})

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

    result: dict = {"logs": entries}
    if malformed:
        result["malformed_entries"] = malformed
    return JSONResponse(result)

