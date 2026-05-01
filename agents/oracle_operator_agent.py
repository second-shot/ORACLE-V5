"""
ORACLE Operator Agent
---------------------
Bounded specialist agent. One role. One log stream. One status surface.

Rules (from canon/07_Agent_Rules.md):
  - Returns: recommendation, reasoning, missing info, next step
  - Does not: perform hidden actions, overwrite canon, take irreversible steps
  - Leaves a log for every action
  - Requires explicit approval for high-value or irreversible actions
"""

import json
import sys
import os
from datetime import datetime, timezone

# ── paths ────────────────────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATUS_FILE = os.path.join(ROOT, "agent-room", "agent_status.json")
LOG_FILE = os.path.join(ROOT, "agent-room", "agent_log.jsonl")
CANON_FILE = os.path.join(ROOT, "canon", "oracle_v5_canon.md")

AGENT_NAME = "ORACLE Operator Agent"


# ── helpers ───────────────────────────────────────────────────────────────────

def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_status() -> dict:
    with open(STATUS_FILE, "r") as f:
        return json.load(f)


def write_status(state: str, mood: str, focus: str, productivity: int,
                 current_task: str | None, stats: dict) -> None:
    status = {
        "agent_name": AGENT_NAME,
        "state": state,
        "mood": mood,
        "focus": focus,
        "productivity": productivity,
        "current_task": current_task,
        "updated_at": now(),
        "stats": stats,
    }
    with open(STATUS_FILE, "w") as f:
        json.dump(status, f, indent=2)


def append_log(event: str, message: str, state: str, extra: dict | None = None) -> None:
    entry = {
        "timestamp": now(),
        "event": event,
        "agent": AGENT_NAME,
        "message": message,
        "state": state,
    }
    if extra:
        entry.update(extra)
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")


# ── canon reader ──────────────────────────────────────────────────────────────

def read_canon() -> str:
    if not os.path.exists(CANON_FILE):
        return ""
    with open(CANON_FILE, "r") as f:
        return f.read()


# ── command handlers ──────────────────────────────────────────────────────────

def handle_read_canon_next_step(stats: dict) -> dict:
    """
    Command: 'Read ORACLE canon and return next build step'
    Reads the master canon and returns a structured recommendation.
    """
    canon_text = read_canon()

    if not canon_text:
        return {
            "recommendation": "Cannot read canon — file not found.",
            "reasoning": "oracle-v5-canon.md does not exist at expected path.",
            "missing_information": "Canon file must be present at repo root.",
            "next_step": "Confirm canon file location and re-run.",
        }

    # Extract the first build slice section (section 11 in canon)
    build_slice_marker = "## 11. First Real Build Slice"
    avoid_marker = "**Do not build yet:**"

    recommendation = (
        "Activate the Command Surface as the first real build slice. "
        "This is the primary input layer — it proves the system can capture raw material "
        "and begin the core loop: capture → normalise → classify → route."
    )

    reasoning = (
        "Canon section 11 defines the first build slice. "
        "The current repo has canon, a dashboard stub, and now an Operator Agent. "
        "The missing live piece is a working Command Surface backed by the object model. "
        "Building it next proves Oracle is real: input enters, becomes a structured object, "
        "gets classified, and receives a route. That is the stated success condition."
    )

    missing_information = (
        "No missing information for this recommendation. "
        "Canon is complete. First build slice is approved in canon section 11. "
        "Tech stack decision (web app vs Electron vs Tauri) is not yet locked — "
        "this should be confirmed before starting the command surface build."
    )

    next_step = (
        "1. Confirm tech stack: local web app (HTML/JS) is simplest and aligns with current repo. "
        "2. Build the Command Surface: a single input that accepts raw text, "
        "   creates a structured object (id, type, status, created_at, owner, notes), "
        "   and returns classification + route recommendation. "
        "3. Wire the output to agent_status.json and agent_log.jsonl so every action is inspectable. "
        "4. Success condition: user types input → object is created → route is returned → log is written."
    )

    build_slice_found = build_slice_marker in canon_text
    stats["canon_reads"] = stats.get("canon_reads", 0) + 1

    return {
        "recommendation": recommendation,
        "reasoning": reasoning,
        "missing_information": missing_information,
        "next_step": next_step,
        "_meta": {
            "canon_loaded": bool(canon_text),
            "canon_chars": len(canon_text),
            "build_slice_section_found": build_slice_found,
        },
    }


def handle_generic_command(command: str, stats: dict) -> dict:
    """
    Fallback handler for commands not explicitly mapped.
    Acknowledges the command and asks for clarification.
    """
    return {
        "recommendation": f"Command received: '{command}'. No specific handler matched.",
        "reasoning": (
            "This Operator Agent handles a defined set of commands. "
            "The received command does not match any current handler. "
            "Adding a handler requires an explicit build step."
        ),
        "missing_information": (
            "Which ORACLE function should this command invoke? "
            "Candidates: read canon, check status, list active objects, "
            "route an object, draft a proposal, inspect archive."
        ),
        "next_step": (
            "Clarify the intended action and re-run with a supported command, "
            "or add a handler for this command in agents/oracle_operator_agent.py."
        ),
    }


# ── routing ───────────────────────────────────────────────────────────────────

COMMAND_MAP = {
    "read oracle canon and return next build step": handle_read_canon_next_step,
    "read canon": handle_read_canon_next_step,
}


def route_command(command: str, stats: dict) -> dict:
    key = command.strip().lower()
    handler = COMMAND_MAP.get(key, handle_generic_command)
    if handler is handle_generic_command:
        return handler(command, stats)
    return handler(stats)


# ── main loop ─────────────────────────────────────────────────────────────────

def run() -> None:
    os.makedirs(os.path.dirname(STATUS_FILE), exist_ok=True)

    status = read_status()
    stats = status.get("stats", {
        "commands_processed": 0,
        "logs_written": 0,
        "session_start": now(),
    })

    print(f"\n{'─' * 60}")
    print(f"  {AGENT_NAME}")
    print(f"  State: {status.get('state', 'idle')}  |  Session started: {stats.get('session_start', now())}")
    print(f"{'─' * 60}\n")

    while True:
        try:
            command = input("command > ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nAgent shutting down.")
            append_log("agent_stopped", "Agent session ended.", "idle")
            write_status("idle", "offline", "none", 0, None, stats)
            break

        if not command:
            continue

        if command.lower() in ("exit", "quit", "q"):
            print("Agent shutting down.")
            append_log("agent_stopped", "Agent session ended by user.", "idle")
            write_status("idle", "offline", "none", 0, None, stats)
            break

        # Update state to active
        stats["commands_processed"] = stats.get("commands_processed", 0) + 1
        write_status("active", "focused", command[:80], 80, command, stats)
        append_log("command_received", f"Command: {command}", "active", {"command": command})

        print(f"\nProcessing: {command}\n")

        # Route and execute
        result = route_command(command, stats)

        # Write result to log
        stats["logs_written"] = stats.get("logs_written", 0) + 1
        append_log("command_result", "Result produced.", "active", {"result": result})

        # Print structured output
        print(f"{'─' * 60}")
        print(f"  RECOMMENDATION\n  {result['recommendation']}\n")
        print(f"  REASONING\n  {result['reasoning']}\n")
        print(f"  MISSING INFORMATION\n  {result['missing_information']}\n")
        print(f"  NEXT STEP\n  {result['next_step']}")
        if "_meta" in result:
            print(f"\n  META\n  {result['_meta']}")
        print(f"{'─' * 60}\n")

        # Return to ready state
        write_status("ready", "calm", "awaiting next command", 60, None, stats)
        append_log("agent_ready", "Agent ready for next command.", "ready")


if __name__ == "__main__":
    run()
