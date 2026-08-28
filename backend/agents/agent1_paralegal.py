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
    Provenance tracking:
      - coordinates_source: "extracted" | "state_inferred" | "fabricated_unresolved"
      - extraction_method:  "llm" | "regex_fallback"
    """
    client = llm_client or LLMClient()
    timestamp = datetime.now(timezone.utc).isoformat()
    warnings: list = []
    warning_flags: list = []

    raw_data = await client.extract_ec_data(pdf_path)

    # --- Provenance metadata from extractor ---
    extraction_method = raw_data.get("extraction_method", "regex_fallback")
    coordinates_source = raw_data.get("coordinates_source", "extracted")

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

    # --- Handle coordinates_source ---
    if coordinates_source == "fabricated_unresolved":
        # No location signal at all — cannot run geospatial pipeline.
        # Expose this as a blocking flag; do not pass a made-up coordinate downstream.
        primary_coord = None
        routing = "manual_legal_review"
        status = "flagged"
        confidence = 0.50
        block_msg = (
            "No resolvable project location found in document. "
            "Geospatial and satellite analysis cannot proceed automatically — "
            "location must be confirmed manually before continuing."
        )
        warnings.append(f"[BLOCKING] {block_msg}")
        warning_flags.append("coordinates_fabricated_unresolved")
        logger.error(f"Agent1 [{pdf_path}]: {block_msg}")

    elif coordinates_source == "state_inferred":
        # State/city centre used — location is approximate, not document-extracted.
        primary_coord = coords[0] if coords else None
        warning_msg = (
            "Project location could not be extracted from document text. "
            "Using state/city geographic centre as approximate coordinate (coordinates_source=state_inferred). "
            "Geospatial results will have reduced confidence. Manual location verification is recommended."
        )
        warnings.append(f"[WARNING] {warning_msg}")
        warning_flags.append("coordinates_state_inferred")
        logger.warning(f"Agent1 [{pdf_path}]: {warning_msg}")

        # Routing still continues, but qualitative-only check still applies
        if has_spatial:
            routing = "continue_pipeline"
            status = "success"
            confidence = 0.70  # reduced because location is approximate
        else:
            routing = "manual_legal_review"
            status = "flagged"
            confidence = 0.60
            warnings.append(
                "Document contains only qualitative conditions. "
                "Flagged for MANUAL_LEGAL_REVIEW (skipping spatial pipeline)."
            )

    else:
        # coordinates_source == "extracted" (from document text or LLM)
        primary_coord = coords[0] if coords else None

        if has_spatial:
            routing = "continue_pipeline"
            status = "success"
            # Confidence depends on extraction method
            if extraction_method == "llm":
                confidence = 0.95
            else:
                confidence = 0.80  # regex extracted
        else:
            routing = "manual_legal_review"
            status = "flagged"
            confidence = 0.85 if extraction_method == "llm" else 0.70
            warnings.append(
                "Document contains only qualitative conditions. "
                "Flagged for MANUAL_LEGAL_REVIEW (skipping spatial pipeline)."
            )

    # Prompt-injection / suspicious directive alerts
    suspicious = raw_data.get("suspicious_directives", [])
    if suspicious:
        warnings.append(f"Security Alert: Document contained suspicious directive text: {'; '.join(suspicious)}")

    agent1_data = Agent1Data(
        project_name=raw_data.get("project_name") or "Unknown Industrial Project",
        file_number=raw_data.get("file_number") or "IA/PROPOSAL/UNKNOWN",
        coordinates=coords,
        primary_coordinate=primary_coord,
        ec_approval_date=raw_data.get("ec_approval_date") or "Date Not Specified",
        conditions=conditions_list,
        has_quantitative_spatial=has_spatial,
        routing=routing,
        suspicious_directives=suspicious,
        raw_text_summary=(
            f"Extracted {len(conditions_list)} conditions "
            f"({'quantitative spatial buffer found' if has_spatial else 'qualitative only'}). "
            f"Extraction method: {extraction_method}. "
            f"Coordinates source: {coordinates_source}."
        ),
        coordinates_source=coordinates_source or "fabricated_unresolved",
        extraction_method=extraction_method or "regex_fallback",
        warning_flags=warning_flags,
    )


    evidence = [
        EvidenceItem(
            source=f"EC Document Extraction ({'Gemini LLM' if extraction_method == 'llm' else 'Regex/PyPDF Fallback'})",
            timestamp=timestamp,
            data_type="document_metadata_and_clauses",
            raw_reference=f"File: {pdf_path.split('/')[-1]} | File No: {agent1_data.file_number}",
            confidence=confidence,
            details={
                "project_name": agent1_data.project_name,
                "approval_date": agent1_data.ec_approval_date,
                "conditions_count": len(conditions_list),
                "spatial_conditions": sum(1 for c in conditions_list if c.condition_type == "quantitative_spatial"),
                "extraction_method": extraction_method,
                "coordinates_source": coordinates_source,
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
