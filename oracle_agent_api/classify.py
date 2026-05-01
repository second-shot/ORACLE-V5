"""
ORACLE V5 — Classification engine.
Rules-based domain classifier. Designed to be swapped for an LLM call
without changing the interface — same input/output contract either way.
"""

from __future__ import annotations

import re

from .models import ClassifyRequest, ClassifyResponse, Domain, Workflow


# ---------------------------------------------------------------------------
# Keyword maps — extend as the corpus grows
# ---------------------------------------------------------------------------

_DOMAIN_KEYWORDS: dict[Domain, list[str]] = {
    "pricing": [
        "price", "pricing", "cost", "rate", "fee", "charge", "quote",
        "invoice", "value", "sell", "sold", "market", "worth",
    ],
    "proposal": [
        "proposal", "pitch", "brief", "commission", "commission brief",
        "application", "residency", "grant", "funding", "submit",
    ],
    "archive": [
        "archive", "record", "document", "scan", "photograph", "provenance",
        "edition", "series", "catalogue", "raisonné", "inventory",
    ],
    "project": [
        "project", "idea", "concept", "develop", "make", "create",
        "build", "plan", "timeline", "milestone", "production",
    ],
    "marketplace": [
        "listing", "marketplace", "shop", "gallery", "auction", "fair",
        "platform", "artsy", "instagram", "online store",
    ],
    "sales": [
        "sale", "sold", "buyer", "collector", "receipt", "payment",
        "split", "consignment", "invoice", "transaction",
    ],
    "artist_identity": [
        "bio", "biography", "statement", "artist statement", "cv",
        "resume", "profile", "about me", "practice", "identity",
    ],
    "operator": [
        "system", "config", "operator", "admin", "setting", "log",
        "debug", "deploy", "infrastructure", "pipeline",
    ],
}

_DOMAIN_TO_WORKFLOW: dict[Domain, Workflow] = {
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


# ---------------------------------------------------------------------------
# Classifier
# ---------------------------------------------------------------------------


def classify(request: ClassifyRequest) -> ClassifyResponse:
    """
    Classify *request.raw* into a domain and suggest a workflow.

    Strategy:
    1.  Tokenise the raw text.
    2.  Score each domain by keyword hit count.
    3.  Pick the highest-scoring domain.
    4.  Fall back to the caller hint if no domain scores > 0.
    5.  Fall back to 'unclassified' if no hint.
    """
    tokens = _tokenise(request.raw)

    scores: dict[Domain, int] = {d: 0 for d in _DOMAIN_KEYWORDS}  # type: ignore[misc]
    matched_tags: list[str] = []

    for domain, keywords in _DOMAIN_KEYWORDS.items():
        for kw in keywords:
            if kw in tokens:
                scores[domain] += 1
                if kw not in matched_tags:
                    matched_tags.append(kw)

    best_domain: Domain
    best_score = max(scores.values())

    if best_score > 0:
        best_domain = max(scores, key=lambda d: scores[d])  # type: ignore[arg-type]
        confidence = "high" if best_score >= 3 else ("medium" if best_score == 2 else "low")
        reasoning = (
            f"Matched {best_score} keyword(s) for domain '{best_domain}': "
            + ", ".join(matched_tags[:5])
        )
    elif request.hint:
        best_domain = request.hint
        confidence = "low"
        reasoning = f"No keyword matches; using caller hint '{request.hint}'."
    else:
        best_domain = "unclassified"
        confidence = "low"
        reasoning = "No keyword matches and no caller hint provided."

    return ClassifyResponse(
        domain=best_domain,
        suggested_workflow=_DOMAIN_TO_WORKFLOW[best_domain],
        confidence=confidence,
        tags=matched_tags[:10],
        reasoning=reasoning,
    )


def _tokenise(text: str) -> set[str]:
    """Lowercase, strip punctuation, return set of word n-grams (1 and 2)."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    words = text.split()
    unigrams = set(words)
    bigrams = {f"{words[i]} {words[i+1]}" for i in range(len(words) - 1)}
    return unigrams | bigrams
