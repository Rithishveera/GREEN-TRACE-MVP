import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure backend directory is in sys.path for direct script execution and IDE resolution
backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.session import init_db
from api.routes import ingestion_router, review_router, retrieval_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("greentrace")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GreenTrace SQLite database...")
    init_db()
    logger.info("Database schema initialized.")
    yield


app = FastAPI(
    title="GreenTrace — Environmental Clearance Discrepancy Detection API",
    description="Multi-agent evidence-generation system for automated environmental-clearance discrepancy detection and legal dossier compilation.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local Vite dev server and external frontends.
# IMPORTANT: allow_origins=["*"] with allow_credentials=True is a CORS spec violation
# (browsers reject it). Use an explicit allow-list from CORS_ORIGINS in .env.
_cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount routers
app.include_router(ingestion_router, prefix="/api")
app.include_router(review_router, prefix="/api")
app.include_router(retrieval_router, prefix="/api")

# Also mount at root for direct endpoint calls
app.include_router(ingestion_router)
app.include_router(review_router)
app.include_router(retrieval_router)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "GreenTrace Backend MVP",
        "version": "1.0.0",
        "agents": ["agent1_paralegal", "agent2_legal_validator", "agent3_geospatial", "agent4_satellite"],
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
