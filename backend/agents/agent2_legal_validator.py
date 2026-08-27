import logging
from typing import Optional
from datetime import datetime, timezone
from models.schemas import AgentResult, Agent2Data, EvidenceItem
from services.parivesh_client import PariveshClient

logger = logging.getLogger(__name__)


async def run_agent2_legal_validator(
    file_number: str,
    parivesh_client: Optional[PariveshClient] = None,
) -> AgentResult:
    """
    Agent 2 — Legal Validator:
    Scrapes/queries PARIVESH by file number.
    Checks amendment history and validity.
    On anti-bot block or unreachable endpoint: flags MANUAL_LEGAL_REVIEW,
    does not crash the run, and does not fabricate legal status.
    """
    client = parivesh_client or PariveshClient()
    timestamp = datetime.now(timezone.utc).isoformat()
    warnings = []
    
    result = await client.verify_file_number(file_number)
    status_type = result.get("status", "scrape_blocked")
    portal_url = result.get("portal_url", f"https://parivesh.nic.in/track-proposal?id={file_number}")
    
    if status_type == "verified_active":
        is_valid = True
        req_manual = False
        status = "success"
        confidence = 0.95
        verification_notes = f"Proposal file #{file_number} actively verified on PARIVESH MoEFCC portal."
        
        evidence = [
            EvidenceItem(
                source="PARIVESH (MoEFCC Portal)",
                timestamp=timestamp,
                data_type="official_registry_verification",
                raw_reference=portal_url,
                confidence=0.95,
                details={
                    "file_number": file_number,
                    "portal_status": "ACTIVE_CLEARANCE",
                    "amendment_count": len(result.get("amendment_history", [])),
                }
            )
        ]
    else:
        # Fallback / Anti-bot state
        is_valid = True  # Preserve presumption of validity pending human verification
        req_manual = True
        status = "flagged"
        confidence = 0.60
        reason = result.get("reason", "Anti-bot verification challenge or endpoint unavailable.")
        verification_notes = f"PARIVESH automated lookup encountered challenge ({reason}). Flagged for MANUAL_LEGAL_REVIEW."
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
                    "suggested_action": "Manual audit via PARIVESH portal link",
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
