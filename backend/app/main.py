"""
backend/app/main.py
──────────────────────────────────────────────────────────────────────────────
Entry point for the FastAPI backend.

Responsibilities:

1. Instantiate the FastAPI application.
2. Configure CORS so that the React frontend (port 3000) can make
   cross‑origin requests during local development.
3. Mount the “netlists” router that exposes all API endpoints.
4. Provide a lightweight /health probe for container orchestrators.
"""

# Third‑party imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Internal routers
from .netlists import router as netlists_router


# --------------------------------------------------------------------------- 
# 1) Create the FastAPI application
# --------------------------------------------------------------------------- 
app = FastAPI(
    title="PCB Netlist Visualizer + Validator API",
    version="0.1.0",
    description=(
        "Proof‑of‑concept backend that ingests a JSON netlist, validates it, "
        "stores it in MongoDB, and serves it back to the React frontend."
    ),
)


# --------------------------------------------------------------------------- 
# 2) Configure CORS (development‑time only)
# --------------------------------------------------------------------------- 
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Which Origin headers to allow
    allow_credentials=True,       # Allow cookies / auth headers
    allow_methods=["*"],          # Allow all HTTP verbs
    allow_headers=["*"],          # Allow any custom headers
)


# --------------------------------------------------------------------------- 
# 3) Mount feature routers
# --------------------------------------------------------------------------- 
app.include_router(netlists_router)


# --------------------------------------------------------------------------- 
# 4) Health check used by Docker / K8s
# --------------------------------------------------------------------------- 
@app.get("/health", summary="Simple liveness probe")
async def health():
    """
    Always returns 200 so long as the process is running.

    Extend this with a DB ping if you need a stricter readiness probe.
    """
    return {"status": "ok"}
