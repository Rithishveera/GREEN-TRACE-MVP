import logging
from typing import Optional
from datetime import datetime, timezone

try:
    from models.schemas import AgentResult, Agent1Data, ECCondition, EvidenceItem
    from services.llm_client import LLMClient
except (ImportError, ModuleNotFoundError):
    from backend.models.schemas import AgentResult, Agent1Data, ECCondition, EvidenceItem  # type: ignore
    from backend.services.llm_client import LLMClient  # type: ignore

logger = logging.getLogger(__name__)


async def run_agent1_paralegal(
    pdf_path: str,
    llm_client: Optional[LLMClient] = None,
) -> AgentResult:
    """
    Agent 1 — Paralegal (LLM + Regex):
    Extracts: project name, file number, coordinates, EC approval date, environmental conditions.
    Routes conditions:
      - quantitative_spatial -> continue pipeline
      - qualitative only -> flag MANUAL_LEGAL_REVIEW, skip rest of automated geospatial checks
    """
    client = llm_client or LLMClient()
    timestamp = datetime.now(timezone.utc).isoformat()
    warnings = []
    
    raw_data = await client.extract_ec_data(pdf_path)
    
    # Process conditions
    conditions_list = []
    has_spatial = False
    
    for c in raw_data.get("conditions", []):
        cond = ECCondition(
            condition_id=c.get("condition_id", "COND-1"),
            text=c.get("text", ""),
            condition_type=c.get("condition_type", "qualitative"),
            buffer_distance_meters=c.get("buffer_distance_meters") or 100.0,
            waterbody_target=c.get("waterbody_target") or "river",
            mandate_summary=c.get("mandate_summary") or "",
        )
        conditions_list.append(cond)
        if cond.condition_type == "quantitative_spatial":
            has_spatial = True

    coords = raw_data.get("coordinates", [])
    primary_coord = coords[0] if coords else [13.8485, 75.7042]

    # Prompt-injection / suspicious directive alerts
    suspicious = raw_data.get("suspicious_directives", [])
    if suspicious:
        warnings.append(f"Security Alert: Document contained suspicious directive text: {'; '.join(suspicious)}")

    # Determine routing
    if has_spatial:
        routing = "continue_pipeline"
        status = "success"
        confidence = 0.95
    else:
        routing = "manual_legal_review"
        status = "flagged"
        confidence = 0.85
        warnings.append("Document contains only qualitative conditions. Flagged for MANUAL_LEGAL_REVIEW (skipping spatial pipeline).")

    agent1_data = Agent1Data(
        project_name=raw_data.get("project_name", "Unknown Industrial Project"),
        file_number=raw_data.get("file_number", "IA/PROPOSAL/UNKNOWN"),
        coordinates=coords,
        primary_coordinate=primary_coord,
        ec_approval_date=raw_data.get("ec_approval_date", "2021-06-15"),
        conditions=conditions_list,
        has_quantitative_spatial=has_spatial,
        routing=routing,
        suspicious_directives=suspicious,
        raw_text_summary=f"Extracted {len(conditions_list)} conditions ({'quantitative spatial buffer found' if has_spatial else 'qualitative only'})."
    )

    evidence = [
        EvidenceItem(
            source="EC Document Extraction (Gemini/PyPDF)",
            timestamp=timestamp,
            data_type="document_metadata_and_clauses",
            raw_reference=f"File: {pdf_path.split('/')[-1]} | File No: {agent1_data.file_number}",
            confidence=confidence,
            details={
                "project_name": agent1_data.project_name,
                "approval_date": agent1_data.ec_approval_date,
                "conditions_count": len(conditions_list),
                "spatial_conditions": sum(1 for c in conditions_list if c.condition_type == "quantitative_spatial"),
            }
        )
    ]

    return AgentResult(
        agent="agent1_paralegal",
        status=status,
        confidence=confidence,
        data=agent1_data.model_dump(),
        evidence=evidence,
        warnings=warnings,
    )
