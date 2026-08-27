from typing import ClassVar, Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field

class Run(SQLModel, table=True):
    __tablename__: ClassVar[str] = "runs"  # type: ignore[assignment]



    run_id: str = Field(default=None, primary_key=True)
    state: str = Field(default="ingested", index=True)
    filename: str
    pdf_path: str
    
    agent1_json: Optional[str] = Field(default=None)
    agent2_json: Optional[str] = Field(default=None)
    agent3_json: Optional[str] = Field(default=None)
    agent4_json: Optional[str] = Field(default=None)
    
    confidence_band: Optional[str] = Field(default=None)
    dossier_path: Optional[str] = Field(default=None)
    
    reviewer_name: Optional[str] = Field(default=None)
    reviewer_notes: Optional[str] = Field(default=None)
    reviewed_at: Optional[str] = Field(default=None)
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
