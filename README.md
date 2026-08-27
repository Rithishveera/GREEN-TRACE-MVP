# GreenTrace MVP — Multi-Agent Environmental Clearance Discrepancy Detection

GreenTrace is an autonomous, multi-agent evidence-generation system for detecting discrepancies between legal Environmental Clearance (EC) mandates and ground-truth physical land use via satellite imagery.

```
                    USER uploads EC PDF
                            │
                            ▼
                    Endpoint 1: /api/ingest
                    (assigns run_id, state=INGESTED)
                            │
                            ▼
                     ORCHESTRATOR
                  (core/orchestrator.py)
                            │
                            ▼
              Agent 1 — Paralegal (LLM + Regex)
         Extracts: project name, file number, coordinates,
         approval date, spatial & qualitative conditions.
                            │
              ┌─────────────┴─────────────┐
              ▼ (async, parallel)          ▼ (async, parallel)
   Agent 2 — Legal Validator      Agent 3 — Geospatial Scout
   Queries PARIVESH registry      Queries Overpass API for
   and amendment history.         waterbodies. Applies exact
   Flags MANUAL_LEGAL_REVIEW      UTM metric buffers (e.g. 100m).
   if blocked or unavailable.
              │                            │
              └─────────────┬──────────────┘
                             ▼
              Agent 4 — Satellite Analyst
   Sentinel-2 (cloud <20%) → Sentinel-1 SAR → Landsat fallback.
   Computes ΔNDBI pre-EC vs post-EC, clips to buffer,
   calculates m² of unauthorized built-up area.
                             │
                             ▼
              Layer 4 — Compile + Score
   Deterministic confidence scoring (🟢/🟡/🔴) via mathematical rules.
   State → DRAFT_PENDING_REVIEW
                             │
                             ▼
                    Endpoint 2: /api/review
   Human Review Gate: Expert inspects before/after slider & metrics.
   Types auditor name + signs off → State: REVIEWED_CONFIRMED.
   Compiles formal 1-page PDF Evidence Dossier via ReportLab.
                             │
                             ▼
                    Endpoint 3: /api/dossier/{run_id}
                    Serves final signed PDF Dossier.
```

---

## 🔑 1. How to Configure API Keys & Credentials

The system reads credentials from `backend/.env` and `backend/secrets/gee-key.json`.

### Step 1: Configure Environment Variables

Open (or create) the `backend/.env` file:

```bash
# Navigate to backend directory
cd backend
```

Edit `backend/.env` with your API keys:

```ini
# ==========================================
# 1. LLM API Key (Agent 1 - Paralegal)
# ==========================================
# Get your Gemini API key from https://aistudio.google.com/
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
LLM_PROVIDER=gemini

# ==========================================
# 2. Google Earth Engine (Agent 4 - Satellite)
# ==========================================
# Google Cloud service account with 'Earth Engine Resource Viewer' role
GEE_SERVICE_ACCOUNT=your-service-account@your-gcp-project.iam.gserviceaccount.com
GEE_PRIVATE_KEY_FILE=secrets/gee-key.json
GEE_PROJECT_ID=your-gcp-project-id

# ==========================================
# 3. Overpass & PARIVESH API Endpoints
# ==========================================
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
PARIVESH_BASE_URL=https://parivesh.nic.in

# ==========================================
# 4. Server & CORS Configuration
# ==========================================
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000
```

### Step 2: Add Google Earth Engine Service Account Key

1. In the Google Cloud Console, create a Service Account with the **Earth Engine Resource Viewer** role.
2. Generate and download a **JSON Key**.
3. Save this JSON file to:
   ```
   backend/secrets/gee-key.json
   ```

*(Note: If API keys are not supplied, GreenTrace automatically activates deterministic fallback engines for demo resilience, so you can test immediately.)*

---

## 🚀 2. Step-by-Step: How to Run the Project

### Prerequisites
- **Python 3.10+** (tested on Python 3.14)
- **Node.js 18+** & **npm**

---

### Step 1: Start the Backend Server

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

4. Verify the backend is running:
   - API Docs / Swagger: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### Step 2: Start the Frontend Application

1. Open a **new terminal** and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```

4. Open the web interface in your browser:
   👉 **[http://127.0.0.1:5173](http://127.0.0.1:5173)**

---

## 🧪 3. Running Automated Tests

To run the end-to-end smoke test (which validates PDF ingestion, agent orchestration, review gate, and PDF dossier compilation):

```bash
cd backend
python -m pytest tests/test_e2e_pipeline.py -v
```

---

## 🖥️ 4. Using the Web Interface

1. **Ingest Environmental Clearance PDF**:
   - Drag and drop any official MoEFCC / SEIAA approval letter PDF, or click **"Load Verified Demo EC"** for instant 1-click testing with a pre-configured clearance document.
2. **Watch Live Multi-Agent Execution**:
   - The UI automatically tracks Agent 1, 2, 3, and 4 in real-time.
   - Click on any agent card to open the **Evidence Provenance Drawer** showing exact timestamps, data sources, and raw references.
3. **Inspect Satellite Ground-Truth**:
   - Use the interactive **Before/After Split Slider** to visually inspect pre-EC baseline vs. post-EC audit imagery.
   - Switch to **Delta Mask Heatmap** mode to visualize detected unauthorized structures ($\text{m}^2$).
4. **Sign Off at the Human Review Gate**:
   - Fill in the Auditor / Reviewer name and notes.
   - Click **"Confirm & Sign Legal Dossier"** to seal the audit and generate the official 1-page PDF Evidence Dossier.
5. **Download Signed Legal Dossier**:
   - Click **"Download Evidence Dossier"** or **"Preview Dossier PDF"** to access the formal legal document.

---

## 📂 Project Structure

```
GREEN-TRACE-MVP/
├── README.md                     # Documentation & setup guide
├── .gitignore
│
├── backend/
│   ├── main.py                   # FastAPI application entrypoint
│   ├── .env                      # API keys & environment config
│   ├── requirements.txt          # Python dependencies
│   ├── secrets/
│   │   └── gee-key.json          # GEE Service Account private key
│   │
│   ├── api/
│   │   ├── dependencies.py       # DB session dependencies
│   │   └── routes/
│   │       ├── ingestion.py      # POST /api/ingest & /api/demo-ingest
│   │       ├── review.py         # POST /api/review (Human Review Gate)
│   │       └── retrieval.py      # GET /api/dossier/{run_id} & /api/status/{run_id}
│   │
│   ├── core/
│   │   ├── state_machine.py      # RunState enum & transition guards
│   │   └── orchestrator.py       # Closed-loop pipeline sequencer
│   │
│   ├── agents/
│   │   ├── agent1_paralegal.py   # LLM extraction & condition routing
│   │   ├── agent2_legal_validator.py # PARIVESH registry validator
│   │   ├── agent3_geospatial.py  # Overpass OSM & UTM metric buffer
│   │   └── agent4_satellite.py   # GEE Sentinel-2/SAR ΔNDBI change detection
│   │
│   ├── services/
│   │   ├── llm_client.py         # Gemini 2.5 structured extraction
│   │   ├── overpass_client.py    # Overpass API HTTP client
│   │   ├── gee_client.py         # Google Earth Engine client
│   │   ├── parivesh_client.py    # PARIVESH portal scraper
│   │   └── pdf_generator.py      # ReportLab PDF Dossier compiler
│   │
│   ├── models/
│   │   ├── schemas.py            # Pydantic data schemas
│   │   └── db_models.py          # SQLModel single runs table
│   │
│   ├── db/
│   │   └── session.py            # SQLite database engine
│   │
│   ├── storage/                  # Runtime uploads, thumbnails, and dossiers
│   └── tests/
│       └── test_e2e_pipeline.py  # Automated E2E smoke test
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── src/
    │   ├── App.tsx               # Main application component
    │   ├── styles/
    │   │   ├── global.css        # Semantic CSS design system
    │   │   └── tokens/           # Civic Emerald, Nordic Forest, Clean Slate palettes
    │   ├── components/
    │   │   ├── UploadZone.tsx
    │   │   ├── AgentStatusTracker.tsx
    │   │   ├── BeforeAfterSlider.tsx
    │   │   ├── FindingsPanel.tsx
    │   │   ├── ReviewGateBanner.tsx
    │   │   └── DossierDownloadButton.tsx
    │   ├── pages/
    │   │   ├── UploadPage.tsx
    │   │   ├── DraftReviewPage.tsx
    │   │   └── DossierPage.tsx
    │   └── api/
    │       └── client.ts         # Backend API client
```
