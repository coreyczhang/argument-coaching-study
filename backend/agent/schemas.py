from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


ErrorType = Literal[
    # original two
    "overgeneralization",
    "false_causation",
    "irrelevant_rebuttal",
    "clarification_needed",
    # 9-check system
    "personal_attack",
    "not_a_statement",
    "exaggeration",
    "straw_man",
    "appeal_to_authority",
    "anecdotal_data",
    "whataboutism_red_herring",
]

FirstWaveCategory = Literal[
    # original
    "needs_more_detail",
    "too_broad",
    "causal_leap",
    "needs_clearer_connection",
    # new from 9-check system
    "personal_attack",
    "not_a_statement",
    "exaggeration",
    "weak_evidence",   # appeal_to_authority + anecdotal_data
    "straw_man",
    "off_topic",       # whataboutism_red_herring
]

RelationshipType = Literal["SUPPORTS", "REBUTS", "IRRELEVANT"]


class StructureResult(BaseModel):
    relationship: RelationshipType = "IRRELEVANT"
    reason: str = ""


class ReasoningCheckDetail(BaseModel):
    detected: bool = False
    trigger_phrase: Optional[str] = None
    explanation: Optional[str] = None


class ReasoningResult(BaseModel):
    # legacy fields kept for backward compat
    overgeneralization: bool = False
    false_causation: bool = False
    reason: str = ""
    errors_found: bool = False
    # 9-check fields
    violations: list[str] = Field(default_factory=list)
    checks: dict[str, ReasoningCheckDetail] = Field(default_factory=dict)


class ClarifyResult(BaseModel):
    clarification_needed: bool = False
    reason: str = ""
    rewrites: list[str] = Field(default_factory=list)


class AiEvaluationResponse(BaseModel):
    tileId: Optional[str] = None
    schema_version: str = "2026-04-16"
    evaluated_at: Optional[str] = None
    model_name: Optional[str] = None
    pipeline_mode: Optional[Literal["combined_analysis", "fallback_split"]] = None
    prompt_versions: dict[str, str] = Field(default_factory=dict)
    threshold_version: Optional[str] = None
    display_feedback: bool = False
    display_reason: Optional[str] = None
    structure: StructureResult
    reasoning: ReasoningResult
    clarify: ClarifyResult
    error_types: list[ErrorType] = Field(default_factory=list)
    first_wave_categories: list[FirstWaveCategory] = Field(default_factory=list)
    feedback: Optional[str] = None
    suggestion: Optional[str] = None
    suggestion_source: Optional[Literal["explanation_agent", "clarify_agent", "none"]] = None
    suggestion_confidence: Optional[Literal["high", "medium", "low"]] = None
    suggestion_preserves_stance: Optional[bool] = None
    errors_found: bool = False


class CoPlayerTurnResponse(BaseModel):
    parent_id: str
    text: str
    strategy: Optional[str] = None
    angle: Optional[str] = None
    prompt_version: Optional[str] = None
    model_name: Optional[str] = None
    evaluated_at: Optional[str] = None
