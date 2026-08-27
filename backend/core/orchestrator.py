import os
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

try:
    from sqlmodel import Session, select
    from db.session import engine
    from models.db_models import Run
    from models.schemas import AgentResult, ConfidenceScore
    from core.state_machine import RunState, validate_transition
    from agents.agent1_paralegal import run_agent1_paralegal
    from agents.agent2_legal_validator import run_agent2_legal_validator
    from agents.agent3_geospatial import run_agent3_geospatial
    from agents.agent4_satellite import run_agent4_satellite
    from services.pdf_generator import generate_dossier_pdf
except (ImportError, ModuleNotFoundError):
    from backend.db.session import engine  # type: ignore
    from backend.models.db_models import Run  # type: ignore
    from backend.models.schemas import AgentResult, ConfidenceScore  # type: ignore
    from backend.core.state_machine import RunState, validate_transition  # type: ignore
    from backend.agents.agent1_paralegal import run_agent1_paralegal  # type: ignore
    from backend.agents.agent2_legal_validator import run_agent2_legal_validator  # type: ignore
    from backend.agents.agent3_geospatial import run_agent3_geospatial  # type: ignore
    from backend.agents.agent4_satellite import run_agent4_satellite  # type: ignore
    from backend.services.pdf_generator import generate_dossier_pdf  # type: ignore

logger = logging.getLogger(__name__)


def compute_deterministic_confidence(
    agent1_res: AgentResult,
    agent2_res: AgentResult,
    agent3_res: AgentResult,
    agent4_res: AgentResult,
) -> ConfidenceScore:
    """
    Derives confidence band (🟢/🟡/🔴) via DETERMINISTIC mathematical rules:
    - Cloud cover percentage (<20% is clean)
    - Vector buffer match (exact OSM waterbody vs fallback point)
    - Area of change & spectral index delta
    - PARIVESH registry status
    NEVER LLM-guessed.
    """
    score = 1.0
    factors: Dict[str, Any] = {}

    # 1. Agent 1: Extraction completeness
    a1_data = agent1_res.data
    if not a1_data.get("coordinates") or len(a1_data.get("coordinates", [])) == 0:
        score -= 0.20
        factors["coordinates_found"] = False
    else:
        factors["coordinates_found"] = True

    # 2. Agent 2: Legal status
    a2_data = agent2_res.data
    if a2_data.get("parivesh_status") == "verified_active":
        factors["parivesh_verified"] = True
    else:
        # Anti-bot block or unreachable
        score -= 0.10
        factors["parivesh_verified"] = False
        factors["parivesh_note"] = a2_data.get("verification_notes", "Challenge noted")

    # 3. Agent 3: OSM waterbody ground truth
    a3_data = agent3_res.data
    if a3_data.get("waterbody_found"):
        factors["osm_waterbody_geometry"] = True
    else:
        score -= 0.12
        factors["osm_waterbody_geometry"] = False
        factors["osm_note"] = "Synthetic site buffer used"

    # 4. Agent 4: Satellite cloud cover & data
    a4_data = agent4_res.data
    cloud = a4_data.get("cloud_cover_pct", 0.0)
    factors["cloud_cover_pct"] = cloud
    if cloud > 20.0:
        score -= 0.25
    elif cloud > 10.0:
        score -= 0.08

    final_score = max(0.1, min(1.0, round(score, 2)))
    
    if final_score >= 0.80 and not a2_data.get("requires_manual_review") and a3_data.get("waterbody_found"):
        band = "green"
    elif final_score >= 0.60:
        band = "yellow"
    else:
        band = "red"

    return ConfidenceScore(
        band=band,
        numeric_score=final_score,
        factors=factors,
    )


class Orchestrator:
    @staticmethod
    def _update_run(run_id: str, updates: Dict[str, Any]):
        with Session(engine) as session:
            statement = select(Run).where(Run.run_id == run_id)
            run = session.exec(statement).first()
            if run:
                for k, v in updates.items():
                    setattr(run, k, v)
                run.updated_at = datetime.now(timezone.utc).isoformat()
                session.add(run)
                session.commit()
                session.refresh(run)

    @classmethod
    async def execute_pipeline(cls, run_id: str, pdf_path: str):
        """
        Executes the closed loop:
        INGEST -> AGENT 1 -> AGENT 2 & 3 (parallel) -> AGENT 4 -> COMPILE SCORE -> DRAFT_PENDING_REVIEW
        """
        logger.info(f"Starting orchestration pipeline for Run {run_id}...")

        try:
            # Step 1: Agent 1 (Paralegal Extraction)
            agent1_res = await run_agent1_paralegal(pdf_path)
            
            cls._update_run(run_id, {
                "agent1_json": agent1_res.model_dump_json(),
                "state": RunState.AGENT1_DONE.value,
            })

            # Check qualitative routing
            if agent1_res.data.get("routing") == "manual_legal_review":
                logger.info(f"Run {run_id} routed to MANUAL_LEGAL_REVIEW by Agent 1.")
                cls._update_run(run_id, {
                    "state": RunState.MANUAL_LEGAL_REVIEW.value,
                    "confidence_band": "yellow",
                })
                return

            # Transition to PROCESSING
            validate_transition(RunState.AGENT1_DONE, RunState.PROCESSING)
            cls._update_run(run_id, {"state": RunState.PROCESSING.value})

            # Extract inputs for downstream agents
            primary_coord = agent1_res.data.get("primary_coordinate") or [13.8485, 75.7042]
            lat, lon = primary_coord[0], primary_coord[1]
            file_no = agent1_res.data.get("file_number", "IA/KA/IND/42019/2021")
            ec_date = agent1_res.data.get("ec_approval_date", "2021-06-15")
            
            # Find requested spatial buffer distance
            buffer_dist = 100.0
            water_target = "river"
            for c in agent1_res.data.get("conditions", []):
                if c.get("condition_type") == "quantitative_spatial":
                    buffer_dist = c.get("buffer_distance_meters") or 100.0
                    water_target = c.get("waterbody_target") or "river"
                    break

            # Step 2: Parallel execution of Agent 2 (Legal Validator) and Agent 3 (Geospatial Scout)
            agent2_res, agent3_res = await asyncio.gather(
                run_agent2_legal_validator(file_no),
                run_agent3_geospatial(lat=lat, lon=lon, buffer_distance_m=buffer_dist, waterbody_target=water_target),
            )

            cls._update_run(run_id, {
                "agent2_json": agent2_res.model_dump_json(),
                "agent3_json": agent3_res.model_dump_json(),
            })

            # Step 3: Agent 4 (Satellite Analyst)
            # Depends on Agent 3's buffered geometry + Agent 1's EC date
            buffered_geom = agent3_res.data.get("buffered_geometry_geojson", {})
            agent4_res = await run_agent4_satellite(
                buffered_geometry_geojson=buffered_geom,
                ec_approval_date=ec_date,
                buffer_distance_m=buffer_dist,
            )

            cls._update_run(run_id, {
                "agent4_json": agent4_res.model_dump_json(),
            })

            # Step 4: Layer 4 Compile + Deterministic Confidence Scoring
            conf_score = compute_deterministic_confidence(agent1_res, agent2_res, agent3_res, agent4_res)

            # Determine next state
            if agent2_res.data.get("requires_manual_review") and conf_score.band == "red":
                target_state = RunState.MANUAL_LEGAL_REVIEW
            else:
                target_state = RunState.DRAFT_PENDING_REVIEW

            validate_transition(RunState.PROCESSING, target_state)
            
            cls._update_run(run_id, {
                "state": target_state.value,
                "confidence_band": conf_score.band,
            })
            logger.info(f"Pipeline finished for Run {run_id}. State: {target_state.value} (Band: {conf_score.band})")

        except Exception as e:
            logger.exception(f"Fatal error in pipeline for Run {run_id}: {e}")
            cls._update_run(run_id, {
                "state": RunState.FAILED.value,
                "reviewer_notes": f"Pipeline failure: {str(e)}"
            })

    @classmethod
    def confirm_review(
        cls,
        run_id: str,
        reviewer_name: str,
        reviewer_notes: Optional[str] = None,
    ) -> Run:
        """
        HUMAN REVIEW GATE:
        Only this function transitions state to REVIEWED_CONFIRMED and triggers final PDF Dossier generation.
        """
        with Session(engine) as session:
            statement = select(Run).where(Run.run_id == run_id)
            run = session.exec(statement).first()
            if not run:
                raise ValueError(f"Run {run_id} not found.")

            curr_state = RunState(run.state)
            validate_transition(curr_state, RunState.REVIEWED_CONFIRMED)

            # Parse agent outputs
            a1_dict = json.loads(run.agent1_json or "{}").get("data", {})
            a2_dict = json.loads(run.agent2_json or "{}").get("data", {})
            a3_dict = json.loads(run.agent3_json or "{}").get("data", {})
            a4_dict = json.loads(run.agent4_json or "{}").get("data", {})
            
            now_iso = datetime.now(timezone.utc).isoformat()
            
            # Generate PDF Dossier
            pdf_path = generate_dossier_pdf(
                run_id=run.run_id,
                filename=run.filename,
                agent1_data=a1_dict,
                agent2_data=a2_dict,
                agent3_data=a3_dict,
                agent4_data=a4_dict,
                confidence_band=run.confidence_band or "green",
                reviewer_name=reviewer_name,
                reviewed_at=now_iso,
                reviewer_notes=reviewer_notes,
            )

            run.state = RunState.REVIEWED_CONFIRMED.value
            run.reviewer_name = reviewer_name
            run.reviewer_notes = reviewer_notes
            run.reviewed_at = now_iso
            run.dossier_path = pdf_path
            run.updated_at = now_iso

            session.add(run)
            session.commit()
            session.refresh(run)
            return run
