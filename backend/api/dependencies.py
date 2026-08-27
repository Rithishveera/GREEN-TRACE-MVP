import os
from typing import Generator
from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select
from db.session import get_session
from models.db_models import Run


def get_db_session() -> Generator[Session, None, None]:
    yield from get_session()


def get_run_or_404(run_id: str, session: Session = Depends(get_db_session)) -> Run:
    statement = select(Run).where(Run.run_id == run_id)
    run = session.exec(statement).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run '{run_id}' not found.",
        )
    return run
