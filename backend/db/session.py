import os
from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session

# 1. Read DATABASE_URL from .env, or fallback to local SQLite
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DB_FILE = Path(__file__).resolve().parent.parent / "greentrace.db"
    DATABASE_URL = f"sqlite:///{DB_FILE}"

# 2. Fix older URI scheme if Supabase provides 'postgres://' instead of 'postgresql://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. 'check_same_thread' is only valid for SQLite
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args["check_same_thread"] = False

# 4. Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,  # Keeps cloud DB connections healthy
)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
