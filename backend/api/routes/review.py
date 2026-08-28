import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from db.session import get_session
from api.dependencies import get_run_or_404, require_api_key
from models.db_models import Run
from models.schemas import ReviewRequest, RunStatusResponse, AgentResult
from core.state_machine import RunState
from core.orchestrator import Orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Human Review Gate"])


@router.post("/review", response_model=RunStatusResponse, dependencies=[Depends(require_api_key)])
async def review_and_confirm(
    req: ReviewRequest,
    session: Session = Depends(get_session),
):
    """
    Endpoint 2: /review (Human Review Gate)
    Human expert inspects extracted conditions, satellite before/after diffs, and change calculations.
    Types reviewer name and confirms.
    ONLY this endpoint may transition state to REVIEWED_CONFIRMED.
    Triggers the generation of the signed 1-page Evidence Dossier PDF.
    """
    run = session.get(Run, req.run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{req.run_id}' not found.")

    if not req.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation flag must be True to sign off and seal the legal evidence dossier.",
        )

    if not req.reviewer_name or not req.reviewer_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auditor / Reviewer name is required for legal traceability.",
        )

    if run.state not in [RunState.DRAFT_PENDING_REVIEW.value, RunState.MANUAL_LEGAL_REVIEW.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Run '{req.run_id}' cannot be reviewed in current state '{run.state}'. Must be in 'draft_pending_review' or 'manual_legal_review'.",
        )

    try:
        updated_run = Orchestrator.confirm_review(
            run_id=req.run_id,
            reviewer_name=req.reviewer_name.strip(),
            reviewer_notes=req.reviewer_notes,
        )
    except Exception as e:
        logger.exception(f"Error executing review confirmation for {req.run_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Review confirmation error: {str(e)}")

    # Format response
    a1 = AgentResult.model_validate_json(updated_run.agent1_json) if updated_run.agent1_json else None
    a2 = AgentResult.model_validate_json(updated_run.agent2_json) if updated_run.agent2_json else None
    a3 = AgentResult.model_validate_json(updated_run.agent3_json) if updated_run.agent3_json else None
    a4 = AgentResult.model_validate_json(updated_run.agent4_json) if updated_run.agent4_json else None

    return RunStatusResponse(
        run_id=updated_run.run_id,
        state=RunState(updated_run.state),
        filename=updated_run.filename,
        created_at=updated_run.created_at,
        updated_at=updated_run.updated_at,
        confidence_band=updated_run.confidence_band,
        agent1=a1,
        agent2=a2,
        agent3=a3,
        agent4=a4,
        dossier_path=updated_run.dossier_path,
        dossier_url=f"/api/dossier/{updated_run.run_id}",
        reviewer_name=updated_run.reviewer_name,
        reviewed_at=updated_run.reviewed_at,
    )
