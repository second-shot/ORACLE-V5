"""
ORACLE V5 — Routing engine.
Determines which workflow an OracleObject should be sent to,
based on its domain and composite score.
"""

from __future__ import annotations

from .models import Domain, OracleObject, RouteResponse, Workflow

# ---------------------------------------------------------------------------
# Domain → workflow map (mirrors classify.py; kept separate so routing
# can diverge from classification over time — e.g. high-score pricing objects
# might route to a premium marketplace workflow instead of the base pricer).
# ---------------------------------------------------------------------------

_DOMAIN_WORKFLOW: dict[Domain, Workflow] = {
    "pricing": "pricing",
    "proposal": "proposal",
    "archive": "archive",
    "project": "project_brief",
    "marketplace": "marketplace_listing",
    "sales": "sales_record",
    "artist_identity": "identity_update",
    "operator": "operator_log",
    "unclassified": "unrouted",
}


def _priority(score: float) -> str:
    if score >= 8.0:
        return "critical"
    if score >= 6.0:
        return "high"
    if score >= 4.0:
        return "normal"
    return "low"


def route(obj: OracleObject) -> RouteResponse:
    """
    Assign a workflow and priority to *obj*.

    Rules applied in order:
    1.  If already routed to a non-null workflow, keep it (idempotent).
    2.  Look up domain in the routing table.
    3.  Derive priority from composite score.
    """
    if obj.workflow and obj.workflow != "unrouted":
        return RouteResponse(
            object_id=obj.id,
            workflow=obj.workflow,
            priority=_priority(obj.score.composite),
            reason="Object already has an assigned workflow; routing is idempotent.",
        )

    workflow: Workflow = _DOMAIN_WORKFLOW.get(obj.domain, "unrouted")  # type: ignore[assignment]
    priority = _priority(obj.score.composite)

    reason = (
        f"Domain '{obj.domain}' maps to workflow '{workflow}'. "
        f"Composite score {obj.score.composite:.2f} → priority '{priority}'."
    )

    return RouteResponse(
        object_id=obj.id,
        workflow=workflow,
        priority=priority,
        reason=reason,
    )
