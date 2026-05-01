# Oracle Architecture

## Purpose
This document defines how Oracle is structured and where Mia fits inside it.

## System Model
Oracle is the operating system.
Mia is the active agent working inside Oracle.

Oracle holds:
- vision
- standards
- workflows
- system memory
- backlog
- architecture

Mia holds:
- identity
- role
- operating rules
- mission execution
- agent memory
- reports
- prompt logic
- review checklists

## Directory Logic

### `/oracle/docs`
System-level documentation.
Anything that defines the platform, standards, or long-term structure belongs here.

### `/oracle/mia`
Agent-level documentation.
Anything that defines how Mia thinks, acts, reports, reviews, and remembers belongs here.

## Decision Flow
1. A need, gap, or idea appears.
2. It is logged as a task, mission, or decision candidate.
3. Mia evaluates scope and impact.
4. If local and low-impact, Mia may act within rules.
5. If structural or high-impact, Mia escalates and a decision is logged.
6. Oracle memory is updated when a meaningful change lands.

## Ownership Boundaries
Oracle owns the system.
Mia owns execution support, clarity, continuity, and visible progress.

## Change Rule
If work changes standards, structure, or long-term behavior, it must be recorded in Oracle memory.

## Current Objective
Turn Oracle from a promising structure into a durable operating system that can grow without losing coherence.
