"""
ORACLE V5 — Shared object model.
Every piece of input that enters the system becomes an OracleObject.
This is the canonical schema for the core loop.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# Enums / Literals
# ---------------------------------------------------------------------------

Domain = Literal[
    "artist_identity",
    "archive",
    "project",
    "proposal",
    "pricing",
    "marketplace",
    "sales",
    "operator",
    "unclassified",
]

InputType = Literal[
    "text",
    "image",
    "audio",
    "file",
    "url",
    "idea",
]

ObjectStatus = Literal[
    "draft",
    "approved",
    "rejected",
    "routed",
    "generated",
    "validated",
    "stored",
]

Workflow = Literal[
    "pricing",
    "proposal",
    "archive",
    "project_brief",
    "identity_update",
    "marketplace_listing",
    "sales_record",
    "operator_log",
    "unrouted",
]


# ---------------------------------------------------------------------------
# Score sub-model
# ---------------------------------------------------------------------------


class ObjectScore(BaseModel):
    """Three-axis quality signal for every OracleObject."""

    importance: int = Field(default=5, ge=1, le=10, description="Strategic importance, 1–10.")
    urgency: int = Field(default=5, ge=1, le=10, description="Time sensitivity, 1–10.")
    quality: int = Field(default=5, ge=1, le=10, description="Signal quality / completeness, 1–10.")
    composite: float = Field(default=5.0, description="Weighted composite score (computed).")

    @model_validator(mode="after")
    def compute_composite(self) -> "ObjectScore":
        # Weights: importance 40 %, urgency 30 %, quality 30 %
        self.composite = round(
            self.importance * 0.4 + self.urgency * 0.3 + self.quality * 0.3, 2
        )
        return self


# ---------------------------------------------------------------------------
# Core object
# ---------------------------------------------------------------------------


class OracleObject(BaseModel):
    """
    The universal container for every input that passes through ORACLE V5.

    Lifecycle stages mirror the core loop:
        capture → normalise → compress → classify → score
        → route → generate → validate → store → surface
    """

    # Identity
    id: str = Field(..., description="Server-generated UUID hex.")
    created_at: str = Field(..., description="UTC ISO-8601 timestamp.")
    updated_at: str = Field(..., description="UTC ISO-8601 timestamp of last mutation.")

    # Classification
    domain: Domain = Field(default="unclassified")
    input_type: InputType = Field(default="text")

    # Content — three compression layers
    raw: str = Field(..., description="Original input, verbatim. Never mutated.")
    normalised: str = Field(default="", description="Cleaned, formatted version of raw.")
    compressed: str = Field(
        default="",
        description="Essence distilled to 1–3 sentences. Empty until a compression step runs.",
    )

    # Metadata
    tags: list[str] = Field(default_factory=list)
    score: ObjectScore = Field(default_factory=ObjectScore)
    status: ObjectStatus = Field(default="draft")

    # Routing & output
    workflow: Workflow | None = Field(default=None)
    output: str | None = Field(default=None, description="Generated output, if any.")

    # Domain-specific free-form payload. Document what each domain puts here.
    metadata: dict = Field(
        default_factory=dict,
        description="Domain-specific key/value store. Keep keys namespaced, e.g. pricing.currency.",
    )


# ---------------------------------------------------------------------------
# Request / response helpers
# ---------------------------------------------------------------------------


class CreateObjectRequest(BaseModel):
    """Inbound payload for POST /objects."""

    raw: str = Field(..., min_length=1, description="Raw input text.")
    domain: Domain = Field(default="unclassified")
    input_type: InputType = Field(default="text")
    importance: int = Field(default=5, ge=1, le=10)
    urgency: int = Field(default=5, ge=1, le=10)
    quality: int = Field(default=5, ge=1, le=10)
    tags: list[str] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)


class ClassifyRequest(BaseModel):
    """Inbound payload for POST /classify."""

    raw: str = Field(..., min_length=1)
    hint: Domain | None = Field(
        default=None,
        description="Optional caller hint. Classification may override it.",
    )


class ClassifyResponse(BaseModel):
    """Result of the classification step."""

    domain: Domain
    suggested_workflow: Workflow
    confidence: Literal["high", "medium", "low"]
    tags: list[str]
    reasoning: str


class RouteResponse(BaseModel):
    """Result of the routing step."""

    object_id: str
    workflow: Workflow
    priority: Literal["critical", "high", "normal", "low"]
    reason: str
