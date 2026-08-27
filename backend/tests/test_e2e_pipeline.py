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

    assert run_data["agent3"] is not None, "Agent 3 output missing"
    assert run_data["agent3"]["data"]["buffer_distance_meters"] == 100.0

    assert run_data["agent4"] is not None, "Agent 4 output missing"
    assert run_data["agent4"]["data"]["change_area_m2"] > 0
    assert run_data["confidence_band"] in ["green", "yellow", "red"]

    # 4. Human Review Gate Confirmation
    review_payload = {
        "run_id": run_id,
        "reviewer_name": "Adv. Rajesh V. Ramanathan (Senior Environmental Counsel)",
        "confirm": True,
        "reviewer_notes": "Ground discrepancy confirmed: 3,820 m² unauthorized clearing inside 100m Bhadra river buffer zone. Forwarded for regulatory notice under Section 5 EPA 1986."
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
