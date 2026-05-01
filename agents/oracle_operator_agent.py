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
    canon_text = read_canon()

    if not canon_text:
        return {
            "recommendation": "Cannot read canon — file not found.",
            "reasoning": "oracle_v5_canon.md not found in /canon.",
            "missing_information": "Ensure canon file exists at canon/oracle_v5_canon.md.",
            "next_step": "Fix canon file path and retry.",
        }

    recommendation = "Build the Command Surface next."
    reasoning = "Canon defines the first build slice: input → structure → route."
    missing_information = "Confirm frontend approach (local web vs framework)."
    next_step = "Create a single input → object → route loop and log it."

    stats["canon_reads"] = stats.get("canon_reads", 0) + 1

    return {
        "recommendation": recommendation,
        "reasoning": reasoning,
        "missing_information": missing_information,
        "next_step": next_step,
    }


def handle_generic_command(command: str, stats: dict) -> dict:
    return {
        "recommendation": f"Command received: '{command}'",
        "reasoning": "No handler exists yet.",
        "missing_information": "Define expected action.",
        "next_step": "Add handler or refine command.",
    }


COMMAND_MAP = {
    "read oracle canon and return next build step": handle_read_canon_next_step,
}


def route_command(command: str, stats: dict) -> dict:
    key = command.strip().lower()
    return COMMAND_MAP.get(key, handle_generic_command)(command if key not in COMMAND_MAP else stats)


def run() -> None:
    os.makedirs(os.path.dirname(STATUS_FILE), exist_ok=True)

    status = read_status()
    stats = status.get("stats", {"commands_processed": 0})

    print("ORACLE Operator Agent live. Type a command.")

    while True:
        command = input("command > ").strip()
        if command in ("exit", "quit"):
            break

        stats["commands_processed"] += 1
        write_status("active", "focused", "processing", 80, command, stats)
        append_log("command", command, "active")

        result = route_command(command, stats)
        append_log("result", json.dumps(result), "active")

        print(result)

        write_status("ready", "calm", "idle", 60, None, stats)


if __name__ == "__main__":
    run()
