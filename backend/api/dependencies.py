import os
import logging
from typing import Generator, Optional
from fastapi import Depends, HTTPException, Header, status
from sqlmodel import Session, select
from db.session import get_session
from models.db_models import Run

logger = logging.getLogger(__name__)


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


# ─── Simple shared-secret API key auth ───────────────────────────────────────
# MVP LIMITATION: This is a single shared-secret header check, not per-user
# authentication. Set GREENTRACE_API_KEY in .env to enable enforcement.
# If the env var is not set, requests pass through (local dev mode) with a warning.
_API_KEY = os.getenv("GREENTRACE_API_KEY", "")


def require_api_key(x_greentrace_key: Optional[str] = Header(default=None)) -> None:
    """
    FastAPI dependency: enforces X-GreenTrace-Key header when GREENTRACE_API_KEY is set.
    When GREENTRACE_API_KEY is not configured (local/demo mode), this dependency
    passes through all requests and logs a warning.
    """
    if not _API_KEY:
        logger.warning(
            "GREENTRACE_API_KEY is not set \u2014 API endpoints are unprotected. "
            "Set GREENTRACE_API_KEY in .env for production use."
        )
        return  # local dev: no enforcement
    if not x_greentrace_key or x_greentrace_key != _API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-GreenTrace-Key header.",
        )
