import { IngestResponse, RunStatusResponse, ReviewRequest } from '../types/schemas';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function ingestPdf(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/ingest`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || `Upload failed with status ${res.status}`);
  }

  return res.json();
}

export async function ingestDemoPdf(): Promise<IngestResponse> {
  const res = await fetch(`${API_BASE}/api/demo-ingest`, {
    method: 'POST',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Demo ingestion failed' }));
    throw new Error(err.detail || `Demo ingestion failed with status ${res.status}`);
  }

  return res.json();
}

export async function getRunStatus(runId: string): Promise<RunStatusResponse> {
  const res = await fetch(`${API_BASE}/api/status/${runId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch status for run ${runId}`);
  }
  return res.json();
}

export async function listRuns(): Promise<RunStatusResponse[]> {
  const res = await fetch(`${API_BASE}/api/runs`);
  if (!res.ok) {
    throw new Error('Failed to fetch runs history');
  }
  return res.json();
}

export async function submitReview(payload: ReviewRequest): Promise<RunStatusResponse> {
  const res = await fetch(`${API_BASE}/api/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Review submission failed' }));
    throw new Error(err.detail || `Review submission failed with status ${res.status}`);
  }

  return res.json();
}

export function getDossierDownloadUrl(runId: string): string {
  return `${API_BASE}/api/dossier/${runId}`;
}
