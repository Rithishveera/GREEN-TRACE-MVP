import os
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException, status
from sqlmodel import Session

from db.session import get_session
from models.db_models import Run
from models.schemas import IngestResponse
from core.state_machine import RunState
from core.orchestrator import Orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Ingestion"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "storage" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_ec_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    """
    Endpoint 1: /ingest
    Receives an Environmental Clearance (EC) PDF, assigns a run_id,
    stores the file, initializes state=INGESTED, and starts the multi-agent pipeline in background.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are accepted for environmental clearance ingestion.",
        )

    run_id = f"run_{uuid.uuid4().hex[:12]}"
    clean_filename = Path(file.filename).name
    saved_pdf_path = UPLOAD_DIR / f"{run_id}_{clean_filename}"

    # Save uploaded file
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if len(content) > 50 * 1024 * 1024:  # 50MB cap
            raise HTTPException(status_code=400, detail="File size exceeds 50MB limit.")

        with open(saved_pdf_path, "wb") as f:
            f.write(content)
    except Exception as e:
        logger.error(f"Failed to save uploaded file: {e}")
        raise HTTPException(status_code=500, detail=f"File save failure: {str(e)}")

    now_iso = datetime.now(timezone.utc).isoformat()
    db_run = Run(
        run_id=run_id,
        state=RunState.INGESTED.value,
        filename=clean_filename,
        pdf_path=str(saved_pdf_path),
        created_at=now_iso,
        updated_at=now_iso,
    )
    session.add(db_run)
    session.commit()
    session.refresh(db_run)

    # Launch background agent orchestration
    background_tasks.add_task(Orchestrator.execute_pipeline, run_id, str(saved_pdf_path))

    return IngestResponse(
        run_id=run_id,
        state=RunState.INGESTED,
        filename=clean_filename,
        message="Environmental Clearance PDF ingested successfully. Multi-agent audit pipeline started.",
        created_at=now_iso,
    )


@router.post("/demo-ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_demo_clearance(
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    """
    Ingests the pre-verified demo Environmental Clearance PDF for Bhadra Steel Project.
    """
    demo_path = Path(__file__).resolve().parent.parent.parent / "demo_data" / "demo_bhadra_steel_ec.pdf"
    if not demo_path.exists():
        # Generate on the fly
        from services.create_demo_pdf import create_demo_ec_pdf
        create_demo_ec_pdf(str(demo_path))

    run_id = f"run_{uuid.uuid4().hex[:12]}"
    clean_filename = "demo_bhadra_steel_ec.pdf"
    saved_pdf_path = UPLOAD_DIR / f"{run_id}_{clean_filename}"

    with open(demo_path, "rb") as src, open(saved_pdf_path, "wb") as dst:
        dst.write(src.read())

    now_iso = datetime.now(timezone.utc).isoformat()
    db_run = Run(
        run_id=run_id,
        state=RunState.INGESTED.value,
        filename=clean_filename,
        pdf_path=str(saved_pdf_path),
        created_at=now_iso,
        updated_at=now_iso,
    )
    session.add(db_run)
    session.commit()
    session.refresh(db_run)

    background_tasks.add_task(Orchestrator.execute_pipeline, run_id, str(saved_pdf_path))

    return IngestResponse(
        run_id=run_id,
        state=RunState.INGESTED,
        filename=clean_filename,
        message="Demo Environmental Clearance PDF loaded. Multi-agent audit pipeline started.",
        created_at=now_iso,
    )
