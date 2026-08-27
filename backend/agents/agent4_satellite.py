import logging
from typing import Any, Dict, Optional
from datetime import datetime, timezone

try:
    from models.schemas import AgentResult, Agent4Data, EvidenceItem
    from services.gee_client import GEEClient
except (ImportError, ModuleNotFoundError):
    from backend.models.schemas import AgentResult, Agent4Data, EvidenceItem  # type: ignore
    from backend.services.gee_client import GEEClient  # type: ignore

logger = logging.getLogger(__name__)


async def run_agent4_satellite(
    buffered_geometry_geojson: Dict[str, Any],
    ec_approval_date: str,
    buffer_distance_m: float = 100.0,
    gee_client: Optional[GEEClient] = None,
) -> AgentResult:
    """
    Agent 4 — Satellite Analyst:
    Depends on Agent 3's buffer geometry + Agent 1's EC date.
    Fallback chain: Sentinel-2 (cloud <20%) -> Sentinel-1 SAR -> Landsat 8/9.
    Computes NDBI/NDVI pre-EC vs post-EC, clips to buffer, calculates m² of change.
    Generates before/after thumbnail images.
    """
    client = gee_client or GEEClient()
    timestamp = datetime.now(timezone.utc).isoformat()
    warnings = []
    
    sat_output = client.run_satellite_pipeline(
        geometry_geojson=buffered_geometry_geojson,
        ec_approval_date_str=ec_approval_date,
    )
    
    data = Agent4Data(
        sensor_used=sat_output.get("sensor_used", "Sentinel-2"),
        cloud_cover_pct=sat_output.get("cloud_cover_pct", 0.0),
        pre_ec_date=sat_output.get("pre_ec_date", "Pre-EC"),
        post_ec_date=sat_output.get("post_ec_date", "Post-EC"),
        index_computed=sat_output.get("index_computed", "NDBI"),
        buffer_total_area_m2=sat_output.get("buffer_total_area_m2", 0.0),
        change_area_m2=sat_output.get("change_area_m2", 0.0),
        change_percentage=sat_output.get("change_percentage", 0.0),
        discrepancy_detected=sat_output.get("discrepancy_detected", False),
        pre_ec_thumbnail_url=sat_output.get("pre_ec_thumbnail_url", ""),
        post_ec_thumbnail_url=sat_output.get("post_ec_thumbnail_url", ""),
        change_heatmap_url=sat_output.get("change_heatmap_url", ""),
        notes=sat_output.get("notes", "")
    )
    
    confidence = 0.92
    if data.cloud_cover_pct and data.cloud_cover_pct > 15.0:
        confidence -= 0.15
        warnings.append(f"Cloud cover was {data.cloud_cover_pct}%, reducing optical confidence.")

    status = "flagged" if data.discrepancy_detected else "success"

    evidence = [
        EvidenceItem(
            source=f"Google Earth Engine ({data.sensor_used})",
            timestamp=timestamp,
            data_type="raster_spectral_difference",
            raw_reference=f"Pre: {data.pre_ec_date} vs Post: {data.post_ec_date} | Index: {data.index_computed}",
            confidence=confidence,
            details={
                "buffer_total_area_m2": data.buffer_total_area_m2,
                "detected_change_area_m2": data.change_area_m2,
                "change_pct": data.change_percentage,
                "cloud_pct": data.cloud_cover_pct,
                "discrepancy_flagged": data.discrepancy_detected,
            }
        )
    ]

    return AgentResult(
        agent="agent4_satellite",
        status=status,
        confidence=confidence,
        data=data.model_dump(),
        evidence=evidence,
        warnings=warnings,
    )
