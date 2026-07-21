import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict
from agents import co_player_turn, evaluate_tile, append_action_log, append_ai_turn_log, export_session_logs
from schemas import AiEvaluationResponse, CoPlayerTurnResponse

app = FastAPI()

allowed_origins = os.getenv(
    "AI_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3100,http://127.0.0.1:3100",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins.split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EvaluateRequest(BaseModel):
    tile: Dict[str, Any]
    game_board: Dict[str, Any]
    topic: str

class FeedbackActionRequest(BaseModel):
    tile_id: str | None = None
    action: str                        # "accepted" | "dismissed"
    original_suggestion: str | None = None
    edited_suggestion: str | None = None   # what the player actually submitted (may differ)
    game_id: str | None = None
    schema_version: str | None = None
    model_name: str | None = None
    prompt_versions: dict | None = None
    threshold_version: str | None = None
    error_types: list | None = None
    first_wave_categories: list | None = None
    errors_found: bool | None = None
    display_feedback: bool | None = None
    display_reason: str | None = None
    feedback: str | None = None
    suggestion: str | None = None
    suggestion_source: str | None = None
    suggestion_preserves_stance: bool | None = None

@app.post("/evaluate", response_model=AiEvaluationResponse)
def evaluate(req: EvaluateRequest):
    try:
        return evaluate_tile(req.tile, req.game_board, req.topic)
    except Exception as e:
        error_str = str(e)
        # Anthropic rate limit / overload → graceful 503 so frontend falls back
        if (
            "429" in error_str
            or "rate_limit" in error_str.lower()
            or "overloaded" in error_str.lower()
            or "529" in error_str
        ):
            from fastapi import HTTPException
            raise HTTPException(status_code=503, detail="AI quota exceeded — falling back to local evaluator")
        raise

@app.post("/feedback-action")
def feedback_action(req: FeedbackActionRequest):
    """Log what the player did with the AI feedback (accepted / dismissed)."""
    append_action_log(
        tile_id=req.tile_id,
        action=req.action,
        original_suggestion=req.original_suggestion,
        edited_suggestion=req.edited_suggestion,
        game_id=req.game_id,
        schema_version=req.schema_version,
        model_name=req.model_name,
        prompt_versions=req.prompt_versions,
        threshold_version=req.threshold_version,
        error_types=req.error_types,
        first_wave_categories=req.first_wave_categories,
        errors_found=req.errors_found,
        display_feedback=req.display_feedback,
        display_reason=req.display_reason,
        feedback=req.feedback,
        suggestion=req.suggestion,
        suggestion_source=req.suggestion_source,
        suggestion_preserves_stance=req.suggestion_preserves_stance,
    )
    return {"status": "ok"}

class AiTurnLogRequest(BaseModel):
    game_id: str | None = None
    tile_id: str | None = None
    parent_id: str | None = None
    text: str | None = None
    ai_role: str | None = None
    strategy: str | None = None
    angle: str | None = None
    model_name: str | None = None
    prompt_version: str | None = None
    evaluated_at: str | None = None

class CoPlayerTurnRequest(BaseModel):
    game_board: Dict[str, Any]
    topic: str
    ai_role: str  # "plus" | "minus"
    viable_parent_ids: list[str] | None = None  # tile IDs with a free edge (game rules)

@app.post("/co-player/turn", response_model=CoPlayerTurnResponse)
def co_player_turn_endpoint(req: CoPlayerTurnRequest):
    try:
        return co_player_turn(req.game_board, req.topic, req.ai_role, req.viable_parent_ids)
    except Exception as e:
        error_str = str(e)
        if (
            "429" in error_str
            or "rate_limit" in error_str.lower()
            or "overloaded" in error_str.lower()
            or "529" in error_str
        ):
            from fastapi import HTTPException
            raise HTTPException(status_code=503, detail="AI quota exceeded")
        raise

@app.post("/co-player/log-turn")
def log_ai_turn(req: AiTurnLogRequest):
    """Log an AI co-player turn for research analysis (FR-11 / BE-04)."""
    append_ai_turn_log(
        game_id=req.game_id,
        tile_id=req.tile_id,
        parent_id=req.parent_id,
        text=req.text,
        ai_role=req.ai_role,
        strategy=req.strategy,
        angle=req.angle,
        model_name=req.model_name,
        prompt_version=req.prompt_version,
        evaluated_at=req.evaluated_at,
    )
    return {"status": "ok"}

@app.get("/co-player/export")
def export_logs(
    event: str | None = None,
    game_id: str | None = None,
    format: str = "json",
):
    """Export AI co-player session logs for research analysis (BE-05 / FR-12).

    Query params:
      event    — filter by event type, e.g. "ai_coplayer_turn" or "feedback_action"
      game_id  — filter by game_id
      format   — "json" (default) returns JSON array; "jsonl" returns newline-delimited JSON
    """
    event_types = [event] if event else None
    records = export_session_logs(event_types=event_types, game_id=game_id)

    if format == "jsonl":
        import io
        from fastapi.responses import StreamingResponse
        import json as _json
        lines = "\n".join(_json.dumps(r, ensure_ascii=False) for r in records) + "\n"
        return StreamingResponse(
            io.StringIO(lines),
            media_type="application/x-ndjson",
            headers={"Content-Disposition": 'attachment; filename="coplayer_logs.jsonl"'},
        )

    return {"count": len(records), "records": records}


@app.get("/health")
def health():
    return {"status": "ok"}
