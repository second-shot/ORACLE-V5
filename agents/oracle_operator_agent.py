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
    try:
        with open(STATUS_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


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


def extract_section(canon_text: str, heading: str) -> str:
    """Return the text of the first canon section whose heading contains `heading`."""
    lines = canon_text.splitlines()
    result_lines = []
    in_section = False
    for line in lines:
        if line.startswith("## ") and heading in line:
            in_section = True
            continue
        if in_section:
            if line.startswith("## "):
                break
            result_lines.append(line)
    return "\n".join(result_lines).strip()


def parse_build_steps(section_text: str) -> list[str]:
    """Extract ordered build steps from the 'Build first' list in section 11."""
    steps = []
    in_list = False
    for line in section_text.splitlines():
        stripped = line.strip()
        if stripped.startswith("**Build first:**"):
            in_list = True
            continue
        if in_list:
            if stripped.startswith("**") and stripped.endswith("**") and len(stripped) > 4:
                # Next bold header — list is over
                break
            # Match lines like "1. Login and onboarding"
            if len(stripped) > 0 and stripped[0].isdigit() and ". " in stripped:
                steps.append(stripped)
    return steps


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
            "reasoning": f"Master canon does not exist at expected path: {CANON_FILE}",
            "missing_information": "Canon file must be present at canon/oracle_v5_canon.md.",
            "next_step": "Confirm canon/oracle_v5_canon.md exists and re-run.",
        }

    section_11 = extract_section(canon_text, "11.")
    build_steps = parse_build_steps(section_11)
    build_slice_found = bool(section_11)

    stats["canon_reads"] = stats.get("canon_reads", 0) + 1

    if build_steps:
        steps_text = "\n".join(f"   {s}" for s in build_steps)
        first_step = build_steps[0] if build_steps else "step 1"
        next_step = (
            f"Canon section 11 defines the build order. Work through steps in sequence:\n"
            f"{steps_text}\n\n"
            f"   Start with '{first_step}' if not yet built, "
            f"or identify which step is currently incomplete and build that next.\n"
            f"   Success condition (from canon): a user can enter raw material, "
            f"see it become a structured object, watch it route into the correct path, "
            f"and receive one usable output."
        )
    else:
        next_step = (
            "Canon section 11 was not parsed successfully. "
            "Verify the canon file format and re-run."
        )

    recommendation = (
        "Activate the Command Surface as the first real build slice. "
        "This is the primary input layer — it proves the system can capture raw material "
        "and begin the core loop: capture → normalise → classify → route."
    )

    reasoning = (
        "Canon section 11 defines the first build slice and its success condition. "
        "The current repo has canon, a dashboard stub, and an Operator Agent. "
        "The missing live piece is a working Command Surface backed by the object model. "
        "Building it next proves Oracle is real: input enters, becomes a structured object, "
        "gets classified, and receives a route — the stated success condition."
    )

    missing_information = (
        "Canon is complete. First build slice is approved in canon section 11. "
        "Tech stack decision (web app vs Electron vs Tauri) is not yet locked — "
        "confirm before starting the command surface build."
    )

    _meta = {
        "canon_loaded": True,
        "canon_chars": len(canon_text),
        "canon_file": CANON_FILE,
        "build_slice_section_found": build_slice_found,
        "build_steps_parsed": len(build_steps),
    }
    append_log("canon_read", "Canon read and parsed.", "active", {"meta": _meta})

    return {
        "recommendation": recommendation,
        "reasoning": reasoning,
        "missing_information": missing_information,
        "next_step": next_step,
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

    write_status("idle", "ready", "awaiting first command", 0, None, stats)
    append_log("agent_started", "Agent initialised. Awaiting first command.", "idle")

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
        print(f"{'─' * 60}\n")

        # Return to ready state
        write_status("ready", "calm", "awaiting next command", 60, None, stats)
        append_log("agent_ready", "Agent ready for next command.", "ready")


if __name__ == "__main__":
    run()
