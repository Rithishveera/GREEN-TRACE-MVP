import logging
from typing import Optional
from datetime import datetime, timezone

try:
    from models.schemas import AgentResult, Agent2Data, EvidenceItem
    from services.parivesh_client import PariveshClient
except (ImportError, ModuleNotFoundError):
    from backend.models.schemas import AgentResult, Agent2Data, EvidenceItem  # type: ignore
    from backend.services.parivesh_client import PariveshClient  # type: ignore

logger = logging.getLogger(__name__)


async def run_agent2_legal_validator(
    file_number: str,
    parivesh_client: Optional[PariveshClient] = None,
) -> AgentResult:
    """
    Agent 2 — Legal Validator:
    Scrapes and queries PARIVESH MoEFCC portal by proposal / file number.
    Verifies statutory validity, issuing authority, sector classification, and amendment history.
    """
    client = parivesh_client or PariveshClient()
    timestamp = datetime.now(timezone.utc).isoformat()
    warnings = []
    
    result = await client.verify_file_number(file_number)
    status_type = result.get("status", "verified_active")
    portal_url = result.get("portal_url", f"https://parivesh.nic.in/track-proposal?id={file_number}")
    authority = result.get("issuing_authority", "MoEFCC Impact Assessment Division")
    sector = result.get("sector", "Industrial Sector")
    category = result.get("category", "Category A")
    state = result.get("state", "National")
    
    if status_type == "verified_active":
        is_valid = True
        req_manual = False
        status = "success"
        confidence = 0.95
        verification_notes = f"Proposal #{file_number} verified on PARIVESH portal. Authority: {authority} ({category})."
        
        evidence = [
            EvidenceItem(
                source="PARIVESH (MoEFCC Statutory Portal)",
                timestamp=timestamp,
                data_type="official_registry_verification",
                raw_reference=portal_url,
                confidence=0.95,
                details={
                    "file_number": file_number,
                    "issuing_authority": authority,
                    "state_jurisdiction": state,
                    "sector_classification": sector,
                    "clearance_category": category,
                    "portal_status": "ACTIVE_CLEARANCE",
                    "amendment_count": len(result.get("amendment_history", [])),
                }
            )
        ]
    else:
        is_valid = True
        req_manual = True
        status = "flagged"
        confidence = 0.60
        reason = result.get("reason", "Verification pending portal response.")
        verification_notes = f"PARIVESH registry lookup ({reason}). Flagged for manual review."
        warnings.append(verification_notes)
        
        evidence = [
            EvidenceItem(
                source="PARIVESH (MoEFCC Portal)",
                timestamp=timestamp,
                data_type="portal_lookup_challenge",
                raw_reference=portal_url,
                confidence=0.60,
                details={
                    "file_number": file_number,
                    "challenge_reason": reason,
                    "suggested_action": f"Verify proposal record on PARIVESH portal: {portal_url}",
                }
            )
        ]

    data = Agent2Data(
        file_number=file_number,
        parivesh_status=status_type,
        is_valid=is_valid,
        amendment_history=result.get("amendment_history", []),
        requires_manual_review=req_manual,
        verification_notes=verification_notes,
        portal_url=portal_url,
    )

    return AgentResult(
        agent="agent2_legal_validator",
        status=status,
        confidence=confidence,
        data=data.model_dump(),
        evidence=evidence,
        warnings=warnings,
    )
