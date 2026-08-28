import os
import time
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from main import app
from db.session import get_session, engine, init_db
from models.db_models import Run
from core.state_machine import RunState

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_full_e2e_pipeline():
    # 1. Prepare demo PDF
    pdf_path = Path(__file__).resolve().parent.parent / "demo_data" / "demo_bhadra_steel_ec.pdf"
    assert pdf_path.exists(), f"Demo EC PDF not found at {pdf_path}"

    # 2. Ingest
    with open(pdf_path, "rb") as f:
        response = client.post(
            "/api/ingest",
            files={"file": ("demo_bhadra_steel_ec.pdf", f, "application/pdf")},
        )
    
    assert response.status_code == 201, response.text
    data = response.json()
    run_id = data["run_id"]
    assert data["state"] == "ingested"
    assert run_id.startswith("run_")

    # 3. Wait for background orchestration to finish
    max_wait_seconds = 25
    start_time = time.time()
    final_state = None
    run_data: dict = {}

    while time.time() - start_time < max_wait_seconds:
        status_res = client.get(f"/api/status/{run_id}")
        assert status_res.status_code == 200
        run_data = status_res.json()
        final_state = run_data["state"]
        if final_state in ["draft_pending_review", "manual_legal_review", "failed"]:
            break
        time.sleep(1.0)

    assert final_state in ["draft_pending_review", "manual_legal_review"], f"Pipeline reached unexpected state: {final_state}"

    # Check agent outputs
    assert run_data["agent1"] is not None, "Agent 1 output missing"
    assert run_data["agent1"]["data"]["file_number"] is not None
    assert len(run_data["agent1"]["data"]["conditions"]) > 0

    # Fix 11: Verify provenance fields exist in Agent 1 output
    a1_data = run_data["agent1"]["data"]
    assert "coordinates_source" in a1_data, "coordinates_source must be present in Agent1Data"
    assert "extraction_method" in a1_data, "extraction_method must be present in Agent1Data"
    assert a1_data["coordinates_source"] in ["extracted", "state_inferred", "fabricated_unresolved"]
    assert a1_data["extraction_method"] in ["llm", "regex_fallback"]

    # Fix 3: Verify Agent 4 has analysis_mode
    if run_data["agent4"] is not None:
        a4_data = run_data["agent4"]["data"]
        assert "analysis_mode" in a4_data, "analysis_mode must be present in Agent4Data"
        assert a4_data["analysis_mode"] in ["live_gee", "offline_demo_simulation"]

        # Fix 4: If simulation mode, confidence must be red
        if a4_data["analysis_mode"] == "offline_demo_simulation":
            assert run_data["confidence_band"] == "red", (
                "Simulation mode must always produce confidence_band='red'"
            )

    if final_state == "draft_pending_review":
        assert run_data["agent3"] is not None, "Agent 3 output missing"
        assert run_data["agent3"]["data"]["buffer_distance_meters"] == 100.0
        assert run_data["agent4"] is not None, "Agent 4 output missing"

    # 4. Human Review Gate Confirmation
    review_payload = {
        "run_id": run_id,
        "reviewer_name": "Adv. Rajesh V. Ramanathan (Senior Environmental Counsel)",
        "confirm": True,
        "reviewer_notes": "Ground discrepancy confirmed. Forwarded for regulatory notice under Section 5 EPA 1986."
    }
    review_res = client.post("/api/review", json=review_payload)
    assert review_res.status_code == 200, review_res.text
    reviewed_data = review_res.json()

    assert reviewed_data["state"] == "reviewed_confirmed"
    assert reviewed_data["reviewer_name"] == review_payload["reviewer_name"]
    assert reviewed_data["dossier_path"] is not None
    assert os.path.exists(reviewed_data["dossier_path"]), "Dossier PDF file must exist on disk"

    # 5. Retrieve Dossier PDF
    dossier_res = client.get(f"/api/dossier/{run_id}")
    assert dossier_res.status_code == 200
    assert dossier_res.headers["content-type"] == "application/pdf"
    assert len(dossier_res.content) > 1000, "Dossier PDF content too small"

    print(f"\n[SUCCESS] E2E Smoke Test Passed! Run ID: {run_id} compiled into formal dossier: {reviewed_data['dossier_path']}")


def test_messy_pdf_routes_to_manual_review():
    """
    Fix 10 + Fix 1: Verify that a PDF with no resolvable coordinates and a non-standard
    file number is blocked at MANUAL_LEGAL_REVIEW, with Agents 3 & 4 never executed.

    Expected outcomes:
    - coordinates_source == "fabricated_unresolved"
    - Pipeline stops at state == "manual_legal_review"
    - agent3 and agent4 outputs are None (never ran)
    - confidence_band == "red"
    """
    pdf_path = Path(__file__).resolve().parent.parent / "demo_data" / "demo_messy_ec_no_coords.pdf"
    assert pdf_path.exists(), (
        f"Messy demo PDF not found at {pdf_path}. "
        "Run: python backend/services/create_messy_demo_pdf.py"
    )

    # Ingest
    with open(pdf_path, "rb") as f:
        response = client.post(
            "/api/ingest",
            files={"file": ("demo_messy_ec_no_coords.pdf", f, "application/pdf")},
        )
    assert response.status_code == 201, response.text
    run_id = response.json()["run_id"]

    # Wait for pipeline to settle
    max_wait_seconds = 30
    start_time = time.time()
    final_state = None
    run_data: dict = {}

    while time.time() - start_time < max_wait_seconds:
        status_res = client.get(f"/api/status/{run_id}")
        assert status_res.status_code == 200
        run_data = status_res.json()
        final_state = run_data["state"]
        if final_state in ["draft_pending_review", "manual_legal_review", "failed"]:
            break
        time.sleep(1.0)

    # Core assertion: messy PDF must go to MANUAL_LEGAL_REVIEW
    assert final_state == "manual_legal_review", (
        f"Messy PDF (no coords, unknown file number) should route to manual_legal_review, "
        f"but got state='{final_state}'. Check coordinates_source and routing logic."
    )

    # Agent 1 should have run but flagged fabricated_unresolved
    assert run_data["agent1"] is not None, "Agent 1 must run even for messy PDFs"
    a1_data = run_data["agent1"]["data"]
    assert a1_data.get("coordinates_source") == "fabricated_unresolved", (
        f"Expected coordinates_source='fabricated_unresolved', got '{a1_data.get('coordinates_source')}'"
    )
    assert a1_data.get("routing") == "manual_legal_review", (
        f"Agent 1 routing should be manual_legal_review, got '{a1_data.get('routing')}'"
    )

    # Agents 3 & 4 must NOT have run (blocked by coordinates_source=fabricated_unresolved)
    assert run_data["agent3"] is None, (
        "Agent 3 must NOT run when coordinates_source=fabricated_unresolved"
    )
    assert run_data["agent4"] is None, (
        "Agent 4 must NOT run when coordinates_source=fabricated_unresolved"
    )

    # Confidence band must be red
    assert run_data.get("confidence_band") == "red", (
        f"confidence_band must be 'red' for fabricated_unresolved coordinates, "
        f"got '{run_data.get('confidence_band')}'"
    )

    print(
        f"\n[SUCCESS] Messy PDF Provenance Test Passed! Run ID: {run_id} | "
        f"state={final_state} | coordinates_source={a1_data.get('coordinates_source')}"
    )
