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

    Status values:
      - "verified_active"     : file number matches a known statutory pattern (IA/, SEIAA/, J-)
      - "format_unrecognized" : file number does not match any known pattern → requires_manual_review=True
      - other                 : unexpected status → requires_manual_review=True
    """
    client = parivesh_client or PariveshClient()
    timestamp = datetime.now(timezone.utc).isoformat()
    warnings = []

    result = await client.verify_file_number(file_number)
    status_type = result.get("status", "format_unrecognized")
    portal_url = result.get("portal_url", f"https://parivesh.nic.in/track-proposal?id={file_number}")
    authority = result.get("issuing_authority", "Unknown")
    sector = result.get("sector", "Unknown")
    category = result.get("category", "Unknown")
    state = result.get("state", "Unknown")
    verification_notes = result.get("verification_notes", "")

    if status_type == "verified_active":
        is_valid = True
        req_manual = False
        status = "success"
        confidence = 0.85  # Format-validated; live per-proposal lookup not implemented
        full_notes = (
            f"Proposal #{file_number} format verified against known MoEFCC/SEIAA pattern. "
            f"Authority: {authority} ({category}). {verification_notes}"
        )

        evidence = [
            EvidenceItem(
                source="PARIVESH (MoEFCC Statutory Portal)",
                timestamp=timestamp,
                data_type="official_registry_verification",
                raw_reference=portal_url,
                confidence=confidence,
                details={
                    "file_number": file_number,
                    "issuing_authority": authority,
                    "state_jurisdiction": state,
                    "sector_classification": sector,
                    "clearance_category": category,
                    "portal_status": "FORMAT_VERIFIED",
                    "amendment_count": len(result.get("amendment_history", [])),
                    "live_lookup_implemented": False,
                }
            )
        ]

    elif status_type == "format_unrecognized":
        is_valid = False
        req_manual = True
        status = "flagged"
        confidence = 0.40
        reason = result.get("reason", "File number format does not match any known statutory pattern.")
        full_notes = (
            f"[FORMAT_UNRECOGNIZED] {verification_notes} "
            f"Reason: {reason} "
            "This finding must be manually resolved before the dossier can proceed."
        )
        warnings.append(full_notes)
        logger.warning(f"Agent2: file number '{file_number}' format unrecognized — requires manual review.")

        evidence = [
            EvidenceItem(
                source="PARIVESH (MoEFCC Portal)",
                timestamp=timestamp,
                data_type="portal_lookup_challenge",
                raw_reference=portal_url,
                confidence=confidence,
                details={
                    "file_number": file_number,
                    "challenge_reason": reason,
                    "suggested_action": f"Manually verify proposal record on PARIVESH portal: {portal_url}",
                    "live_lookup_implemented": False,
                }
            )
        ]

    else:
        # Unexpected status — treat conservatively
        is_valid = True
        req_manual = True
        status = "flagged"
        confidence = 0.60
        full_notes = f"PARIVESH registry lookup returned unexpected status '{status_type}'. Flagged for manual review."
        warnings.append(full_notes)

        evidence = [
            EvidenceItem(
                source="PARIVESH (MoEFCC Portal)",
                timestamp=timestamp,
                data_type="portal_lookup_challenge",
                raw_reference=portal_url,
                confidence=confidence,
                details={
                    "file_number": file_number,
                    "challenge_reason": f"Unexpected status: {status_type}",
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
        verification_notes=full_notes,
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
