import os
import json
import logging
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select, col


from db.session import get_session
from models.db_models import Run
from models.schemas import RunStatusResponse, AgentResult
from core.state_machine import RunState

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Retrieval & Status"])


@router.get("/status/{run_id}", response_model=RunStatusResponse)
async def get_run_status(
    run_id: str,
    session: Session = Depends(get_session),
):
    """
    Retrieves the live processing state and all agent outputs for the specified run.
    """
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found.")

    a1 = AgentResult.model_validate_json(run.agent1_json) if run.agent1_json else None
    a2 = AgentResult.model_validate_json(run.agent2_json) if run.agent2_json else None
    a3 = AgentResult.model_validate_json(run.agent3_json) if run.agent3_json else None
    a4 = AgentResult.model_validate_json(run.agent4_json) if run.agent4_json else None

    # Synthesize findings summary
    summary = None
    if a4 and a4.data:
        summary = {
            "discrepancy_detected": a4.data.get("discrepancy_detected", False),
            "change_area_m2": a4.data.get("change_area_m2", 0.0),
            "change_percentage": a4.data.get("change_percentage", 0.0),
            "buffer_total_m2": a4.data.get("buffer_total_area_m2", 0.0),
            "project_name": a1.data.get("project_name") if a1 else None,
            "file_number": a1.data.get("file_number") if a1 else None,
            "parivesh_status": a2.data.get("parivesh_status") if a2 else None,
        }

    return RunStatusResponse(
        run_id=run.run_id,
        state=RunState(run.state),
        filename=run.filename,
        created_at=run.created_at,
        updated_at=run.updated_at,
        confidence_band=run.confidence_band,
        agent1=a1,
        agent2=a2,
        agent3=a3,
        agent4=a4,
        dossier_path=run.dossier_path,
        dossier_url=f"/api/dossier/{run.run_id}" if run.dossier_path else None,
        reviewer_name=run.reviewer_name,
        reviewed_at=run.reviewed_at,
        summary_findings=summary,
    )


@router.get("/runs", response_model=List[RunStatusResponse])
async def list_runs(
    session: Session = Depends(get_session),
    limit: int = 20,
):
    """List recent runs in descending order of creation."""
    statement = select(Run).order_by(col(Run.created_at).desc()).limit(limit)

    runs = session.exec(statement).all()
    results = []
    for r in runs:
        a1 = AgentResult.model_validate_json(r.agent1_json) if r.agent1_json else None
        a2 = AgentResult.model_validate_json(r.agent2_json) if r.agent2_json else None
        a3 = AgentResult.model_validate_json(r.agent3_json) if r.agent3_json else None
        a4 = AgentResult.model_validate_json(r.agent4_json) if r.agent4_json else None
        results.append(
            RunStatusResponse(
                run_id=r.run_id,
                state=RunState(r.state),
                filename=r.filename,
                created_at=r.created_at,
                updated_at=r.updated_at,
                confidence_band=r.confidence_band,
                agent1=a1,
                agent2=a2,
                agent3=a3,
                agent4=a4,
                dossier_path=r.dossier_path,
                dossier_url=f"/api/dossier/{r.run_id}" if r.dossier_path else None,
                reviewer_name=r.reviewer_name,
                reviewed_at=r.reviewed_at,
            )
        )
    return results


@router.get("/dossier/{run_id}")
async def download_dossier_pdf(
    run_id: str,
    session: Session = Depends(get_session),
):
    """
    Endpoint 3: /dossier/{run_id}
    Serves the final 1-page PDF evidence dossier.
    Available ONLY after human review has confirmed the findings.
    """
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found.")

    if run.state != RunState.REVIEWED_CONFIRMED.value or not run.dossier_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dossier for run '{run_id}' is not yet available. Current state: '{run.state}'. Run must pass human review confirmation first.",
        )

    if not os.path.exists(run.dossier_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier PDF file not found on disk.",
        )

    return FileResponse(
        path=run.dossier_path,
        media_type="application/pdf",
        filename=f"GreenTrace_Dossier_{run_id}.pdf",
    )
