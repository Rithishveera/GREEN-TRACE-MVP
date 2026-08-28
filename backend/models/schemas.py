from __future__ import annotations
from typing import Any, Dict, List, Optional, Literal
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from core.state_machine import RunState


class EvidenceItem(BaseModel):
    source: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    data_type: str
    raw_reference: str
    confidence: float = 1.0
    details: Optional[Dict[str, Any]] = None


class ECCondition(BaseModel):
    condition_id: str
    text: str
    condition_type: Literal["quantitative_spatial", "qualitative"]
    buffer_distance_meters: Optional[float] = 100.0
    waterbody_target: Optional[str] = "river"
    mandate_summary: Optional[str] = None


class Agent1Data(BaseModel):
    project_name: str
    file_number: str
    coordinates: List[List[float]] = Field(default_factory=list, description="[[lat, lon], ...]")
    primary_coordinate: Optional[List[float]] = None
    ec_approval_date: str
    conditions: List[ECCondition] = Field(default_factory=list)
    has_quantitative_spatial: bool = True
    routing: Literal["continue_pipeline", "manual_legal_review"] = "continue_pipeline"
    suspicious_directives: List[str] = Field(default_factory=list)
    raw_text_summary: Optional[str] = None
    # Provenance tracking fields
    coordinates_source: Literal["extracted", "state_inferred", "fabricated_unresolved"] = "extracted"
    extraction_method: Literal["llm", "regex_fallback"] = "regex_fallback"
    warning_flags: List[str] = Field(default_factory=list)


class Agent2Data(BaseModel):
    file_number: str
    parivesh_status: str  # "verified_active", "amended", "revoked", "not_found", "scrape_blocked"
    is_valid: bool = True
    amendment_history: List[Dict[str, Any]] = Field(default_factory=list)
    requires_manual_review: bool = False
    verification_notes: str = ""
    portal_url: Optional[str] = None


class Agent3Data(BaseModel):
    waterbody_found: bool = False
    waterbody_type: Optional[str] = "river"
    waterbody_name: Optional[str] = None
    buffer_distance_meters: float = 100.0
    utm_zone: Optional[str] = None
    osm_elements_count: int = 0
    raw_geometry_geojson: Optional[Dict[str, Any]] = None
    buffered_geometry_geojson: Optional[Dict[str, Any]] = None
    bbox: Optional[List[float]] = None  # [min_lon, min_lat, max_lon, max_lat]
    notes: Optional[str] = None


class Agent4Data(BaseModel):
    sensor_used: str  # "Sentinel-2", "Sentinel-1 SAR", "Landsat 8/9", "Simulation"
    cloud_cover_pct: Optional[float] = 0.0
    pre_ec_date: str
    post_ec_date: str
    index_computed: str = "NDBI"  # Normalized Difference Built-up Index
    buffer_total_area_m2: float = 0.0
    change_area_m2: float = 0.0
    change_percentage: float = 0.0
    discrepancy_detected: bool = False
    pre_ec_thumbnail_url: str = ""
    post_ec_thumbnail_url: str = ""
    change_heatmap_url: Optional[str] = ""
    spectral_layers: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    notes: Optional[str] = None
    # Provenance tracking: distinguishes live GEE results from offline simulation
    analysis_mode: Literal["live_gee", "offline_demo_simulation"] = "offline_demo_simulation"



class AgentResult(BaseModel):
    agent: str
    status: Literal["success", "flagged", "failed"]
    confidence: float = 1.0
    data: Dict[str, Any] = Field(default_factory=dict)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class ConfidenceScore(BaseModel):
    band: Literal["green", "yellow", "red"]
    numeric_score: float
    factors: Dict[str, Any]


class IngestResponse(BaseModel):
    run_id: str
    state: RunState
    filename: str
    message: str
    created_at: str


class ReviewRequest(BaseModel):
    run_id: str
    reviewer_name: str
    confirm: bool
    reviewer_notes: Optional[str] = None


class RunStatusResponse(BaseModel):
    run_id: str
    state: RunState
    filename: str
    created_at: str
    updated_at: str
    confidence_band: Optional[str] = None
    agent1: Optional[AgentResult] = None
    agent2: Optional[AgentResult] = None
    agent3: Optional[AgentResult] = None
    agent4: Optional[AgentResult] = None
    dossier_path: Optional[str] = None
    dossier_url: Optional[str] = None
    reviewer_name: Optional[str] = None
    reviewed_at: Optional[str] = None
    summary_findings: Optional[Dict[str, Any]] = None
