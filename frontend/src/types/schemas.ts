export type RunState =
  | 'ingested'
  | 'agent1_done'
  | 'processing'
  | 'draft_pending_review'
  | 'reviewed_confirmed'
  | 'manual_legal_review'
  | 'failed';

export interface EvidenceItem {
  source: string;
  timestamp: string;
  data_type: string;
  raw_reference: string;
  confidence: number;
  details?: Record<string, any>;
}

export interface ECCondition {
  condition_id: string;
  text: string;
  condition_type: 'quantitative_spatial' | 'qualitative';
  buffer_distance_meters?: number;
  waterbody_target?: string;
  mandate_summary?: string;
}

export interface Agent1Data {
  project_name: string;
  file_number: string;
  coordinates: number[][];
  primary_coordinate?: number[];
  ec_approval_date: string;
  conditions: ECCondition[];
  has_quantitative_spatial: boolean;
  routing: 'continue_pipeline' | 'manual_legal_review';
  suspicious_directives: string[];
  raw_text_summary?: string;
}

export interface Agent2Data {
  file_number: string;
  parivesh_status: string;
  is_valid: boolean;
  amendment_history: Record<string, any>[];
  requires_manual_review: boolean;
  verification_notes: string;
  portal_url?: string;
}

export interface Agent3Data {
  waterbody_found: boolean;
  waterbody_type?: string;
  waterbody_name?: string;
  buffer_distance_meters: number;
  utm_zone?: string;
  osm_elements_count: number;
  raw_geometry_geojson?: Record<string, any>;
  buffered_geometry_geojson?: Record<string, any>;
  bbox?: number[];
  notes?: string;
}

export interface SpectralLayer {
  id: string;
  name: string;
  sensor: string;
  description: string;
  formula: string;
  band_combination: string;
  pre_thumbnail_url: string;
  post_thumbnail_url: string;
  diff_thumbnail_url?: string;
  metric_name: string;
  metric_value: string;
  status_tag: string;
  status_color: string;
}

export interface Agent4Data {
  sensor_used: string;
  cloud_cover_pct: number;
  pre_ec_date: string;
  post_ec_date: string;
  index_computed: string;
  buffer_total_area_m2: number;
  change_area_m2: number;
  change_percentage: number;
  discrepancy_detected: boolean;
  pre_ec_thumbnail_url: string;
  post_ec_thumbnail_url: string;
  change_heatmap_url?: string;
  spectral_layers?: SpectralLayer[];
  notes?: string;
}


export interface AgentResult {
  agent: string;
  status: 'success' | 'flagged' | 'failed';
  confidence: number;
  data: Record<string, any>;
  evidence: EvidenceItem[];
  warnings: string[];
}

export interface RunStatusResponse {
  run_id: string;
  state: RunState;
  filename: string;
  created_at: string;
  updated_at: string;
  confidence_band?: 'green' | 'yellow' | 'red';
  agent1?: AgentResult;
  agent2?: AgentResult;
  agent3?: AgentResult;
  agent4?: AgentResult;
  dossier_path?: string;
  dossier_url?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  summary_findings?: {
    discrepancy_detected: boolean;
    change_area_m2: number;
    change_percentage: number;
    buffer_total_m2: number;
    project_name?: string;
    file_number?: string;
    parivesh_status?: string;
  };
}

export interface IngestResponse {
  run_id: string;
  state: RunState;
  filename: string;
  message: string;
  created_at: string;
}

export interface ReviewRequest {
  run_id: string;
  reviewer_name: string;
  confirm: boolean;
  reviewer_notes?: string;
}
